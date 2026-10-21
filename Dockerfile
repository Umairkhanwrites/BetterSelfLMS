FROM node:20-alpine

# Install libc6-compat for Next.js Alpine optimization
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Set production environment defaults
ENV NODE_ENV=production
ENV PORT=3000
ENV BACKEND_PORT=5000
ENV NEXT_PUBLIC_API_URL=/api

# Copy package manifests
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install dependencies for both backend and frontend
RUN cd backend && npm install --production=false
RUN cd frontend && npm install --production=false

# Copy application sources
COPY backend ./backend
COPY frontend ./frontend
COPY start-production.js ./

# Build Next.js optimized production bundle
RUN cd frontend && npm run build

# Expose CapRover container HTTP port
EXPOSE 3000

# Start unified backend & frontend supervisor
CMD ["node", "start-production.js"]
