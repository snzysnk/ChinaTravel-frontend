/**
 * 应用入口：创建 Vue 应用并挂载到 index.html 的 #app 上。
 * 全局样式在此引入，保证无论从哪个页面进入样式都已加载。
 *
 * 组件库的按需引入由 `vite.config.ts` 的两个 unplugin 插件负责，此处不注册任何组件；
 * 中文语言包在 `App.vue` 中以 `el-config-provider` 包裹根组件的方式生效。
 * 两者都不在这里，是因为入口一旦 `app.use(ElementPlus)` 就会把组件库全部组件
 * 注册进产物（实测 JS 66 kB → 1.03 MB），详见 App.vue 的说明。
 */

import { createApp } from 'vue'

import App from './App.vue'
import './assets/main.css'
import './assets/theme.css'

createApp(App).mount('#app')
