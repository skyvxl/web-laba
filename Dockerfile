# --- ЭТАП 1: СБОРКА (Builder) ---
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm i

COPY . .

RUN npm run build:prod

# --- ЭТАП 2: ИСПОЛНЕНИЕ (Runner) ---
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY --from=build /app/dist ./dist

ENV PORT=4000

EXPOSE $PORT

CMD [ "node", "dist/laba/server/server.mjs" ]
