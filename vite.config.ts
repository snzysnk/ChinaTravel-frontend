/**
 * Vite 构建与开发服务器配置。
 *
 * 配置三件事：Vue 插件、Element Plus 的按需加载插件，以及开发期的 /api 转发。
 *
 * **本文件的分区约定**：下面三个常量区（后端端口 / 前端端口 / Element Plus 按需加载）
 * 互不相关，改动其中一区不得触碰另一区的取值。特别是 `BACKEND_PORT` 是后端监听端口的
 * 唯一前端引用点，历史变更 `frontend-stack-and-toolchain` 已规定的
 * 「前端源码不得声明后端端口」约束依赖它保持唯一。
 */

import { fileURLToPath, URL } from 'node:url'

import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
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

/**
 * Element Plus 按需加载的自动生成物目录。
 *
 * 两个插件各自产出一个声明文件：组件解析器产出组件类型，自动导入产出 API 类型。
 * 二者都被 `tsconfig.json` 的 `include`（`src/**\/*.d.ts`）覆盖，因此
 * 「模板里直接写组件标签、脚本里直接写函数名」不会触发 vue-tsc 的「找不到名称」错误。
 *
 * 放在 `src/` 下而非仓库根，是为了让类型声明的可见范围与源码一致——生成物在源码目录内，
 * 阅读时更容易发现「这里的组件是自动引入的」。
 */
const AUTO_IMPORT_DTS = 'src/auto-imports.d.ts'
const COMPONENTS_DTS = 'src/components.d.ts'

export default defineConfig({
  plugins: [
    vue(),

    // Element Plus 按需加载：解析模板中用到的组件，只把实际使用的组件与其样式纳入产物。
    // 不使用全量注册（app.use(ElementPlus)）——那会把全部组件与样式打进产物，
    // 而本项目实际用量远小于组件库规模（见 design.md 决策 2）。
    AutoImport({
      // 当前不自动导入任何第三方 API，只保留 Vue 自身的组合式 API，
      // 避免「函数凭空出现」——那会削弱「错误暴露在阅读层面」这一项目首要指标。
      imports: ['vue'],
      resolvers: [ElementPlusResolver()],
      dts: AUTO_IMPORT_DTS,
    }),
    Components({
      resolvers: [ElementPlusResolver()],
      dts: COMPONENTS_DTS,
    }),
  ],
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
