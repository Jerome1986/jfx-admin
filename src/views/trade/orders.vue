<script setup lang="ts">
import { pageFilters } from '@/config/pageFilters'
</script>

<template>
  <PagePlaceholder section="交易中心" title="商品订单" :filters="pageFilters.orders" />
</template>
