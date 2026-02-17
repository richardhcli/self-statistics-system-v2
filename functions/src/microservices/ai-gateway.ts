import {onRequest} from "firebase-functions/v2/https";
import {generateTopology} from "../services/genai-topology";

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "entry";

const buildNodesAndEdges = (text: string, duration: number, topology: Awaited<ReturnType<typeof generateTopology>>) => {
  const actions = topology.weightedActions.map((action) => ({
    id: `action-${slugify(action.label)}`,
    label: action.label,
  }));

  const skillMap = new Map<string, string>();
  topology.skillMappings.forEach((mapping) => {
    const id = `skill-${slugify(mapping.parent)}`;
    skillMap.set(id, mapping.parent);
  });

  const characteristicMap = new Map<string, string>();
  topology.characteristicMappings.forEach((mapping) => {
    const id = `characteristic-${slugify(mapping.parent)}`;
    characteristicMap.set(id, mapping.parent);
  });

  // Ensure progression root exists in mapping chain
  const generalizationChain = topology.generalizationChain ?? [];
  const chainNodes = generalizationChain.flatMap((link) => [link.child, link.parent]);
  chainNodes.forEach((label) => {
    if (label && label !== "progression") {
      characteristicMap.set(`characteristic-${slugify(label)}`, label);
    }
  });

  const skills = Array.from(skillMap.entries()).map(([id, label]) => ({id, label}));

  const characteristics = Array.from(characteristicMap.entries()).map(([id, label]) => ({id, label}));

  const links = [] as {source: string; target: string; weight?: number}[];

  // Map characteristic -> skill
  topology.characteristicMappings.forEach((mapping) => {
    const source = `characteristic-${slugify(mapping.parent)}`;
    const target = `skill-${slugify(mapping.child)}`;
    links.push({source, target, weight: mapping.weight});
  });

  // Map skill -> action
  topology.skillMappings.forEach((mapping) => {
    const source = `skill-${slugify(mapping.parent)}`;
    const target = `action-${slugify(mapping.child)}`;
    links.push({source, target, weight: mapping.weight});
  });

  // Generalization chain: parent -> child toward progression
  generalizationChain.forEach((mapping) => {
    const source = `characteristic-${slugify(mapping.parent)}`;
    const target = `characteristic-${slugify(mapping.child)}`;
    links.push({source, target, weight: mapping.weight});
  });

  // Anchor to progression root if absent
  const roots = characteristics.length ? characteristics : [{id: "characteristic-progression", label: "Progression"}];
  roots.forEach((node) => {
    links.push({source: "progression", target: node.id, weight: 1});
  });

  const expReward = Math.max(50, Math.min(200, Math.round((duration || 30) / 30) * 50));

  const summary = `Analyzed: ${text.slice(0, 96)}...`;
  const tags = Array.from(new Set([...skills.map((s) => s.label), ...characteristics.map((c) => c.label)])).slice(0, 5);

  return {
    summary,
    tags: tags.length ? tags : ["journal"],
    sentiment: "positive",
    expReward,
    actions,
    skills,
    characteristics,
    links,
  };
};

/**
 * AI gateway backed by the same single-prompt topology methodology used in the client.
 */
export const aiGateway = onRequest(async (req, res) => {
  const content = typeof req.body?.content === "string" ? req.body.content : "";
  const duration = typeof req.body?.duration === "number" ? req.body.duration : 0;
  const safeText = content.trim() || "Journal entry";

  try {
    const topology = await generateTopology(safeText);
    const payload = buildNodesAndEdges(safeText, duration, topology);
    res.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown AI error";
    console.error("aiGateway topology failure", message, error);
    res.status(500).json({error: message});
  }
});
