<script setup lang="ts">
import { pageFilters } from '@/config/pageFilters'
</script>

<template>
  <PagePlaceholder section="服务支持" title="服务网点" :filters="pageFilters.outlets" />
</template>
