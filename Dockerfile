# ─── Stage 1: Build Client ────────────────────────────────────────
FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package.json client/package-lock.json* ./
RUN npm install
COPY client/ ./
RUN npm run build

# ─── Stage 2: Build Server ────────────────────────────────────────
FROM node:20-alpine AS server-build
WORKDIR /app/server
COPY server/package.json server/package-lock.json* ./
RUN npm install
COPY server/ ./
RUN npx prisma generate
RUN npx tsc

# ─── Stage 3: Production ──────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

# Copy server
COPY --from=server-build /app/server/dist ./dist
COPY --from=server-build /app/server/node_modules ./node_modules
COPY --from=server-build /app/server/prisma ./prisma
COPY --from=server-build /app/server/package.json ./

# Copy client build
COPY --from=client-build /app/client/dist ./client/dist

# Generate Prisma client in production
RUN npx prisma generate

# Set environment
ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

# Push schema and start
CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/src/index.js"]
