<script setup lang="ts">
import { pageFilters } from '@/config/pageFilters'
</script>

<template>
  <PagePlaceholder section="装修业务" title="装修项目" :filters="pageFilters.projects" />
</template>
