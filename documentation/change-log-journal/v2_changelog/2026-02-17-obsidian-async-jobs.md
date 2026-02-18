# 2026-02-17 — Obsidian jobs restored

- Reinstated async job flow for Obsidian ingestion: POST queues `ai_analysis_obsidian` and returns `jobId`, GET polls job status.
- Worker now runs real journal analysis (AI + graph upsert + stats) and writes results back to the entry and job.
- Added structured logging on API and worker to trace queueing, missing jobs, and failures.
- Keeps test harness contract (202 Accepted on POST, async completion via GET) intact.
- AI gateway now returns only the topology fragment (frontend-shaped); `analyzeJournal` mirrors this topology response.
- Obsidian worker consumes the topology, only updates the graph, and sets a placeholder job result `nodesMade`.
