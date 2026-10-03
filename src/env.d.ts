/// <reference types="vite/client" />

/**
 * 让 TypeScript 识别 `*.vue` 单文件组件的默认导出类型。
 * 没有这份声明时，`import App from './App.vue'` 会被判定为找不到模块。
 */
declare module '*.vue' {
  import type { DefineComponent } from 'vue'

  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}
