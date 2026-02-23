Short-Term Plan: Transition to Shared Data Manipulation
This plan outlines the migration to a Firebase Cloud Functions backend while ensuring your React 19 frontend and the server execute the exact same progression and topology logic.

Step 1: Restructure into a Domain-Driven Workspace
Create the foundational folders and link them via the root package.json.

Root /package.json:

JSON
{
  "name": "self-stats-workspace",
  "private": true,
  "workspaces": [
    "apps/*",
    "shared/*"
  ]
}
Directory Layout:

/apps/web (React 19, Vite 6, Zustand 5)

/apps/api-cloud (Firebase Functions)

/shared/contracts (Types & Zod Schemas)

/shared/progression (EXP & Leveling Engine)

/shared/topology (Graph Math)

Step 2: Extract the Shared Logic Libraries
Move your custom technologies out of src/systems and src/lib and into the isolated workspace packages. These functions must be pure.

/shared/progression/src/leveling.ts

TypeScript
/**
 * Calculates the current level based on cumulative EXP.
 * Uses the mathematical formula: Level = floor(log2(EXP + 1))
 */
export const calculateLevel = (exp: number): number => {
  // LaTeX representation of the core mechanic: $Level = \lfloor\log_2(EXP + 1)\rfloor$
  return Math.floor(Math.log2(exp + 1));
};

/**
 * Normalizes EXP to prevent "Domain Inflation" across the 3-Layer Semantic Pipeline.
 */
export const normalizeExp = (rawExp: number, nodeDepth: number): number => {
  const normalized = rawExp / Math.max(1, nodeDepth);
  return Number(normalized.toFixed(4)); // Rounded to 4 decimal places for consistency
};
/shared/topology/src/merging.ts

TypeScript
import { calculateLevel } from '@self-stats/progression';

export const applyNeuralWeighting = (currentWeight: number, suggestedWeight: number): number => {
  const LEARNING_RATE = 0.01; 
  return currentWeight + (suggestedWeight - currentWeight) * LEARNING_RATE;
};
Step 3: Build the Firebase API Endpoint
This Cloud Function acts as the orchestrator. It receives the journal text, calls the AI Engine (Gemini 2.0 Flash), and then runs the same progression and topology logic your frontend uses to calculate the final state before saving to Firestore.

/apps/api-cloud/src/index.ts

TypeScript
import * as functions from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { calculateLevel, normalizeExp } from "@self-stats/progression"; 
import { applyNeuralWeighting } from "@self-stats/topology";

admin.initializeApp();

export const processJournalEntry = functions.onCall(async (request) => {
  if (!request.auth) throw new functions.https.HttpsError("unauthenticated", "Denied");

  const { rawText } = request.data;

  // 1. AI Engine Call (Gemini)
  // const geminiResponse = await callGemini(rawText);
  const mockAiExtraction = { action: "Debugging", suggestedExp: 15, relatedSkill: "Frontend Engineering" };

  // 2. Shared Data Manipulation (Progression & Topology)
  const finalExp = normalizeExp(mockAiExtraction.suggestedExp, 1);
  const newLevel = calculateLevel(finalExp);

  const finalNodeState = {
    ...mockAiExtraction,
    exp: finalExp,
    level: newLevel,
    layer: "Action", // Emerald #10b981
    isSynced: true
  };

  // 3. Save to Firestore (Source of Truth)
  const docRef = await admin.firestore()
    .collection("users").doc(request.auth.uid)
    .collection("nodes").add(finalNodeState);

  return { success: true, id: docRef.id, data: finalNodeState };
});
Step 4: Implement the Frontend Hybrid Call
The React app implements the Hybrid Read-Aside, Sync-Behind architecture. It processes the raw text locally using a fast fallback heuristic to update the UI immediately, then syncs with Firebase for the AI-processed truth.

/apps/web/src/components/JournalForm.tsx

TypeScript
import { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { calculateLevel } from '@self-stats/progression';
import { set, update } from 'idb-keyval'; // Using idb-keyval for IndexedDB

export const JournalForm = () => {
  const [text, setText] = useState('');
  const functions = getFunctions();
  const processJournalCloud = httpsCallable(functions, 'processJournalEntry');

  const handleSubmit = async () => {
    const tempId = `temp_${Date.now()}`;
    
    // 1. Optimistic UI Manipulation (Using shared logic)
    const optimisticExp = 5; // Base fallback EXP
    const optimisticData = {
      rawText: text,
      exp: optimisticExp,
      level: calculateLevel(optimisticExp),
      isSynced: false
    };

    // 2. Save to idb-keyval immediately
    await set(tempId, optimisticData);
    
    // -> Zustand state updates here to reflect the idb-keyval change <-

    try {
      // 3. Send to Firebase Cloud Function
      const result = await processJournalCloud({ rawText: text });
      
      // 4. Reconcile IndexedDB state with the server's AI-processed truth
      await update(tempId, () => result.data);
    } catch (error) {
      console.error("Sync failed, item remains in IndexedDB for manual Force-Sync panel", error);
    }
  };

  // ... render
};
Step 5: TypeScript Configuration (tsconfig.json Update)
To ensure Vite and the Firebase compiler understand the domain-driven imports, map the paths in a base configuration file.

/tsconfig.base.json

JSON
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@self-stats/contracts": ["shared/contracts/src/index.ts"],
      "@self-stats/progression": ["shared/progression/src/index.ts"],
      "@self-stats/topology": ["shared/topology/src/index.ts"]
    }
  }
}
Extend this base config in both /apps/web/tsconfig.json and /apps/api-cloud/tsconfig.json.