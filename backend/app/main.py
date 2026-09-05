from contextlib import asynccontextmanager
from logging.config import dictConfig

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .model_service import ModelService
from .schemas import (
    BatchPredictionRequest,
    BatchPredictionResponse,
    HealthResponse,
    HouseFeatures,
    PredictionResponse,
    ServiceInfoResponse,
)


dictConfig({
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {"default": {"format": "%(asctime)s %(levelname)s %(name)s: %(message)s"}},
    "handlers": {"default": {"class": "logging.StreamHandler", "formatter": "default"}},
    "loggers": {"house_price_api": {"handlers": ["default"], "level": "INFO", "propagate": False}},
})

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    service = ModelService(settings)
    service.load()
    app.state.model_service = service
    yield


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="Predict California median house values from housing features.",
    lifespan=lifespan,
)

if settings.allowed_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=False,
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type"],
    )


@app.get("/", response_model=ServiceInfoResponse, tags=["system"])
def service_info(request: Request) -> ServiceInfoResponse:
    service: ModelService = request.app.state.model_service
    return ServiceInfoResponse(
        name=settings.app_name,
        version=app.version,
        model=service.model_name,
        feature_count=len(service.feature_columns),
    )


@app.get("/health", response_model=HealthResponse, tags=["system"])
def health(request: Request) -> HealthResponse:
    service: ModelService = request.app.state.model_service
    return HealthResponse(status="ok", model=service.model_name, feature_count=len(service.feature_columns))


@app.post("/predict", response_model=PredictionResponse, tags=["prediction"])
def predict(features: HouseFeatures, request: Request) -> PredictionResponse:
    service: ModelService = request.app.state.model_service
    try:
        prediction = service.predict(features)
    except Exception as error:
        raise HTTPException(status_code=500, detail="Prediction failed") from error
    return PredictionResponse(predicted_median_house_value=prediction, model=service.model_name)


@app.post("/predict/batch", response_model=BatchPredictionResponse, tags=["prediction"])
def predict_batch(payload: BatchPredictionRequest, request: Request) -> BatchPredictionResponse:
    service: ModelService = request.app.state.model_service
    try:
        predictions = service.predict_batch(payload.houses)
    except Exception as error:
        raise HTTPException(status_code=500, detail="Prediction failed") from error
    return BatchPredictionResponse(predictions=predictions, model=service.model_name)
