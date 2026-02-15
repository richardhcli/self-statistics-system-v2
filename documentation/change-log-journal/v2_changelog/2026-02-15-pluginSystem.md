# Architecture Blueprint: Async Plugin System & Job Queue

DONE:
# Async Plugin System & Job Queue (Implemented)

  
## Implementation Snapshot
- Async job queue introduced for plugin-driven AI processing and third-party ingestion.
- Single entry point Plugin SDK created to gate all Firestore access per user scope.
- Obsidian integration now ships with HTTPS ingest plus a Firestore-triggered worker that updates journal metadata and XP.
- Mock AI microservice added to mirror external provider latency.

  
## Files and Responsibilities
- Plugin SDK: [functions/src/plugin-sdk/index.ts](functions/src/plugin-sdk/index.ts)
- Mock AI gateway: [functions/src/microservices/ai-gateway.ts](functions/src/microservices/ai-gateway.ts)
- Obsidian ingest endpoint: [functions/src/plugins/obsidian-integration/api.ts](functions/src/plugins/obsidian-integration/api.ts)
- Obsidian worker trigger: [functions/src/plugins/obsidian-integration/worker.ts](functions/src/plugins/obsidian-integration/worker.ts)
- Obsidian types: [functions/src/plugins/obsidian-integration/types.ts](functions/src/plugins/obsidian-integration/types.ts)
- Exports registry: [functions/src/index.ts](functions/src/index.ts)
- Test harness: [testing/testing-backend/test-obsidian.py](testing/testing-backend/test-obsidian.py)

  
## Flow
1. Client submits content to the Obsidian endpoint; entry is stored immediately and a queued job is created.
2. Firestore trigger sees queued jobs and marks them processing, fetches the source journal entry, simulates AI analysis, and applies tags plus XP.
3. Job is finalized as completed (or failed) with result metadata accessible via GET polling.

## Job Schema
- Location: users/{uid}/jobs/{jobId}
- Fields: id, type, payload, status (queued|processing|completed|failed), timestamps, result, errors.


## Testing
- Emulator workflow: run the backend emulator, then execute the polling harness at [testing/testing-backend/test-obsidian.py](testing/testing-backend/test-obsidian.py) to confirm submit → queue → completion.


## Notes
- All Firestore access is mediated through the Plugin SDK to prevent unscoped reads or writes.
- Mock AI latency is intentional to mimic real external calls; adjust in [functions/src/microservices/ai-gateway.ts](functions/src/microservices/ai-gateway.ts) if shorter cycles are needed.



## 1. Executive Summary
This blueprint defines the architecture for the **Self-Statistics System V2** backend. We are moving to an **Async Job Queue Pattern** to handle AI processing and third-party integrations (like Obsidian).

**Core Philosophy:**
1.  **"Fire and Forget" API**: Client apps (Obsidian) submit data and get an immediate tracking ID (`jobId`). They do *not* wait for AI analysis.
2.  **Plugin SDK**: A strict abstraction layer (`PluginSDK`) that standardizes how all plugins interact with Firestore (validating paths, managing schemas).
3.  **Microservices**: AI logic is treated as an external service, even if currently mocked internally.

Plugin structure: 
- Each plugin will have utils (pure utilities), helpers (orchestrators), api (endpoints), and index (export api). Also, they will have "tests" for local python testbenches. 

---

## 2. Directory Structure
All backend logic resides in `functions/src/`.

```text
functions/src/
├── plugin-sdk/                  # CORE ABSTRACTION
│   └── index.ts                 # The Universal CRUD Wrapper
├── microservices/               # BACKEND SERVICES
│   └── ai-gateway.ts            # Mocks external AI provider
├── plugins/                     # FEATURE IMPLEMENTATIONS
│   └── obsidian-integration/    # Integration: Obsidian
│       ├── api.ts               # HTTP Endpoint (Ingest)
│       ├── worker.ts            # Firestore Trigger (Process)
│       ├── types.ts             # Plugin-specific Interfaces
│       └── index.ts             # Export barrel
└── index.ts                     # Main Registry
```

---

## 3. Implementation Specifications

