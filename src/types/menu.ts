import type { Component } from 'vue'

export interface MenuItem {
  title: string
  path: string
}

export interface MenuGroup {
  index: string
  title: string
  icon: Component
  path?: string
  children?: MenuItem[]
}
