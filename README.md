# 命海拾遗

八字命理排盘与命例分析应用。支持公历/农历/手动输入排盘、命例库浏览、万年黄历查询。

## 功能

- **排盘** — 输入出生年月日时及性别，自动计算八字四柱、十神、藏干、纳音、大运流年。支持公历、农历、手动输入干支三种方式，以及真太阳时校正
- **命例库** — 浏览检索历史命例，支持按性别、四柱干支筛选，点击即可查看完整排盘
- **黄历** — 万年黄历查询
- **作者信息** — 关于页面

## 技术栈

| 层面 | 技术 |
|------|------|
| 框架 | React 19 + TypeScript |
| 构建 | Vite 5 |
| 样式 | Tailwind CSS |
| 阴阳历转换 | lunar-typescript |
| 图标 | lucide-react |
| 部署 | Docker + Nginx |

## 本地运行

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

开发服务器默认运行在 `http://localhost:5173`，API 请求通过 Vite 代理转发至后端。

## Docker 部署

```bash
docker-compose up -d
```

构建多阶段镜像（Node 构建 → Nginx 运行），对外暴露 80 端口。
