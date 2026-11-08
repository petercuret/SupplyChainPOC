"""Graph operations: edge validation and traversals (Postgres recursive CTEs)."""

from dataclasses import dataclass
from typing import Any

from django.db import connection

from core.models import SEVERITY_RANK, Edge, Incident, Node

# Which node kinds each edge kind may connect. The generic tables can't enforce this, so every
# edge is created through `create_edge`.
ALLOWED_EDGES: dict[str, tuple[str, str]] = {
    Edge.Kind.CONTAINS: (Node.Kind.ITEM, Node.Kind.ITEM),
    Edge.Kind.MADE_AT: (Node.Kind.ITEM, Node.Kind.FACILITY),
    Edge.Kind.OPERATED_BY: (Node.Kind.FACILITY, Node.Kind.ORGANIZATION),
}

# Edge kinds along which an incident propagates to the items that depend on it.
SUPPLY_EDGES = [Edge.Kind.CONTAINS, Edge.Kind.MADE_AT, Edge.Kind.OPERATED_BY]

MAX_DEPTH = 20


class InvalidEdge(ValueError):
    pass


def validate_edge(kind: str, source: Node, target: Node) -> None:
    allowed = ALLOWED_EDGES.get(kind)
    if allowed is None:
        raise InvalidEdge(f"Unknown edge kind {kind!r}")
    if (source.kind, target.kind) != allowed:
        raise InvalidEdge(
            f"{kind} must connect {allowed[0]} -> {allowed[1]}, got {source.kind} -> {target.kind}"
        )


def create_edge(kind: str, source: Node, target: Node, **attrs: Any) -> Edge:
    validate_edge(kind, source, target)
    edge, _ = Edge.objects.update_or_create(
        kind=kind, source=source, target=target, defaults={"attrs": attrs}
    )
    return edge


@dataclass
class ExposurePath:
    incident: Incident
    nodes: list[Node]  # from the exposed product to the flagged node
    edges: list[Edge]  # edges[i] connects nodes[i] -> nodes[i + 1]


@dataclass
class Exposure:
    product: Node
    paths: list[ExposurePath]

    @property
    def severity(self) -> str:
        return max((p.incident.severity for p in self.paths), key=SEVERITY_RANK.__getitem__)


_EXPOSURE_SQL = """
WITH RECURSIVE walk(node_id, incident_id, nodes, edges) AS (
    SELECT i.node_id, i.id, ARRAY[i.node_id], ARRAY[]::bigint[]
    FROM core_incident i WHERE i.id = ANY(%(incident_ids)s)
  UNION ALL
    SELECT e.source_id, w.incident_id, w.nodes || e.source_id, w.edges || e.id
    FROM walk w JOIN core_edge e ON e.target_id = w.node_id
    WHERE e.kind = ANY(%(kinds)s)
      AND NOT e.source_id = ANY(w.nodes)
      AND cardinality(w.nodes) < %(max_depth)s
)
SELECT w.incident_id, w.nodes, w.edges
FROM walk w JOIN core_node n ON n.id = w.node_id
WHERE n.role = 'product' AND n.owner_id = %(owner_id)s
"""


def find_exposure(
    owner_id: int, incident_type: str | None = None, min_severity: str | None = None
) -> list[Exposure]:
    """Products of `owner_id` that depend, at any depth, on a node with an open incident."""
    incidents = Incident.objects.filter(status=Incident.Status.OPEN).select_related("node")
    if incident_type:
        incidents = incidents.filter(type=incident_type)
    if min_severity:
        rank = SEVERITY_RANK[min_severity]
        at_least = [s for s, r in SEVERITY_RANK.items() if r >= rank]
        incidents = incidents.filter(severity__in=at_least)
    incidents_by_id = {i.id: i for i in incidents}
    if not incidents_by_id:
        return []

    with connection.cursor() as cursor:
        cursor.execute(
            _EXPOSURE_SQL,
            {
                "incident_ids": list(incidents_by_id),
                "kinds": SUPPLY_EDGES,
                "max_depth": MAX_DEPTH,
                "owner_id": owner_id,
            },
        )
        rows = cursor.fetchall()

    node_ids = {n for _, nodes, _ in rows for n in nodes}
    edge_ids = {e for _, _, edges in rows for e in edges}
    nodes_by_id = Node.objects.in_bulk(node_ids)
    edges_by_id = Edge.objects.in_bulk(edge_ids)

    exposures: dict[int, Exposure] = {}
    for incident_id, path_nodes, path_edges in rows:
        # The walk runs flagged node -> product; reverse it to read product -> flagged node.
        path = ExposurePath(
            incident=incidents_by_id[incident_id],
            nodes=[nodes_by_id[n] for n in reversed(path_nodes)],
            edges=[edges_by_id[e] for e in reversed(path_edges)],
        )
        product = path.nodes[0]
        exposures.setdefault(product.id, Exposure(product=product, paths=[])).paths.append(path)
    return list(exposures.values())


_REACHABLE_SQL = """
WITH RECURSIVE walk(root_id, node_id) AS (
    SELECT n.id, n.id FROM core_node n WHERE n.owner_id = %(owner_id)s AND n.role = 'product'
  UNION
    SELECT w.root_id, e.target_id
    FROM walk w JOIN core_edge e ON e.source_id = w.node_id
    WHERE e.kind = ANY(%(kinds)s)
)
SELECT node_id, count(DISTINCT root_id) FROM walk GROUP BY node_id
"""


