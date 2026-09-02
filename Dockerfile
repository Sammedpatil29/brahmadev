# Stage 1: Build
FROM node:22-alpine AS build

WORKDIR /app

# Prevent Node heap out-of-memory errors on small VPS instances
ENV NODE_OPTIONS="--max-old-space-size=1536"

# Cache dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy application code
COPY . .

# Build for production
RUN npm run build -- --configuration production

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Remove default Nginx config and copy custom one
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build output (verify if your project outputs to dist/ngo/browser, dist/ngo, or www)
COPY --from=build /app/dist/ngo/browser /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
