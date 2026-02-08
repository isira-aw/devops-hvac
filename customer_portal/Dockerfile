# syntax=docker/dockerfile:1
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies (BuildKit cache mount keeps npm cache across builds)
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# Copy source files
COPY . .

# Build arguments for environment variables
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application (cache .next/cache across builds for faster rebuilds)
RUN --mount=type=cache,target=/app/.next/cache \
    npm run build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Add non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -u 1001 -S nextjs -G nodejs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Set correct permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=10 \
    CMD node -e "const http = require('http'); const req = http.request({hostname:'localhost',port:3000,path:'/',method:'GET',timeout:5000}, res => { process.exit(res.statusCode === 200 ? 0 : 1) }); req.on('error', () => process.exit(1)); req.end();"

CMD ["node", "server.js"]