### Phase 1: The Plugin SDK
**File:** `functions/src/plugin-sdk/index.ts`

The SDK creates a secure boundary for plugins, ensuring they only touch `users/{userId}/...` paths.

**Responsibilities:**
*   **Journal**: Create raw entries.
*   **Jobs**: Enqueue background tasks (`queued` -> `processing` -> `completed`).
*   **User**: Read/Update Gamification stats.

```typescript
import * as admin from 'firebase-admin';

// Singleton Init
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

export class PluginSDK {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  // --- SUB-MODULES ---

  get journal() {
    return {
      create: async (content: string, metadata: any = {}) => {
        const ref = db.collection(`users/${this.userId}/journal_entries`).doc();
        const entry = {
          id: ref.id,
          content,
          metadata,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          created_at_iso: new Date().toISOString()
        };
        await ref.set(entry);
        return ref.id;
      },
      get: async (entryId: string) => {
        const doc = await db.doc(`users/${this.userId}/journal_entries/${entryId}`).get();
        return doc.exists ? doc.data() : null;
      },
      update: async (entryId: string, data: any) => {
        await db.doc(`users/${this.userId}/journal_entries/${entryId}`).set(data, { merge: true });
      }
    };
  }

  get jobs() {
    return {
      create: async (type: string, payload: any) => {
        const ref = db.collection(`users/${this.userId}/jobs`).doc();
        await ref.set({
          id: ref.id,
          type,
          payload,
          status: 'queued', // queued -> processing -> completed/failed
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          result: null,
          errors: []
        });
        return ref.id;
      },
      get: async (jobId: string) => {
        const doc = await db.doc(`users/${this.userId}/jobs/${jobId}`).get();
        return doc.exists ? doc.data() : null;
      },
      updateStatus: async (jobId: string, status: 'processing' | 'completed' | 'failed', result: any = null) => {
        const updateData: any = { status, updatedAt: admin.firestore.FieldValue.serverTimestamp() };
        if (result) updateData.result = result;
        await db.doc(`users/${this.userId}/jobs/${jobId}`).update(updateData);
      }
    };
  }

  get user() {
    return {
      updateStats: async (deltaExp: number) => {
        const ref = db.doc(`users/${this.userId}/user_information/player_statistics`);
        await db.runTransaction(async (t) => {
            const doc = await t.get(ref);
            const currentExp = doc.data()?.exp || 0;
            t.set(ref, { exp: currentExp + deltaExp }, { merge: true });
        });
      }
    };
  }
}
```

### Phase 2: Mock AI Microservice
**File:** `functions/src/microservices/ai-gateway.ts`

Simulates an external heavyweight process.

```typescript
import { onRequest } from "firebase-functions/v2/https";

export const aiGateway = onRequest(async (req, res) => {
  // Simulate 1.5s latency similar to OpenAI
  await new Promise(r => setTimeout(r, 1500));

  res.json({
    summary: "Automatically generated summary from AI.",
    tags: ["auto-tag-1", "auto-tag-2"],
    sentiment: "positive",
    expReward: 50
  });
});
```

### Phase 3: Obsidian Integration Plugin
**Folder:** `functions/src/plugins/obsidian-integration/`

#### A. The API (Ingest)
**File:** `api.ts`
Accepts volume, stores it safely, and offloads processing.

```typescript
import { onRequest } from "firebase-functions/v2/https";
import { PluginSDK } from "../../plugin-sdk";

export const obsidianApi = onRequest(async (req, res) => {
    // 1. Auth (Simple Header for MVP)
    const userId = req.headers['x-user-id'] as string || 'default_user';
    const sdk = new PluginSDK(userId);

    // 2. Handle POST (Submit Entry)
    if (req.method === 'POST') {
        const { content, duration } = req.body;
        
        // A. Store Raw Data
        const entryId = await sdk.journal.create(content, { duration });

        // B. Queue Background Job
        const jobId = await sdk.jobs.create('ai_analysis_obsidian', { entryId });

        // C. Fast Response
        res.status(202).json({ 
            success: true, 
            entryId, 
            jobId, 
            message: "Entry stored. AI analysis queued." 
        });
        return;
    }

    // 3. Handle GET (Check Job Status)
    if (req.method === 'GET' && req.query.jobId) {
        const job = await sdk.jobs.get(req.query.jobId as string);
        if (!job) { res.status(404).send('Job not found'); return; }
        res.json(job);
        return;
    }

    res.status(405).send('Method Not Allowed');
});
```

