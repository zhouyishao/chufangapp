from fastapi.testclient import TestClient

from app.main import create_app


def test_openapi_available():
  app = create_app()
  client = TestClient(app)
  response = client.get("/openapi.json")
  assert response.status_code == 200


def test_users_list_requires_pagination_defaults():
  app = create_app()
  client = TestClient(app)
  response = client.get("/api/v1/users")
  assert response.status_code == 200
  payload = response.json()
  assert payload["code"] == 0
  assert payload["data"]["page"] == 1
  assert payload["data"]["page_size"] == 20
