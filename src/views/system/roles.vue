<script setup lang="ts">
import { pageFilters } from '@/config/pageFilters'
</script>

<template>
  <PagePlaceholder section="系统管理" title="管理员与角色" :filters="pageFilters.roles" />
</template>
