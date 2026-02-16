import {onRequest} from "firebase-functions/v2/https";

/**
 * Mock external AI processing endpoint.
 * Simulates latency to mimic real-world provider calls.
 */
export const aiGateway = onRequest(async (_req, res) => {
  // Simulate provider latency.
  await new Promise((resolve) => setTimeout(resolve, 1500));

  res.json({
    summary: "Automatically generated summary from AI.",
    tags: ["auto-tag-1", "auto-tag-2"],
    sentiment: "positive",
    expReward: 50,
  });
});
