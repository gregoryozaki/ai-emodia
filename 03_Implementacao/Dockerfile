FROM node:22-bookworm-slim

ENV NODE_ENV=production
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=1
ENV PATH="/opt/conda/bin:${PATH}"

RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl bzip2 ffmpeg libgl1 libglib2.0-0 git git-lfs && rm -rf /var/lib/apt/lists/*

RUN git lfs install --system

RUN curl -fsSL https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh -o /tmp/miniconda.sh && bash /tmp/miniconda.sh -b -p /opt/conda && rm /tmp/miniconda.sh && conda clean --all --yes

RUN conda tos accept --override-channels --channel https://repo.anaconda.com/pkgs/main && conda tos accept --override-channels --channel https://repo.anaconda.com/pkgs/r && conda create --yes --name emodia-ml python=3.11 pip && conda clean --all --yes

WORKDIR /app

RUN conda run --no-capture-output -n emodia-ml pip install --no-cache-dir --index-url https://download.pytorch.org/whl/cpu torch

RUN conda run --no-capture-output -n emodia-ml pip install --no-cache-dir faster-whisper transformers safetensors onnxruntime opencv-python-headless numpy

COPY ml /app/ml

RUN GIT_LFS_SKIP_SMUDGE=1 git clone --depth 1 --branch main https://github.com/gregoryozaki/ai-emodia.git /tmp/ai-emodia && cd /tmp/ai-emodia && git lfs pull --include="AI-multimedia-sentiment-analysis/ml/models/nlp/bertimbau/model.safetensors,AI-multimedia-sentiment-analysis/ml/models/cv/convnexttiny_rafdb_v4/convnexttiny_rafdb_facecrop.onnx,AI-multimedia-sentiment-analysis/ml/models/cv/convnexttiny_rafdb_v4/convnexttiny_rafdb_facecrop.onnx.data" --exclude="" && cp AI-multimedia-sentiment-analysis/ml/models/nlp/bertimbau/model.safetensors /app/ml/models/nlp/bertimbau/model.safetensors && cp AI-multimedia-sentiment-analysis/ml/models/cv/convnexttiny_rafdb_v4/convnexttiny_rafdb_facecrop.onnx /app/ml/models/cv/convnexttiny_rafdb_v4/convnexttiny_rafdb_facecrop.onnx && cp AI-multimedia-sentiment-analysis/ml/models/cv/convnexttiny_rafdb_v4/convnexttiny_rafdb_facecrop.onnx.data /app/ml/models/cv/convnexttiny_rafdb_v4/convnexttiny_rafdb_facecrop.onnx.data && rm -rf /tmp/ai-emodia

RUN test "$(stat -c%s /app/ml/models/nlp/bertimbau/model.safetensors)" -gt 100000000 && test "$(stat -c%s /app/ml/models/cv/convnexttiny_rafdb_v4/convnexttiny_rafdb_facecrop.onnx)" -gt 100000 && test "$(stat -c%s /app/ml/models/cv/convnexttiny_rafdb_v4/convnexttiny_rafdb_facecrop.onnx.data)" -gt 100000000

RUN conda run --no-capture-output -n emodia-ml python -c "from faster_whisper import WhisperModel; WhisperModel('small', device='cpu', compute_type='int8')"

COPY web-app/package.json web-app/package-lock.json /app/web-app/

WORKDIR /app/web-app

RUN npm ci --include=dev

COPY web-app /app/web-app

RUN DATABASE_URL="postgresql://usuario:senha@localhost:5432/emodia" npx prisma generate && npx sass public/scss/main.scss public/css/main.css --no-source-map && npm run build && mkdir -p build/generated && cp -R src/generated/prisma build/generated/

EXPOSE 8080

CMD ["npm", "run", "start:prod"]
