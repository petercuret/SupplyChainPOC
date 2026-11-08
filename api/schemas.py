"""Pydantic request/response models for the HTTP API."""

import re
from datetime import date
from typing import Annotated, Any

from pydantic import AfterValidator, BaseModel, ConfigDict, Field

from core.models import Incident

Severity = Incident.Severity
Status = Incident.Status


def normalize_type(value: str) -> str:
    """'Child Labor ' / 'child-labour' -> 'child_labor'-style slug so free-text types group."""
    slug = re.sub(r"[^a-z0-9]+", "_", value.strip().lower()).strip("_")
    if not slug:
        raise ValueError("type must contain letters or digits")
    return slug


IncidentType = Annotated[str, Field(max_length=64), AfterValidator(normalize_type)]


class NodeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    kind: str
    role: str
    external_id: str
    name: str
    attrs: dict[str, Any]


class IncidentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    node: NodeOut
    type: str
    severity: Severity
    status: Status
    description: str
    reported_at: date
    resolved_at: date | None


class IncidentCreate(BaseModel):
    node_id: int
    type: IncidentType
    severity: Severity = Severity.HIGH
    description: str = ""
    reported_at: date = Field(default_factory=date.today)


class IncidentUpdate(BaseModel):
    type: IncidentType | None = None
    severity: Severity | None = None
    status: Status | None = None
    description: str | None = None
    reported_at: date | None = None
    resolved_at: date | None = None


class ToySummary(BaseModel):
    toy: NodeOut
    part_count: int
    severity: Severity | None  # highest open incident reaching this toy


class PartSource(BaseModel):
    factory: NodeOut
    supplier: NodeOut | None
    unit_cost_usd: float | None


class BomLine(BaseModel):
    part: NodeOut
    quantity: int
    sources: list[PartSource]


class SupplierSummary(BaseModel):
    supplier: NodeOut
    factory_count: int
    toy_count: int  # this finisher's toys that depend on the supplier
    affected_toy_count: int  # of those, toys exposed through incidents on this supplier
    open_incidents: list[IncidentOut]


class PathStep(BaseModel):
    node: NodeOut
    edge_kind: str | None = None  # edge from the previous step to this node
    edge_attrs: dict[str, Any] = {}


class ExposurePathOut(BaseModel):
    incident: IncidentOut
    steps: list[PathStep]


class ExposedToy(BaseModel):
    toy: NodeOut
    severity: Severity
    paths: list[ExposurePathOut]
