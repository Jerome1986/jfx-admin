<script setup lang="ts">
import { pageFilters } from '@/config/pageFilters'
</script>

<template>
  <PagePlaceholder section="商品中心" title="商品管理" :filters="pageFilters.goods" />
</template>
