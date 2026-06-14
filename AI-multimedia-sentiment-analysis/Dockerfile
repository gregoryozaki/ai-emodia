FROM node:22-bookworm-slim

ENV NODE_ENV=production
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=1
ENV PATH="/opt/conda/bin:${PATH}"

RUN apt-get update 
&& apt-get install -y --no-install-recommends 
ca-certificates 
curl 
bzip2 
ffmpeg 
libgl1 
libglib2.0-0 
&& rm -rf /var/lib/apt/lists/*

RUN curl -fsSL 
https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh 
-o /tmp/miniconda.sh 
&& bash /tmp/miniconda.sh -b -p /opt/conda 
&& rm /tmp/miniconda.sh 
&& conda clean --all --yes

RUN conda create 
--yes 
--name emodia-ml 
python=3.11 
pip 
&& conda clean --all --yes

WORKDIR /app

COPY ml/requirements.txt /app/ml/requirements.txt

RUN conda run 
--no-capture-output 
--name emodia-ml 
pip install 
--no-cache-dir 
--index-url https://download.pytorch.org/whl/cpu 
torch

RUN conda run 
--no-capture-output 
--name emodia-ml 
pip install 
--no-cache-dir 
-r /app/ml/requirements.txt

COPY ml /app/ml

COPY web-app/package.json web-app/package-lock.json /app/web-app/

WORKDIR /app/web-app

RUN npm ci --include=dev

COPY web-app /app/web-app

RUN npx prisma generate 
&& npx sass public/scss/main.scss public/css/main.css --no-source-map 
&& npm run build 
&& mkdir -p build/generated 
&& cp -R src/generated/prisma build/generated/

EXPOSE 8080

CMD ["npm", "run", "start:prod"]
