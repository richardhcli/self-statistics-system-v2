### Finalized Implementation Blueprint: Async Job Pattern

This blueprint integrates your decisions: **Dedicated Jobs Collection** (`users/{uid}/jobs`) and **External AI Microservice**.

**Phase 1: The Plugin SDK (The "Gatekeeper")**

* **Goal**: Provide a unified, safe API for all plugins.
* **Structure**:
* `journal`: CRUD for `users/{uid}/journal_entries`.
* `graph`: CRUD for `users/{uid}/graphs`.
* `settings`: Read/Write `users/{uid}/account_config`.
* `user`: Read/Write `users/{uid}/user_information`.
* `jobs`: Manage the new `users/{uid}/jobs` collection.



**Phase 2: The AI Microservice (Mock)**

* **Goal**: Create a standalone function that simulates the "External AI" service.
* **Implementation**: A generic HTTP function that accepts a prompt and returns a mock analysis result after a delay.
* **Location**: `src/microservices/ai-gateway.ts` (This represents the separate deployment).

**Phase 3: The Job Manager System**

* **Goal**: Handle the async lifecycle.
* **Flow**:
1. Plugin submits data → SDK creates "Queued" Job.
2. Firestore Trigger (`onJobCreated`) wakes up.
3. Trigger calls AI Microservice.
4. Trigger updates Job to "Completed" with results.



**Phase 4: Obsidian Plugin**

* **Endpoints**:
* `POST /submit`: Creates Journal Entry + Job. Returns `202 Accepted` + `jobId`.
* `GET /status`: Checks Job status.



---

### Step 1: The Plugin SDK (`src/plugin-sdk/index.ts`)

This is the **only** file your plugins are allowed to import for data access.

```typescript
import * as admin from 'firebase-admin';

// Ensure Admin SDK is initialized
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

export class PluginSDK {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }
...

```

We will move away from hardcoded modules and instead create a Universal CRUD Engine that can access any datastore, with specific helpers for your known domains.

Action: Create src/plugin-sdk/index.ts
This single file will export the PluginSDK class.

1. The Universal CRUD Layer
This internal helper handles the raw Firestore operations. It is "private" to the SDK but exposed via controlled methods.

```TypeScript
// Conceptual Implementation
private async crud(action: 'GET' | 'SET' | 'UPDATE' | 'DELETE', collectionPath: string, docId?: string, data?: any) {
  const colRef = this.db.collection(`users/${this.userId}/${collectionPath}`);
  // ... switch statement handling standard Firestore logic ...
}
```

#### 2. The Domain Helpers

These are the friendly wrappers you will actually use.

* **`journal`**:
* `createEntry(text, metadata)`: Auto-generates ID (YYYYMMDD...), adds timestamps.
* `getEntry(id)`


* **`graph`**:
* `getTopology()`: Fetches `graphs/cdag_topology`.
* `updateNode(nodeId, data)`


* **`user`**:
* `getStats()`: Fetches `user_information/player_statistics`.
* `updateStats(data)`: Merges data into player statistics.


* **`jobs`** (The Async Engine):
* `create(type, payload)`: Creates a job in `jobs/` collection.
* `get(jobId)`: Checks status.
* `updateStatus(jobId, status, result)`: Used by workers.

---

### Step 2: The Mock AI Microservice (`src/microservices/ai-gateway.ts`)

This represents the **separate** cloud function.

```typescript
import { onRequest } from "firebase-functions/v2/https";

/**
 * TODO: Deploy this as a separate microservice.
 * URL: https://api.myservice.com/v1/analyze
 */
export const aiGateway = onRequest(async (req, res) => {
  // Simulate processing delay (e.g., calling OpenAI)
  await new Promise(resolve => setTimeout(resolve, 2000));

  const { prompt, content } = req.body;

  // Mock Response
  res.json({
    success: true,
    analysis: {
      summary: `Analyzed: ${content.substring(0, 20)}...`,
      sentiment: "positive",
      suggestedTags: ["productivity", "obsidian"],
      tokensUsed: 150
    }
  });
});

```

---

### Step 3: The Obsidian Plugin

Location: src/plugins/obsidian-integration/


