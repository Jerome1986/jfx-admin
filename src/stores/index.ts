import { createPinia } from 'pinia'
import persist from 'pinia-plugin-persistedstate'

// 创建全局 Pinia 状态管理实例。
const pinia = createPinia()
pinia.use(persist)

export default pinia

export * from './modules/user'
