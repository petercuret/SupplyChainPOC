import pytest
from fastapi.testclient import TestClient

from core.graph import create_edge
from core.models import Edge, Node
from main import app
from tests.conftest import make

client = TestClient(app)

# Endpoints run in a threadpool with their own DB connection, so data must be committed.
db = pytest.mark.django_db(transaction=True)


def test_cors_allows_web_app() -> None:
    response = client.get("/openapi.json", headers={"Origin": "http://localhost:3000"})

    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"


@db
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


@db
def test_rejects_unknown_severity_and_node(chain: dict[str, Node]) -> None:
    body = {"node_id": chain["supplier"].id, "type": "child_labor", "severity": "extreme"}
    assert client.post("/api/incidents", json=body).status_code == 422
    body = {"node_id": 0, "type": "child_labor"}
    assert client.post("/api/incidents", json=body).status_code == 404


@db
def test_graph_contains_whole_supply_chain_and_incidents(chain: dict[str, Node]) -> None:
    client.post("/api/incidents", json={"node_id": chain["supplier"].id, "type": "child_labor"})

    graph = client.get(f"/api/nodes/{chain['toy'].id}/graph").json()

    ids = {n["external_id"] for n in graph["nodes"]}
    assert ids == {"TOY", "ASM", "PRT", "FAC", "FAC-CLEAN", "SUP", "SUP-CLEAN"}
    assert len(graph["edges"]) == 6
    assert [i["node"]["external_id"] for i in graph["incidents"]] == ["SUP"]


@db
def test_factory_counts_toys_exposed_through_its_supplier(chain: dict[str, Node]) -> None:
    client.post("/api/incidents", json={"node_id": chain["supplier"].id, "type": "child_labor"})

    factories = client.get(f"/api/finishers/{chain['finisher'].id}/factories").json()

    affected = {f["factory"]["external_id"]: f["affected_toy_count"] for f in factories}
    assert affected == {"FAC": 1, "FAC-CLEAN": 0}
    assert factories[0]["supplier"]["external_id"] == "SUP"


@db
def test_parts_show_exposure_paths_and_clean_alternatives(chain: dict[str, Node]) -> None:
    alternative = make(Node.Kind.ITEM, "part", "PRT-ALT")
    alternative.name = "PRT"  # same part type as chain["part"]
    alternative.save()
    create_edge(Edge.Kind.MADE_AT, alternative, chain["clean_factory"])
    client.post("/api/incidents", json={"node_id": chain["supplier"].id, "type": "child_labor"})
    finisher = chain["finisher"].id

    parts = {
        p["part"]["external_id"]: p for p in client.get(f"/api/finishers/{finisher}/parts").json()
    }
    assert parts["PRT"]["severity"] == "high"
    assert parts["PRT"]["toy_count"] == 1
    assert parts["PRT-ALT"]["severity"] is None

    detail = client.get(f"/api/finishers/{finisher}/parts/{chain['part'].id}").json()
    flagged = {p["steps"][-1]["node"]["external_id"]: bool(p["incidents"]) for p in detail["paths"]}
    assert flagged == {"SUP": True, "SUP-CLEAN": False}  # dual-sourced: one path is clean
    assert [t["external_id"] for t in detail["used_in"]] == ["TOY"]
    assert [a["part"]["external_id"] for a in detail["alternatives"]] == ["PRT-ALT"]
