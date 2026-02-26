/**
 * @file topology.ts
 * @module @self-stats/contracts/topology
 *
 * Payload contracts for the AI-driven Text-to-Topology pipeline.
 *
 * ## Pipeline overview
 * 1. The user submits raw journal text (e.g. "Ran 10km and read philosophy").
 * 2. Gemini (or OpenAI) returns a `TextToActionResponse` containing extracted
 *    actions, skill mappings, and characteristic mappings.
 * 3. `@self-stats/soul-topology` consumes this response to produce a `GraphState`
 *    fragment that is merged into the CDAG.
 * 4. `@self-stats/progression-system` propagates EXP through the resulting graph.
 *
 * AI agents: these types are the *boundary contract* between the LLM service and
 * the pure-math layers. Do NOT add React/SDK imports here.
 */

// ─── AI output primitives ──────────────────────────────────────────────────

/**
 * A single action extracted from a journal entry along with its relevance weight.
 *
 * Actions are leaf nodes in the CDAG (type `'action'`).
 * The `weight` influences how much initial EXP seed is assigned before
 * propagation — higher weight ≈ more time / effort invested in this activity.
 */
export interface WeightedAction {
  /** Normalised action label (lowercase slug, e.g. "ran 10km", "read philosophy"). */
  label: string;
  /**
   * Relevance weight in the range `[0.0, 1.0]`.
   * `1.0` = dominant activity for the entry; `0.1` = minor/incidental.
   * The progression engine multiplies this against the duration multiplier.
   */
  weight: number;
}

/**
 * A directed relationship from a more-specific concept (child) to a
 * more-general concept (parent) in the CDAG hierarchy.
 *
 * Used for both skill mappings (action → skill) and characteristic mappings
 * (skill → characteristic).
 *
 * @example
 * { child: "ran 10km", parent: "Cardio", weight: 0.9 }
 * { child: "Cardio", parent: "Vitality", weight: 0.85 }
 */
export interface GeneralizationLink {
  /**
   * The more-specific (lower-tier) node label.
   * For skill mappings: an action label.
   * For characteristic mappings: a skill label.
   */
  child: string;
  /**
   * The more-general (higher-tier) node label.
   * For skill mappings: a skill category (e.g. "Cardio").
   * For characteristic mappings: a core attribute (e.g. "Vitality").
   */
  parent: string;
  /**
   * Edge weight in the range `[0.0, 1.0]`.
   * Determines how strongly EXP flows upward through this link during BFS
   * propagation in `calculateParentPropagation`.
   */
  weight: number;
}

// ─── Full AI response ──────────────────────────────────────────────────────

/**
 * Complete structured response returned by the LLM text-to-topology step.
 *
 * This is the *single source of truth* produced by `generateTopology` in
 * `apps/api-firebase/src/services/genai-topology.ts` and consumed by
 * `transformAnalysisToTopology` in `@self-stats/soul-topology`.
 *
 * Field-by-field guide for AI agents editing this contract:
 * - Adding a new array field: also update `transformAnalysisToTopology` to
 *   process the new field into CDAG nodes/edges.
 * - Changing a field name: update the Gemini prompt schema, the transform
 *   function, and any Zod validation simultaneously.
 */
export interface TextToActionResponse {
  /**
   * Estimated activity duration in integer minutes.
   * Used to compute the duration multiplier → final scaled EXP.
   * `0` means the AI could not estimate duration; the system falls back to `30`.
   */
  durationMinutes: number;
  /**
   * List of actions extracted from the journal text, each with a relevance weight.
   * These become leaf nodes (`type: 'action'`) in the CDAG.
   * The progression engine uses these weights as initial EXP seeds before propagation.
   */
  weightedActions: WeightedAction[];
  /**
   * Action → Skill generalisation links.
   * Each entry creates or reuses a skill node and a directed edge
   * from skill (parent) to action (child) with the given weight.
   */
  skillMappings: GeneralizationLink[];
  /**
   * Skill → Characteristic generalisation links.
   * Each entry creates or reuses a characteristic node and an edge
   * from characteristic (parent) to skill (child).
   * The AI should bias `parent` toward the 7 `CORE_ATTRIBUTES` when possible.
   */
  characteristicMappings: GeneralizationLink[];
  /**
   * Optional flat chain of generalisation links that the AI generated before
   * splitting into skill/characteristic layers.
   * When present, `transformAnalysisToTopology` uses this in preference to the
   * split mappings to avoid duplication.
   * May be `undefined` or empty for older AI responses.
   */
  generalizationChain?: GeneralizationLink[];
}
