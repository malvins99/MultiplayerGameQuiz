# Use Node.js 18 LTS
FROM node:18-alpine

# Set working directory to server
WORKDIR /app/server

# Copy server package files first for better Docker layer caching
COPY server/package*.json ./

# Install all dependencies (including devDependencies for TypeScript build)
RUN npm ci

# Copy the rest of server files
COPY server/ ./

# Build the server (compiles TypeScript and copies maps)
RUN npm run build

# Expose port (Railway will set PORT env variable)
EXPOSE 2567

# Start the server
CMD ["npm", "start"]

