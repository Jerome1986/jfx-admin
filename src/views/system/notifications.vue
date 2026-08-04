<script setup lang="ts">
import { pageFilters } from '@/config/pageFilters'
</script>

<template>
  <PagePlaceholder section="系统管理" title="消息通知" :filters="pageFilters.notifications" />
</template>
