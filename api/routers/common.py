from typing import Any

from django.db.models import Model, QuerySet
from fastapi import HTTPException


def get_or_404[M: Model](queryset: type[M] | QuerySet[M], **lookup: Any) -> M:
    qs = queryset.objects.all() if isinstance(queryset, type) else queryset
    try:
        return qs.get(**lookup)
    except qs.model.DoesNotExist:
        raise HTTPException(404, f"{qs.model.__name__} not found") from None
