/**
 * @file transform-analysis-to-topology.ts
 * @module @self-stats/soul-topology/entry-pipeline/transform-analysis-to-topology
 *
 * Converts a `TextToActionResponse` (AI output) + a generalisation chain
 * into a `GraphState` fragment ready to be merged into the CDAG store.
 *
 * ## What it produces
 * The output `GraphState` contains:
 * - **Action nodes** (`type: 'action'`): one per `weightedActions[*].label`.
 * - **Skill nodes** (`type: 'skill'`): one per unique `skillMappings[*].parent`.
 * - **Characteristic nodes** (`type: 'characteristic'`): one per unique `characteristicMappings[*].parent`.
 * - **Directed edges** for every `skillMappings` and `characteristicMappings` entry.
 * - **Generalisation chain edges** from `analysis.generalizationChain` or the
 *   fallback `generalizationChain` parameter (whichever is non-empty).
 *
 * ## Important: edge direction
 * Edges point **parent → child** (generalisation direction).
 * The progression engine traverses them *bottom-up* during BFS.
 *
 * ## Merging
 * The caller is responsible for merging the returned fragment into the existing
 * CDAG store — this function only creates NEW nodes/edges and does not read
 * or mutate any existing store state.
 */

import {
  type GraphState,
  type NodeData,
  type EdgeData,
  type TextToActionResponse,
  type GeneralizationLink,
} from '@self-stats/contracts';

/**
 * Transform an AI `TextToActionResponse` + supplemental generalisation chain
 * into a `GraphState` fragment.
 *
 * @param analysis            - Structured response from the LLM (Gemini / OpenAI).
 *                              See `TextToActionResponse` for field semantics.
 * @param generalizationChain - Fallback chain of `{ child, parent, weight }` links
 *                              used when `analysis.generalizationChain` is empty.
 *                              Pass an empty array `[]` if no fallback is available.
 * @returns A `GraphState` containing ALL nodes and edges identified in this entry.
 *          Nodes may overlap with the existing CDAG — the store's merge logic
 *          (`upsertNodes` / `set()` with merge) handles deduplication.
 */
export const transformAnalysisToTopology = (
  analysis: TextToActionResponse,
  generalizationChain: GeneralizationLink[],
): GraphState => {
  const nodes: Record<string, NodeData> = {};
  const edges: Record<string, EdgeData> = {};
  const timestamp = new Date().toISOString();

  // ── Layer 0: action (leaf) nodes ──────────────────────────────────────────
  analysis.weightedActions.forEach((wa) => {
    nodes[wa.label] = {
      id: wa.label,
      label: wa.label,
      type: 'action',
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  });

  // ── Layer 1: skill nodes + action→skill edges ─────────────────────────────
  analysis.skillMappings.forEach((mapping) => {
    if (!nodes[mapping.parent]) {
      nodes[mapping.parent] = {
        id: mapping.parent,
        label: mapping.parent,
        type: 'skill',
        createdAt: timestamp,
        updatedAt: timestamp,
      };
    }

    const edgeId = `${mapping.parent}->${mapping.child}`;
    edges[edgeId] = {
      id: edgeId,
      source: mapping.parent,
      target: mapping.child,
      weight: mapping.weight,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  });

  // ── Layer 2: characteristic nodes + skill→characteristic edges ────────────
  analysis.characteristicMappings.forEach((mapping) => {
    if (!nodes[mapping.parent]) {
      nodes[mapping.parent] = {
        id: mapping.parent,
        label: mapping.parent,
        type: 'characteristic',
        createdAt: timestamp,
        updatedAt: timestamp,
      };
    }

    const edgeId = `${mapping.parent}->${mapping.child}`;
    edges[edgeId] = {
      id: edgeId,
      source: mapping.parent,
      target: mapping.child,
      weight: mapping.weight,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  });

  // ── Generalisation chain (flat fallback or AI-provided chain) ─────────────
  // Prefer the chain embedded in the analysis response; fall back to the
  // separately provided chain if the analysis field is absent / empty.
  const finalChain =
    analysis.generalizationChain && analysis.generalizationChain.length > 0
      ? analysis.generalizationChain
      : generalizationChain;

  finalChain.forEach((link) => {
    if (!nodes[link.child]) {
      nodes[link.child] = {
        id: link.child,
        label: link.child,
        type: 'none',
        createdAt: timestamp,
        updatedAt: timestamp,
      };
    }
    if (!nodes[link.parent]) {
      nodes[link.parent] = {
        id: link.parent,
        label: link.parent,
        type: 'none',
        createdAt: timestamp,
        updatedAt: timestamp,
      };
    }

    const linkEdgeId = `${link.parent}->${link.child}`;
    edges[linkEdgeId] = {
      id: linkEdgeId,
      source: link.parent,
      target: link.child,
      weight: link.weight,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  });

  return {
    nodes,
    edges,
  };
};

