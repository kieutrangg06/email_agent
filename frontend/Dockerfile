# -------------------------------------------------------------
# Stage 1: Build Next.js Application
# -------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code and config
COPY . .
RUN mkdir -p public

# Build Next.js for production
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# -------------------------------------------------------------
# Stage 2: Production Runner Image
# -------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

# Copy production files
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["npm", "start"]
