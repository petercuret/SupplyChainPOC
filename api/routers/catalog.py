from collections import defaultdict
from dataclasses import dataclass

from django.db.models import Count, Q
from fastapi import APIRouter

from core.graph import (
    dependency_graph,
    find_exposure,
    open_incidents_by_node,
    operators,
    upstream_product_counts,
)
from core.models import Edge, Node
from routers.common import finisher_or_404, get_or_404, path_steps
from schemas import (
    BomLine,
    EdgeOut,
    ExposedToy,
    ExposurePathOut,
    FactorySummary,
    GraphOut,
    IncidentOut,
    NodeOut,
    PartSource,
    Severity,
    SupplierSummary,
    ToySummary,
)

router = APIRouter(prefix="/api", tags=["catalog"])


@router.get("/finishers")
def list_finishers() -> list[NodeOut]:
    finishers = Node.objects.filter(kind=Node.Kind.ORGANIZATION, role="finisher")
    return [NodeOut.model_validate(f) for f in finishers.order_by("name")]


@router.get("/finishers/{finisher_id}/toys")
def list_toys(finisher_id: int) -> list[ToySummary]:
    finisher = finisher_or_404(finisher_id)
    severity = {e.product.id: e.severity for e in find_exposure(finisher.id)}
    toys = (
        Node.objects.filter(owner=finisher, role="product")
        .annotate(part_count=Count("out_edges", filter=Q(out_edges__kind=Edge.Kind.CONTAINS)))
        .order_by("name")
    )
    return [
        ToySummary(
            toy=NodeOut.model_validate(t), part_count=t.part_count, severity=severity.get(t.id)
        )
        for t in toys
    ]


@router.get("/finishers/{finisher_id}/exposure")
def list_exposure(
    finisher_id: int, type: str | None = None, min_severity: Severity | None = None
) -> list[ExposedToy]:
    finisher = finisher_or_404(finisher_id)
    exposures = find_exposure(finisher.id, incident_type=type, min_severity=min_severity)
    return [
        ExposedToy(
            toy=NodeOut.model_validate(e.product),
            severity=e.severity,
            paths=[
                ExposurePathOut(
                    incident=IncidentOut.model_validate(p.incident),
                    steps=path_steps(p.nodes, p.edges),
                )
                for p in e.paths
            ],
        )
        for e in sorted(exposures, key=lambda e: e.product.name)
    ]


@dataclass
class _Upstream:
    """A node the finisher's toys depend on, with the numbers shown in the list views."""

    node: Node
    toy_count: int  # finisher's toys that depend on it
    affected_toy_count: int  # of those, toys with an exposure path through it
    open_incidents: list[IncidentOut]


def _upstream(finisher: Node, kind: str, count_edge: str) -> list[_Upstream]:
    """Nodes of `kind` the finisher's toys depend on. Each node gets `edge_count`: how many
    `count_edge` edges point at it (factories per supplier, parts per factory)."""
    toy_counts = upstream_product_counts(finisher.id)
    # A toy is affected through a node when one of its exposure paths passes that node, so a
    # factory counts toys exposed by an incident on the factory itself or on its operator.
    affected: dict[int, set[int]] = defaultdict(set)
    for exposure in find_exposure(finisher.id):
        for path in exposure.paths:
            for node in path.nodes:
                affected[node.id].add(exposure.product.id)

    nodes = list(
        Node.objects.filter(id__in=toy_counts, kind=kind)
        .annotate(edge_count=Count("in_edges", filter=Q(in_edges__kind=count_edge)))
        .order_by("name")
    )
    incidents = open_incidents_by_node(nodes)
    return [
        _Upstream(
            node=n,
            toy_count=toy_counts[n.id],
            affected_toy_count=len(affected[n.id]),
            open_incidents=[IncidentOut.model_validate(i) for i in incidents.get(n.id, [])],
        )
        for n in nodes
    ]


@router.get("/finishers/{finisher_id}/suppliers")
def list_suppliers(finisher_id: int) -> list[SupplierSummary]:
    upstream = _upstream(
        finisher_or_404(finisher_id), Node.Kind.ORGANIZATION, Edge.Kind.OPERATED_BY
    )
    return [
        SupplierSummary(
            supplier=NodeOut.model_validate(u.node),
            factory_count=u.node.edge_count,
            toy_count=u.toy_count,
            affected_toy_count=u.affected_toy_count,
            open_incidents=u.open_incidents,
        )
        for u in upstream
    ]


@router.get("/finishers/{finisher_id}/factories")
def list_factories(finisher_id: int) -> list[FactorySummary]:
    upstream = _upstream(finisher_or_404(finisher_id), Node.Kind.FACILITY, Edge.Kind.MADE_AT)
    operator = operators(u.node for u in upstream)
    return [
        FactorySummary(
            factory=NodeOut.model_validate(u.node),
            supplier=NodeOut.model_validate(operator[u.node.id]) if u.node.id in operator else None,
            part_count=u.node.edge_count,
            toy_count=u.toy_count,
            affected_toy_count=u.affected_toy_count,
            open_incidents=u.open_incidents,
        )
        for u in upstream
    ]


def part_sources(parts: list[Node]) -> dict[int, list[PartSource]]:
    """Each part's factories (made_at) with the supplier operating each one."""
    made_at = list(
        Edge.objects.filter(kind=Edge.Kind.MADE_AT, source__in=parts).select_related("target")
    )
    operator = operators(e.target_id for e in made_at)
    sources: dict[int, list[PartSource]] = defaultdict(list)
    for e in made_at:
        supplier = operator.get(e.target_id)
        sources[e.source_id].append(
            PartSource(
                factory=NodeOut.model_validate(e.target),
                supplier=NodeOut.model_validate(supplier) if supplier else None,
                unit_cost_usd=e.attrs.get("unit_cost_usd"),
            )
        )
    return sources


@router.get("/toys/{toy_id}/parts")
def list_toy_parts(toy_id: int) -> list[BomLine]:
    """One level of the BOM, with each part's factories and their operators."""
    toy = get_or_404(Node, id=toy_id, role="product")
    contains = list(toy.out_edges.filter(kind=Edge.Kind.CONTAINS).select_related("target"))
    sources = part_sources([e.target for e in contains])
    lines = [
        BomLine(
            part=NodeOut.model_validate(e.target),
            quantity=e.attrs.get("quantity", 1),
            sources=sources[e.target_id],
        )
        for e in contains
    ]
    return sorted(lines, key=lambda line: line.part.name)


@router.get("/nodes/{node_id}/graph")
def node_graph(node_id: int) -> GraphOut:
    """The node and everything it depends on, for the graph view."""
    root = get_or_404(Node, id=node_id)
    nodes, edges = dependency_graph(root.id)
    incidents = open_incidents_by_node(nodes)
    return GraphOut(
        root_id=root.id,
        nodes=[NodeOut.model_validate(n) for n in nodes],
        edges=[EdgeOut.model_validate(e) for e in edges],
        incidents=[IncidentOut.model_validate(i) for group in incidents.values() for i in group],
    )
