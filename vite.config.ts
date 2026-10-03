/**
 * Vite 构建与开发服务器配置。
 *
 * 只配置两件事：Vue 插件，以及开发期的 /api 转发。
 */

import { fileURLToPath, URL } from 'node:url'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

/**
 * 后端监听端口。
 *
 * **权威来源**是后端仓库的 `backend/configs/config.yaml` 中的 `server.port`，
 * 该文件当前取值为 18080。这里的取值必须与之一致——它不再是「前端自己记一个端口」，
 * 而是「转发目标指向权威来源」，因此整个前端源码中只此一处出现该取值。
 *
 * 后端端口变更时，需要同步的位置共两处：本常量，以及 workspace 仓库 Makefile 的
 * BACKEND_PORT 提示值（后者仅用于提示，不参与真实监听）。
 */
const BACKEND_PORT = 18080

/**
 * 前端开发服务器端口。
 *
 * 5174 是本项目前端**唯一**的端口：旧版零构建静态页面的 5173 已随本次工程化退役。
 * 该取值必须同时出现在后端 `configs/config.yaml` 的 `cors.allow_origins` 中，
 * 否则以本端口直连后端时会被拦截（开发期经 /api 转发时是同源请求，不触发跨域校验，
 * 但直连路径与生产环境的跨域部署仍需白名单正确）。
 */
const DEV_SERVER_PORT = 5174

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      // '@' 指向源码根，使跨目录引用（如页面引用接口层）不依赖相对层级深度。
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: DEV_SERVER_PORT,
    strictPort: true,
    proxy: {
      // 前端以相对路径 /api/... 发起请求，由开发服务器转发到后端。
      // 这样前端源码中不出现后端端口，端口漂移的触发点收敛到本文件一处；
      // 生产环境由反向代理承担同样的职责，因此前端产物无需按环境切换地址。
      '/api': {
        target: `http://localhost:${BACKEND_PORT}`,
        changeOrigin: true,
      },
    },
  },
})
