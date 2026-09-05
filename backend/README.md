# House Price Prediction API

FastAPI service for the exported models in `../backend_artifacts`.

## Run locally

From this directory:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Open `http://127.0.0.1:8000/docs` for the interactive API documentation.

## Endpoints

- `GET /` returns service and model metadata.
- `GET /health` verifies that the configured fitted model and feature contract loaded.
- `POST /predict` validates one house record and returns the predicted median house value.
- `POST /predict/batch` predicts up to 100 house records in one request.

Example request body:

```json
{
  "longitude": -122.23,
  "latitude": 37.88,
  "housing_median_age": 41,
  "total_rooms": 880,
  "total_bedrooms": 129,
  "population": 322,
  "households": 126,
  "median_income": 8.3252,
  "ocean_proximity": "<1H OCEAN"
}
```

Set `HOUSE_PRICE_MODEL_NAME` to `model_rf` or `model_gb` to select another exported model. Keep the model and `preprocessing.pkl` artifacts from the same training run together. XGBoost uses the native `model_xgb.json` artifact when available and falls back to `model_xgb.pkl` for compatibility.
