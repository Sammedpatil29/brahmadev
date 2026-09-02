# Stage 1: Build
FROM node:22-alpine AS build
WORKDIR /app
COPY . .
RUN npm install --legacy-peer-deps
RUN npm run build --configuration=production

# Stage 2: Serve with Nginx
FROM nginx:alpine

# 1. Remove the default Nginx configuration file
RUN rm /etc/nginx/conf.d/default.conf

# 2. Copy your custom configuration file
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 3. Copy the Angular build files
# Double check if your path is /app/dist/ngo/browser or just /app/dist/ngo
COPY --from=build /app/dist/ngo/browser /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
