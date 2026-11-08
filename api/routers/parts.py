from fastapi import APIRouter

from core.graph import (
    affected_nodes,
    dependent_products,
    supply_paths,
    upstream_product_counts,
)
from core.models import SEVERITY_RANK, Incident, Node
from routers.catalog import finisher_or_404, part_sources
from routers.common import get_or_404
from schemas import IncidentOut, NodeOut, PartDetail, PartSummary, PathStep, SupplyPathOut

router = APIRouter(prefix="/api", tags=["parts"])


def _summaries(finisher: Node, parts: list[Node]) -> list[PartSummary]:
    toy_counts = upstream_product_counts(finisher.id)
    affected = affected_nodes()
    sources = part_sources(parts)

    def summary(part: Node) -> PartSummary:
        incidents: list[Incident] = affected.get(part.id, [])
        worst = max((i.severity for i in incidents), key=SEVERITY_RANK.__getitem__, default=None)
        return PartSummary(
            part=NodeOut.model_validate(part),
            sources=sources[part.id],
            toy_count=toy_counts.get(part.id, 0),
            severity=worst,
            incident_count=len({i.id for i in incidents}),
        )

    return [summary(p) for p in parts]


@router.get("/finishers/{finisher_id}/parts")
def list_parts(finisher_id: int) -> list[PartSummary]:
    """All parts in the catalog (not only the finisher's), so clean alternatives show up too."""
    finisher = finisher_or_404(finisher_id)
    parts = list(Node.objects.filter(kind=Node.Kind.ITEM, role="part").order_by("name", "id"))
    return _summaries(finisher, parts)


@router.get("/finishers/{finisher_id}/parts/{part_id}")
def part_detail(finisher_id: int, part_id: int) -> PartDetail:
    finisher = finisher_or_404(finisher_id)
    part = get_or_404(Node, id=part_id, kind=Node.Kind.ITEM, role="part")
    paths = [
        SupplyPathOut(
            steps=[PathStep(node=NodeOut.model_validate(path.nodes[0]))]
            + [
                PathStep(node=NodeOut.model_validate(n), edge_kind=e.kind, edge_attrs=e.attrs)
                for n, e in zip(path.nodes[1:], path.edges, strict=True)
            ],
            incidents=[IncidentOut.model_validate(i) for i in path.incidents],
        )
        for path in supply_paths(part.id)
    ]
    # Alternatives: other parts of the same type, which the seed data expresses as the same name.
    alternatives = list(
        Node.objects.filter(kind=Node.Kind.ITEM, role="part", name=part.name)
        .exclude(id=part.id)
        .order_by("id")
    )
    ranked = sorted(
        _summaries(finisher, alternatives),
        key=lambda s: (s.severity is not None, -s.toy_count, s.part.external_id),
    )
    return PartDetail(
        paths=paths,
        used_in=[NodeOut.model_validate(t) for t in dependent_products(part.id, finisher.id)],
        alternatives=ranked,
    )
