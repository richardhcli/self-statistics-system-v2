/**
 * @file graph.ts
 * @module @self-stats/contracts/graph
 *
 * Core CDAG (Concept Directed Acyclic Graph) data types shared between the
 * React frontend (`apps/web`) and the Firebase backend (`apps/api-firebase`).
 *
 * ## Graph model overview
 * The CDAG is a three-layer directed acyclic graph:
 * - **Layer 0 — Actions**: Leaf nodes (e.g. "ran 5km", "read chapter 3").
 * - **Layer 1 — Skills**: Intermediate nodes that group actions (e.g. "Cardio").
 * - **Layer 2 — Characteristics**: Root concept wells (e.g. "Vitality").
 *
 * Edges point from parent → child (top-down generalisation direction).
 * The progression engine traverses the graph *bottom-up* to propagate EXP.
 *
 * ## Usage by AI agents
 * - `NodeData` / `EdgeData` are the runtime graph elements stored in Firestore
 *   and kept in the Zustand CDAG store.
 * - `CdagStructure` is a pre-computed adjacency list cached for fast BFS.
 * - `CdagStoreSnapshot` is the full serialisable state saved to IndexedDB.
 */

// ─── Primitives ────────────────────────────────────────────────────────────

/**
 * Semantic tier of a node in the CDAG hierarchy.
 *
 * - `'action'`         — Leaf node, produced directly from a journal entry (e.g. "coded").
 * - `'skill'`          — Mid-tier group of related actions (e.g. "Programming").
 * - `'characteristic'` — Top-tier gravity-well attribute (e.g. "Intellect").
 * - `'none'`           — Type not yet resolved; used for placeholder / legacy nodes.
 */
export type NodeType = 'action' | 'skill' | 'characteristic' | 'none';

// ─── Runtime graph elements ────────────────────────────────────────────────

/**
 * Single node in the CDAG graph.
 *
 * Stored in Firestore under `users/{uid}/graph/nodes/{nodeId}` and mirrored
 * into the Zustand `cdagTopologyStore` keyed by `id`.
 */
export interface NodeData {
  /** Unique node identifier — typically a slugified version of `label`. Serves as the Firestore document ID. */
  id: string;
  /** Human-readable display name (e.g. "Marathon Training"). Shown in the UI and sent to AI prompts. */
  label: string;
  /** Semantic tier of this node — determines how it is rendered and how EXP propagates through it. */
  type: NodeType;
  /**
   * Arbitrary extensible metadata bag.
   * Reserved for future features (e.g. custom icons, colour overrides, user notes).
   * When writing, only add keys you own; do NOT destructure the whole object.
   */
  metadata?: Record<string, unknown>;
  /** ISO 8601 creation timestamp set once on first write. Never mutated after creation. */
  createdAt?: string;
  /** ISO 8601 last-updated timestamp refreshed on every write. Used for conflict resolution. */
  updatedAt?: string;
}

/**
 * Directed edge connecting a parent node (source) to a child node (target).
 *
 * Edge direction is **parent → child** (generalisation direction).
 * The progression engine reads edges bottom-up (child → parent) during BFS.
 *
 * Stored in Firestore under `users/{uid}/graph/edges/{edgeId}`.
 */
export interface EdgeData {
  /**
   * Unique edge identifier.
   * Convention: `"${source}->${target}"` for deterministic deduplication.
   */
  id: string;
  /** ID of the parent (more general) node — e.g. the skill "Programming". */
  source: string;
  /** ID of the child (more specific) node — e.g. the action "coded". */
  target: string;
  /**
   * Influence weight in the range `[0.1, 1.0]`.
   * Controls how much of the child's EXP seed propagates to this parent.
   * Default `1.0` means full propagation; `0.5` means 50% pass-through.
   * The AI model assigns weights based on semantic relevance.
   */
  weight?: number;
  /** Optional human-readable relationship description (e.g. "reinforces", "is-a"). */
  label?: string;
  /** ISO 8601 creation timestamp. */
  createdAt?: string;
  /** ISO 8601 last-updated timestamp. */
  updatedAt?: string;
}

/**
 * Minimal in-memory CDAG snapshot used by the progression engine and
 * topology transform functions.
 *
 * Both `nodes` and `edges` are keyed by their respective `id` fields for O(1)
 * access during BFS propagation.
 */
export interface GraphState {
  /** Map of `nodeId → NodeData`. Keyed by `NodeData.id`. */
  nodes: Record<string, NodeData>;
  /** Map of `edgeId → EdgeData`. Keyed by `EdgeData.id`. */
  edges: Record<string, EdgeData>;
}

// ─── CDAG pre-computed structures ─────────────────────────────────────────

