# Sử dụng base image Node.js LTS chính thức (slim version để tương thích tốt với bcrypt và tối ưu hóa kích thước)
FROM node:20-slim

# Thiết lập thư mục làm việc trong container
WORKDIR /usr/src/app

# Sao chép package.json và package-lock.json để tận dụng Docker cache
COPY package*.json ./

# Cài đặt dependencies (bỏ qua devDependencies để tối ưu hóa dung lượng image)
RUN npm install --omit=dev

# Sao chép toàn bộ mã nguồn backend vào container
COPY . .

# Khai báo cổng lắng nghe
EXPOSE 5000

# Khai báo các biến môi trường mặc định
ENV PORT=5000
ENV NODE_ENV=production

# Lệnh khởi chạy server
CMD ["node", "src/server.js"]