#### B. The Worker (Process)
**File:** `worker.ts`
Listens for new jobs and executes logic.

```typescript
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { PluginSDK } from "../../plugin-sdk";

// Mock fetching the AI result (In prod, use axios/fetch to call ai-gateway)
const mockAiCall = async (text: string) => {
    return {
        summary: `Analyzed: ${text.substring(0, 15)}...`,
        tags: ["productivity", "obsidian"],
        expReward: 100
    };
};

export const obsidianWorker = onDocumentCreated("users/{uid}/jobs/{jobId}", async (event) => {
    const job = event.data?.data();
    if (!job || job.type !== 'ai_analysis_obsidian' || job.status !== 'queued') return;

    const { uid, jobId } = event.params;
    const sdk = new PluginSDK(uid);

    try {
        // 1. Mark Processing
        await sdk.jobs.updateStatus(jobId, 'processing');

        // 2. Fetch Source Data
        const entry = await sdk.journal.get(job.payload.entryId);
        if (!entry) throw new Error("Journal Entry not found");

        // 3. Perform AI Logic
        const aiResult = await mockAiCall(entry.content);

        // 4. Apply Side Effects
        // a. Update Journal
        await sdk.journal.update(job.payload.entryId, { 
            ai_analysis: aiResult,
            tags: aiResult.tags 
        });
        // b. Award XP
        await sdk.user.updateStats(aiResult.expReward);

        // 5. Complete
        await sdk.jobs.updateStatus(jobId, 'completed', aiResult);

    } catch (err: any) {
        console.error(err);
        await sdk.jobs.updateStatus(jobId, 'failed', { error: err.message });
    }
});
```

#### C. Export
**File:** `index.ts`
```typescript
export { obsidianApi } from './api';
export { obsidianWorker } from './worker';
```

---

## 4. Main Registry
**File:** `functions/src/index.ts`

Registers the new namespaces.

```typescript
import { setGlobalOptions } from "firebase-functions";

setGlobalOptions({ maxInstances: 10 });

// Existing Exports (Preserve these)
export { externalWebhook } from './modules/bare-metal-api';
export { onJournalEntryCreated } from './modules/voice-processor';
export { debugEndpoint, helloWorld } from './testing';

// New Microservices
export { aiGateway } from './microservices/ai-gateway';

// New Plugin Systems
export * as obsidian from './plugins/obsidian-integration';
```

---

## 5. Verification Plan

### Test Script (`testing/testing-backend/test-obsidian.py`)
Run this against the Emulator to verify the pipeline.

```python
import requests, time, sys

# Verify Emulator URL
BASE_URL = "http://127.0.0.1:5001/demo-project/us-central1"
URL = f"{BASE_URL}/obsidian-obsidianApi"

def run():
    print(f"🚀 Testing Pipeline: {URL}")
    
    # 1. Submit
    print(">> Submitting Entry...")
    res = requests.post(URL, json={"content": "Architecture test.", "duration": 60}, headers={"x-user-id": "richard_li"})
    if res.status_code != 202: 
        print(f"❌ Failed: {res.text}"); sys.exit(1)
        
    data = res.json()
    job_id = data['jobId']
    print(f"✅ Job Queued: {job_id}")

    # 2. Poll for Completion
    print(">> Polling Worker...", end="", flush=True)
    for _ in range(10):
        time.sleep(1)
        status_res = requests.get(URL, params={"jobId": job_id}, headers={"x-user-id": "richard_li"})
        state = status_res.json().get('status')
        print(f".{state}", end="", flush=True)
        if state == 'completed':
            print("\n✅ WORKER SUCCESS!")
            print(status_res.json().get('result'))
            return
            
    print("\n❌ Timeout: Worker did not complete job.")

if __name__ == "__main__":
    run()
```

