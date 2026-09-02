# Stage 1: Build
FROM node:18-alpine AS build

WORKDIR /app

# Prevent Node from overrunning VPS memory
ENV NODE_OPTIONS="--max-old-space-size=1536"

# Leverage Docker cache for dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy application source
COPY . .

# Build for production
RUN npm run build -- --configuration production

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Remove default Nginx config and copy custom one
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build artifacts (Ensure this matches outputPath in angular.json)
COPY --from=build /app/dist/ngo/browser /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]