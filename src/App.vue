<script setup lang="ts">
/**
 * 应用根组件。
 *
 * 当前只承载一个页面，因此不做路由；待出现第二个需要跳转的页面时再引入路由
 * （见 openspec/changes/frontend-stack-and-toolchain/design.md 决策 5）。
 */

import DestinationHome from '@/views/DestinationHome.vue'
</script>

<template>
  <DestinationHome />
</template>
