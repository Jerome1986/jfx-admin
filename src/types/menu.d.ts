import type { Component } from 'vue'

/** 菜单子项 */
export interface MenuItem {
  /** 菜单标题 */
  title: string
  /** 菜单路由路径 */
  path: string
}

/** 菜单分组 */
export interface MenuGroup {
  /** 菜单分组唯一索引 */
  index: string
  /** 菜单分组标题 */
  title: string
  /** 菜单分组图标组件 */
  icon: Component
  /** 菜单分组直接跳转路径 */
  path?: string
  /** 菜单分组包含的子菜单 */
  children?: MenuItem[]
}
