/**
 * 应用入口：创建 Vue 应用并挂载到 index.html 的 #app 上。
 * 全局样式在此引入，保证无论从哪个页面进入样式都已加载。
 */

import { createApp } from 'vue'

import App from './App.vue'
import './assets/main.css'

createApp(App).mount('#app')
