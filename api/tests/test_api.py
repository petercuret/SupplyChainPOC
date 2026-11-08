from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_hello() -> None:
    response = client.get("/api/hello")

    assert response.status_code == 200
    assert response.json() == {"message": "Hello, World!"}


def test_cors_allows_web_app() -> None:
    response = client.get("/api/hello", headers={"Origin": "http://localhost:3000"})

    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"