def upstream_product_counts(owner_id: int) -> dict[int, int]:
    """For every node the owner's products depend on: how many of those products use it."""
    with connection.cursor() as cursor:
        cursor.execute(_REACHABLE_SQL, {"owner_id": owner_id, "kinds": SUPPLY_EDGES})
        return dict(cursor.fetchall())


_DOWNSTREAM_SQL = """
WITH RECURSIVE walk(node_id) AS (
    SELECT %(root_id)s::bigint
  UNION
    SELECT e.target_id FROM walk w JOIN core_edge e ON e.source_id = w.node_id
    WHERE e.kind = ANY(%(kinds)s)
)
SELECT node_id FROM walk
"""


def dependency_graph(root_id: int) -> tuple[list[Node], list[Edge]]:
    """Everything `root_id` depends on (at any depth), with the edges between those nodes."""
    with connection.cursor() as cursor:
        cursor.execute(_DOWNSTREAM_SQL, {"root_id": root_id, "kinds": SUPPLY_EDGES})
        node_ids = [row[0] for row in cursor.fetchall()]
    nodes = list(Node.objects.filter(id__in=node_ids))
    edges = list(
        Edge.objects.filter(source_id__in=node_ids, target_id__in=node_ids, kind__in=SUPPLY_EDGES)
    )
    return nodes, edges


_AFFECTED_SQL = """
WITH RECURSIVE walk(node_id, incident_id, nodes) AS (
    SELECT i.node_id, i.id, ARRAY[i.node_id]
    FROM core_incident i WHERE i.status = 'open'
  UNION ALL
    SELECT e.source_id, w.incident_id, w.nodes || e.source_id
    FROM walk w JOIN core_edge e ON e.target_id = w.node_id
    WHERE e.kind = ANY(%(kinds)s)
      AND NOT e.source_id = ANY(w.nodes)
      AND cardinality(w.nodes) < %(max_depth)s
)
SELECT DISTINCT node_id, incident_id FROM walk
"""


def affected_nodes() -> dict[int, list[Incident]]:
    """Every node that is, or depends on, a node with an open incident -> those incidents."""
    with connection.cursor() as cursor:
        cursor.execute(_AFFECTED_SQL, {"kinds": SUPPLY_EDGES, "max_depth": MAX_DEPTH})
        rows = cursor.fetchall()
    incidents = Incident.objects.select_related("node").in_bulk({i for _, i in rows})
    affected: dict[int, list[Incident]] = {}
    for node_id, incident_id in rows:
        affected.setdefault(node_id, []).append(incidents[incident_id])
    return affected


_SUPPLY_PATHS_SQL = """
WITH RECURSIVE walk(node_id, nodes, edges) AS (
    SELECT %(root_id)s::bigint, ARRAY[%(root_id)s::bigint], ARRAY[]::bigint[]
  UNION ALL
    SELECT e.target_id, w.nodes || e.target_id, w.edges || e.id
    FROM walk w JOIN core_edge e ON e.source_id = w.node_id
    WHERE e.kind = ANY(%(kinds)s)
      AND NOT e.target_id = ANY(w.nodes)
      AND cardinality(w.nodes) < %(max_depth)s
)
SELECT w.nodes, w.edges FROM walk w
WHERE NOT EXISTS (
    SELECT 1 FROM core_edge e WHERE e.source_id = w.node_id AND e.kind = ANY(%(kinds)s)
)
ORDER BY w.nodes
"""


@dataclass
class SupplyPath:
    nodes: list[Node]  # from the root down to the end of the chain (e.g. part -> ... -> supplier)
    edges: list[Edge]  # edges[i] connects nodes[i] -> nodes[i + 1]
    incidents: list[Incident]  # open incidents on any node of the path


def supply_paths(root_id: int) -> list[SupplyPath]:
    """Every chain from `root_id` down to a node with no further dependencies, at any depth."""
    with connection.cursor() as cursor:
        cursor.execute(
            _SUPPLY_PATHS_SQL,
            {"root_id": root_id, "kinds": SUPPLY_EDGES, "max_depth": MAX_DEPTH},
        )
        rows = cursor.fetchall()
    nodes = Node.objects.in_bulk({n for path, _ in rows for n in path})
    edges = Edge.objects.in_bulk({e for _, path in rows for e in path})
    incidents: dict[int, list[Incident]] = {}
    for i in Incident.objects.filter(node__in=nodes, status=Incident.Status.OPEN).select_related(
        "node"
    ):
        incidents.setdefault(i.node_id, []).append(i)
    return [
        SupplyPath(
            nodes=[nodes[n] for n in path_nodes],
            edges=[edges[e] for e in path_edges],
            incidents=[i for n in path_nodes for i in incidents.get(n, [])],
        )
        for path_nodes, path_edges in rows
    ]


_DEPENDENT_PRODUCTS_SQL = """
WITH RECURSIVE walk(node_id) AS (
    SELECT %(root_id)s::bigint
  UNION
    SELECT e.source_id FROM walk w JOIN core_edge e ON e.target_id = w.node_id
    WHERE e.kind = ANY(%(kinds)s)
)
SELECT n.id FROM walk w JOIN core_node n ON n.id = w.node_id
WHERE n.role = 'product' AND n.owner_id = %(owner_id)s
"""


def dependent_products(root_id: int, owner_id: int) -> list[Node]:
    """The owner's products that depend on `root_id`, at any depth."""
    with connection.cursor() as cursor:
        cursor.execute(
            _DEPENDENT_PRODUCTS_SQL,
            {"root_id": root_id, "owner_id": owner_id, "kinds": SUPPLY_EDGES},
        )
        ids = [row[0] for row in cursor.fetchall()]
    return list(Node.objects.filter(id__in=ids).order_by("name"))
