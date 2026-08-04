<script setup lang="ts">
import { pageFilters } from '@/config/pageFilters'
</script>

<template>
  <PagePlaceholder section="会员营销" title="积分管理" :filters="pageFilters.points" />
</template>
