# Use Node.js 18 LTS
FROM node:18-alpine

# Set working directory to server
WORKDIR /app/server

# Copy server package files first for better Docker layer caching
COPY server/package*.json ./

# Install all dependencies (including devDependencies for TypeScript build)
RUN npm ci

# Copy server source code, config, and public files
COPY server/src ./src
COPY server/tsconfig.json ./
COPY server/public ./public

# Verify public directory exists before build
RUN echo "Checking public directory before build..." && \
    ls -la public/ | head -5 && \
    test -f public/index.html && echo "✓ index.html found" || echo "✗ index.html NOT found!"

# Build the server (compiles TypeScript and copies maps)
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

