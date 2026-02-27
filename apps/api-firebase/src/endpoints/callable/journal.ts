/**
 * @file journal.ts
 * @module api-firebase/endpoints/callable/journal
 *
 * Callable (onCall v2) endpoint for processing journal entries.
 *
 * Thin handler: validate input → call `journal-service.processJournal` → return.
 * Zero business logic here.
 *
 * Authentication: Firebase Auth user context from `request.auth`.
 */

import {onCall, HttpsError} from "firebase-functions/v2/https";
import {processJournal} from "../../services/journal-service";

/**
 * Process a journal entry through the full pipeline:
 * AI topology → progression update → graph + journal persist.
 *
 * Client calls via Firebase SDK `httpsCallable("processJournalEntry")`.
 */
export const processJournalEntry = onCall(async (request) => {
  // Auth check
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be signed in.");
  }

  const userId = request.auth.uid;
  const {rawText, timestamp} = request.data as {
    rawText?: string;
    timestamp?: number;
  };

  if (!rawText || typeof rawText !== "string") {
    throw new HttpsError("invalid-argument", "Missing rawText.");
  }

  const result = await processJournal({rawText, userId, timestamp});

  return {
    success: true,
    entryId: result.entryId,
    graph: result.graph,
    stats: result.stats,
  };
});
