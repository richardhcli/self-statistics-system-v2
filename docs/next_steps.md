# Next Steps

**Last Updated**: March 2, 2026

---

## Immediate Backlog

### Full Delete Overhaul
Using [features-datastores-debug.md](./dev/features/features-datastores-debug.md), improve the "neural wipe" delete. Rename to "Destroy All Data" in the debug menu. Split into its own panel:

| Button (Color) | Action |
|----------------|--------|
| **Delete Account** (dark red) | Remove Firebase account + destroy all data |
| **Destroy All Data** (dark red) | Delete all Firebase collections, keep user doc + Google sign-in. Clear stores + IndexedDB |
| **Remove Firebase Data** (red) | Remove all Firebase collections, keep user doc + Google sign-in |
| **Clear IndexedDB** (red) | Remove all IndexedDB data |
| **Clear Global Stores** (red) | Reset all Zustand stores |

### Entry View Upgrade
- When journal entry is in transcribing state, remove AI analyze button.

### Profile Picture
- Update default picture in Statistics → information header to use profile pic.
- Update debug view to show profile pic in component.

### Cycle Prevention (App Logic)
Firestore does not enforce DAG constraints. Verify that `targetId` is not an ancestor of `sourceId` in React logic before calling `upsertEdge`.

### Required Firestore Indexes
To filter edges by source, target, or metadata, define indexes in `firestore.indexes.json`:
- `edges`: `source` (Asc) + `weight` (Desc)
- `edges`: `target` (Asc) + `metadata.type` (Asc)

### Authentication Fixes
- Authentication breaks with multiple tabs open for the same user. Fix this.

---

## Phase 3: Deployment

- [ ] **CI/CD Pipeline**: Automated testing and deployment via GitHub Actions.
- [ ] **Monitoring & Logging**: Integrate Sentry for error tracking and PostHog for privacy-preserving usage analytics.
- [ ] **Edge Functions**: Offload classification logic to Edge Workers for lower latency in global regions.
- [ ] **SSL/TLS & Domain**: Configure custom domain with high-availability SSL certificates.

---

## Phase 4: Scaling to Production

- [ ] **Multi-Tenancy**: Database sharding and tenant isolation for data privacy and performance.
- [ ] **Subscription Engine**: Integrate Stripe for "Pro Explorer" billing and seat management.
- [ ] **Advanced RAG Engine**: Vector database integration (Pinecone/Weaviate) for semantic search across thousands of entries.
- [ ] **Mobile Performance**: Native performance optimizations for iOS/Android via Capacitor or React Native.
- [ ] **Enterprise Integrations**: Bi-directional sync with Notion, Trello, and Jira via official API connectors.

### Backend & Persistence Scaling
- [ ] **Database Migration**: Evaluate PostgreSQL/Neo4j for cross-device sync at scale.
- [ ] **Binary Audio Storage**: Move voice recordings to Object Stores (AWS S3 / GCS).

### Advanced AI Features
- [ ] **RAG (Retrieval-Augmented Generation)**: Vector database to allow Gemini to search through years of history.
- [ ] **Long-term Habit Analysis**: AI-driven weekly reports identifying behavioral trends over time.

### Mobile & Additional Integrations
- [ ] **Native Mobile App**: Capacitor/React Native shell for push notification support.
- [ ] **Inbound Webhooks**: Allow external devices (Apple Watch, external API calls) to push data into the Brain.
- [ ] **Outbound Webhooks**: Call external APIs upon new data, especially new status gains.

---

## Completed Milestones (Archived)

The following phases have been completed. See [CHANGELOG.md](../CHANGELOG.md) for details.

- **Phase 2.5 — Monorepo Refactor for Plugin API Integration** (Feb 17 – Mar 2, 2026): pnpm workspace, shared packages, Firebase backend, Obsidian plugin, Custom Token auth, plugin-sdk.
- **Phase 2 — Isomorphic Logic Extraction**: `@self-stats/progression-system`, `@self-stats/soul-topology`, `@self-stats/contracts` extracted from frontend.
- **Phase 1 — Workspace Initialization**: Converted to pnpm monorepo, moved React app to `apps/web`.
