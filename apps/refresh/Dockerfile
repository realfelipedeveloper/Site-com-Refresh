FROM node:20-alpine AS base
WORKDIR /app
COPY package.json tsconfig.base.json ./
COPY packages ./packages
COPY apps/refresh ./apps/refresh
RUN npm install
RUN npm run build -w @abbatech/refresh

FROM node:20-alpine
WORKDIR /app
COPY --from=base /app /app
EXPOSE 3000
CMD ["npm", "run", "start", "-w", "@abbatech/refresh"]

