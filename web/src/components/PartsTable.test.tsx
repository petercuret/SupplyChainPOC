import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { SWRConfig } from "swr";
import { afterEach, expect, test, vi } from "vitest";

import type { GraphNode } from "@/lib/types";

import { PartsTable } from "./PartsTable";

const node = (id: number, kind: GraphNode["kind"], role: string, name: string): GraphNode => ({
  id,
  kind,
  role,
  external_id: `X-${id}`,
  name,
  attrs: {},
});
const part = node(1, "item", "part", "LED array");
const alternative = node(2, "item", "part", "LED array");
const flaggedSupplier = node(3, "organization", "supplier", "Lianfa Fabrication");
const cleanSupplier = node(4, "organization", "supplier", "Keyuan Works");
const flaggedSite = node(5, "facility", "factory", "Lianfa Fabrication — Bien Hoa Plant");
const cleanSite = node(6, "facility", "factory", "Keyuan Works — Bien Hoa Plant");
const incident = {
  id: 9,
  node: flaggedSupplier,
  type: "child_labor",
  severity: "high",
  status: "open",
  description: "",
  reported_at: "2026-11-08",
  resolved_at: null,
};
const summary = (p: GraphNode, severity: string | null, supplier: GraphNode, site: GraphNode) => ({
  part: p,
  sources: [{ factory: site, supplier, unit_cost_usd: 1 }],
  toy_count: 2,
  severity,
  incident_count: severity ? 1 : 0,
});
const path = (site: GraphNode, supplier: GraphNode, incidents: unknown[]) => ({
  steps: [
    { node: part, edge_kind: null, edge_attrs: {} },
    { node: site, edge_kind: "made_at", edge_attrs: {} },
    { node: supplier, edge_kind: "operated_by", edge_attrs: {} },
  ],
  incidents,
});

const responses: Record<string, unknown> = {
  "/api/finishers/7/parts": [
    summary(part, "high", flaggedSupplier, flaggedSite),
    summary(alternative, null, cleanSupplier, cleanSite),
  ],
  "/api/finishers/7/parts/1": {
    paths: [path(flaggedSite, flaggedSupplier, [incident]), path(cleanSite, cleanSupplier, [])],
    used_in: [node(8, "item", "product", "Amber Pony")],
    alternatives: [summary(alternative, null, cleanSupplier, cleanSite)],
  },
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

test("expanding a part shows its supply paths, incidents and clean alternatives", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) => Promise.resolve(Response.json(responses[new URL(url).pathname]))),
  );

  render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <PartsTable finisherId={7} />
    </SWRConfig>,
  );

  expect(await screen.findByText("Exposed (1)")).toBeDefined();
  fireEvent.click(screen.getByLabelText("Expand X-1"));

  expect(await screen.findByText("Supply paths")).toBeDefined();
  expect(screen.getByText("Child labor")).toBeDefined(); // the flagged path's incident
  expect(screen.getAllByText("Bien Hoa Plant")).toHaveLength(2); // both sites, prefix dropped
  expect(screen.getByText("Used in your toys (1)")).toBeDefined();
  expect(screen.getByText("Alternatives of the same type (1 of 1 clear)")).toBeDefined();
});
