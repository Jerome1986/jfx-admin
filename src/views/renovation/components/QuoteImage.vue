<script setup lang="ts">
defineProps<{ src?: string | null }>()
</script>
<template>
  <el-image
    v-if="src"
    :src="src"
    :preview-src-list="[src]"
    preview-teleported
    fit="contain"
    class="quote-image"
  >
    <template #error><span class="placeholder">图片不可用</span></template>
  </el-image>
  <span v-else class="quote-image placeholder">暂无图片</span>
</template>
<style scoped>
.quote-image {
  width: 52px;
  height: 52px;
  border-radius: 6px;
  flex-shrink: 0;
}
.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  color: #909399;
  font-size: 11px;
  height: 52px;
}
</style>
