# StayHub — single service. The client is built locally into client/dist and
# shipped as-is; this image only installs the server and serves /api + the SPA.
FROM node:20-bookworm-slim

WORKDIR /app

# Copy source incl. the pre-built client/dist (node_modules excluded).
COPY . .

# Install server runtime deps only.
RUN cd server && npm install --omit=dev

ENV NODE_ENV=production

# Server listens on process.env.PORT (Railway injects it) and serves /api +
# client/dist.
CMD ["node", "server/src/index.js"]
