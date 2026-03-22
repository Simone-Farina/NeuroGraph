FROM node:20.20.0-bookworm-slim AS base

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm install -g npm@11

COPY package.json package-lock.json ./

FROM base AS deps

RUN npm ci

FROM deps AS dev

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0", "--port", "3000"]
