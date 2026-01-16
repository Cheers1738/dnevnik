FROM node:20-bookworm-slim AS base
WORKDIR /app

COPY package.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN npm install

COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/web apps/web

RUN npm run build --workspace packages/shared && npm run build --workspace apps/web

FROM node:20-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production

COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/apps/web/.next ./apps/web/.next
COPY --from=base /app/apps/web/package.json ./apps/web/package.json
COPY --from=base /app/apps/web/public ./apps/web/public
COPY --from=base /app/apps/web/next.config.js ./apps/web/next.config.js
COPY --from=base /app/packages/shared ./packages/shared

WORKDIR /app/apps/web
EXPOSE 3000
CMD ["npm", "run", "start"]
