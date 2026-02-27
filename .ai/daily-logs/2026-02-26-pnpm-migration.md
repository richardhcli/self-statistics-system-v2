2. Migration Action Plan
Follow these exact steps to transition the workspace from npm to pnpm.

Step 1: Enable pnpm via Corepack
Due to Windows file system protections, enabling corepack requires elevated privileges.

Open a new PowerShell window as Administrator.

Execute the enabler:

PowerShell
corepack enable pnpm
Close the Administrator window and return to your standard development terminal.

Step 2: Purge Legacy npm Artifacts
Before initializing pnpm, we must completely remove all traces of npm's dependency trees and lockfiles to prevent conflicts.
Run the following from the root of self-statistics-system-v2:

PowerShell
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force apps\web\node_modules
Remove-Item -Recurse -Force apps\api-cloud\node_modules
Remove-Item package-lock.json
Step 3: Validate Workspace Links
Ensure all internal dependencies in your apps/web/package.json and apps/api-cloud/package.json utilize the explicit workspace protocol:

JSON
"dependencies": {
  "@self-stats/contracts": "workspace:*",
  "@self-stats/progression-system": "workspace:*",
  "@self-stats/soul-topology": "workspace:*"
}
Step 4: Execute Clean Installation
Run the pnpm install command at the root directory. pnpm will automatically detect the workspaces array in the root package.json, build the strict symlink structure, and generate a new pnpm-lock.yaml file.

PowerShell
pnpm install
Step 5: Install Root Development Tools
To run both the Vite frontend and Firebase emulators simultaneously, install concurrently at the workspace root as a dev dependency (-D) using the workspace flag (-w).

PowerShell
pnpm add concurrently -w -D
Step 6: Verify Development Environment
Boot the entire stack using the root script defined in package.json ("dev": "concurrently \"pnpm run dev:web\" \"pnpm run dev:api\"").

PowerShell
pnpm run dev