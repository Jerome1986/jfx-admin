<script setup lang="ts">
// 后台通用布局：侧栏菜单与业务页面出口
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowDown, Bell, Expand, Fold } from '@element-plus/icons-vue'
import { menuGroups } from '@/config/menu'

// 控制侧边栏的折叠状态。
const isCollapsed = ref(false)
// 获取当前激活的路由信息。
const route = useRoute()

// 根据当前路由计算所属菜单分组。
const currentGroup = computed(
  () =>
    menuGroups.find(
      (group) =>
        group.path === route.path || group.children?.some((item) => item.path === route.path),
    )?.title,
)
// 根据路由元信息计算当前页面标题。
const currentTitle = computed(() => String(route.meta.title || '管理后台'))
</script>

<template>
  <div class="admin-shell">
    <aside class="sidebar" :class="{ 'is-collapsed': isCollapsed }">
      <div class="brand">
        <div class="logo-placeholder">LOGO</div>
        <div v-show="!isCollapsed" class="brand-copy">
          <strong>家翻新</strong>
          <span>管理后台</span>
        </div>
      </div>

      <el-scrollbar class="menu-scrollbar">
        <div v-show="!isCollapsed" class="menu-caption">业务菜单</div>
        <el-menu
          class="sidebar-menu"
          :collapse="isCollapsed"
          :collapse-transition="false"
          :default-active="route.path"
          router
          :unique-opened="true"
        >
          <template v-for="group in menuGroups" :key="group.index">
            <el-menu-item v-if="group.path" class="group-menu-item" :index="group.path">
              <el-icon><component :is="group.icon" /></el-icon>
              <span>{{ group.title }}</span>
            </el-menu-item>
            <el-sub-menu v-else :index="group.index">
              <template #title>
                <el-icon><component :is="group.icon" /></el-icon>
                <span>{{ group.title }}</span>
              </template>
              <el-menu-item
                v-for="item in group.children ?? []"
                :key="item.path"
                :index="item.path"
              >
                <span class="menu-dot" />
                <span>{{ item.title }}</span>
              </el-menu-item>
            </el-sub-menu>
          </template>
        </el-menu>
      </el-scrollbar>

      <div class="sidebar-footer">
        <el-button class="collapse-button" text @click="isCollapsed = !isCollapsed">
          <el-icon><component :is="isCollapsed ? Expand : Fold" /></el-icon>
          <span v-show="!isCollapsed">收起菜单</span>
        </el-button>
      </div>
    </aside>

    <section class="workspace">
      <header class="topbar">
        <div class="page-heading">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item>{{ currentGroup }}</el-breadcrumb-item>
            <el-breadcrumb-item v-if="currentTitle !== currentGroup">{{
              currentTitle
            }}</el-breadcrumb-item>
          </el-breadcrumb>
          <h1>{{ currentTitle }}</h1>
        </div>

        <div class="topbar-actions">
          <el-badge is-dot>
            <el-button class="notification-button" :icon="Bell" circle text aria-label="消息通知" />
          </el-badge>
          <span class="topbar-divider" />
          <el-dropdown>
            <button class="user-entry" type="button">
              <el-avatar :size="34">管</el-avatar>
              <span class="user-copy">
                <strong>管理员</strong>
                <small>超级管理员</small>
              </span>
              <el-icon><ArrowDown /></el-icon>
            </button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>个人中心</el-dropdown-item>
                <el-dropdown-item divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <main class="content-area">
        <router-view />
      </main>
    </section>
  </div>
</template>
