from fastapi import APIRouter

from core.graph import affected_nodes, dependent_products, supply_paths, upstream_product_counts
from core.models import Node, worst_severity
from routers.catalog import part_sources
from routers.common import finisher_or_404, get_or_404, path_steps
from schemas import IncidentOut, NodeOut, PartDetail, PartSummary, SupplyPathOut

router = APIRouter(prefix="/api", tags=["parts"])

PARTS = Node.objects.filter(kind=Node.Kind.ITEM, role="part")


def _summaries(finisher: Node, parts: list[Node]) -> list[PartSummary]:
    toy_counts = upstream_product_counts(finisher.id)
    affected = affected_nodes()
    sources = part_sources(parts)
    return [
        PartSummary(
            part=NodeOut.model_validate(part),
            sources=sources[part.id],
            toy_count=toy_counts.get(part.id, 0),
            severity=worst_severity(i.severity for i in affected.get(part.id, [])),
            incident_count=len({i.id for i in affected.get(part.id, [])}),
        )
        for part in parts
    ]


@router.get("/finishers/{finisher_id}/parts")
def list_parts(finisher_id: int) -> list[PartSummary]:
    """All parts in the catalog (not only the finisher's), so clean alternatives show up too."""
    finisher = finisher_or_404(finisher_id)
    return _summaries(finisher, list(PARTS.order_by("name", "id")))


@router.get("/finishers/{finisher_id}/parts/{part_id}")
def part_detail(finisher_id: int, part_id: int) -> PartDetail:
    finisher = finisher_or_404(finisher_id)
    part = get_or_404(PARTS, id=part_id)
    # Alternatives: other parts of the same type, which the seed data expresses as the same name.
    # Clean ones first, then those the finisher already uses most.
    alternatives = sorted(
        _summaries(finisher, list(PARTS.filter(name=part.name).exclude(id=part.id))),
        key=lambda s: (s.severity is not None, -s.toy_count, s.part.external_id),
    )
    return PartDetail(
        paths=[
            SupplyPathOut(
                steps=path_steps(p.nodes, p.edges),
                incidents=[IncidentOut.model_validate(i) for i in p.incidents],
            )
            for p in supply_paths(part.id)
        ],
        used_in=[NodeOut.model_validate(t) for t in dependent_products(part.id, finisher.id)],
        alternatives=alternatives,
    )