### Phase 2: Obsidian Integration Plugin Blueprint

This plugin serves as the bridge between your local Obsidian vault (or any external tool) and your Firebase backend.

**Location:** `src/plugins/obsidian-integration/`

#### Step 1: `api.ts` (The Public Interface)

This file exports a single HTTPS Function `obsidianEntry` that handles two methods:

* **POST (Submit Entry):**
* **Input:** `{ "content": "My journal text", "duration": 300, "tags": ["coding"] }`
* **Logic:**
1. Auth Check (Header `x-user-id`).
2. Call `SDK.journal.createEntry()` to save the raw text immediately.
3. Call `SDK.jobs.create('ai_analysis_obsidian', { entryId })` to trigger the AI background worker.


* **Response:** `202 Accepted` JSON containing `{ "jobId": "...", "statusUrl": "..." }`.


* **GET (Check Status):**
* **Input:** Query param `?jobId=...`
* **Logic:** Call `SDK.jobs.get(jobId)`.
* **Response:** JSON with current status (`queued`, `processing`, `completed`) and result if done.



#### Step 2: `status-api.ts` (The Player Stats)

A separate HTTPS Function `obsidianStatus` for fetching RPG stats.

* **GET:**
* **Logic:** Call `SDK.user.getStats()`.
* **Response:** JSON `{ "level": 5, "exp": 1200, "attributes": { ... } }`.
* **Use Case:** Your Obsidian dashboard can display your current "Game Level".



#### Step 3: `worker.ts` (The Background Processor)

A Firestore Trigger on `users/{uid}/jobs/{jobId}`.

* **Trigger:** `onDocumentCreated`
* **Logic:**
1. Check if `job.type === 'ai_analysis_obsidian'`.
2. Update Job Status → `processing`.
3. **AI Simulation:**
* Fetch the Journal Entry using `SDK.journal.getEntry(job.payload.entryId)`.
* Send text to your **AI Microservice** (or mock function).
* Receive analysis (tags, sentiment, EXP gained).


4. **Apply Results:**
* Update the Journal Entry with AI metadata (tags, summary).
* Update Player Stats with gained EXP using `SDK.user.updateStats()`.


5. Update Job Status → `completed` (with results).



---

### Phase 3: Testing Plan

1. **Local Test Script (`test_obsidian_flow.py`):**
* **Test A:** POST a journal entry. Assert `202` response.
* **Test B:** Loop/Poll the status URL. Assert status changes from `queued` → `completed`.
* **Test C:** GET the `obsidianStatus` endpoint. Assert that EXP has increased (proving the worker updated the stats).



#### 3a. Utils & Types (`utils.ts`)

```typescript
export interface ObsidianPayload {
  content: string;
  durationSeconds: number;
}

```

#### 3b. The API (`api.ts`)

This handles the User -> Backend HTTP request.

```typescript
import { onRequest } from "firebase-functions/v2/https";
import { PluginSDK } from "../../plugin-sdk";

export const obsidianApi = onRequest(async (req, res) => {
  // 1. Auth Check (Mock)
  const userId = req.headers['x-user-id'] as string || 'default_user';
  const sdk = new PluginSDK(userId);

  if (req.method === 'POST') {
    // --- SUBMIT FLOW ---
    const { content, durationSeconds } = req.body;

    try {
      // A. Save the Raw Entry
      const entryId = await sdk.journal.create(content, { duration: durationSeconds });

      // B. Create the Async Job
      const jobId = await sdk.jobs.create('ai_analysis_obsidian', { 
        entryId, 
        content 
      });

      // C. Return 202 Accepted + Job ID
      res.status(202).json({
        message: "Entry accepted. Processing started.",
        entryId,
        jobId,
        statusUrl: `/obsidianApi?action=poll&jobId=${jobId}`
      });

    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }

  } else if (req.method === 'GET' && req.query.action === 'poll') {
    // --- POLLING FLOW ---
    const jobId = req.query.jobId as string;
    const job = await sdk.jobs.get(jobId);
    
    if (!job) {
      res.status(404).json({ error: "Job not found" });
      return;
    }

    res.json(job);
  }
});

```

