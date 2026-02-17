import * as admin from "firebase-admin";

export type GraphNodeType = "action" | "skill" | "characteristic";

export interface GraphNode {
  id: string;
  label: string;
  type: GraphNodeType;
}

export interface GraphEdge {
  source: string;
  target: string;
  weight?: number;
  label?: string;
}

interface ManifestNodeSummary {
  label?: string;
  type?: GraphNodeType | "none";
}

interface ManifestAdjacencyEntry {
  target?: string;
  weight?: number;
  t?: string;
  w?: number;
}

interface ManifestDocument {
  nodes?: Record<string, ManifestNodeSummary>;
  edges?: Record<string, ManifestAdjacencyEntry[]>;
  metrics?: {nodeCount: number; edgeCount: number};
  lastUpdated?: string;
  version?: number;
}

const db = admin.firestore();
const GRAPH_ROOT = "progression";
const GRAPH_BASE_PATH = "graphs/cdag_topology";
const MANIFEST_COLLECTION = "graph_metadata";
const MANIFEST_ID = "topology_manifest";

const normalizeWeight = (weight?: number): number => {
  if (typeof weight !== "number" || Number.isNaN(weight)) return 1;
  return Math.min(1, Math.max(0, weight));
};

const ensureManifest = (payload?: ManifestDocument): ManifestDocument => {
  const manifest: ManifestDocument = payload ? {...payload} : {};

  manifest.nodes = {
    [GRAPH_ROOT]: {label: "Progression", type: "characteristic"},
    ...(manifest.nodes ?? {}),
  };

  manifest.edges = {
    [GRAPH_ROOT]: manifest.edges?.[GRAPH_ROOT] ?? [],
    ...(manifest.edges ?? {}),
  };

  manifest.metrics = manifest.metrics ?? {nodeCount: 1, edgeCount: 0};
  manifest.version = manifest.version ?? 1;
  manifest.lastUpdated = new Date().toISOString();

  return manifest;
};

const mergeManifestNodes = (manifest: ManifestDocument, nodes: GraphNode[]) => {
  manifest.nodes = manifest.nodes ?? {};
  nodes.forEach((node) => {
    manifest.nodes![node.id] = {label: node.label, type: node.type};
  });
};

const mergeManifestEdges = (manifest: ManifestDocument, edges: GraphEdge[]) => {
  manifest.edges = manifest.edges ?? {};

  edges.forEach((edge) => {
    const source = edge.source;
    const target = edge.target;
    if (!source || !target) return;

    const weight = normalizeWeight(edge.weight);
    const entry: ManifestAdjacencyEntry = {target, weight};

    const existing = manifest.edges![source] ?? [];
    const next = existing.filter((item) => (item.target ?? item.t) !== target);
    next.push(entry);
    manifest.edges![source] = next;
  });
};

const recomputeManifestMetrics = (manifest: ManifestDocument) => {
  const nodeCount = Object.keys(manifest.nodes ?? {}).length;
  const edgeCount = Object.values(manifest.edges ?? {}).reduce(
    (sum, list) => sum + (list?.length ?? 0),
    0,
  );
  manifest.metrics = {nodeCount, edgeCount};
};

export const upsertGraph = async (
  userId: string,
  nodes: GraphNode[],
  edges: GraphEdge[],
): Promise<{nodeCount: number; edgeCount: number}> => {
  const manifestRef = db.doc(`users/${userId}/${GRAPH_BASE_PATH}/${MANIFEST_COLLECTION}/${MANIFEST_ID}`);
  const nodesCol = db.collection(`users/${userId}/${GRAPH_BASE_PATH}/nodes`);
  const edgesCol = db.collection(`users/${userId}/${GRAPH_BASE_PATH}/edges`);

  const manifestSnap = await manifestRef.get();
  const manifest = ensureManifest(manifestSnap.data() as ManifestDocument | undefined);

  mergeManifestNodes(manifest, nodes);
  mergeManifestEdges(manifest, edges);
  recomputeManifestMetrics(manifest);

  const batch = db.batch();
  const now = new Date().toISOString();

  nodes.forEach((node) => {
    batch.set(
      nodesCol.doc(node.id),
      {
        id: node.id,
        label: node.label,
        type: node.type,
        updatedAt: now,
        createdAt: admin.firestore.Timestamp.now(),
      },
      {merge: true},
    );
  });

  edges.forEach((edge) => {
    const edgeId = `${edge.source}__${edge.target}`;
    batch.set(
      edgesCol.doc(edgeId),
      {
        id: edgeId,
        source: edge.source,
        target: edge.target,
        weight: normalizeWeight(edge.weight),
        label: edge.label,
        updatedAt: now,
        createdAt: admin.firestore.Timestamp.now(),
      },
      {merge: true},
    );
  });

  await batch.commit();
  await manifestRef.set(manifest, {merge: false});

  return {
    nodeCount: manifest.metrics?.nodeCount ?? 0,
    edgeCount: manifest.metrics?.edgeCount ?? 0,
  };
};
