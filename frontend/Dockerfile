# Stage 1: Build the React application
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# ARG to pass build-time environment variables
ARG VITE_AMAP_API_KEY
ARG VITE_AMAP_SECURITY_KEY

# Set the environment variables for the build process
ENV VITE_AMAP_API_KEY=$VITE_AMAP_API_KEY
ENV VITE_AMAP_SECURITY_KEY=$VITE_AMAP_SECURITY_KEY

RUN npm run build

# Stage 2: Serve the static files with Nginx
FROM nginx:stable-alpine

# Copy the built files from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy the Nginx configuration file
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
