# TrustBridge Backend Dockerfile
FROM node:20-alpine AS runner

WORKDIR /app

# Install build dependencies if needed
RUN apk add --no-cache libc6-compat

# Copy package files
COPY package*.json ./

# Install dependencies (production only)
RUN npm ci --only=production

# Copy application files
COPY . .

# Ensure upload directories exist
RUN mkdir -p uploads/student-faces uploads/student-ids uploads/logos uploads/documents

# Expose backend port
EXPOSE 5001

ENV NODE_ENV=production
ENV PORT=5001

CMD ["node", "src/index.js"]
