"use client";

import { useSearchParams } from "next/navigation";
import useSWR from "swr";

import { fetcher } from "@/lib/api";
import type { GraphNode } from "@/lib/types";

export const VIEWS = ["toys", "suppliers", "factories", "incidents"] as const;
export type View = (typeof VIEWS)[number];

export const VIEW_TITLES: Record<View, string> = {
  toys: "Toys",
  suppliers: "Suppliers",
  factories: "Factories",
  incidents: "Incidents",
};

export function viewHref(finisherId: number | null, view: View): string {
  const params = new URLSearchParams({ view });
  if (finisherId !== null) params.set("finisher", String(finisherId));
  return `/?${params}`;
}

/**
 * The finisher and view selected in the URL (`/?finisher=4&view=suppliers`), falling back to the
 * first finisher and the toys view. Uses `useSearchParams`, so callers must be inside Suspense.
 */
export function useView() {
  const params = useSearchParams();
  const finishers = useSWR<GraphNode[]>("/api/finishers", fetcher);
  const requested = Number(params.get("finisher"));
  const finisherId = requested || finishers.data?.[0]?.id || null;
  const viewParam = params.get("view");
  const view: View = VIEWS.find((v) => v === viewParam) ?? "toys";
  return { finishers, finisherId, view };
}
