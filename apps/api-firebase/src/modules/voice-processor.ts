// // src/modules/voice-processor.ts
// import * as logger from "firebase-functions/logger";
// import { onDocumentCreated } from "firebase-functions/v2/firestore";
// import { IntegrationSDK } from "../integrations/sdk";

// const sdk = new IntegrationSDK();

// // NEW v2 Syntax
// export const onJournalEntryCreated = onDocumentCreated(
//   "users/{userId}/journal/{entryId}", // The document path goes here directly
//   async (event) => {
//     // In v2, 'event' contains 'data' (the snapshot) and 'params'
//     const snapshot = event.data;
//     const params = event.params;

//     // Safety check: if the document was deleted, snapshot is undefined
//     if (!snapshot) {
//         return;
//     }

//     const data = snapshot.data(); // This retrieves the actual fields
//     const userId = params.userId;

//     // Only process if it needs analysis
//     if (data && data.needsAnalysis === true) {
//       logger.info(`Analyzing entry for user ${userId}...`);

//       // ... (Rest of your logic remains the same) ...
//       const extractedExp = 50;

//       await sdk.stats.updateExp(userId, 'voice-node-1', extractedExp);

//       // Update the doc to prevent infinite loops
//       await snapshot.ref.update({ needsAnalysis: false });
//     }
//   }
// );
