import { cleanup, render, screen } from "@testing-library/react";
import { SWRConfig } from "swr";
import { afterEach, expect, test, vi } from "vitest";

import { HelloMessage } from "./HelloMessage";

function renderWithFreshCache() {
  return render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <HelloMessage />
    </SWRConfig>,
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

test("shows the message returned by the API", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(Response.json({ message: "Hello, World!" })),
  );

  renderWithFreshCache();

  expect(await screen.findByText("Hello, World!")).toBeDefined();
});

test("shows an error when the API is unavailable", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 500 })));

  renderWithFreshCache();

  expect(await screen.findByText(/Could not reach the API/)).toBeDefined();
});
