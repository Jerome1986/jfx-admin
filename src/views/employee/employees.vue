<script setup lang="ts">
import { pageFilters } from '@/config/pageFilters'
</script>

<template>
  <PagePlaceholder section="员工中心" title="员工管理" :filters="pageFilters.employees" />
</template>
