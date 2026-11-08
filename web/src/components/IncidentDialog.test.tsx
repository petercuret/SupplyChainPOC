import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SWRConfig } from "swr";
import { afterEach, expect, test, vi } from "vitest";

import type { GraphNode } from "@/lib/types";

import { IncidentDialog } from "./IncidentDialog";

const supplier: GraphNode = {
  id: 5,
  kind: "organization",
  role: "supplier",
  external_id: "SUP-005",
  name: "Keyuan Fabrication",
  attrs: {},
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

test("flags a supplier with the chosen type and severity", async () => {
  const fetchMock = vi.fn((url: string, init?: RequestInit) =>
    Promise.resolve(
      init?.method === "POST"
        ? Response.json({ id: 1 }, { status: 201 })
        : Response.json(["child_labor"]),
    ),
  );
  vi.stubGlobal("fetch", fetchMock);
  const onClose = vi.fn();

  render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <IncidentDialog open node={supplier} onClose={onClose} />
    </SWRConfig>,
  );

  fireEvent.change(screen.getByLabelText(/Type/), { target: { value: "Forced labor" } });
  fireEvent.change(screen.getByLabelText(/Description/), { target: { value: "Audit 2026" } });
  fireEvent.click(screen.getByRole("button", { name: "Flag" }));

  await waitFor(() => expect(onClose).toHaveBeenCalled());
  const post = fetchMock.mock.calls.find(([, init]) => init?.method === "POST");
  expect(JSON.parse(String(post?.[1]?.body))).toMatchObject({
    node_id: 5,
    type: "Forced labor",
    severity: "high",
    description: "Audit 2026",
  });
});
