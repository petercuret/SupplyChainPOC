from datetime import date

import pytest

from core.graph import InvalidEdge, create_edge, find_exposure
from core.importer import import_seed
from core.models import Edge, Incident, Node

pytestmark = pytest.mark.django_db


def flag(node: Node, **kwargs: object) -> Incident:
    kwargs.setdefault("type", "child_labor")
    return Incident.objects.create(node=node, reported_at=date.today(), **kwargs)


def test_flagged_supplier_exposes_toy_through_any_depth(chain: dict[str, Node]) -> None:
    flag(chain["supplier"], severity="critical")

    [exposure] = find_exposure(chain["finisher"].id)

    assert exposure.product == chain["toy"]
    assert exposure.severity == "critical"
    [path] = exposure.paths
    assert [n.external_id for n in path.nodes] == ["TOY", "ASM", "PRT", "FAC", "SUP"]


def test_only_open_incidents_and_own_products_count(chain: dict[str, Node]) -> None:
    flag(chain["supplier"], status=Incident.Status.RESOLVED)
    flag(chain["clean_supplier"], type="forced_labor", severity="low")

    assert find_exposure(chain["finisher"].id, incident_type="child_labor") == []
    assert find_exposure(chain["finisher"].id, min_severity="medium") == []
    assert [e.product for e in find_exposure(chain["other_finisher"].id)] == []


def test_edges_are_validated(chain: dict[str, Node]) -> None:
    with pytest.raises(InvalidEdge):
        create_edge(Edge.Kind.MADE_AT, chain["part"], chain["supplier"])


def test_import_keeps_dual_sourcing_and_shared_toy_ids() -> None:
    import_seed()

    part = Node.objects.get(role="part", external_id="PRT-0235")
    assert part.out_edges.filter(kind=Edge.Kind.MADE_AT).count() == 2
    assert Node.objects.filter(role="product", external_id="TOY-0092").count() == 2
