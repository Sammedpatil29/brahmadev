# ============================================
# Stage 1: Build the Ionic Angular app
# ============================================
FROM node:22-alpine AS build

WORKDIR /app

# Copy dependency files first for better layer caching
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy the rest of the source code
COPY . .

# Build the production app (output goes to /app/www)
RUN npm run build -- --configuration production

# ============================================
# Stage 2: Serve with Nginx
# ============================================
FROM nginx:alpine AS production

# Remove default nginx static content
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from build stage
COPY --from=build /app/www /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

