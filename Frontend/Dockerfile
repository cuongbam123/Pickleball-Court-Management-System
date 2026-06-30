# Stage 1: Build React/Vite App
FROM node:20-alpine AS build

WORKDIR /app

# Sao chép package.json và package-lock.json để cài đặt dependencies
COPY package*.json ./
RUN npm install

# Sao chép mã nguồn Frontend và tiến hành build
COPY . .
ENV VITE_API_URL=http://localhost:5000
RUN npm run build

# Stage 2: Serve static files using Nginx
FROM nginx:alpine

# Sao chép kết quả build từ stage trước vào thư mục public của Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Cấu hình Nginx để hỗ trợ SPA Routing (nếu người dùng reload trang không bị 404)
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
