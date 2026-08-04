<script setup lang="ts">
import { pageFilters } from '@/config/pageFilters'
</script>

<template>
  <PagePlaceholder section="交易中心" title="安装服务单" :filters="pageFilters.installation" />
</template>
