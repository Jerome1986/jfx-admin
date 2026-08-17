import { createRouter, createWebHistory } from 'vue-router'
import Layout from '@/layout/index.vue'
import pinia, { useUserStore } from '@/stores'

// 创建后台页面路由实例并注册业务路由。
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      component: () => import('@/views/login/index.vue'),
      meta: { title: '登录' },
    },
    {
      path: '/',
      component: Layout,
      redirect: '/dashboard/overview',
      children: [
        // 工作台
        {
          path: '/dashboard/overview',
          component: () => import('@/views/dashboard/overview.vue'),
          meta: { title: '工作台' },
        },
        // 内容管理
        {
          path: '/content/cases',
          component: () => import('@/views/content/cases.vue'),
          meta: { title: '案例管理' },
        },
        {
          path: '/content/plans',
          component: () => import('@/views/content/plans.vue'),
          meta: { title: '焕新方案' },
        },
        {
          path: '/content/banner',
          component: () => import('@/views/content/banner.vue'),
          meta: { title: '轮播图管理' },
        },
        // 商品中心
        {
          path: '/product/category',
          component: () => import('@/views/product/category.vue'),
          meta: { title: '商品分类' },
        },
        {
          path: '/product/goods',
          component: () => import('@/views/product/goods.vue'),
          meta: { title: '商品管理' },
        },
        {
          path: '/product/services',
          component: () => import('@/views/product/services.vue'),
          meta: { title: '商品服务' },
        },
        // 交易中心
        {
          path: '/trade/orders',
          component: () => import('@/views/trade/orders.vue'),
          meta: { title: '商品订单' },
        },
        {
          path: '/trade/installation',
          component: () => import('@/views/trade/installation.vue'),
          meta: { title: '安装服务单' },
        },
        // 装修业务
        {
          path: '/renovation/appointment',
          component: () => import('@/views/renovation/appointment.vue'),
          meta: { title: '预约管理' },
        },
        {
          path: '/renovation/projects',
          component: () => import('@/views/renovation/projects.vue'),
          meta: { title: '装修项目' },
        },
        // 客户中心
        {
          path: '/customer/customers',
          component: () => import('@/views/customer/customers.vue'),
          meta: { title: '客户管理' },
        },
        {
          path: '/customer/addresses',
          component: () => import('@/views/customer/addresses.vue'),
          meta: { title: '服务地址' },
        },
        // 员工中心
        {
          path: '/employee/employees',
          component: () => import('@/views/employee/employees.vue'),
          meta: { title: '员工管理' },
        },
        {
          path: '/employee/performance',
          component: () => import('@/views/employee/performance.vue'),
          meta: { title: '员工业绩' },
        },
        // 会员营销
        {
          path: '/marketing/points',
          component: () => import('@/views/marketing/points.vue'),
          meta: { title: '积分管理' },
        },
        {
          path: '/marketing/coupons',
          component: () => import('@/views/marketing/coupons.vue'),
          meta: { title: '优惠券管理' },
        },
        // 服务支持
        {
          path: '/support/outlets',
          component: () => import('@/views/support/outlets.vue'),
          meta: { title: '服务网点' },
        },
        {
          path: '/support/feedback',
          component: () => import('@/views/support/feedback.vue'),
          meta: { title: '意见反馈' },
        },
        // 系统管理
        {
          path: '/system/roles',
          component: () => import('@/views/system/roles.vue'),
          meta: { title: '管理员与角色' },
        },
        {
          path: '/system/dictionary',
          component: () => import('@/views/system/dictionary.vue'),
          meta: { title: '字典与参数' },
        },
        {
          path: '/system/notifications',
          component: () => import('@/views/system/notifications.vue'),
          meta: { title: '消息通知' },
        },
        {
          path: '/system/logs',
          component: () => import('@/views/system/logs.vue'),
          meta: { title: '操作日志' },
        },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/login' },
  ],
})

// 路由守卫
router.beforeEach((to) => {
  const userStore = useUserStore(pinia)

  if (!userStore.token && to.path !== '/login') {
    return '/login'
  }

  if (userStore.token && to.path === '/login') {
    return '/dashboard/overview'
  }
})

router.afterEach((to) => {
  document.title = `${String(to.meta.title || '管理后台')} - 家翻新`
})

export default router
