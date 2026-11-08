/** Pure helpers for the supply-chain graph view (no React), so they are easy to test. */

type NodeLike = { id: number; name: string };
type EdgeLike = { source_id: number; target_id: number };

export const COLUMN_GAP = 260; // between sub-columns of one layer
export const LAYER_GAP = 360; // between layers
export const ROW_GAP = 104;
export const MAX_ROWS = 10;

/**
 * Layered left-to-right layout for a DAG rooted at `rootId`. Each node sits one layer to the
 * right of its deepest dependent (longest path), so toy -> part -> factory -> supplier line up
 * in columns at any depth. Within a layer, nodes are ordered by the average position of their
 * dependents to reduce crossing edges. A layer with more than `maxRows` nodes wraps into
 * several sub-columns, so a toy with 40 parts stays close to screen proportions.
 */
export function layoutLayers(
  rootId: number,
  nodes: NodeLike[],
  edges: EdgeLike[],
  maxRows = MAX_ROWS,
): Map<number, { x: number; y: number; layer: number }> {
  const out = new Map<number, number[]>();
  const parents = new Map<number, number[]>();
  const indegree = new Map<number, number>(nodes.map((n) => [n.id, 0]));
  for (const e of edges) {
    out.set(e.source_id, [...(out.get(e.source_id) ?? []), e.target_id]);
    parents.set(e.target_id, [...(parents.get(e.target_id) ?? []), e.source_id]);
    indegree.set(e.target_id, (indegree.get(e.target_id) ?? 0) + 1);
  }

  // Kahn's algorithm: a node's layer is final once all its dependents are placed.
  const layer = new Map<number, number>([[rootId, 0]]);
  const queue = nodes.filter((n) => indegree.get(n.id) === 0).map((n) => n.id);
  while (queue.length) {
    const id = queue.shift()!;
    for (const target of out.get(id) ?? []) {
      layer.set(target, Math.max(layer.get(target) ?? 0, (layer.get(id) ?? 0) + 1));
      const remaining = indegree.get(target)! - 1;
      indegree.set(target, remaining);
      if (remaining === 0) queue.push(target);
    }
  }

  const layers: NodeLike[][] = [];
  for (const n of nodes) (layers[layer.get(n.id) ?? 0] ??= []).push(n);

  const order = new Map<number, number>();
  const positions = new Map<number, { x: number; y: number; layer: number }>();
  let x = 0;
  layers.forEach((members = [], depth) => {
    const score = (n: NodeLike) => {
      const placed = (parents.get(n.id) ?? []).filter((p) => order.has(p));
      return placed.length ? placed.reduce((sum, p) => sum + order.get(p)!, 0) / placed.length : 0;
    };
    const sorted = [...members].sort((a, b) => score(a) - score(b) || a.name.localeCompare(b.name));
    const rows = Math.min(sorted.length, maxRows);
    sorted.forEach((n, i) => {
      const column = Math.floor(i / rows);
      // Center each sub-column vertically, including a shorter last one.
      const inColumn = Math.min(rows, sorted.length - column * rows);
      order.set(n.id, i);
      positions.set(n.id, {
        x: x + column * COLUMN_GAP,
        y: ((i % rows) - (inColumn - 1) / 2) * ROW_GAP,
        layer: depth,
      });
    });
    x += (Math.ceil(sorted.length / rows) - 1) * COLUMN_GAP + LAYER_GAP;
  });
  return positions;
}

/** Nodes that are, or depend on (at any depth), one of `flagged`. */
export function nodesReaching(flagged: Iterable<number>, edges: EdgeLike[]): Set<number> {
  const dependents = new Map<number, number[]>();
  for (const e of edges) {
    dependents.set(e.target_id, [...(dependents.get(e.target_id) ?? []), e.source_id]);
  }
  const reached = new Set(flagged);
  const stack = [...reached];
  while (stack.length) {
    for (const source of dependents.get(stack.pop()!) ?? []) {
      if (!reached.has(source)) {
        reached.add(source);
        stack.push(source);
      }
    }
  }
  return reached;
}
