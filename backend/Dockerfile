# -------------------------------------------------------------
# Stage 1: Build NestJS Application
# -------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install dependencies (including devDependencies needed for build)
RUN npm install

# Copy source code and build config
COPY nest-cli.json tsconfig*.json ./
COPY src/ ./src/

# Compile TypeScript to JavaScript in /dist
RUN npm run build

# -------------------------------------------------------------
# Stage 2: Production Runner Image
# -------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Copy package and production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy compiled dist from builder
COPY --from=builder /app/dist ./dist

EXPOSE 4000

CMD ["node", "dist/main.js"]
