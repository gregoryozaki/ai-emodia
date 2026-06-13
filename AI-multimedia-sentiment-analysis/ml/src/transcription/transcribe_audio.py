import argparse
import json
import sys
from pathlib import Path

from faster_whisper import WhisperModel


def load_model(model_size: str, device_preference: str):
    attempts = []

    if device_preference == "cuda":
        attempts = [("cuda", "float16"), ("cpu", "int8")]
    elif device_preference == "cpu":
        attempts = [("cpu", "int8")]
    else:
        attempts = [("cuda", "float16"), ("cpu", "int8")]

    last_error = None

    for device, compute_type in attempts:
        try:
            print(
                f"[emodia-transcription] carregando modelo={model_size} "
                f"device={device} compute_type={compute_type}",
                file=sys.stderr,
            )

            model = WhisperModel(
                model_size,
                device=device,
                compute_type=compute_type,
            )

            return model, device
        except Exception as error:
            last_error = error
            print(
                f"[emodia-transcription] falhou em device={device}: {error}",
                file=sys.stderr,
            )

    raise RuntimeError(
        f"Não foi possível carregar o modelo. Último erro: {last_error}"
    )


def transcribe_audio(audio_path: Path, model_size: str, device: str):
    if not audio_path.exists():
        raise FileNotFoundError(f"Arquivo não encontrado: {audio_path}")

    model, used_device = load_model(model_size, device)

    segments, info = model.transcribe(
    str(audio_path),
    language="pt",
    task="transcribe",
    vad_filter=True,
    vad_parameters={
        "min_silence_duration_ms": 500,
        "speech_pad_ms": 300,
    },
    beam_size=5,
    best_of=5,
    temperature=0,
    condition_on_previous_text=True,
    initial_prompt=(
        "Este é um relato emocional em português brasileiro. "
        "Transcreva com pontuação natural, mantendo o sentido da fala."
    ),
)

    transcript_parts = []

    for segment in segments:
        text = segment.text.strip()

        if text:
            transcript_parts.append(text)

    transcript = " ".join(transcript_parts).strip()

    return {
        "transcript": transcript,
        "language": info.language,
        "language_probability": info.language_probability,
        "duration": info.duration,
        "device": used_device,
        "model": model_size,
    }


def main():
    parser = argparse.ArgumentParser(description="Transcreve áudio para o Emodia.")
    parser.add_argument("audio_path", help="Caminho do arquivo de áudio.")
    parser.add_argument("--model", default="base", help="Modelo Whisper: tiny, base, small.")
    parser.add_argument("--device", default="auto", help="auto, cuda ou cpu.")

    args = parser.parse_args()

    try:
        result = transcribe_audio(
            audio_path=Path(args.audio_path),
            model_size=args.model,
            device=args.device,
        )

        print(json.dumps(result, ensure_ascii=False))
    except Exception as error:
        print(
            json.dumps(
                {
                    "error": str(error)
                },
                ensure_ascii=False,
            )
        )
        sys.exit(1)


if __name__ == "__main__":
    main()