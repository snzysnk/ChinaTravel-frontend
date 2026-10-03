<script setup lang="ts">
/**
 * 应用根组件。
 *
 * 当前只承载一个页面，因此不做路由；待出现第二个需要跳转的页面时再引入路由
 * （见 openspec/changes/frontend-stack-and-toolchain/design.md 决策 5）。
 *
 * 组件库的中文语言包在此以 `el-config-provider` 包裹整棵树的方式生效：日期/时间选择、
 * 分页、表格空态等组件的内置文案随之变为中文，各页面无需逐处传 `locale` 属性。
 *
 * **为什么用组件的包裹方式，而不是在入口 `app.use(ElementPlus, { locale })`**：
 * 后者的安装器实现是 `components.forEach((c) => app.use(c))`，注册发生在运行时，
 * 打包器无法据此裁剪，于是组件库**全部**组件都会进入产物。实测同一页面下
 * JS 由 66 kB 涨到 1.03 MB，且产物中出现了本项目从未使用的组件（ElTransfer），
 * 直接违反 frontend-ui-library 规格「组件库 SHALL 按需加载」中
 * 「SHALL NOT 在应用入口全量注册」及其场景「未使用的组件不进入产物」。
 * 改用包裹方式后，被引入的组件只有 `ElConfigProvider` 一个。
 */

import type { ConfigProviderProps } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'

import DestinationHome from '@/views/DestinationHome.vue'

/**
 * `el-config-provider` 声明出来的 `locale` 属性类型。
 *
 * 这不是我们想要的类型，而是组件库当前版本**声明错**的类型，此处只把它作为断言的落点。
 * 组件库对该属性的声明是 `locale: { type: PropType<Language> }`——一个 prop 描述对象，
 * 而 `ConfigProviderProps` 是 `ExtractPropTypes<typeof configProviderProps>`：
 * Vue 的 `ExtractPropTypes` 只认自家的 `PropType<T>` 包装，不认 element-plus 用于
 * 构建 props 的 `__epPropKey` 标记，于是它没有把类型解成 `Language`，而是**原样返回了
 * 那个描述对象**。结果就是：属性声明说它要 `Language`，推导出来的类型却是一个
 * 带 `type`/`validator`/`__epPropKey` 的对象。
 */
type LocaleProp = NonNullable<ConfigProviderProps['locale']>

/**
 * 中文语言包实例。
 *
 * 因此这里必须断言：把语言包对象直接绑给 `:locale` 会报 TS2739
 * 「missing the following properties … : type, required, validator, __epPropKey」——
 * 缺的正是那个 prop 描述对象的字段，而不是语言包缺字段。这是上游的类型问题，
 * 不是我们传错了值：组件库自己的运行时期望就是 `Language`。
 *
 * 若将来上游修正了该推导，此处会变成「多余的断言」而非静默失效——断言的落点类型一旦
 * 与实际不再冲突，编译仍通过，但可以随时删掉这行断言改为 `const locale = zhCn`。
 */
const locale = zhCn as unknown as LocaleProp
</script>

<template>
  <el-config-provider :locale="locale">
    <DestinationHome />
  </el-config-provider>
</template>
