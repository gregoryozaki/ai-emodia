import argparse
import json
import sys
from collections import Counter, defaultdict
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


def map_to_emodia(emotion):
    return EMODIA_MAP.get(str(emotion).strip(), "UNKNOWN")


def build_named_scores(scores):
    scores_array = np.asarray(scores).astype(float).flatten()

    if scores_array.size != len(HSEMOTION_CLASSES):
        return {}, scores_array.tolist()

    named_scores = {
        emotion: float(score)
        for emotion, score in zip(HSEMOTION_CLASSES, scores_array)
    }

    return named_scores, scores_array.tolist()


def read_video_frames(video_path, frame_interval_seconds):
    video_path = Path(video_path)

    if not video_path.exists():
        raise FileNotFoundError(f"Vídeo não encontrado: {video_path}")

    capture = cv2.VideoCapture(str(video_path))

    if not capture.isOpened():
        raise ValueError(f"Não foi possível abrir o vídeo: {video_path}")

    fps = capture.get(cv2.CAP_PROP_FPS)

    if fps <= 0:
        fps = 30

    frame_interval = max(1, int(fps * frame_interval_seconds))

    frames = []
    frame_index = 0

    while True:
        success, frame_bgr = capture.read()

        if not success:
            break

        if frame_index % frame_interval == 0:
            frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
            frames.append(frame_rgb)

        frame_index += 1

    capture.release()

    return frames


def predict_video_emotion(video_path, model_name, frame_interval_seconds):
    frames = read_video_frames(video_path, frame_interval_seconds)

    if not frames:
        raise ValueError("Nenhum frame foi extraído do vídeo.")

    recognizer = HSEmotionRecognizer(model_name=model_name)

    emotion_counts = Counter()
    score_sums = defaultdict(float)
    frame_results = []

    for index, frame_rgb in enumerate(frames):
        emotion, scores = recognizer.predict_emotions(frame_rgb, logits=False)

        emotion = str(emotion).strip()
        named_scores, raw_scores = build_named_scores(scores)

        emotion_counts[emotion] += 1

        for score_name, score_value in named_scores.items():
            score_sums[score_name] += score_value

        frame_results.append({
            "frameIndex": index,
            "emotion": emotion,
            "emodiaEmotion": map_to_emodia(emotion),
            "confidence": named_scores.get(emotion),
            "scores": named_scores,
            "rawScores": raw_scores,
        })

    average_scores = {
        emotion: score_sums[emotion] / len(frames)
        for emotion in HSEMOTION_CLASSES
    }

    dominant_emotion = max(
        average_scores,
        key=lambda emotion: average_scores[emotion],
    )

    top_scores = sorted(
        average_scores.items(),
        key=lambda item: item[1],
        reverse=True,
    )

    second_emotion, second_score = top_scores[1]
    top_gap = average_scores[dominant_emotion] - second_score

    if average_scores[dominant_emotion] >= 0.60 and top_gap >= 0.20:
        confidenceLevel = "HIGH"
    elif average_scores[dominant_emotion] >= 0.40 and top_gap >= 0.12:
        confidenceLevel = "MEDIUM"
    else:
        confidenceLevel = "LOW"

    result = {
        "emotion": dominant_emotion,
        "emodiaEmotion": map_to_emodia(dominant_emotion),
        "confidence": average_scores[dominant_emotion],
        "confidenceLevel": confidenceLevel,
        "topGap": top_gap,
        "averageScores": average_scores,
        "emotionCounts": dict(emotion_counts),
        "framesAnalyzed": len(frames),
        "frameIntervalSeconds": frame_interval_seconds,
        "model": model_name,
        "input": str(video_path),
        "interpretation": (
            "Resultado visual com baixa confiança. Use apenas como sinal complementar."
            if confidenceLevel == "LOW"
            else "Resultado visual complementar."
        ),
        "warning": (
            "Expressão facial aparente em vídeo. Não é diagnóstico clínico "
            "e deve ser usada apenas como sinal complementar."
        ),
    }
    top_scores = sorted(
        average_scores.items(),
        key=lambda item: item[1],
        reverse=True,
    )

    second_emotion, second_score = top_scores[1]
    top_gap = average_scores[dominant_emotion] - second_score

    if average_scores[dominant_emotion] >= 0.60 and top_gap >= 0.20:
        confidenceLevel = "HIGH"
    elif average_scores[dominant_emotion] >= 0.40 and top_gap >= 0.12:
        confidenceLevel = "MEDIUM"
    else:
        confidenceLevel = "LOW"

    result = {
        "emotion": dominant_emotion,
        "emodiaEmotion": map_to_emodia(dominant_emotion),
        "confidence": average_scores[dominant_emotion],
        "confidenceLevel": confidenceLevel,
        "topGap": top_gap,
        "averageScores": average_scores,
        "emotionCounts": dict(emotion_counts),
        "framesAnalyzed": len(frames),
        "frameIntervalSeconds": frame_interval_seconds,
        "model": model_name,
        "input": str(video_path),
        "interpretation": (
            "Resultado visual com baixa confiança. Use apenas como sinal complementar."
            if confidenceLevel == "LOW"
            else "Resultado visual complementar."
        ),
        "warning": (
            "Expressão facial aparente em vídeo. Não é diagnóstico clínico "
            "e deve ser usada apenas como sinal complementar."
        ),
    }
    
    return result


def main():
    parser = argparse.ArgumentParser(
        description="Predição de emoção facial aparente em vídeo para o Emodia."
    )

    parser.add_argument(
        "video_path",
        help="Caminho do vídeo para análise."
    )

    parser.add_argument(
        "--model",
        default="enet_b0_8_best_afew",
        help="Modelo HSEmotion."
    )

    parser.add_argument(
        "--interval",
        type=float,
        default=1.0,
        help="Intervalo em segundos entre frames analisados."
    )

    args = parser.parse_args()

    try:
        result = predict_video_emotion(
            video_path=args.video_path,
            model_name=args.model,
            frame_interval_seconds=args.interval,
        )

        print(json.dumps(result, ensure_ascii=False))
    except Exception as error:
        print(json.dumps({"error": str(error)}, ensure_ascii=False))
        sys.exit(1)


if __name__ == "__main__":
    main()