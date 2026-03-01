**Action Plan: Obsidian Plugin View Finalization (Single AI call + Rich Markdown)**

**Date:** 2026-03-01  
**Status:** ✅ Implemented  
**Scope:** Backend `api-router` pipeline, shared SDK response shape, Obsidian plugin command rendering

---

## Goals
- Eliminate the duplicate AI execution during a single journal submission (one call to the model per request).
- Expand backend response to include per-stat deltas (`oldValue`, `newValue`, `increase`) for Obsidian rendering.
- Render a nested Obsidian callout in the plugin using the new payload.

## Preconditions
- Firebase Custom Token auth already in place (Bearer `ID_TOKEN` required on `apiRouter`).
- Existing Obsidian command and backend endpoints are functioning with current summary payloads.

## Workstream A: Stop duplicate AI execution (backend)
1) Locate AI invocation path: `apps/api-firebase/src/services/journal-service.ts` and `soul-topology` helpers (`analyzeAndTransform` / `generateTopology`).
2) Trace where `aiProvider.analyzeEntry(text)` (or equivalent) is called; confirm it runs twice.
3) Fix: call once, store result (`topologyResult`), reuse downstream; remove any secondary validation/invocation.
4) Add unit/integration-level log guard: ensure only one “analysis start” log per request in `apiRouter` execution.

## Workstream B: Enrich API payload (backend + SDK)
1) Define `StatChange { name: string; oldValue: number; newValue: number; increase: number; }`.
2) Backend: include `statChanges: StatChange[]` in `apiRouter` response (both journal and Obsidian webhook paths). Populate from actual graph delta (before/after).
3) SDK: update `shared/plugin-sdk/src/client.ts` `JournalEntryResponse` to carry `statChanges` (and any shared type export if needed).
4) REMOVE and IGNORE backward-compatibility, focus on only making the new version. 

## Workstream C: Obsidian rendering
1) Target: `apps/obsidian-plugin/src/commands/index.ts` (`handleJournalEntry`).
2) Parse `statChanges`, compute largest increase (tie-break on first occurrence).
3) Build nested callout:
```
> [!info] Self Statistics
> EXP UP!! **{Largest}**: {Old} → {New} (+{Increase}) (+{Total_EXP} total EXP)
> > [!success]- All increases:
> > - {Stat_1}: {Old} → {New} (+{Inc})
> > - ...
>
> {Original Journal Text}
```
4) Insert into note (existing insertion mechanism), preserving original journal text.

## Validation (AI Agent): 
* follow .ai\blueprints\universal-validation-guidelines.md

## Validation (user) 
- Backend logs: one AI invocation per request (manual check via Cloud Function logs or emulator logs).
- Response schema: `statChanges` present with correct numeric deltas; existing fields remain intact.
- Plugin output: callout matches the required format and lists all stats; largest increase shown in header line.
- Regression: journal submission still returns 2xx via Obsidian command and SDK sandbox.

## Deliverables
- Backend fix to single-invocation pipeline and enriched response.
- SDK type update for `JournalEntryResponse` with `statChanges`.
- Obsidian command rendering updated to nested callout.
- Validation notes/log evidence captured (no new docs unless behavior changes beyond callout format).
