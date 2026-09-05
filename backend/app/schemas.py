from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class OceanProximity(str, Enum):
    less_than_one_hour = "<1H OCEAN"
    inland = "INLAND"
    island = "ISLAND"
    near_bay = "NEAR BAY"
    near_ocean = "NEAR OCEAN"


class HouseFeatures(BaseModel):
    model_config = ConfigDict(extra="forbid")

    longitude: float = Field(ge=-180, le=180)
    latitude: float = Field(ge=-90, le=90)
    housing_median_age: float = Field(ge=0, le=200)
    total_rooms: float = Field(ge=0)
    total_bedrooms: float = Field(ge=0)
    population: float = Field(ge=0)
    households: float = Field(ge=0)
    median_income: float = Field(ge=0)
    ocean_proximity: OceanProximity


class PredictionResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    predicted_median_house_value: float
    model: str


class BatchPredictionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    houses: list[HouseFeatures] = Field(min_length=1, max_length=100)


class BatchPredictionResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    predictions: list[float]
    model: str


class ServiceInfoResponse(BaseModel):
    name: str
    version: str
    model: str
    feature_count: int


class HealthResponse(BaseModel):
    status: str
    model: str
    feature_count: int
