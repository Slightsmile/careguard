FROM node:22-alpine AS base
WORKDIR /app

COPY package.json ./
COPY apps/backend/package.json apps/backend/package.json
RUN npm install --workspace=apps/backend

COPY apps/backend apps/backend
RUN npm run build --workspace=apps/backend
RUN npx prisma generate --schema=apps/backend/prisma/schema.prisma

EXPOSE 4000
CMD ["node", "apps/backend/dist/server.js"]
