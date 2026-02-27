Technical Decision Record: Migrating to pnpm
1. Architectural Justification
The Self Statistics System is transitioning from a standard npm structure to pnpm (Performant NPM). As the application evolves into a domain-driven monorepo (separating React frontends, Firebase Cloud Functions, and shared isomorphic logic), standard npm introduces critical bottlenecks and risks that pnpm natively solves.

1.1. Native Monorepo Workspaces (workspace:*)
Standard npm struggles to guarantee that local packages are prioritized over public registry packages without complex linking. pnpm natively supports the workspace:* protocol. This ensures that when the React app imports @self-stats/progression-system, it is explicitly hard-linked to our local shared folder. It fundamentally prevents the system from accidentally querying the internet for our private domain logic.

1.2. Strict Dependency Resolution (Eliminating Phantom Dependencies)
npm "hoists" dependencies, flattening the node_modules folder. This allows a frontend app to accidentally import a library (like lodash) that was installed by a sub-dependency, even if it isn't listed in the frontend's package.json. If that sub-dependency updates and removes lodash, our app breaks in production. pnpm uses a strict symlink structure: if a package is not explicitly declared in an app's package.json, the code cannot access it.

1.3. Global Store and Disk Efficiency
Instead of copying a heavy library like React or Firebase Admin into multiple node_modules folders across our workspace, pnpm downloads them once to a read-only global store on the OS file system. It then creates lightweight hard links in our project folders. This dramatically reduces installation times and prevents gigabytes of duplicated bloat on the local development machine.