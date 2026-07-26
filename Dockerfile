# StayHub — single service: Express serves the API + the built React SPA.
FROM node:20-bookworm-slim

WORKDIR /app

# Copy the source (node_modules / dist excluded via .dockerignore).
COPY . .

# Install deps and build the client. `npm install` (not `npm ci`) so the build
# works even if package-lock.json is absent from the upload context.
RUN cd server && npm install --omit=dev
RUN cd client && npm install && npm run build

ENV NODE_ENV=production

# The server listens on process.env.PORT (Railway injects it) and serves both
# /api and client/dist.
CMD ["node", "server/src/index.js"]
