# Potential next steps for this app

## 

#### full delete: 
Go back to recent "firebase migration plans" documents.

Using documentation\docs-features\features-datastores-debug.md
improve the "neural wipe" delete. Rename this to "destroy all data" in the debugging menu. Split this button into its own panel aside from the Batch Injection component: 

Create (Button color) Button:functionlity pairs: 
(Dark red) Delete Account: removes account from firebase, and destroys all data. 
(Dark Red) Destroy All Data: deletes all firebase collections, but keeps user document and google sign-in information. Clears current global stores and removes all data in IndexDB. 
(red) Remove firebase data: removes all firebase collections, but keeps user document and google sign-in information. 
(red) Clear indexDB: remove all indexDB data. 
(red) Clear global stores: removes all global stores data. 

#### entry view upgrade: 
- when journal entry is in transcribing state, remove ai analyze button. 

#### profile picture: 
update default picture in statistics -> information header to be profile pic. update debug view to show profile pic in component. 

#### 1. Cycle Prevention (App Logic)

Firestore does not enforce DAG constraints. You **must** verify that `targetId` is not an ancestor of `sourceId` in your React logic before calling `upsertEdge`.

#### 2. Required Indexes

To filter edges by source, target, or metadata, you must define indexes in `firestore.indexes.json`:
* `edges`: `source` (Asc) + `weight` (Desc)
* `edges`: `target` (Asc) + `metadata.type` (Asc)

#### fix authentication glitches: 
- authentication breaks if there is multiple tabs open for the same user. Fix this. 
- use JWT authentication tokens - https://github.com/alan2207/bulletproof-react/security. 

#### Implement webhooks plan and implementation: 
- webhooks. to app and from app. test with obsidian. Using live app... 

---

## Phase 3: Deployment
Moving from a local developer environment to a managed production infrastructure.

- [ ] **CI/CD Pipeline**: Automated testing and deployment via GitHub Actions to Vercel/Netlify.
- [ ] **Environment Security**: Transition from static env keys to a secure Vault or Secrets Manager.
- [ ] **Monitoring & Logging**: Integrate Sentry for error tracking and PostHog for privacy-preserving usage analytics.
- [ ] **Edge Functions**: Offload classification logic to Edge Workers for lower latency in global regions.
- [ ] **SSL/TLS & Domain**: Configure custom domain with high-availability SSL certificates.

---

## Phase 4: Scaling to Production
Transforming the application into a robust SaaS platform.

- [ ] **Authentication & Identity**: Integrate Auth0 or Supabase for secure JWT-based multi-user management.
- [ ] **Multi-Tenancy**: Database sharding and tenant isolation to ensure data privacy and performance.
- [ ] **Subscription Engine**: Integrate Stripe for "Pro Explorer" billing and seat management.
- [ ] **Advanced RAG Engine**: Vector database integration (Pinecone/Weaviate) to enable semantic search across thousands of entries.
- [ ] **Mobile Performance**: Native performance optimizations for iOS/Android via Capacitor or React Native.
- [ ] **Enterprise Integrations**: Bi-directional sync with Notion, Trello, and Jira via official API connectors.

Requirements for transforming the app into a multi-user platform.

### 1. Backend & Persistence Layer
- [ ] **Database Migration**: Move from IndexedDB to PostgreSQL/Neo4j for cross-device sync.
- [ ] **API Implementation**: Deploy REST/GraphQL endpoints for the centralized state.
- [ ] **Binary Audio Storage**: Move voice recordings to Object Stores (AWS S3 / GCS).

### 2. Authentication & Multi-Tenancy
- [ ] **Identity Provider**: Integrate Auth0/Supabase for JWT-based session management.
- [ ] **End-to-End Encryption**: User-controlled private keys for local content encryption.

### 3. Advanced AI Features
- [ ] **RAG (Retrieval-Augmented Generation)**: Vector database integration to allow Gemini to "search" through years of history.
- [ ] **Long-term Habit Analysis**: AI-driven weekly reports identifying behavioral trends over time.

## 4. Mobile & Integrations
- [ ] **Native Mobile App**: Capacitor/React Native shell for push notification support.
- [ ] **Inbound Webhooks**: Allow external devices (Apple Watch, external API calls) to push data into the Brain.
- [ ] **Outbound Webhooks**: Call external APIs upon new data, especially new status gains. 