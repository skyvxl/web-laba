# --- ЭТАП 1: СБОРКА (Builder) ---
FROM node:22 AS build

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build:prod

# --- ЭТАП 2: ИСПОЛНЕНИЕ (Runner) ---
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev

COPY --from=build /app/dist ./dist

ENV PORT=4000

EXPOSE $PORT

CMD [ "node", "dist/laba/server/server.mjs" ]
