FROM node:22.11.0-bookworm-slim@sha256:4b6c8f1a2e3d5c7b9a0f1e2d3c4b5a69788766554433221100ffeeddccbbaa99
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile --prod
COPY src ./src
USER node
CMD ["node", "src/server.js"]
