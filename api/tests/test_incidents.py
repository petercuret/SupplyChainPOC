import pytest
from fastapi.testclient import TestClient

from core.models import Node
from main import app

client = TestClient(app)

# Endpoints run in a threadpool with their own DB connection, so data must be committed.
pytestmark = pytest.mark.django_db(transaction=True)


def test_flag_supplier_then_resolve(chain: dict[str, Node]) -> None:
    exposure_url = f"/api/finishers/{chain['finisher'].id}/exposure"

    created = client.post(
        "/api/incidents",
        json={"node_id": chain["supplier"].id, "type": " Child Labor", "severity": "high"},
    )
    assert created.status_code == 201
    assert created.json()["type"] == "child_labor"

    [toy] = client.get(exposure_url).json()
    assert toy["toy"]["id"] == chain["toy"].id
    assert [s["node"]["external_id"] for s in toy["paths"][0]["steps"]] == [
        "TOY", "ASM", "PRT", "FAC", "SUP",
    ]  # fmt: skip

    resolved = client.patch(f"/api/incidents/{created.json()['id']}", json={"status": "resolved"})
    assert resolved.json()["resolved_at"] is not None
    assert client.get(exposure_url).json() == []


def test_rejects_unknown_severity_and_node(chain: dict[str, Node]) -> None:
    body = {"node_id": chain["supplier"].id, "type": "child_labor", "severity": "extreme"}
    assert client.post("/api/incidents", json=body).status_code == 422
    body = {"node_id": 0, "type": "child_labor"}
    assert client.post("/api/incidents", json=body).status_code == 404
