Last updated: 2026-02-26

# Architecture Guide: Development vs. Production Environments

The Self Statistics System utilizes a strict boundary between local development and live production. This ensures that experimental features and test data never corrupt the live historical data.

Because the frontend is powered by React 19 and Vite 6, we do not rely on complex `.env` files or manual command-line flags to switch environments. The build tools handle the routing automatically.

## 1. The Environment Switch (Vite)

The core mechanism dictating where the application sends data is Vite's built-in `import.meta.env.DEV` variable, located in the frontend's Firebase initialization file.

* **When running `vite` (Dev):** This variable evaluates to `true`. The initialization script explicitly intercepts the Firebase configuration and forces all SDK calls to route to `127.0.0.1` (the local emulators).
* **When running `vite build` (Prod):** This variable evaluates to `false`. During compilation, Vite completely strips the emulator connection logic from the final JavaScript bundle. The resulting code connects directly to the live Google Cloud project.

## 2. The Development Environment (`dev`)

The development environment is entirely sandboxed on the local machine. It provides hot-reloading for both the frontend UI and the backend Cloud Functions.

* **Command:** `pnpm run dev`
* **Frontend Execution:** Vite spins up a local dev server (typically `http://localhost:5173`) with instant hot-Module Replacement (HMR).
* **Backend Execution:** Esbuild runs in `--watch` mode to continuously compile the backend logic, while the Firebase Emulator Suite hosts the Cloud Functions, Auth, and a local instance of Firestore.
* **Data Persistence:** Data written during development stays in the local emulator and is wiped when the emulators are shut down (unless explicitly exported).

## 3. The Production Environment (`prod`)

The production environment represents the live, hosted application. The deployment command ensures that no code reaches Google's servers unless both the frontend and backend compile perfectly.

* **Command:** `pnpm run deploy`
* **Frontend Execution:** Vite compiles and minifies the React application into static assets within the `apps/web/dist` folder.
* **Backend Execution:** Esbuild bundles the Cloud Functions and all imported shared packages (e.g., `@self-stats/progression-system`) into a single, highly optimized `apps/api-firebase/lib/index.js` file.
* **Deployment:** The `firebase deploy` command takes over, uploading the static frontend to Firebase Hosting, the bundled backend to Google Cloud Functions, and applying the strict Firestore security rules.

## 4. Environment Comparison Summary

| Feature | Development (`pnpm run dev`) | Production (`pnpm run deploy`) |
| --- | --- | --- |
| **Frontend Host** | Local Vite Server (`localhost:5173`) | Firebase Hosting (Live URL) |
| **Backend Host** | Firebase Functions Emulator (`127.0.0.1:5001`) | Google Cloud Functions |
| **Database** | Local Firestore Emulator (`127.0.0.1:8080`) | Live Google Cloud Firestore |
| **Code Compilation** | Unminified, source-mapped (Hot Reloading) | Fully minified, tree-shaken, bundled |
| **Shared Logic** | Read directly from `shared/*` via symlinks | Bundled into the final `.js` artifacts |
