<script setup lang="ts">
import { pageFilters } from '@/config/pageFilters'
</script>

<template>
  <PagePlaceholder section="员工中心" title="员工业绩" :filters="pageFilters.performance" />
</template>
