/**
 * @description Axios 混合增强封装
 * - 拦截器统一处理 token 注入、业务错误、401 登录跳转
 * - request 函数支持泛型，直接返回业务 data
 * - 方便维护与类型安全
 */

import axios from 'axios'
import type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'
import { useUserStore } from '@/stores'
import type { ApiResponse } from '@/types/api'

export type { ApiResponse } from '@/types/api'

// ======================== 基础配置 ========================
export const baseURL = 'http://localhost:3000/api'
// 定义后台接口的基础访问地址。
// export const baseURL = 'https://api.920keji.com/api'

// 创建带统一超时和基础地址的 Axios 实例。
const instance: AxiosInstance = axios.create({
  baseURL,
  timeout: 10000,
})

/**
 * HTTP 错误体里 data.message 可能是字符串，也可能是字符串数组（如校验错误）
 */
// 将不同结构的 HTTP 错误转换为可读文本。
function normalizeHttpErrorMessage(message: unknown): string {
  if (message == null) return ''
  if (typeof message === 'string') return message.trim() || ''
  if (Array.isArray(message)) {
    // 汇总数组形式的多个接口校验错误。
    const parts = message
      .map((item) => {
        if (typeof item === 'string') return item.trim()
        if (item != null && typeof item === 'object' && 'message' in item) {
          return String((item as { message: unknown }).message).trim()
        }
        return String(item).trim()
      })
      .filter(Boolean)
    return parts.join('；')
  }
  return String(message)
}

// ======================== 拦截器 ========================

// 请求拦截器：注入 token
instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 获取当前管理员令牌以注入请求头。
    const userStore = useUserStore()
    if (userStore.token) {
      config.headers.set('Authorization', userStore.token)
    }
    return config
  },
  (error) => Promise.reject(error),
)

// 响应拦截器：统一处理业务逻辑
instance.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const { code, message } = response.data
    if (code === 200) {
      return response // 这里返回原始 response，用外层 request 统一解耦
    }
    ElMessage.error(message || '服务异常')
    return Promise.reject(new Error(message || '接口异常'))
  },
  (error) => {
    // 提取接口响应体中的原始错误信息。
    const rawMsg =
      error.response?.data && typeof error.response.data === 'object'
        ? (error.response.data as { message?: unknown }).message
        : undefined
    // 将响应体错误转换为标准文本。
    const fromBody = normalizeHttpErrorMessage(rawMsg)
    // 选择本次请求最终展示的错误信息。
    const msg = fromBody || error.message || '服务异常'
    ElMessage.error(msg)

    if (error.response?.status === 401) {
      // 获取用户仓储以清理失效登录态。
      const userStore = useUserStore()
      userStore.clearToken?.()
      router.push('/login').then((r) => console.log(r))
    }
    return Promise.reject(error)
  },
)

// ======================== request 函数 ========================

/**
 * @description 类型安全请求函数
 * @template T 返回业务数据类型
 * @param config AxiosRequestConfig
 * @returns Promise<T>
 */
export async function request<T = unknown>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
  try {
    // 执行请求并保留标准业务响应结构。
    const response = await instance.request<ApiResponse<T>>(config)
    // 返回整个 response.data，包括 code / message / data
    return response.data
  } catch (error) {
    throw error
  }
}
