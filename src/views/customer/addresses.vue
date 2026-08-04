<script setup lang="ts">
import { pageFilters } from '@/config/pageFilters'
</script>

<template>
  <PagePlaceholder section="客户中心" title="服务地址" :filters="pageFilters.addresses" />
</template>
