from typing import Any

from django.db.models import Model, QuerySet
from fastapi import HTTPException

from core.models import Edge, Node
from schemas import NodeOut, PathStep


def get_or_404[M: Model](queryset: type[M] | QuerySet[M], **lookup: Any) -> M:
    qs = queryset.objects.all() if isinstance(queryset, type) else queryset
    try:
        return qs.get(**lookup)
    except qs.model.DoesNotExist:
        raise HTTPException(404, f"{qs.model.__name__} not found") from None


def finisher_or_404(finisher_id: int) -> Node:
    return get_or_404(Node, id=finisher_id, kind=Node.Kind.ORGANIZATION, role="finisher")


def path_steps(nodes: list[Node], edges: list[Edge]) -> list[PathStep]:
    """A traversal path as response steps; each step after the first carries its incoming edge."""
    return [PathStep(node=NodeOut.model_validate(nodes[0]))] + [
        PathStep(node=NodeOut.model_validate(n), edge_kind=e.kind, edge_attrs=e.attrs)
        for n, e in zip(nodes[1:], edges, strict=True)
    ]
