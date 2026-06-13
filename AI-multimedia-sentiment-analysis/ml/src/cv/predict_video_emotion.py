import argparse
import json
import sys
from collections import Counter, defaultdict
from pathlib import Path

import cv2
import numpy as np

from predict_facial_emotion import (
    DEFAULT_LABELS_PATH,
    DEFAULT_MODEL_PATH,
    WARNING_MESSAGE,
    confidence_level,
    create_face_detector,
    create_session,
    detect_largest_face,
    load_labels,
    preprocess_image,
    softmax,
)


def read_video_metadata(capture: cv2.VideoCapture) -> dict:
    fps = capture.get(cv2.CAP_PROP_FPS)

    if fps <= 0:
        fps = 30.0

    total_frames = int(capture.get(cv2.CAP_PROP_FRAME_COUNT))
    duration_seconds = (
        total_frames / fps
        if total_frames > 0
        else 0.0
    )

    return {
        "fps": float(fps),
        "totalFrames": total_frames,
        "durationSeconds": float(duration_seconds),
    }


def predict_video_emotion(
    video_path: Path,
    model_path: Path,
    labels_path: Path,
    device: str,
    frame_interval_seconds: float,
) -> dict:
    if not video_path.exists():
        raise FileNotFoundError(
            f"Vídeo não encontrado: {video_path}"
        )

    if frame_interval_seconds <= 0:
        raise ValueError(
            "O intervalo entre frames deve ser maior que zero."
        )

    labels = load_labels(labels_path)

    class_names = labels["class_names"]
    emotion_map = labels["emotion_map"]
    image_size = labels["image_size"]

    detector = create_face_detector()
    session = create_session(model_path, device)

    model_input = session.get_inputs()[0]

    capture = cv2.VideoCapture(str(video_path))

    if not capture.isOpened():
        raise ValueError(
            f"Não foi possível abrir o vídeo: {video_path}"
        )

    metadata = read_video_metadata(capture)
    fps = metadata["fps"]

    frame_interval = max(
        1,
        int(round(fps * frame_interval_seconds))
    )

    frame_index = 0
    sampled_frames = 0
    analyzed_frames = 0
    skipped_frames_without_face = 0

    score_sums = defaultdict(float)
    emotion_counts = Counter()
    frame_results = []

    while True:
        success, frame_bgr = capture.read()

        if not success:
            break

        if frame_index % frame_interval != 0:
            frame_index += 1
            continue

        sampled_frames += 1

        face_crop, face_box = detect_largest_face(
            frame_bgr,
            detector
        )

        if face_box is None:
            skipped_frames_without_face += 1
            frame_index += 1
            continue

        input_tensor = preprocess_image(
            face_crop,
            image_size
        )

        model_outputs = session.run(
            None,
            {
                model_input.name: input_tensor
            }
        )

        if not model_outputs:
            frame_index += 1
            continue

        probabilities = softmax(model_outputs[0])

        if len(probabilities) != len(class_names):
            raise ValueError(
                "A quantidade de classes retornada pelo modelo "
                "não corresponde ao labels.json."
            )

        scores = {
            class_name: float(probability)
            for class_name, probability in zip(
                class_names,
                probabilities
            )
        }

        ordered_scores = sorted(
            scores.items(),
            key=lambda item: item[1],
            reverse=True
        )

        emotion, confidence = ordered_scores[0]

        second_score = (
            ordered_scores[1][1]
            if len(ordered_scores) > 1
            else 0.0
        )

        top_gap = confidence - second_score

        emotion_counts[emotion] += 1

        for score_name, score_value in scores.items():
            score_sums[score_name] += score_value

        analyzed_frames += 1

        frame_results.append({
            "frameIndex": frame_index,
            "timeSeconds": round(
                frame_index / fps,
                3
            ),
            "emotion": emotion,
            "emodiaEmotion": emotion_map.get(
                emotion,
                "UNKNOWN"
            ),
            "confidence": float(confidence),
            "confidenceLevel": confidence_level(
                float(confidence),
                float(top_gap)
            ),
            "topGap": float(top_gap),
            "faceBox": face_box,
            "scores": scores,
        })

        frame_index += 1

    capture.release()

    if analyzed_frames == 0:
        raise ValueError(
            "Nenhuma face foi detectada nos frames analisados."
        )

    average_scores = {
        class_name: (
            score_sums[class_name] / analyzed_frames
        )
        for class_name in class_names
    }

    ordered_average_scores = sorted(
        average_scores.items(),
        key=lambda item: item[1],
        reverse=True
    )

    dominant_emotion, dominant_confidence = (
        ordered_average_scores[0]
    )

    second_average_score = (
        ordered_average_scores[1][1]
        if len(ordered_average_scores) > 1
        else 0.0
    )

    top_gap = (
        dominant_confidence - second_average_score
    )

    level = confidence_level(
        dominant_confidence,
        top_gap
    )

    providers = session.get_providers()

    return {
        "emotion": dominant_emotion,
        "emodiaEmotion": emotion_map.get(
            dominant_emotion,
            "UNKNOWN"
        ),
        "confidence": float(dominant_confidence),
        "confidencePercent": round(
            float(dominant_confidence) * 100,
            2
        ),
        "confidenceLevel": level,
        "topGap": float(top_gap),
        "averageScores": average_scores,
        "emotionCounts": dict(emotion_counts),
        "sampledFrames": sampled_frames,
        "framesAnalyzed": analyzed_frames,
        "framesWithoutFace": skipped_frames_without_face,
        "frameIntervalSeconds": frame_interval_seconds,
        "fps": metadata["fps"],
        "totalFrames": metadata["totalFrames"],
        "durationSeconds": metadata["durationSeconds"],
        "model": labels["model_name"],
        "modelPath": str(model_path),
        "labelsPath": str(labels_path),
        "device": (
            "cuda"
            if "CUDAExecutionProvider" in providers
            else "cpu"
        ),
        "input": str(video_path),
        "interpretation": (
            "Resultado visual com baixa confiança. "
            "Use apenas como sinal complementar."
            if level == "LOW"
            else "Resultado visual complementar."
        ),
        "warning": WARNING_MESSAGE,
        "frameResults": frame_results,
    }


def main():
    parser = argparse.ArgumentParser(
        description=(
            "Predição de expressão facial aparente "
            "em vídeo com ConvNeXtTiny RAF-DB V4."
        )
    )

    parser.add_argument(
        "video_path",
        help="Caminho do vídeo para análise."
    )

    parser.add_argument(
        "--model-path",
        default=str(DEFAULT_MODEL_PATH),
        help="Caminho do modelo ONNX."
    )

    parser.add_argument(
        "--labels-path",
        default=str(DEFAULT_LABELS_PATH),
        help="Caminho do arquivo labels.json."
    )

    parser.add_argument(
        "--device",
        choices=["cpu", "cuda"],
        default="cpu",
        help="Dispositivo usado pelo ONNX Runtime."
    )

    parser.add_argument(
        "--interval",
        type=float,
        default=0.5,
        help="Intervalo em segundos entre frames analisados."
    )

    args = parser.parse_args()

    try:
        result = predict_video_emotion(
            video_path=Path(args.video_path).resolve(),
            model_path=Path(args.model_path).resolve(),
            labels_path=Path(args.labels_path).resolve(),
            device=args.device,
            frame_interval_seconds=args.interval,
        )

        print(
            json.dumps(
                result,
                ensure_ascii=False
            )
        )
    except Exception as error:
        print(
            json.dumps(
                {
                    "error": str(error)
                },
                ensure_ascii=False
            )
        )

        sys.exit(1)


if __name__ == "__main__":
    main()