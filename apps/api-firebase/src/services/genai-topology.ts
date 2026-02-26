import {GoogleGenAI} from "@google/genai";
import * as logger from "firebase-functions/logger";
import { type TextToActionResponse } from "@self-stats/contracts";

export type TopologyResponse = TextToActionResponse;

const MODEL_CANDIDATES = ["gemini-3-flash-preview", "gemini-2.0-flash"] as const;

const SINGLE_PROMPT_TOPOLOGY_PROMPT = (text: string) => `
You are an expert ontological architect. Analyze the journal entry to produce a structured semantic topology.

# PIPELINE
1. EXTRACT ACTIONS: Identify 1-5 broad, repeatable gerunds (e.g. "Debugging", "Running"). Avoid specific metrics.
2. DURATION: Estimate total minutes (int). Default: 30.
3. WEIGHTS: Assign 0.1-1.0 to actions based on effort. Sum must be 1.0.
4. SKILL MAPPING: Map each Action to a parent Skill (e.g. "Debugging" -> "Software Engineering").
5. CHARACTERISTICS: Map Skills to [Intellect, Vitality, Wisdom, Social, Discipline, Creativity, Leadership].
6. GENERALIZATION: Chain from a Characteristic -> abstract concepts -> "progression". Max 5 links.
   - Example: "Intellect" -> "Cognitive Mastery" -> "Self-Improvement" -> "progression"

# RULES
- Return ONLY valid JSON.
- All weights 0.1-1.0.
- Explicit parent/child mappings for every layer.

### Characteristics:
- "progression" is the recommended root node.
Strongly prefer mapping to one of these 7 Archetypal Attributes when semantically appropriate:
- Vitality: Physical resilience, fitness, and overall physiological health.
- Intellect: Analytical capacity, coding proficiency, and technical rigor.
- Wisdom: Metacognition, experienced judgment, and philosophical depth.
- Social: Charisma, collaboration, interpersonal intelligence, and empathy.
- Discipline: Focus, self-control, and the ability to maintain behavioral systems/habits.
- Creativity: Innovation, design thinking, and artistic problem-solving.
- Leadership: Vision, strategic influence, and group direction.

If a skill does not clearly fit any of the above, generate a specific, descriptive characteristic instead (e.g., "Engineering", "Athletics", "Music"). Do NOT force-fit; organic classification is preferred.


# OUTPUT JSON STRUCTURE
{
  "durationMinutes": <integer>,
  "weightedActions": [{ "label": "string", "weight": number }],
  "skillMappings": [{ "child": "string", "parent": "string", "weight": number }],
  "characteristicMappings": [{ "child": "string", "parent": "string", "weight": number }],
  "generalizationChain": [{ "child": "string", "parent": "string", "weight": number }]
}

# ENTRY
${JSON.stringify(text)}
`;

const withTimeout = async <T>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
  let timeoutId: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

const getClient = (): GoogleGenAI => {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GENAI_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_API_KEY not configured for ai-gateway");
  }
  return new GoogleGenAI({apiKey});
};

export const generateTopology = async (text: string): Promise<TopologyResponse> => {
  const client = getClient();
  let lastError: unknown;

  for (const model of MODEL_CANDIDATES) {
    try {
      const result = (await withTimeout(
        client.models.generateContent({
          model,
          contents: SINGLE_PROMPT_TOPOLOGY_PROMPT(text),
          config: {
            temperature: 0,
            responseMimeType: "application/json",
            responseSchema: {
              type: "object",
              properties: {
                durationMinutes: {type: "number"},
                weightedActions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {label: {type: "string"}, weight: {type: "number"}},
                    required: ["label", "weight"],
                  },
                },
                skillMappings: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {child: {type: "string"}, parent: {type: "string"}, weight: {type: "number"}},
                    required: ["child", "parent", "weight"],
                  },
                },
                characteristicMappings: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {child: {type: "string"}, parent: {type: "string"}, weight: {type: "number"}},
                    required: ["child", "parent", "weight"],
                  },
                },
                generalizationChain: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {child: {type: "string"}, parent: {type: "string"}, weight: {type: "number"}},
                    required: ["child", "parent", "weight"],
                  },
                },
              },
              required: [
                "durationMinutes",
                "weightedActions",
                "skillMappings",
                "characteristicMappings",
                "generalizationChain",
              ],
            },
          },
        }),
        120000,
        `genai-topology ${model}`,
      )) as {response?: {text(): string}};

      const raw = result.response?.text();
      logger.info(`genai-topology success with model ${model}`, {raw});

      const parsed = JSON.parse(raw ?? "{}") as Partial<TopologyResponse>;
      if (Object.keys(parsed).length === 0) {
        logger.warn("genai-topology empty payload", {model, raw});
        throw new Error("Empty response from GenAI");
      }

      logger.info("genai-topology parsed payload", {
        model,
        duration: parsed.durationMinutes,
        actions: parsed.weightedActions?.length ?? 0,
        skills: parsed.skillMappings?.length ?? 0,
        characteristics: parsed.characteristicMappings?.length ?? 0,
        generalizations: parsed.generalizationChain?.length ?? 0,
      });

      return {
        durationMinutes: parsed.durationMinutes ?? 30,
        weightedActions: parsed.weightedActions ?? [],
        skillMappings: parsed.skillMappings ?? [],
        characteristicMappings: parsed.characteristicMappings ?? [],
        generalizationChain: parsed.generalizationChain ?? [],
      };
    } catch (error) {
      lastError = error;
      continue;
    }
  }

  throw new Error(`All GenAI models failed: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
};
