import { build } from 'esbuild';
import fs from 'fs';
import { execSync } from 'child_process';

// 1. Bundle the TypeScript code, excluding cloud-native packages
await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node22', // Upgraded to prevent the upcoming 2026 deprecation!
  outfile: 'dist/index.js',
  external: ['firebase-admin', 'firebase-functions', '@google/genai']
});

// 2. Read the local package.json
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// 3. Generate a pure, workspace-free package.json for Google Cloud
const cleanPkg = {
  name: pkg.name,
  version: pkg.version,
  main: 'index.js',
  engines: { "node": "22" }, // Upgraded to Node 22
  dependencies: {
    "firebase-admin": pkg.dependencies["firebase-admin"],
    "firebase-functions": pkg.dependencies["firebase-functions"],
    "@google/genai": pkg.dependencies["@google/genai"]
  }
};

// 4. Write it to the dist/ folder
fs.writeFileSync('dist/package.json', JSON.stringify(cleanPkg, null, 2));

// 5. THE FIX: Install dependencies locally in dist/ so the Firebase CLI can parse them
console.log("Installing production dependencies in dist/...");
execSync('npm install --omit=dev', { cwd: 'dist', stdio: 'inherit' });

console.log("✅ Isolated distribution build complete.");