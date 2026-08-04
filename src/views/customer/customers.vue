<script setup lang="ts">
import { pageFilters } from '@/config/pageFilters'
</script>

<template>
  <PagePlaceholder section="客户中心" title="客户管理" :filters="pageFilters.customers" />
</template>
