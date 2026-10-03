<script setup lang="ts">
/**
 * 目的地首页：ChinaTravel 的前后端链路验收页面。
 *
 * 由零构建版本的 index.html 原样迁移而来（结构与交互不变，见 design.md 决策 7）。
 * 本次变更把手写的交互元素换成了组件库组件，但**脚本逻辑与渲染顺序一字未动**：
 *   - 健康状态展示；
 *   - 目的地列表渲染，区分「有数据 / 空集合 / 请求失败」三种结果；
 *   - 重新加载按钮，两个请求互不依赖、并行发起、各自处理失败。
 *
 * 之所以强调「逻辑未动」：迁移与新逻辑混在一起时，出问题无法判断是迁移引入的还是新写的。
 * 原样替换把变量收敛为一个——链路是否仍然完整，验收标准因此是客观的
 * （见 design.md 决策 5）。
 *
 * 所有来自接口的文本都经模板插值写入（Vue 默认转义），等价于原实现的
 * textContent 写入方式，不拼 HTML 字符串，避免数据里的尖括号破坏页面结构。
 */

import { onMounted, ref } from 'vue'

import { getHealth, listDestinations } from '@/api'
import type { Destination } from '@/api/types'

// 健康状态用三态表达：检测中 / 正常 / 不可用。
// 用联合类型而非两个布尔量，避免出现"既正常又不可用"这类不可能状态。
type HealthState = 'checking' | 'ok' | 'bad'

const healthState = ref<HealthState>('checking')
const healthText = ref('检测中…')

/** 目的地的三种列表态：加载中 / 已获取 / 失败。失败态单独存文案，便于直接展示。 */
const destinations = ref<Destination[] | null>(null)
const listError = ref('')

/**
 * 表格「名称」列要展示的文本。
 *
 * 保留原实现的降级顺序 `name || id || '(未命名)'`：接口类型上 name 是必填的，
 * 但运行时仍可能给出空串（后端数据问题不该让页面出现空白单元格）。
 */
function displayName(item: Destination): string {
  return item.name || item.id || '(未命名)'
}

/** 拉取健康状态。任何失败都收敛为"服务不可用"，不影响页面其余部分。 */
async function loadHealth(): Promise<void> {
  healthState.value = 'checking'
  healthText.value = '检测中…'
  try {
    const data = await getHealth()
    healthState.value = 'ok'
    healthText.value = `服务正常（status: ${data.status || 'unknown'}）`
  } catch (err) {
    healthState.value = 'bad'
    healthText.value = `服务不可用：${(err as Error).message}`
  }
}

/** 拉取目的地列表。失败时记录文案，由模板与空状态区分展示。 */
async function loadDestinations(): Promise<void> {
  listError.value = ''
  try {
    destinations.value = await listDestinations()
  } catch (err) {
    // 失败时把列表置空，避免残留上一次的内容。
    destinations.value = null
    listError.value = `加载失败：${(err as Error).message}`
  }
}

/** 刷新整页数据。两个请求互不依赖，并行发起、各自处理失败。 */
function refresh(): void {
  void loadHealth()
  void loadDestinations()
}

onMounted(refresh)
</script>

<template>
  <main class="page">
    <h1>ChinaTravel 前后端链路验收</h1>
    <p class="subtitle">本页经开发服务器转发访问后端接口，前后端由独立服务托管。</p>

    <section class="card">
      <h2>服务连通状态</h2>
      <!-- 三态沿用原来的视觉映射：ok 为成功色，checking 与 bad 同为危险色
           （检测中尚未确认可用，不给出"正常"的绿色信号）。 -->
      <el-tag :type="healthState === 'ok' ? 'success' : 'danger'" effect="light" round>
        {{ healthText }}
      </el-tag>
    </section>

    <section class="card">
      <h2>目的地列表</h2>

      <!-- 失败态优先展示：此时列表已置空，不应同时出现"加载中"或空状态文案。 -->
      <el-alert v-if="listError" :title="listError" type="error" :closable="false" show-icon />

      <el-text v-else-if="destinations === null" type="info">加载中…</el-text>

      <!-- image-size 把默认的大号插图压到与原先一行文案相当的高度，
           避免空态在卡片里占据过大的版面（属布局调整，非视觉覆盖）。 -->
      <el-empty v-else-if="destinations.length === 0" description="暂无目的地数据。" :image-size="60" />

      <el-table v-else :data="destinations">
        <el-table-column label="名称" min-width="120">
          <!-- 断言是必要的，不是图省事：组件库把插槽的 row 声明为宽松行类型
               （Record<PropertyKey, any>），而带泛型的表格推导在「按需引入」下拿不到
               （组件是运行时解析的，没有泛型实例可依）；同时该宽松类型也无法反向
               收窄成具名的行类型（直接标注 : Destination 会被判定为不可赋值）。
               表格的数据来源就是上面的 destinations，这里的断言与事实一致。 -->
          <template #default="{ row }">{{ displayName(row as Destination) }}</template>
        </el-table-column>
        <el-table-column prop="province" label="省份" width="120" />
        <el-table-column prop="summary" label="简介" />
      </el-table>

      <p class="refresh-row">
        <el-button @click="refresh">重新加载</el-button>
      </p>
    </section>
  </main>
</template>

<!--
  本页没有 <style scoped>：列表、状态、空态、错误提示原先由这里的手写样式与
  assets/page.css 共同负责，迁移到组件库后这些样式已无对应结构，故一并移除。
  剩下的页面级布局（.page / .card / .subtitle / .refresh-row）仍在 assets/page.css。
-->
