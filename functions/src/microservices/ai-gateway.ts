import {onRequest} from "firebase-functions/v2/https";

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "entry";

/**
 * Mock external AI processing endpoint.
 * Simulates latency to mimic real-world provider calls.
 */
export const aiGateway = onRequest(async (req, res) => {
  // Simulate provider latency.
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const content = typeof req.body?.content === "string" ? req.body.content : "";
  const duration = typeof req.body?.duration === "number" ? req.body.duration : 0;

  const safeText = content.trim() || "Journal entry";
  const summary = `Analyzed: ${safeText.slice(0, 96)}...`;
  const tags = Array.from(
    new Set(
      safeText
        .split(/\s+/)
        .filter((word: string) => word.length > 4)
        .slice(0, 3),
    ),
  );

  const actions = [
    {id: `action-${slugify(safeText).slice(0, 32) || "journal"}`, label: safeText.slice(0, 32) || "Journal"},
  ];
  const skills = [{id: "skill-knowledge-mgmt", label: "Knowledge Management"}];
  const characteristics = [{id: "characteristic-intellect", label: "Intellect"}];

  const links = [
    {source: "progression", target: characteristics[0].id, weight: 1},
    {source: characteristics[0].id, target: skills[0].id, weight: 0.8},
    {source: skills[0].id, target: actions[0].id, weight: 0.6},
  ];

  const expReward = Math.max(50, Math.min(200, Math.round((duration || 30) / 30) * 50));

  res.json({
    summary,
    tags: tags.length ? tags : ["journal"],
    sentiment: "positive",
    expReward,
    actions,
    skills,
    characteristics,
    links,
  });
});
