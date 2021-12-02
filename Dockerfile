FROM node:slim

WORKDIR /app

COPY / /app/

RUN apt-get update
RUN apt-get install curl unzip openjdk-17-jre -y
RUN curl -fsSL https://deno.land/x/install/install.sh | sh
ENV DENO_PATH="/root/.deno/bin/deno"

RUN npm i -g pnpm
RUN pnpm install --prod --frozen-lockfile

CMD [ "pnpm", "start" ]
