
## Refactor for DRY

Session 3 — Quality Audit Results
Lint: 50 → 0 errors
Fix	Count	Method
object-curly-spacing / operator-linebreak	32	eslint --fix
import/namespace (firebase-admin)	14	Created admin-init.ts with modular imports
no-explicit-any	2	Replaced Promise<any> → Promise<Response> in ai-client.ts
new-cap	1	Renamed SINGLE_PROMPT_TOPOLOGY_PROMPT → buildTopologyPrompt in genai-topology.ts
import/namespace (plugin-sdk)	1	Refactored PluginSDK to use centralized db
DRY — Centralized Firebase Admin Init
Created admin-init.ts using modern modular imports (firebase-admin/app, firebase-admin/firestore). Updated 5 files that duplicated the if (!admin.apps.length) initializeApp() + admin.firestore() pattern:

process-journal-entry.ts (agent-created)
sdk.ts
plugin-sdk/index.ts
debug-api.ts
graph-writer.ts
Shared Package Bugs Fixed
BFS infinite loop guard — Added visited Set cycle detection to calculateParentPropagation in engine.ts (malformed AI graph edges could cause hangs)
Duplicated roundExp — engine.ts now imports from formulas.js instead of defining its own copy
ProgressionResult not exported — Added export keyword and barrel re-export in index.ts
module: "ESNext" mismatch — Changed to "NodeNext" in all 3 shared tsconfigs to match moduleResolution: "NodeNext"
Dual spelling canceled/cancelled — Normalized to 'canceled' (Stripe API convention) in firestore.ts
Duplicate @module tags — Removed from engine.ts, state-mutations.ts, orchestrator.ts
Validation
npm run -w apps/api-firebase build — pass
npm run -w apps/api-firebase lint — 0 errors
npm run -w apps/web typecheck — pass
