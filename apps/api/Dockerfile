FROM node:20-slim AS base
WORKDIR /app

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/contracts/package.json ./packages/contracts/package.json
COPY apps/api/package.json ./apps/api/package.json

RUN npm ci

COPY packages ./packages
COPY apps/api ./apps/api
COPY scripts ./scripts

RUN npm run prisma:generate -w @abbatech/api
RUN npm run build -w @abbatech/api

FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY --from=base /app /app

EXPOSE 3333

CMD ["sh", "-c", "node scripts/guard-production-config.mjs && npm run prisma:generate -w @abbatech/api && node scripts/guard-database-preflight.mjs && node scripts/guard-database-bootstrap.mjs && npm run prisma:migrate -w @abbatech/api && npm run prisma:status -w @abbatech/api && node scripts/guard-database-identity.mjs && npm run prisma:seed -w @abbatech/api && node scripts/guard-domain-data-integrity.mjs && node apps/api/dist/src/main.js"]
