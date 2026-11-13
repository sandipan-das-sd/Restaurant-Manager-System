FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/server/package.json apps/server/
COPY apps/web/package.json apps/web/
COPY apps/mobile/package.json apps/mobile/
RUN npm ci
COPY . .
RUN npm run build -w @dhabar/server

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY apps/server/package.json apps/server/
COPY apps/web/package.json apps/web/
COPY apps/mobile/package.json apps/mobile/
RUN npm ci --omit=dev
COPY --from=build /app/apps/server/dist apps/server/dist
COPY apps/server/sql apps/server/sql
EXPOSE 4000
CMD ["node", "apps/server/dist/index.js"]
