import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { SWRConfig } from "swr";
import { afterEach, expect, test, vi } from "vitest";

import type { GraphNode } from "@/lib/types";

import { ToysTable } from "./ToysTable";

const node = (id: number, role: string, name: string, attrs = {}): GraphNode => ({
  id,
  kind: "item",
  role,
  external_id: `X-${id}`,
  name,
  attrs,
});
const toy = node(1, "product", "Comet Fort", { units_per_year: 1000, retail_price_usd: 12 });
const part = node(2, "part", "wheel");
const supplier = { ...node(3, "supplier", "Aequs Fabrication"), kind: "organization" as const };

const responses: Record<string, unknown> = {
  "/api/finishers/7/toys": [
    { toy, part_count: 1, severity: "critical" },
    { toy: node(4, "product", "Pixel Camp", toy.attrs), part_count: 3, severity: null },
  ],
  "/api/finishers/7/exposure": [
    {
      toy,
      severity: "critical",
      paths: [
        {
          incident: { id: 9, type: "child_labor", severity: "critical", node: supplier },
          steps: [
            { node: toy, edge_kind: null, edge_attrs: {} },
            { node: part, edge_kind: "contains", edge_attrs: { quantity: 4 } },
            { node: supplier, edge_kind: "operated_by", edge_attrs: {} },
          ],
        },
      ],
    },
  ],
  "/api/toys/1/parts": [],
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

test("marks exposed toys and explains the path through the parts", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) => Promise.resolve(Response.json(responses[new URL(url).pathname]))),
  );

  render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <ToysTable finisherId={7} />
    </SWRConfig>,
  );

  expect(await screen.findByText("Exposed · critical")).toBeDefined();
  expect(screen.getByText("Clear")).toBeDefined();
  expect(screen.getByText("Exposed (1)")).toBeDefined();

  fireEvent.click(screen.getByText("Comet Fort"));

  expect(await screen.findByText("Comet Fort → wheel ×4 → Aequs Fabrication")).toBeDefined();
});
