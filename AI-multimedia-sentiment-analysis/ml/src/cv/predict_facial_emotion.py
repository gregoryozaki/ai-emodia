import argparse
import json
import sys
from pathlib import Path

import cv2
import numpy as np
import torch
from hsemotion.facial_emotions import HSEmotionRecognizer


_original_torch_load = torch.load


def torch_load_compat(*args, **kwargs):
    kwargs.setdefault("weights_only", False)
    return _original_torch_load(*args, **kwargs)


torch.load = torch_load_compat


HSEMOTION_CLASSES = [
    "Anger",
    "Contempt",
    "Disgust",
    "Fear",
    "Happiness",
    "Neutral",
    "Sadness",
    "Surprise",
]


EMODIA_MAP = {
    "Anger": "RAIVA",
    "Contempt": "NOJO",
    "Disgust": "NOJO",
    "Fear": "MEDO",
    "Happiness": "ALEGRIA",
    "Neutral": "NEUTRAL",
    "Sadness": "TRISTEZA",
    "Surprise": "SURPRISE",
}


def normalize_emotion_name(emotion):
    if not emotion:
        return "Unknown"

    return str(emotion).strip()


def map_to_emodia(emotion):
    return EMODIA_MAP.get(normalize_emotion_name(emotion), "UNKNOWN")


def load_image(image_path):
    image_path = Path(image_path)

    if not image_path.exists():
        raise FileNotFoundError(f"Imagem não encontrada: {image_path}")

    image_bgr = cv2.imread(str(image_path))

    if image_bgr is None:
        raise ValueError(f"Não foi possível ler a imagem: {image_path}")

    return cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)


def build_named_scores(scores):
    scores_array = np.asarray(scores).astype(float).flatten()

    if scores_array.size != len(HSEMOTION_CLASSES):
        return {}, scores_array.tolist()

    named_scores = {
        emotion: float(score)
        for emotion, score in zip(HSEMOTION_CLASSES, scores_array)
    }

    return named_scores, scores_array.tolist()


def predict_emotion(image_path, model_name):
    image_rgb = load_image(image_path)

    recognizer = HSEmotionRecognizer(model_name=model_name)
    emotion, scores = recognizer.predict_emotions(image_rgb, logits=False)

    emotion = normalize_emotion_name(emotion)
    named_scores, raw_scores = build_named_scores(scores)

    result = {
        "emotion": emotion,
        "emodiaEmotion": map_to_emodia(emotion),
        "confidence": named_scores.get(emotion),
        "scores": named_scores,
        "rawScores": raw_scores,
        "model": model_name,
        "input": str(image_path),
        "warning": (
            "Expressão facial aparente. Não é diagnóstico clínico "
            "e deve ser usada apenas como sinal complementar."
        ),
    }

    if result["confidence"] is None and raw_scores:
        result["confidence"] = float(max(raw_scores))

    return result


def main():
    parser = argparse.ArgumentParser(
        description="Predição de emoção facial aparente para o Emodia."
    )

    parser.add_argument(
        "image_path",
        help="Caminho da imagem/frame para análise."
    )

    parser.add_argument(
        "--model",
        default="enet_b0_8_best_afew",
        help="Modelo HSEmotion. Ex: enet_b0_8_best_afew."
    )

    args = parser.parse_args()

    try:
        result = predict_emotion(
            image_path=args.image_path,
            model_name=args.model,
        )

        print(json.dumps(result, ensure_ascii=False))
    except Exception as error:
        print(json.dumps({"error": str(error)}, ensure_ascii=False))
        sys.exit(1)


if __name__ == "__main__":
    main()