# StayHub — single service: Express serves the API + the built React SPA.
FROM node:20-bookworm-slim

WORKDIR /app

# Install dependencies first (better layer caching). The client needs its
# devDependencies (Vite) for the production build.
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/
RUN npm ci --prefix server && npm ci --include=dev --prefix client

# Copy the source and build the frontend into client/dist.
COPY . .
RUN npm run build --prefix client

ENV NODE_ENV=production

# The server listens on process.env.PORT (Railway injects it) and serves both
# /api and client/dist.
CMD ["npm", "start", "--prefix", "server"]
