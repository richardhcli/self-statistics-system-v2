# AI Agent Guidelines: npm Workspaces Management

## 1. Architectural Context
This repository is a polyglot monorepo utilizing **npm workspaces**. 
The root directory acts as the orchestrator. Sub-applications and services are located within the `apps/` directory.

## 2. Separation of Concerns & Execution Context
**CRITICAL RULE:** All `npm` commands MUST be executed from the **monorepo root directory**. 
Do not change directories (`cd`) into individual workspace folders (like `apps/web-app`) to manage packages or run scripts.

## 3. Dependency Management
To add, remove, or update packages for a specific workspace, use the `--workspace` (or `-w`) flag from the root directory.

### Adding a Package to a Specific Workspace
```bash
# Add a runtime dependency
npm install <package-name> --workspace=<workspace-name>

# Add a development dependency
npm install <package-name> --save-dev --workspace=<workspace-name>

# Example: Adding zod to the backend
npm install zod -w apps/api-firebase
```

### Adding a Dependency to the Root
Only install orchestration tools, linters, or workspace-wide tooling at the root.

```bash
npm install <package-name> --save-dev
```

## 4. Task Execution
To run package.json scripts (like build, dev, or test) for a specific workspace, use the --workspace flag.

```bash
# Run a script in a specific workspace
npm run <script-name> --workspace=<workspace-name>

# Example: Running the frontend dev server
npm run dev -w apps/web-app
```

## 5. Strict Anti-Patterns (Do NOT Do These)
DO NOT run npm install inside an apps/* directory. This will generate a localized package-lock.json and break the monorepo dependency hoisting.

DO NOT delete the root package-lock.json unless a complete workspace dependency reset is explicitly requested by the user.

DO NOT create a node_modules folder manually. Let the root npm install handle hoisting.

## 6. Official Documentation Link
For further details on npm workspace behaviors, refer to the official documentation:
npm workspaces CLI documentation: https://docs.npmjs.com/cli/using-npm/workspaces/