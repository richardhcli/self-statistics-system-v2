import {onRequest} from "firebase-functions/v2/https";
import {generateTopology} from "../services/genai-topology";

/**
 * AI gateway backed by the same single-prompt topology methodology used in the client.
 */
export const aiGateway = onRequest(async (req, res) => {
  const content = typeof req.body?.content === "string" ? req.body.content : "";
  const safeText = content.trim() || "Journal entry";

  try {
    const topology = await generateTopology(safeText);
    res.json(topology);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown AI error";
    console.error("aiGateway topology failure", message, error);
    res.status(500).json({error: message});
  }
});
