# =========================
# 1️⃣ 构建阶段
# =========================
FROM docker.m.daocloud.io/library/node:20-alpine AS build

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json，先安装依赖
COPY package.json package-lock.json ./

# 安装依赖（使用淘宝/阿里源加速 npm 安装速度）
RUN npm config set registry https://registry.npmmirror.com \
 && npm install

# 复制整个项目
COPY . .

# 打包生产环境文件
RUN npm run build

# =========================
# 2️⃣ 运行阶段（Nginx）
# =========================
FROM docker.m.daocloud.io/library/nginx:stable-alpine

# 删除默认 nginx 静态文件
RUN rm -rf /usr/share/nginx/html/*

# 复制构建产物到 nginx html 目录
COPY --from=build /app/dist /usr/share/nginx/html

# 复制自定义 nginx 配置（可选）
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]

