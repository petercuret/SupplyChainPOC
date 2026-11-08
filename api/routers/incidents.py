from datetime import date

from fastapi import APIRouter, Response

from core.models import Incident, Node
from routers.common import get_or_404
from schemas import IncidentCreate, IncidentOut, IncidentUpdate, Status

router = APIRouter(prefix="/api", tags=["incidents"])

DEFAULT_TYPES = ["child_labor"]


@router.get("/incidents")
def list_incidents(
    node_id: int | None = None, status: Status | None = None, type: str | None = None
) -> list[IncidentOut]:
    incidents = Incident.objects.select_related("node").order_by("-reported_at", "-id")
    if node_id is not None:
        incidents = incidents.filter(node_id=node_id)
    if status:
        incidents = incidents.filter(status=status)
    if type:
        incidents = incidents.filter(type=type)
    return [IncidentOut.model_validate(i) for i in incidents]


@router.post("/incidents", status_code=201)
def create_incident(body: IncidentCreate) -> IncidentOut:
    node = get_or_404(Node, id=body.node_id)
    incident = Incident.objects.create(node=node, **body.model_dump(exclude={"node_id"}))
    return IncidentOut.model_validate(incident)


@router.patch("/incidents/{incident_id}")
def update_incident(incident_id: int, body: IncidentUpdate) -> IncidentOut:
    incident = get_or_404(Incident.objects.select_related("node"), id=incident_id)
    changes = body.model_dump(exclude_unset=True)
    if "status" in changes and "resolved_at" not in changes:
        if changes["status"] == Status.RESOLVED and incident.resolved_at is None:
            changes["resolved_at"] = date.today()
        elif changes["status"] == Status.OPEN:
            changes["resolved_at"] = None
    for field, value in changes.items():
        setattr(incident, field, value)
    incident.save()
    return IncidentOut.model_validate(incident)


@router.delete("/incidents/{incident_id}", status_code=204)
def delete_incident(incident_id: int) -> Response:
    get_or_404(Incident, id=incident_id).delete()
    return Response(status_code=204)


@router.get("/incident-types")
def list_incident_types() -> list[str]:
    used = Incident.objects.values_list("type", flat=True).distinct()
    return sorted(set(DEFAULT_TYPES) | set(used))
