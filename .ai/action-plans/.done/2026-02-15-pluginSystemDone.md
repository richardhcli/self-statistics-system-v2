# Async Plugin System & Job Queue (Implemented)

## Implementation Snapshot
- Async job queue for plugin-driven AI processing and third-party ingestion (Obsidian).
- Plugin SDK gates all Firestore access per user scope.
- AI gateway calls Gemini topology (Primary: Gemini 3 Flash → Fallback: Gemini 2.0 Flash) and returns raw `TopologyResponse`.
- Obsidian integration: HTTPS ingest queues job (202), Firestore-triggered worker runs real AI analysis, upserts CDAG graph, returns `nodesMade` count.

## Files
- Plugin SDK: [functions/src/plugin-sdk/index.ts](functions/src/plugin-sdk/index.ts)
- AI gateway: [functions/src/microservices/ai-gateway.ts](functions/src/microservices/ai-gateway.ts)
- Topology service: [functions/src/services/genai-topology.ts](functions/src/services/genai-topology.ts)
- AI client (gateway caller): [functions/src/services/ai-client.ts](functions/src/services/ai-client.ts)
- Graph writer: [functions/src/services/graph-writer.ts](functions/src/services/graph-writer.ts)
- Journal pipeline: [functions/src/plugins/journal-pipeline/pipeline.ts](functions/src/plugins/journal-pipeline/pipeline.ts)
- Obsidian API: [functions/src/plugins/obsidian-integration/api.ts](functions/src/plugins/obsidian-integration/api.ts)
- Obsidian worker: [functions/src/plugins/obsidian-integration/worker.ts](functions/src/plugins/obsidian-integration/worker.ts)
- Exports registry: [functions/src/index.ts](functions/src/index.ts)
- Test harness: [testing/testing-backend/testing-emulator/test-obsidian.py](testing/testing-backend/testing-emulator/test-obsidian.py)

## Flow
1. Client POSTs content → Obsidian API stores entry, queues `ai_analysis_obsidian` job, returns 202 + `jobId`.
2. Firestore trigger fires worker → marks processing → calls `analyzeJournal` (→ AI gateway → Gemini topology).
3. Worker converts topology → graph nodes/edges via `buildGraphPayload`, upserts via `graph-writer`.
4. Job finalized as completed with `{nodesMade: N}` or failed with error.
5. Client polls GET `?jobId=` for status.

## Job Schema
- Location: `users/{uid}/jobs/{jobId}`
- Fields: id, type, payload, status (queued|processing|completed|failed), timestamps, result, errors.

## Testing
- Start emulator, then run test harness to confirm submit → queue → completion cycle.
