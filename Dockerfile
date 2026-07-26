# StayHub — single service: Express serves the API + the built React SPA.
FROM node:20-bookworm-slim

WORKDIR /app

# Copy the source (node_modules / dist excluded via .dockerignore).
COPY . .

# Install server deps, then client deps (incl. devDeps for Vite) and build.
RUN cd server && npm ci
RUN cd client && npm ci --include=dev && npm run build

ENV NODE_ENV=production

# The server listens on process.env.PORT (Railway injects it) and serves both
# /api and client/dist.
CMD ["node", "server/src/index.js"]
