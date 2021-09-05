FROM node:slim

WORKDIR /app

COPY / /app/

RUN npm i -g pnpm
RUN pnpm install

CMD [ "pnpm", "start" ]
