FROM node:slim

WORKDIR /app

COPY / /app/

RUN apt-get update
RUN apt-get install curl unzip ffmpeg -y
RUN curl -fsSL https://deno.land/x/install/install.sh | sh
ENV DENO_PATH="/root/.deno/bin/deno"

RUN npm i -g pnpm
RUN pnpm install

CMD [ "pnpm", "start" ]
