FROM node:20-bookworm-slim AS base
WORKDIR /app

COPY package.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN npm install

COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/api apps/api

RUN npm run build --workspace packages/shared && npm run build --workspace apps/api

FROM node:20-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production

COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/apps/api/dist ./apps/api/dist
COPY --from=base /app/apps/api/package.json ./apps/api/package.json
COPY --from=base /app/packages/shared ./packages/shared

WORKDIR /app/apps/api
CMD ["node", "dist/server.js"]
