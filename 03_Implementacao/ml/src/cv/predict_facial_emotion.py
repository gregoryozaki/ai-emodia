import argparse
import json
import sys
from pathlib import Path

import cv2
import numpy as np
import onnxruntime as ort


DEFAULT_MODEL_PATH = (
    Path(__file__).resolve().parents[2]
    / "models"
    / "cv"
    / "convnexttiny_rafdb_v4"
    / "convnexttiny_rafdb_facecrop.onnx"
)

DEFAULT_LABELS_PATH = (
    Path(__file__).resolve().parents[2]
    / "models"
    / "cv"
    / "convnexttiny_rafdb_v4"
    / "labels.json"
)

WARNING_MESSAGE = (
    "Expressão facial aparente. Não é diagnóstico clínico "
    "e deve ser usada apenas como sinal complementar."
)


def load_labels(labels_path: Path) -> dict:
    if not labels_path.exists():
        raise FileNotFoundError(
            f"Arquivo de rótulos não encontrado: {labels_path}"
        )

    with labels_path.open("r", encoding="utf-8") as file:
        labels = json.load(file)

    class_names = labels.get("class_names")
    emotion_map = labels.get("facial_emotion_to_emodia")
    image_size = labels.get("image_size", 224)

    if not isinstance(class_names, list) or not class_names:
        raise ValueError(
            "O arquivo labels.json não contém uma lista class_names válida."
        )

    if not isinstance(emotion_map, dict):
        raise ValueError(
            "O arquivo labels.json não contém facial_emotion_to_emodia."
        )

    return {
        "class_names": class_names,
        "emotion_map": emotion_map,
        "image_size": int(image_size),
        "model_name": labels.get(
            "model",
            "convnexttiny_rafdb_facecrop"
        )
    }


def load_image(image_path: Path) -> np.ndarray:
    if not image_path.exists():
        raise FileNotFoundError(
            f"Imagem não encontrada: {image_path}"
        )

    image_bgr = cv2.imread(str(image_path))

    if image_bgr is None:
        raise ValueError(
            f"Não foi possível ler a imagem: {image_path}"
        )

    return image_bgr


def create_face_detector():
    cascade_path = (
        Path(cv2.data.haarcascades)
        / "haarcascade_frontalface_default.xml"
    )

    detector = cv2.CascadeClassifier(str(cascade_path))

    if detector.empty():
        raise RuntimeError(
            "Não foi possível carregar o detector facial do OpenCV."
        )

    return detector


def detect_largest_face(
    image_bgr: np.ndarray,
    detector
) -> tuple[np.ndarray, dict | None]:
    image_gray = cv2.cvtColor(
        image_bgr,
        cv2.COLOR_BGR2GRAY
    )

    faces = detector.detectMultiScale(
        image_gray,
        scaleFactor=1.1,
        minNeighbors=5,
        minSize=(40, 40)
    )

    if len(faces) == 0:
        return image_bgr, None

    x, y, width, height = max(
        faces,
        key=lambda face: int(face[2]) * int(face[3])
    )

    margin_x = int(width * 0.15)
    margin_y = int(height * 0.15)

    x_start = max(0, x - margin_x)
    y_start = max(0, y - margin_y)
    x_end = min(image_bgr.shape[1], x + width + margin_x)
    y_end = min(image_bgr.shape[0], y + height + margin_y)

    face_crop = image_bgr[
        y_start:y_end,
        x_start:x_end
    ]

    face_box = {
        "x": int(x_start),
        "y": int(y_start),
        "width": int(x_end - x_start),
        "height": int(y_end - y_start)
    }

    return face_crop, face_box


def preprocess_image(
    face_bgr: np.ndarray,
    image_size: int
) -> np.ndarray:
    resized = cv2.resize(
        face_bgr,
        (image_size, image_size),
        interpolation=cv2.INTER_AREA
    )

    image_rgb = cv2.cvtColor(
        resized,
        cv2.COLOR_BGR2RGB
    )

    image = image_rgb.astype(np.float32) / 255.0

    mean = np.array(
        [0.485, 0.456, 0.406],
        dtype=np.float32
    )

    std = np.array(
        [0.229, 0.224, 0.225],
        dtype=np.float32
    )

    image = (image - mean) / std

    image = np.transpose(
        image,
        (2, 0, 1)
    )

    image = np.expand_dims(
        image,
        axis=0
    )

    return np.ascontiguousarray(
        image,
        dtype=np.float32
    )


