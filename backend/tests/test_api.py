from fastapi.testclient import TestClient

from app.main import app


SAMPLE_HOUSE = {
    "longitude": -122.23,
    "latitude": 37.88,
    "housing_median_age": 41,
    "total_rooms": 880,
    "total_bedrooms": 129,
    "population": 322,
    "households": 126,
    "median_income": 8.3252,
    "ocean_proximity": "<1H OCEAN",
}


def test_health_and_prediction() -> None:
    with TestClient(app) as client:
        info = client.get("/")
        health = client.get("/health")
        prediction = client.post("/predict", json=SAMPLE_HOUSE)

    assert info.status_code == 200
    assert info.json()["feature_count"] == 12
    assert health.status_code == 200
    assert health.json()["feature_count"] == 12
    assert prediction.status_code == 200
    assert prediction.json()["predicted_median_house_value"] > 0


def test_batch_prediction() -> None:
    with TestClient(app) as client:
        response = client.post("/predict/batch", json={"houses": [SAMPLE_HOUSE, SAMPLE_HOUSE]})

    assert response.status_code == 200
    assert len(response.json()["predictions"]) == 2


def test_prediction_rejects_unknown_fields() -> None:
    invalid_house = {**SAMPLE_HOUSE, "unexpected": 1}

    with TestClient(app) as client:
        response = client.post("/predict", json=invalid_house)

    assert response.status_code == 422
