import pickle
from pathlib import Path
from typing import Any

import pandas as pd
from sklearn.utils.validation import check_is_fitted

from .config import Settings
from .schemas import HouseFeatures


class ModelService:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.model: Any | None = None
        self.model_name = settings.model_name
        self.feature_columns: list[str] = []
        self.preprocessing: dict[str, Any] = {}
        self.artifact_format = "pickle"

    @property
    def artifacts_dir(self) -> Path:
        if self.settings.artifacts_dir:
            return Path(self.settings.artifacts_dir).expanduser().resolve()
        return Path(__file__).resolve().parents[2] / "backend_artifacts"

    def load(self) -> None:
        metadata_path = self.artifacts_dir / "preprocessing.pkl"
        if not metadata_path.is_file():
            raise FileNotFoundError(f"Missing preprocessing artifact: {metadata_path}")

        with metadata_path.open("rb") as file:
            self.preprocessing = pickle.load(file)

        native_model_path = self.artifacts_dir / f"{self.model_name}.json"
        pickle_model_path = self.artifacts_dir / f"{self.model_name}.pkl"
        if self.model_name == "model_xgb" and native_model_path.is_file():
            from xgboost import Booster

            self.model = Booster()
            self.model.load_model(native_model_path)
            self.artifact_format = "xgboost-native"
        elif pickle_model_path.is_file():
            with pickle_model_path.open("rb") as file:
                self.model = pickle.load(file)
        else:
            raise FileNotFoundError(f"Missing model artifact: {native_model_path} or {pickle_model_path}")

        self.feature_columns = self.preprocessing.get("feature_columns", [])
        if not self.feature_columns:
            raise ValueError("preprocessing.pkl does not contain feature_columns")
        if self.artifact_format == "pickle":
            check_is_fitted(self.model)

    def predict(self, features: HouseFeatures) -> float:
        if self.model is None:
            raise RuntimeError("The model has not been loaded")

        row = pd.DataFrame([features.model_dump()])
        row = pd.get_dummies(
            row,
            columns=[self.preprocessing["categorical_column"]],
            drop_first=self.preprocessing["one_hot_drop_first"],
            dtype=self.preprocessing["one_hot_dtype"],
        )
        row = row.reindex(columns=self.feature_columns, fill_value=0)
        if self.artifact_format == "xgboost-native":
            from xgboost import DMatrix

            prediction = self.model.predict(DMatrix(row))[0]
        else:
            prediction = self.model.predict(row)[0]
        return float(prediction)

    def predict_batch(self, features: list[HouseFeatures]) -> list[float]:
        return [self.predict(item) for item in features]
