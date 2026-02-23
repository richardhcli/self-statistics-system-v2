### Migration Log: Polyglot Monorepo Architecture via npm Workspaces

**Date:** February 23, 2026

**Overview**
Transitioned the Self Statistics System codebase from a flat, frontend-heavy repository into a polyglot monorepo using npm workspaces, separating the Vite/React frontend and Firebase Functions backend into distinct, scalable workspace packages.

**Structural Changes**

* **Frontend Relocation:** Moved the Vite, React, and Tailwind stack (including `src/`, `index.html`, `vite.config.ts`, `tailwind.config.js`) from the repository root to `apps/web/`.
* **Backend Relocation:** Moved the Firebase Cloud Functions backend (`src/`, `index.js`, `tsconfig.json`) from the root `functions/` directory to `apps/api-firebase/`.
* **Root Orchestration Setup:** Established the repository root as the task orchestrator, retaining global files like `firebase.json`, `.firebaserc`, `.vscode/`, and `.gitignore`.

**Configuration & Dependency Management**

* **Root `package.json`:** Created a new root configuration defining `"workspaces": ["apps/*"]` to handle global dependency hoisting and lockfile generation. Added orchestration scripts (`dev:web`, `dev:api`).
* **Workspace Packages:**
* Renamed the frontend package to `"name": "web"`.
* Renamed the backend package to `"name": "api-firebase"`.
* Synchronized shared dependency versions across workspaces (e.g., `@google/genai` to `^1.41.0`) to ensure proper root hoisting.


* **Dependency Cleanup:** Purged local `node_modules` and individual `package-lock.json` files, migrating to a single source of truth at the monorepo root.

**Bug Fixes & Tooling Resolution**

* **TypeScript & ESLint Integration:** Fixed version mismatches and parsing errors in `apps/api-firebase` caused by workspace hoisting.
* Installed `@typescript-eslint/parser` and `@typescript-eslint/eslint-plugin` at the monorepo root to allow hoisted plugins to resolve correctly.
* Installed `eslint-import-resolver-typescript` and updated `apps/api-firebase/.eslintrc.js` to natively parse `.ts` module imports.


* **Config Parsing (`TS18003`):** Added `"allowJs": true` to `apps/api-firebase/tsconfig.dev.json` to permit linting of the JavaScript `.eslintrc.js` file.
* **Line Endings:** Disabled the ESLint `"linebreak-style"` rule in the backend to prevent cross-platform CRLF/LF Git conflicts.
* **Script Standardization:** Added a dedicated `"typecheck": "tsc --noEmit"` script to `apps/web/package.json` to bypass `npx tsc` terminal flag collisions.

**Documentation Added**

* Created `.ai/npm-workspace-guidelines.md` detailing strict rules for executing npm commands via `--workspace` flags.
* Created `.ai/universal-validation-guidelines.md` outlining mandatory, multi-phase static type checking, build validation, and root dependency integrity checks following codebase modifications.
