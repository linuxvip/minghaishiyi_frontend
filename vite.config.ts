
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // 这里的 VITE_API_KEY 是从你主机的环境变量中读取的
    'process.env.API_KEY': JSON.stringify(process.env.VITE_API_KEY)
  },
  server: {
    proxy: {
      // 代理配置：当请求以 /api 开头时，转发到 Python 后端
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    emptyOutDir: true
  }
});
