<script setup lang="ts">
/**
 * 目的地首页：ChinaTravel 的前后端链路验收页面。
 *
 * 由零构建版本的 index.html 原样迁移而来（结构与交互不变，见 design.md 决策 7）：
 *   - 健康状态展示；
 *   - 目的地列表渲染，区分「有数据 / 空集合 / 请求失败」三种结果；
 *   - 重新加载按钮，两个请求互不依赖、并行发起、各自处理失败。
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
      <span class="status" :class="healthState === 'ok' ? 'ok' : 'bad'">
        <span class="dot"></span>
        <span>{{ healthText }}</span>
      </span>
    </section>

    <section class="card">
      <h2>目的地列表</h2>

      <!-- 失败态优先展示：此时列表已置空，不应同时出现"加载中"或空状态文案。 -->
      <p v-if="listError" class="error">{{ listError }}</p>

      <p v-else-if="destinations === null" class="empty">加载中…</p>

      <p v-else-if="destinations.length === 0" class="empty">暂无目的地数据。</p>

      <ul v-else class="destinations">
        <li v-for="item in destinations" :key="item.id">
          <span class="name">{{ item.name || item.id || '(未命名)' }}</span>
          <span v-if="item.province" class="province">{{ item.province }}</span>
          <div v-if="item.summary" class="summary">{{ item.summary }}</div>
        </li>
      </ul>

      <p class="refresh-row">
        <button type="button" @click="refresh">重新加载</button>
      </p>
    </section>
  </main>
</template>

<style scoped>
/**
 * 列表相关样式。卡片、状态胶囊等通用样式在 assets/page.css 中，
 * 这里只放仅本页使用的列表样式。
 */

ul.destinations {
  list-style: none;
  margin: 0;
  padding: 0;
}

ul.destinations li {
  padding: 12px 0;
  border-top: 1px solid var(--border);
}

ul.destinations li:first-child {
  border-top: none;
}

.name {
  font-weight: 600;
}

.province {
  margin-left: 8px;
  font-size: 12px;
  color: var(--muted);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 1px 6px;
}

.summary {
  color: var(--muted);
  font-size: 13px;
  margin-top: 2px;
}
</style>
