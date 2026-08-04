<script setup lang="ts">
import { reactive, watch } from 'vue'

import type { PageFilter, PageFilterValue } from '@/types/pageFilter'

// 接收占位页面标题、分组和筛选配置。
const props = withDefaults(
  defineProps<{
    section: string
    title: string
    filters?: readonly PageFilter[]
  }>(),
  { filters: () => [] },
)

// 保存占位页面的动态查询值。
const query = reactive<Record<string, PageFilterValue>>({})

// 根据筛选配置初始化查询字段。
const initializeQuery = () => {
  Object.keys(query).forEach((key) => delete query[key])
  props.filters.forEach((filter) => {
    query[filter.key] = filter.type === 'date-range' ? [] : ''
  })
}

watch(() => props.filters, initializeQuery, { immediate: true })

// 将占位页面查询条件恢复为初始值。
const resetQuery = () => {
  initializeQuery()
}
</script>

<template>
  <section class="placeholder-page">
    <div v-if="filters.length" class="filter-card">
      <el-form :inline="true" :model="query" label-position="left">
        <el-form-item v-for="filter in filters" :key="filter.key" :label="filter.label">
          <el-input
            v-if="filter.type === 'text'"
            v-model="query[filter.key]"
            clearable
            :placeholder="filter.placeholder"
          />
          <el-select
            v-else-if="filter.type === 'select'"
            v-model="query[filter.key]"
            clearable
            :placeholder="filter.placeholder"
          >
            <el-option
              v-for="option in filter.options"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
          <el-date-picker
            v-else
            v-model="query[filter.key]"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item class="filter-actions">
          <el-button type="primary">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-card">
      <div class="table-toolbar">
        <div>
          <h2>{{ title }}</h2>
          <p>{{ section }}数据列表</p>
        </div>
        <el-button type="primary">新增</el-button>
      </div>
      <el-empty description="暂无数据" />
    </div>
  </section>
</template>
