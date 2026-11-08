import { expect, test } from "vitest";

import { layoutLayers, nodesReaching } from "./graphLayout";

const node = (id: number) => ({ id, name: `n${id}` });
// toy(1) -> assembly(2) -> part(3) -> factory(4) -> supplier(5); toy also contains part 3 directly
const edges = [
  { source_id: 1, target_id: 2 },
  { source_id: 2, target_id: 3 },
  { source_id: 1, target_id: 3 },
  { source_id: 3, target_id: 4 },
  { source_id: 4, target_id: 5 },
  { source_id: 3, target_id: 6 }, // dual-sourced: second factory, not flagged
];

test("places each node one layer right of its deepest dependent", () => {
  const positions = layoutLayers(1, [1, 2, 3, 4, 5, 6].map(node), edges);

  expect([1, 2, 3, 4, 5].map((id) => positions.get(id)?.layer)).toEqual([0, 1, 2, 3, 4]);
  expect(positions.get(6)?.layer).toBe(3);
  expect(positions.get(4)?.y).not.toBe(positions.get(6)?.y);
});

test("wraps a large layer into sub-columns", () => {
  const parts = [2, 3, 4, 5, 6].map(node);
  const fanOut = parts.map((p) => ({ source_id: 1, target_id: p.id }));

  const positions = layoutLayers(1, [node(1), ...parts], fanOut, 2);

  const columns = new Set(parts.map((p) => positions.get(p.id)?.x));
  expect(columns.size).toBe(3);
  expect(parts.every((p) => positions.get(p.id)?.layer === 1)).toBe(true);
});

test("finds every node on a path to a flagged node", () => {
  expect([...nodesReaching([5], edges)].sort()).toEqual([1, 2, 3, 4, 5]);
});
