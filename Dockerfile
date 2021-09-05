FROM node:slim

RUN npm i -g pnpm
RUN pnpm install

CMD [ "pnpm", "start" ]
