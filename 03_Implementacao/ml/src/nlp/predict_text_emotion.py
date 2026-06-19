import os
from transformers.utils import logging as transformers_logging
import argparse
import json
import sys
from pathlib import Path

import torch
from transformers import (
    AutoModelForSequenceClassification,
    AutoTokenizer,
)

os.environ["HF_HUB_DISABLE_PROGRESS_BARS"] = "1"

transformers_logging.set_verbosity_error()
transformers_logging.disable_progress_bar()

ML_ROOT = Path(__file__).resolve().parents[2]

DEFAULT_MODEL_PATH = (
    ML_ROOT
    / "models"
    / "nlp"
    / "bertimbau"
)

MAX_LENGTH = 128

EMODIA_EMOTIONS = {
    "ALEGRIA",
    "TRISTEZA",
    "ANSIEDADE",
    "RAIVA",
    "MEDO",
    "NOJO",
}


def normalize_label(label: str) -> str:
    normalized = (
        str(label)
        .strip()
        .upper()
        .replace("Á", "A")
        .replace("Ã", "A")
        .replace("Â", "A")
        .replace("É", "E")
        .replace("Ê", "E")
        .replace("Í", "I")
        .replace("Ó", "O")
        .replace("Ô", "O")
        .replace("Õ", "O")
        .replace("Ú", "U")
        .replace("Ç", "C")
        .replace(" ", "_")
        .replace("-", "_")
    )

    return normalized


def determine_confidence_level(confidence: float) -> str:
    if confidence >= 0.75:
        return "HIGH"

    if confidence >= 0.50:
        return "MEDIUM"

    return "LOW"


def resolve_emotion(label: str, confidence: float) -> str:
    normalized_label = normalize_label(label)

    if confidence < 0.50:
        return "INDEFINIDO"

    if normalized_label not in EMODIA_EMOTIONS:
        return "INDEFINIDO"

    return normalized_label


class TextEmotionPredictor:
    def __init__(
        self,
        model_path: Path,
        device: str = "auto",
    ) -> None:
        if not model_path.exists():
            raise FileNotFoundError(
                f"Diretório do modelo não encontrado: {model_path}"
            )

        self.model_path = model_path
        self.device = self._resolve_device(device)

        self.tokenizer = AutoTokenizer.from_pretrained(
            model_path,
            local_files_only=True,
        )

        self.model = (
            AutoModelForSequenceClassification.from_pretrained(
                model_path,
                local_files_only=True,
            )
            .to(self.device)
        )

        self.model.eval()

    @staticmethod
    def _resolve_device(device: str) -> torch.device:
        if device == "cpu":
            return torch.device("cpu")

        if device == "cuda":
            if not torch.cuda.is_available():
                raise RuntimeError(
                    "CUDA foi solicitada, mas não está disponível."
                )

            return torch.device("cuda")

        return torch.device(
            "cuda" if torch.cuda.is_available() else "cpu"
        )

    def _get_label(self, class_id: int) -> str:
        id_to_label = self.model.config.id2label

        label = id_to_label.get(class_id)

        if label is None:
            label = id_to_label.get(str(class_id))

        if label is None:
            return f"LABEL_{class_id}"

        return str(label)

    def predict(self, text: str) -> dict:
        normalized_text = text.strip()

        if not normalized_text:
            raise ValueError(
                "Informe um texto para análise."
            )

        encoded = self.tokenizer(
            normalized_text,
            return_tensors="pt",
            truncation=True,
            max_length=MAX_LENGTH,
            padding=True,
        )

        encoded = {
            key: value.to(self.device)
            for key, value in encoded.items()
        }

        with torch.inference_mode():
            output = self.model(**encoded)
            probabilities = torch.softmax(
                output.logits,
                dim=-1,
            )[0]

        predicted_id = int(
            torch.argmax(probabilities).item()
        )

        predicted_label = self._get_label(predicted_id)
        confidence = float(
            probabilities[predicted_id].item()
        )

        scores = {}

        for class_id, probability in enumerate(probabilities):
            label = self._get_label(class_id)
            normalized_label = normalize_label(label)

            scores[normalized_label] = float(
                probability.item()
            )

        scores = dict(
            sorted(
                scores.items(),
                key=lambda item: item[1],
                reverse=True,
            )
        )

        emodia_emotion = resolve_emotion(
            predicted_label,
            confidence,
        )

        confidence_level = determine_confidence_level(
            confidence
        )

        return {
            "emotion": normalize_label(predicted_label),
            "emodiaEmotion": emodia_emotion,
            "confidence": confidence,
            "confidencePercent": round(
                confidence * 100,
                2,
            ),
            "confidenceLevel": confidence_level,
            "accepted": emodia_emotion != "INDEFINIDO",
            "scores": scores,
            "model": "BERTimbau Emodia V2",
            "device": str(self.device),
            "maxLength": MAX_LENGTH,
            "warning": (
                "Classificação emocional provável. "
                "O resultado pode falhar em sarcasmo, ironia, "
                "subentendidos e emoções mascaradas. "
                "Não constitui diagnóstico clínico."
            ),
        }


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Classifica emoção textual usando "
            "o BERTimbau treinado para o Emodia."
        )
    )

    parser.add_argument(
        "text",
        nargs="+",
        help="Texto que será analisado.",
    )

    parser.add_argument(
        "--model-path",
        type=Path,
        default=DEFAULT_MODEL_PATH,
        help="Diretório local do modelo BERTimbau.",
    )

    parser.add_argument(
        "--device",
        choices=["auto", "cpu", "cuda"],
        default="auto",
        help="Dispositivo usado na inferência.",
    )

    return parser.parse_args()


def main() -> None:
    args = parse_arguments()
    text = " ".join(args.text)

    try:
        predictor = TextEmotionPredictor(
            model_path=args.model_path,
            device=args.device,
        )

        result = predictor.predict(text)

        print(
            json.dumps(
                result,
                ensure_ascii=False,
            )
        )
    except Exception as error:
        print(
            json.dumps(
                {
                    "error": str(error),
                },
                ensure_ascii=False,
            )
        )

        sys.exit(1)


if __name__ == "__main__":
    main()