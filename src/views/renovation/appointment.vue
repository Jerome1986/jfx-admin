<script setup lang="ts">
import { pageFilters } from '@/config/pageFilters'
</script>

<template>
  <PagePlaceholder section="装修业务" title="预约管理" :filters="pageFilters.appointment" />
</template>
