from collections import defaultdict

from django.db.models import Count, Q
from fastapi import APIRouter

from core.graph import Exposure, find_exposure, upstream_product_counts
from core.models import Edge, Incident, Node
from routers.common import get_or_404
from schemas import (
    BomLine,
    ExposedToy,
    ExposurePathOut,
    IncidentOut,
    NodeOut,
    PartSource,
    PathStep,
    Severity,
    SupplierSummary,
    ToySummary,
)

router = APIRouter(prefix="/api", tags=["catalog"])


def _finisher(finisher_id: int) -> Node:
    return get_or_404(Node, id=finisher_id, kind=Node.Kind.ORGANIZATION, role="finisher")


def _exposed_toy(exposure: Exposure) -> ExposedToy:
    paths = [
        ExposurePathOut(
            incident=IncidentOut.model_validate(p.incident),
            steps=[PathStep(node=NodeOut.model_validate(p.nodes[0]))]
            + [
                PathStep(node=NodeOut.model_validate(n), edge_kind=e.kind, edge_attrs=e.attrs)
                for n, e in zip(p.nodes[1:], p.edges, strict=True)
            ],
        )
        for p in exposure.paths
    ]
    return ExposedToy(
        toy=NodeOut.model_validate(exposure.product), severity=exposure.severity, paths=paths
    )


@router.get("/finishers")
def list_finishers() -> list[NodeOut]:
    finishers = Node.objects.filter(kind=Node.Kind.ORGANIZATION, role="finisher")
    return [NodeOut.model_validate(f) for f in finishers.order_by("name")]


@router.get("/finishers/{finisher_id}/toys")
def list_toys(finisher_id: int) -> list[ToySummary]:
    finisher = _finisher(finisher_id)
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


@router.get("/finishers/{finisher_id}/suppliers")
def list_suppliers(finisher_id: int) -> list[SupplierSummary]:
    finisher = _finisher(finisher_id)
    toy_counts = upstream_product_counts(finisher.id)
    affected: dict[int, set[int]] = defaultdict(set)
    for exposure in find_exposure(finisher.id):
        for path in exposure.paths:
            affected[path.incident.node_id].add(exposure.product.id)

    suppliers = (
        Node.objects.filter(id__in=toy_counts, kind=Node.Kind.ORGANIZATION)
        .exclude(id=finisher.id)
        .annotate(factory_count=Count("in_edges", filter=Q(in_edges__kind=Edge.Kind.OPERATED_BY)))
        .order_by("name")
    )
    incidents: dict[int, list[Incident]] = defaultdict(list)
    for i in Incident.objects.filter(
        node__in=suppliers, status=Incident.Status.OPEN
    ).select_related("node"):
        incidents[i.node_id].append(i)

    return [
        SupplierSummary(
            supplier=NodeOut.model_validate(s),
            factory_count=s.factory_count,
            toy_count=toy_counts[s.id],
            affected_toy_count=len(affected[s.id]),
            open_incidents=[IncidentOut.model_validate(i) for i in incidents[s.id]],
        )
        for s in suppliers
    ]


@router.get("/finishers/{finisher_id}/exposure")
def list_exposure(
    finisher_id: int, type: str | None = None, min_severity: Severity | None = None
) -> list[ExposedToy]:
    finisher = _finisher(finisher_id)
    exposures = find_exposure(finisher.id, incident_type=type, min_severity=min_severity)
    exposures.sort(key=lambda e: e.product.name)
    return [_exposed_toy(e) for e in exposures]


@router.get("/toys/{toy_id}/parts")
def list_toy_parts(toy_id: int) -> list[BomLine]:
    """One level of the BOM, with each part's factories and their operators."""
    toy = get_or_404(Node, id=toy_id, role="product")
    contains = toy.out_edges.filter(kind=Edge.Kind.CONTAINS).select_related("target")
    parts = [e.target for e in contains]
    made_at = Edge.objects.filter(kind=Edge.Kind.MADE_AT, source__in=parts).select_related("target")
    operators = {
        e.source_id: e.target
        for e in Edge.objects.filter(
            kind=Edge.Kind.OPERATED_BY, source__in=[e.target_id for e in made_at]
        ).select_related("target")
    }
    sources: dict[int, list[PartSource]] = defaultdict(list)
    for e in made_at:
        operator = operators.get(e.target_id)
        sources[e.source_id].append(
            PartSource(
                factory=NodeOut.model_validate(e.target),
                supplier=NodeOut.model_validate(operator) if operator else None,
                unit_cost_usd=e.attrs.get("unit_cost_usd"),
            )
        )
    lines = [
        BomLine(
            part=NodeOut.model_validate(e.target),
            quantity=e.attrs.get("quantity", 1),
            sources=sources[e.target_id],
        )
        for e in contains
    ]
    return sorted(lines, key=lambda line: line.part.name)
