import * as functions from "firebase-functions";
import {IntegrationSDK} from "../integrations/sdk";

interface UploadStatsPayload {
  userId: string;
  action: "UPLOAD_STATS";
  data: {
    nodeId: string;
    amount: number;
  };
}

const sdk = new IntegrationSDK();

// This function will be available at a specific URL
export const externalWebhook = functions.https.onRequest(async (req, res) => {
  // 1. Security Check (Simple API Key)
  const apiKey = req.headers["x-api-key"];
  // In production, use: functions.config().api.key
  if (apiKey !== "MY_SECRET_LOCAL_KEY") {
    res.status(403).send("Unauthorized");
    return;
  }

  // 2. Extract Data
  const {userId, action, data} = req.body as Partial<UploadStatsPayload>;

  // 3. Route to logic
  try {
    if (action === "UPLOAD_STATS") {
      if (!userId || !data?.nodeId || typeof data.amount !== "number") {
        res.status(400).json({error: "Missing or invalid payload"});
        return;
      }
      await sdk.stats.updateExp(userId, data.nodeId, data.amount);
      res.json({success: true, message: "Stats updated"});
    } else {
      res.status(400).json({error: "Unknown action"});
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({error: message});
  }
});
