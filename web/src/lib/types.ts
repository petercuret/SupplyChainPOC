export type GraphNode = {
  id: number;
  kind: "organization" | "facility" | "item";
  role: string;
  external_id: string;
  name: string;
  attrs: Record<string, string | number>;
};

export const SEVERITIES = ["low", "medium", "high", "critical"] as const;
export type Severity = (typeof SEVERITIES)[number];

/** 0 for no severity, then 1 (low) to 4 (critical), for sorting. */
export function severityRank(severity: Severity | null | undefined): number {
  return severity ? SEVERITIES.indexOf(severity) + 1 : 0;
}

export const STATUSES = ["open", "resolved", "dismissed"] as const;
export type IncidentStatus = (typeof STATUSES)[number];

export type Incident = {
  id: number;
  node: GraphNode;
  type: string;
  severity: Severity;
  status: IncidentStatus;
  description: string;
  reported_at: string;
  resolved_at: string | null;
};

export type ToySummary = { toy: GraphNode; part_count: number; severity: Severity | null };

export type SupplierSummary = {
  supplier: GraphNode;
  factory_count: number;
  toy_count: number;
  affected_toy_count: number;
  open_incidents: Incident[];
};

export type FactorySummary = {
  factory: GraphNode;
  supplier: GraphNode | null;
  part_count: number;
  toy_count: number;
  affected_toy_count: number;
  open_incidents: Incident[];
};

export type PartSource = {
  factory: GraphNode;
  supplier: GraphNode | null;
  unit_cost_usd: number | null;
};

export type BomLine = { part: GraphNode; quantity: number; sources: PartSource[] };

export type PathStep = {
  node: GraphNode;
  edge_kind: string | null;
  edge_attrs: Record<string, number>;
};

export type ExposedToy = {
  toy: GraphNode;
  severity: Severity;
  paths: { incident: Incident; steps: PathStep[] }[];
};

/** "child_labor" -> "Child labor" */
export function formatType(type: string): string {
  const text = type.replaceAll("_", " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export type GraphEdge = {
  id: number;
  kind: string;
  source_id: number;
  target_id: number;
  attrs: Record<string, number>;
};

export type GraphData = {
  root_id: number;
  nodes: GraphNode[];
  edges: GraphEdge[];
  incidents: Incident[];
};

export type PartSummary = {
  part: GraphNode;
  sources: PartSource[];
  toy_count: number;
  severity: Severity | null;
  incident_count: number;
};

export type PartDetailData = {
  paths: { steps: PathStep[]; incidents: Incident[] }[];
  used_in: GraphNode[];
  alternatives: PartSummary[];
};