def get_execution_providers(device: str) -> list[str]:
    available_providers = (
        ort.get_available_providers()
    )

    if (
        device == "cuda"
        and "CUDAExecutionProvider" in available_providers
    ):
        return [
            "CUDAExecutionProvider",
            "CPUExecutionProvider"
        ]

    return ["CPUExecutionProvider"]


def create_session(
    model_path: Path,
    device: str
) -> ort.InferenceSession:
    if not model_path.exists():
        raise FileNotFoundError(
            f"Modelo ONNX não encontrado: {model_path}"
        )

    providers = get_execution_providers(device)

    return ort.InferenceSession(
        str(model_path),
        providers=providers
    )


def softmax(logits: np.ndarray) -> np.ndarray:
    logits = np.asarray(
        logits,
        dtype=np.float32
    ).reshape(-1)

    shifted = logits - np.max(logits)
    exponentials = np.exp(shifted)

    denominator = np.sum(exponentials)

    if denominator <= 0:
        raise ValueError(
            "Não foi possível calcular as probabilidades."
        )

    return exponentials / denominator


def confidence_level(
    confidence: float,
    top_gap: float
) -> str:
    if confidence >= 0.60 and top_gap >= 0.20:
        return "HIGH"

    if confidence >= 0.40 and top_gap >= 0.12:
        return "MEDIUM"

    return "LOW"


def predict_emotion(
    image_path: Path,
    model_path: Path,
    labels_path: Path,
    device: str
) -> dict:
    labels = load_labels(labels_path)

    class_names = labels["class_names"]
    emotion_map = labels["emotion_map"]
    image_size = labels["image_size"]

    image_bgr = load_image(image_path)

    detector = create_face_detector()

    face_crop, face_box = detect_largest_face(
        image_bgr,
        detector
    )

    input_tensor = preprocess_image(
        face_crop,
        image_size
    )

    session = create_session(
        model_path,
        device
    )

    model_input = session.get_inputs()[0]
    model_outputs = session.run(
        None,
        {
            model_input.name: input_tensor
        }
    )

    if not model_outputs:
        raise ValueError(
            "O modelo ONNX não retornou saída."
        )

    probabilities = softmax(
        model_outputs[0]
    )

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

    level = confidence_level(
        confidence,
        top_gap
    )

    emodia_emotion = emotion_map.get(
        emotion,
        "UNKNOWN"
    )

    providers = session.get_providers()

    return {
        "emotion": emotion,
        "emodiaEmotion": emodia_emotion,
        "confidence": float(confidence),
        "confidencePercent": round(
            float(confidence) * 100,
            2
        ),
        "confidenceLevel": level,
        "topGap": float(top_gap),
        "scores": scores,
        "faceDetected": face_box is not None,
        "faceBox": face_box,
        "model": labels["model_name"],
        "modelPath": str(model_path),
        "labelsPath": str(labels_path),
        "device": (
            "cuda"
            if "CUDAExecutionProvider" in providers
            else "cpu"
        ),
        "input": str(image_path),
        "interpretation": (
            "Resultado visual com baixa confiança. "
            "Use apenas como sinal complementar."
            if level == "LOW"
            else "Resultado visual complementar."
        ),
        "warning": WARNING_MESSAGE
    }


def main():
    parser = argparse.ArgumentParser(
        description=(
            "Predição de expressão facial aparente "
            "com ConvNeXtTiny RAF-DB V4."
        )
    )

    parser.add_argument(
        "image_path",
        help="Caminho da imagem para análise."
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

    args = parser.parse_args()

    try:
        result = predict_emotion(
            image_path=Path(args.image_path).resolve(),
            model_path=Path(args.model_path).resolve(),
            labels_path=Path(args.labels_path).resolve(),
            device=args.device
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