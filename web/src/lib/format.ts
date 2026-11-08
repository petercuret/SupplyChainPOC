/** Pure display helpers (no React). */

import type { GraphNode } from "@/lib/types";

/** Case-insensitive "does any field contain the query"; an empty query matches everything. */
export function matches(query: string, ...fields: (string | number | undefined | null)[]) {
  const q = query.trim().toLowerCase();
  return (
    !q ||
    fields.some((f) =>
      String(f ?? "")
        .toLowerCase()
        .includes(q),
    )
  );
}

/**
 * A factory's name without its operator's name, when it repeats it:
 * "Aequs Fabrication — Tijuana Plant" operated by "Aequs Fabrication" -> "Tijuana Plant".
 */
export function siteName(factory: GraphNode, operator?: GraphNode | null): string {
  if (!operator || !factory.name.startsWith(operator.name)) return factory.name;
  const rest = factory.name.slice(operator.name.length).match(/^\s*[—–-]\s*(.+)$/);
  return rest?.[1] ?? factory.name;
}

/** Country, plus the city unless the site's display name already says it ("Tijuana Plant"). */
export function siteLocation(factory: GraphNode, displayName: string): string {
  const { city, country } = factory.attrs;
  return city && !displayName.includes(String(city)) ? `${city}, ${country}` : String(country);
}

/** A translucent version of a CSS color, e.g. for row highlights that work in both themes. */
export function tint(color: string, percent: number): string {
  return `color-mix(in srgb, ${color} ${percent}%, transparent)`;
}

export const ERROR_COLOR = "var(--mui-palette-error-main)";
