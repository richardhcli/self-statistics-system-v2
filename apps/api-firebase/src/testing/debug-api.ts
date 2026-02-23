import * as logger from "firebase-functions/logger";
import {onRequest} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

// Ensure Admin SDK is initialized (if not already done in index.ts or sdk.ts)
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

export const debugEndpoint = onRequest(async (req, res) => {
  // 1. Security: Simple API Key Check
  const apiKey = req.headers["x-api-key"];
  if (apiKey !== "MY_SECRET_LOCAL_KEY") {
    res.status(401).json({error: "Unauthorized: Invalid API Key"});
    return;
  }

  const {action, payload} = req.body as {action?: string; payload?: unknown};

  try {
    switch (action) {
    // Basic "Are you alive?" check
    case "HEALTH":
      res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        nodeVersion: process.version,
        memoryUsage: process.memoryUsage(),
      });
      break;

      // Echo back payload to verify data integrity
    case "ECHO":
      res.json({
        received: payload,
        meta: {size: JSON.stringify(payload).length},
      });
      break;

      // Crucial: Test if the Function has permission to Read/Write Firestore
    case "DB_CONNECTIVITY_TEST": {
      const testRef = db.doc("_system_debug/connectivity_check");
      const writeTime = new Date().toISOString();

      // Write
      await testRef.set({
        lastCheck: writeTime,
        status: "active",
        payload: payload ?? "default",
      });

      // Read Back
      const snap = await testRef.get();
      const data = snap.data();

      if (data && data.lastCheck === writeTime) {
        res.json({
          success: true,
          message: "Firestore Read/Write Successful",
          data: data,
        });
      } else {
        throw new Error("Data verification failed: Read data did not match write.");
      }
      break;
    }

    default:
      res.status(400).json({error: `Unknown action: ${action}`});
    }
  } catch (error) {
    logger.error("Debug Error", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: process.env.FUNCTIONS_EMULATOR && error instanceof Error ? error.stack : undefined,
    });
  }
});
