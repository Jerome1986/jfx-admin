<script setup lang="ts">
import { pageFilters } from '@/config/pageFilters'
</script>

<template>
  <PagePlaceholder section="系统管理" title="操作日志" :filters="pageFilters.logs" />
</template>
