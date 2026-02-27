# Architecture Guide: Backend Bundling in the Monorepo

## 1. The Monorepo Compilation Trap (Why We Bundle)

In a standard, isolated Firebase project, compiling TypeScript is straightforward: the TypeScript compiler (`tsc`) reads `src/index.ts` and outputs `lib/index.js`.

However, the Self Statistics System utilizes a domain-driven monorepo architecture where the Firebase backend (`apps/api-firebase`) imports pure logic from strictly separated sibling directories (e.g., `@self-stats/progression-system`).

When relying solely on `tsc` in this environment, we encounter a critical issue known as **Directory Widening**:

* To maintain relative import paths, `tsc` recalculates the "root" of the project to the highest common folder (the monorepo root).
* It then recreates the *entire* monorepo folder structure inside the backend's `lib` folder (resulting in `lib/apps/api-firebase/src/index.js`).
* **The Deployment Failure:** When deploying to production, the Firebase CLI only zips and uploads the `apps/api-firebase` directory. It leaves the `shared` directory behind. If the compiled code relies on relative paths pointing outside its own folder, the Cloud Functions will crash in production because those files simply do not exist on Google's servers.

**The Solution:** We must bundle the backend. Bundling takes our entry point (`src/index.ts`), physically pulls in the necessary code from the `shared` packages, and smashes it together into a single, self-contained `lib/index.js` file that is 100% safe to deploy.

## 2. The Tooling Choice: Why Esbuild?

When selecting a bundler for the Node.js backend, several industry standards were evaluated:

* **Webpack:** Dismissed. It is highly optimized for massive frontend web applications, making it bloated, slow, and overly complex to configure for a simple backend function.
* **Rollup:** Dismissed. While excellent for tree-shaking open-source libraries, configuring it to parse TypeScript and output Node-compatible CommonJS requires chaining together multiple fragile plugins.
* **Esbuild:** **Selected.** Esbuild is written in Go, making it orders of magnitude faster than JavaScript-based bundlers. Furthermore, our frontend runs on React 19 powered by Vite 6. Under the hood, Vite relies heavily on Esbuild for its lightning-fast compilation. By choosing Esbuild for the backend, we consolidate our entire compilation toolchain around a single, highly performant engine.

## 3. Implementation Details

The bundling pipeline is divided into two distinct responsibilities: **Generation** (Esbuild) and **Verification** (TypeScript).

### A. The Esbuild Configuration (Generation)

We use the Esbuild CLI directly within our `apps/api-firebase/package.json` scripts to generate the output file.

```json
{
  "scripts": {
    "build": "esbuild src/index.ts --bundle --platform=node --target=node20 --outfile=lib/index.js --external:firebase-admin --external:firebase-functions",
    "build:watch": "esbuild src/index.ts --bundle --platform=node --target=node20 --outfile=lib/index.js --external:firebase-admin --external:firebase-functions --watch",
    "serve": "pnpm run build && concurrently \"pnpm run build:watch\" \"firebase emulators:start\""
  }
}

```

**Key CLI Flags Explained:**

* `--bundle`: Instructs Esbuild to inline imported local code (like our `@self-stats` packages).
* `--platform=node --target=node20`: Ensures the output JavaScript is compatible with the Node.js 20 runtime used by our Firebase Cloud Functions.
* `--external:firebase-*`: **Critical step.** We explicitly tell Esbuild *not* to bundle Firebase's massive core libraries. Google's cloud environment already provides these natively. Bundling them would result in a massive file size and severe memory limits.

### B. The TypeScript Configuration (Verification)

Because Esbuild strips out TypeScript types and compiles the code blindly, it does not perform type checking. We retain `tsc` strictly as a linter for the developer experience.

In `apps/api-firebase/tsconfig.json`, we set `"noEmit": true`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "commonjs",
    "noEmit": true, 
    "rootDir": "src",
    "strict": true,
    "target": "es2017"
  },
  "include": ["src"]
}

```

This configuration ensures that VS Code still highlights type errors using our shared base configuration, but `tsc` will never accidentally overwrite the `lib` folder managed by Esbuild.

