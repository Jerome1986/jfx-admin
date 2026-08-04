<script setup lang="ts">
import { pageFilters } from '@/config/pageFilters'
</script>

<template>
  <PagePlaceholder section="服务支持" title="意见反馈" :filters="pageFilters.feedback" />
</template>
