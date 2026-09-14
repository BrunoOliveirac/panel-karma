# Stage 1: Dependencies and Build
FROM node:22-alpine AS builder
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the files and build the app
COPY . .
RUN npm run build

# Stage 2: Execution in Production
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy only the necessary from the back stage
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]