/**
 * Compact node summary stored inside `CdagStructure.nodeSummaries`.
 * Contains only the fields needed for lightweight UI rendering and BFS —
 * avoids sending full `NodeData` payloads over the wire repeatedly.
 */
export interface CdagNodeSummary {
  /** Unique node ID — mirrors `NodeData.id`. */
  id: string;
  /** Human-readable label — mirrors `NodeData.label`. */
  label: string;
  /** Semantic type — mirrors `NodeData.type`. */
  type: NodeType;
}

/**
 * Single entry in a `CdagStructure.adjacencyList` array.
 * Describes one outgoing edge from a parent node to a child.
 */
export interface CdagAdjacencyTarget {
  /** Child node ID that this parent connects to (target of the edge). */
  target: string;
  /**
   * Propagation weight for this edge (`[0.1, 1.0]`).
   * Defaults to `1.0` if the original `EdgeData.weight` was absent.
   */
  weight: number;
}

/**
 * Pre-computed adjacency structure stored in Firestore as a single document
 * (`users/{uid}/graph/structure`) for fast client-side BFS without
 * re-traversing raw node/edge collections.
 *
 * Rebuilt by the backend whenever the graph changes.
 * AI agents: do NOT mutate this directly — it is always derived from nodes+edges.
 */
export interface CdagStructure {
  /**
   * Map of `nodeId → CdagAdjacencyTarget[]`.
   * Each array lists the children of that node with their edge weights.
   * Used for top-down traversal (e.g. rendering the graph).
   */
  adjacencyList: Record<string, CdagAdjacencyTarget[]>;
  /**
   * Map of `nodeId → CdagNodeSummary`.
   * Enables O(1) node label / type lookup without joining the full node table.
   */
  nodeSummaries: Record<string, CdagNodeSummary>;
  /** Graph-wide statistics used for UI badges and analytics. */
  metrics: {
    /** Total number of nodes in the graph. */
    nodeCount: number;
    /** Total number of directed edges in the graph. */
    edgeCount: number;
  };
  /** ISO 8601 timestamp of the last structure rebuild. Used to detect stale caches. */
  lastUpdated?: string;
  /**
   * Monotonically increasing schema version number.
   * Increment when the shape of `CdagStructure` itself changes to allow migrations.
   */
  version: number;
}

// ─── Cache metadata ────────────────────────────────────────────────────────

/**
 * Timestamps and dirty-flags for a single CDAG collection (nodes, edges, or structure).
 * Stored client-side in the Zustand / IndexedDB metadata layer — NOT in Firestore.
 */
export interface CdagCacheInfo {
  /** Unix epoch (ms) of the last successful fetch from Firestore for this collection. */
  lastFetched: number;
  /**
   * `true` when the client has a pending local write that has not yet been
   * synced to Firestore (optimistic update). The store should re-fetch on next
   * opportunity to reconcile.
   */
  isDirty?: boolean;
}

/**
 * Cache-tracking metadata for ALL CDAG collections in the Zustand store.
 * Drives refresh logic — if `isDirty` or `lastFetched` is stale, re-fetch.
 */
export interface CdagMetadata {
  /** Per-node cache info (keyed by nodeId). Typically only `fullFetchAt` is used. */
  nodes: Record<string, CdagCacheInfo>;
  /** Per-edge cache info (keyed by edgeId). Typically only `fullFetchAt` is used. */
  edges: Record<string, CdagCacheInfo>;
  /** Cache info for the derived `CdagStructure` document. */
  structure: CdagCacheInfo;
  /**
   * Unix epoch (ms) of the last complete graph fetch.
   * Used as a coarse cache-invalidation signal — avoids re-fetching the entire
   * graph on every component mount when the data is still fresh.
   */
  fullFetchAt: number;
}

// ─── Store snapshot ────────────────────────────────────────────────────────

/**
 * Full serialisable snapshot of the CDAG Zustand store.
 * Written to IndexedDB for offline support and used for hydration on app start.
 *
 * AI agents: when reading the store state (e.g. for progression calculations),
 * pass `topology = { nodes: snapshot.nodes, edges: snapshot.edges }` into the
 * `@self-stats/progression-system` functions.
 */
export interface CdagStoreSnapshot {
  /** All CDAG nodes indexed by their `id`. */
  nodes: Record<string, NodeData>;
  /** All CDAG edges indexed by their `id`. */
  edges: Record<string, EdgeData>;
  /** Pre-computed adjacency structure for fast rendering and traversal. */
  structure: CdagStructure;
  /** Client-side cache metadata — not persisted to Firestore. */
  metadata: CdagMetadata;
}
