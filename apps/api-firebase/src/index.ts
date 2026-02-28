/**
 * @file index.ts
 * @module api-firebase
 *
 * Cloud Functions entry point. Exports all deployed endpoints.
 *
 * ## Architecture (post-overhaul)
 * - `endpoints/callable/*` — `onCall` endpoints (Firebase Auth integrated)
 * - `endpoints/rest/*`     — `onRequest` endpoints (Bearer token auth)
 * - `testing/*`            — Dev-only debug endpoints
 */

import {setGlobalOptions} from "firebase-functions";
// import {onRequest} from "firebase-functions/https";
// import * as logger from "firebase-functions/logger";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({maxInstances: 10});

// Callable (authenticated frontend endpoints)
export {processJournalEntry} from "./endpoints/callable/journal";
export {generateFirebaseAccessToken} from "./endpoints/callable/integration-auth";

// REST (external plugin endpoints)
export {apiRouter} from "./endpoints/rest/api-router";
export {obsidianWebhook} from "./endpoints/rest/obsidian-webhook";

// Testing (dev only)
export {debugEndpoint, helloWorld} from "./testing";
