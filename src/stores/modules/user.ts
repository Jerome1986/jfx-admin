import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { AdminInfo } from '@/types/auth'

// 定义管理员信息和登录令牌状态仓储。
export const useUserStore = defineStore(
  'user',
  () => {
    // 保存当前登录管理员的基础信息。
    const userInfo = ref<AdminInfo>()

    // 保存当前接口访问令牌。
    const token = ref('')
    // 写入新的接口访问令牌。
    const setToken = (val: string) => {
      token.value = val
    }
    // 清空当前接口访问令牌。
    const clearToken = () => {
      token.value = ''
    }

    return {
      userInfo,
      token,
      setToken,
      clearToken,
    }
  },
  {
    persist: true, // 持久化
  },
)
