# ============================================
# Stage 1: Build the Ionic Angular app
# ============================================
FROM node:22-alpine AS build

WORKDIR /app

# Prevent Node heap out-of-memory errors during production bundling
ENV NODE_OPTIONS="--max-old-space-size=4096"
# Disable Angular CLI analytics prompt in CI/CD
ENV NG_CLI_ANALYTICS=false

# Copy dependency files first for layer caching
COPY package*.json ./

# Install dependencies (reproducible build)
RUN npm ci --legacy-peer-deps

# Copy the rest of the application code
COPY . .

# Build for production
RUN npm run build -- --configuration production

# ============================================
# Stage 2: Serve with Nginx
# ============================================
FROM nginx:alpine AS production

# Set working directory
WORKDIR /usr/share/nginx/html

# Clean default assets and copy build output
RUN rm -rf ./*
# NOTE: Modern Angular/Ionic builds may output to /app/dist/<project-name>/browser or /app/www
# Adjust '/app/www' below if your angular.json specifies a different outputPath
COPY --from=build /app/www ./

# Copy custom Nginx configuration for SPA routing & caching
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose standard HTTP port
EXPOSE 80

# Health check to ensure Nginx is actively responding
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1/ || exit 1

# Start Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]