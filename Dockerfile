# Stage 1: Build Client
FROM node:18-alpine AS client-builder

WORKDIR /app/client
# Copy client package files
COPY client/package*.json ./
# Install dependencies
RUN npm ci
# Copy client source code
COPY client/ ./
# Build the client (vite.config.ts outputs to ../server/public)
RUN npm run build

# Stage 2: Build and Run Server
FROM node:18-alpine

WORKDIR /app/server

# Copy server package files first for better Docker layer caching
COPY server/package*.json ./

# Install all dependencies (including devDependencies for TypeScript build)
RUN npm ci

# Copy server source code and config
COPY server/src ./src
COPY server/tsconfig.json ./

# Copy compiled client files from the client-builder stage
COPY --from=client-builder /app/server/public ./public

# Verify public directory exists before build
RUN echo "Checking public directory before build..." && \
    ls -la public/ | head -5 && \
    test -f public/index.html && echo "✓ index.html found" || echo "✗ index.html NOT found!"

# Build the server (compiles TypeScript)
RUN npm run build

# Verify public directory and index.html exist after build
RUN echo "Verifying public files after build..." && \
    ls -la public/ | head -5 && \
    test -f public/index.html && \
    echo "✓ index.html found successfully" || \
    (echo "✗ ERROR: index.html not found!" && ls -la . && exit 1)

# Expose port (Railway will set PORT env variable)
EXPOSE 2567

# Start the server
CMD ["npm", "start"]
