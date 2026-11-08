"""Load the customer CSVs (api/seed_data) into the node/edge graph. Safe to re-run."""

import csv
from collections import defaultdict
from pathlib import Path
from typing import Any

from django.db import transaction

from core.graph import validate_edge
from core.models import Edge, Node

SEED_DIR = Path(__file__).resolve().parent.parent / "seed_data"


def _rows(directory: Path, name: str) -> list[dict[str, str]]:
    with open(directory / f"{name}.csv", newline="", encoding="utf-8") as f:
        return [{k: v.strip() for k, v in row.items()} for row in csv.DictReader(f)]


def _node(kind: str, role: str, external_id: str, name: str, owner: Node | None = None,
          **attrs: Any) -> Node:  # fmt: skip
    node, _ = Node.objects.update_or_create(
        owner=owner,
        kind=kind,
        external_id=external_id,
        defaults={"role": role, "name": name, "attrs": attrs},
    )
    return node


@transaction.atomic
def import_seed(directory: Path = SEED_DIR) -> dict[str, int]:
    org, fac, item = Node.Kind.ORGANIZATION, Node.Kind.FACILITY, Node.Kind.ITEM
    edges: list[Edge] = []

    def edge(kind: str, source: Node, target: Node, **attrs: Any) -> None:
        validate_edge(kind, source, target)
        edges.append(Edge(kind=kind, source=source, target=target, attrs=attrs))

    finishers = {
        r["finisher_id"]: _node(
            org, "finisher", r["finisher_id"], r["finisher_name"], hq_country=r["hq_country"]
        )
        for r in _rows(directory, "finishers")
    }
    suppliers = {
        r["supplier_id"]: _node(
            org, "supplier", r["supplier_id"], r["supplier_name"], hq_country=r["hq_country"]
        )
        for r in _rows(directory, "suppliers")
    }

    factories: dict[str, Node] = {}
    for r in _rows(directory, "factories"):
        factories[r["factory_id"]] = node = _node(
            fac, "factory", r["factory_id"], r["factory_name"],
            address=r["address_line"], city=r["city"], country=r["country"],
        )  # fmt: skip
        edge(Edge.Kind.OPERATED_BY, node, suppliers[r["supplier_id"]])

    # A part_id can appear on several rows: the same part, dual-sourced from different factories.
    # parts.supplier_id is redundant with the factory's operator, so it is not stored.
    parts: dict[str, Node] = {}
    for r in _rows(directory, "parts"):
        if r["part_id"] not in parts:
            parts[r["part_id"]] = _node(item, "part", r["part_id"], r["part_name"])
        edge(
            Edge.Kind.MADE_AT, parts[r["part_id"]], factories[r["factory_id"]],
            unit_cost_usd=float(r["unit_cost_usd"]),
        )  # fmt: skip

    # A toy_id can belong to several finishers (separate products per tenant). The BOM is keyed by
    # toy_id only, so every finisher's copy gets the same parts.
    products: dict[str, list[Node]] = defaultdict(list)
    for r in _rows(directory, "toys"):
        products[r["toy_id"]].append(
            _node(
                item,
                "product",
                r["toy_id"],
                r["toy_name"],
                owner=finishers[r["finisher_id"]],
                retail_price_usd=float(r["retail_price_usd"]),
                units_per_year=int(r["units_per_year"]),
            )  # fmt: skip
        )

    for r in _rows(directory, "bill_of_materials"):
        for product in products[r["toy_id"]]:
            edge(Edge.Kind.CONTAINS, product, parts[r["part_id"]], quantity=int(r["quantity"]))

    Edge.objects.bulk_create(
        edges,
        update_conflicts=True,
        unique_fields=["kind", "source", "target"],
        update_fields=["attrs"],
        batch_size=2000,
    )
    return {"nodes": Node.objects.count(), "edges": Edge.objects.count()}
