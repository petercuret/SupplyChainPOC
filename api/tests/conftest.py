import pytest

from core.graph import create_edge
from core.models import Edge, Node


def make(kind: str, role: str, ext: str, owner: Node | None = None) -> Node:
    return Node.objects.create(kind=kind, role=role, external_id=ext, name=ext, owner=owner)


@pytest.fixture
def chain() -> dict[str, Node]:
    """finisher's toy -> sub-assembly -> part -> factory -> supplier, the part dual-sourced."""
    org, fac, item = Node.Kind.ORGANIZATION, Node.Kind.FACILITY, Node.Kind.ITEM
    n = {
        "finisher": make(org, "finisher", "FIN"),
        "other_finisher": make(org, "finisher", "FIN-2"),
        "supplier": make(org, "supplier", "SUP"),
        "clean_supplier": make(org, "supplier", "SUP-CLEAN"),
        "factory": make(fac, "factory", "FAC"),
        "clean_factory": make(fac, "factory", "FAC-CLEAN"),
        "part": make(item, "part", "PRT"),
        "assembly": make(item, "part", "ASM"),
    }
    n["toy"] = make(item, "product", "TOY", owner=n["finisher"])
    n["other_toy"] = make(item, "product", "TOY", owner=n["other_finisher"])
    create_edge(Edge.Kind.OPERATED_BY, n["factory"], n["supplier"])
    create_edge(Edge.Kind.OPERATED_BY, n["clean_factory"], n["clean_supplier"])
    create_edge(Edge.Kind.MADE_AT, n["part"], n["factory"])
    create_edge(Edge.Kind.MADE_AT, n["part"], n["clean_factory"])
    create_edge(Edge.Kind.CONTAINS, n["assembly"], n["part"], quantity=2)
    create_edge(Edge.Kind.CONTAINS, n["toy"], n["assembly"], quantity=1)
    return n
