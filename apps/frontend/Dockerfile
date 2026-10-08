FROM node:22-alpine AS base
WORKDIR /app

COPY package.json ./
COPY apps/frontend/package.json apps/frontend/package.json
RUN npm install --workspace=apps/frontend

COPY apps/frontend apps/frontend
RUN npm run build --workspace=apps/frontend

EXPOSE 3000
CMD ["npm", "run", "start", "--workspace=apps/frontend"]