#### 3c. The Worker (`worker.ts`)

This is the Firestore Trigger that actually does the work.

```typescript
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { PluginSDK } from "../../plugin-sdk";
// In real life, use 'axios' or 'fetch' to call your AI Microservice
// import axios from 'axios'; 

export const obsidianWorker = onDocumentCreated(
  "users/{userId}/jobs/{jobId}",
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const job = snapshot.data();
    const { userId, jobId } = event.params;
    const sdk = new PluginSDK(userId);

    // Only process our specific job type
    if (job.type !== 'ai_analysis_obsidian' || job.status !== 'queued') return;

    try {
      // 1. Mark as Processing
      await sdk.jobs.updateStatus(jobId, 'processing');

      // 2. Call AI Microservice (Simulated)
      // const response = await axios.post(AI_SERVICE_URL, { ... });
      
      // SIMULATION:
      const mockResult = {
        summary: "AI Analysis Complete",
        tags: ["obsidian", "test"]
      };

      // 3. Mark as Completed
      await sdk.jobs.updateStatus(jobId, 'completed', mockResult);

    } catch (err: any) {
      await sdk.jobs.updateStatus(jobId, 'failed', { error: err.message });
    }
  }
);

```

#### 3d. Index (`index.ts`)

```typescript
export { obsidianApi } from './api';
export { obsidianWorker } from './worker';

```

---

### Step 4: Register Everything (`src/index.ts`)

```typescript
// 1. Testing
export { helloWorld } from './testing/hello-world';
export { debugEndpoint } from './testing/debug-api'; // If you kept this

// 2. Microservices (Mock)
export { aiGateway } from './microservices/ai-gateway';

// 3. Plugins
export * as obsidian from './plugins/obsidian-incremental-system';

```

---

### Step 5: The Test Script (`testing-obsidian.py`)

This Python script verifies the entire "Job Queue" flow.

```python
import requests
import time
import json

# CONFIG
PROJECT_ID = "demo-project" # Change if needed
REGION = "us-central1"
BASE_URL = f"http://127.0.0.1:5001/{PROJECT_ID}/{REGION}"
OBSIDIAN_URL = f"{BASE_URL}/obsidian-obsidianApi" # Note the export name!

def run_test():
    print(f"🚀 Testing Obsidian Plugin Flow: {OBSIDIAN_URL}")

    # 1. SUBMIT ENTRY
    payload = {
        "content": "Today I refactored the backend to use an async job queue.",
        "durationSeconds": 300
    }
    headers = { "x-user-id": "richard_li", "Content-Type": "application/json" }

    print("Step 1: Submitting Journal Entry...")
    resp = requests.post(OBSIDIAN_URL, json=payload, headers=headers)
    
    if resp.status_code != 202:
        print(f"❌ Failed to submit: {resp.text}")
        return

    data = resp.json()
    job_id = data['jobId']
    print(f"✅ Accepted! Job ID: {job_id}")

    # 2. POLL FOR COMPLETION
    print("Step 2: Polling for results...")
    status = "queued"
    
    for i in range(10): # Try 10 times
        time.sleep(1) # Wait 1 second
        poll_resp = requests.get(OBSIDIAN_URL, params={"action": "poll", "jobId": job_id}, headers=headers)
        job_data = poll_resp.json()
        status = job_data.get('status')
        
        print(f"   Attempt {i+1}: Status = {status}")
        
        if status == 'completed':
            print("✅ Job Completed!")
            print("Result:", json.dumps(job_data.get('result'), indent=2))
            break
            
    if status != 'completed':
        print("❌ Timed out waiting for job completion.")

if __name__ == "__main__":
    run_test()

```







## Execution Checklist

1. [ ] **Refactor SDK:** Create `src/plugin-sdk/index.ts` with Universal CRUD.
2. [ ] **Create Plugin:** Set up `src/plugins/obsidian-integration/` structure.
3. [ ] **Implement API:** Write `api.ts` and `status-api.ts`.
4. [ ] **Implement Worker:** Write `worker.ts`.
5. [ ] **Register Exports:** Update `src/index.ts` to export the new functions.
6. [ ] **Verify:** Run the Python test script against the Emulator.

