import {
  DataLine,
  Document,
  Goods,
  House,
  Present,
  Service,
  Setting,
  ShoppingCart,
  User,
  UserFilled,
} from '@element-plus/icons-vue'
import type { MenuGroup } from '@/types/menu'

// 定义后台侧边栏的菜单分组与路由入口。
export const menuGroups: MenuGroup[] = [
  {
    index: 'dashboard',
    title: '工作台',
    icon: DataLine,
    path: '/dashboard/overview',
  },
  {
    index: 'content',
    title: '内容管理',
    icon: Document,
    children: [
      { title: '案例管理', path: '/content/cases' },
      { title: '焕新方案', path: '/content/plans' },
      { title: '轮播图管理', path: '/content/banner' },
    ],
  },
  {
    index: 'product',
    title: '商品中心',
    icon: Goods,
    children: [
      { title: '商品分类', path: '/product/category' },
      { title: '商品管理', path: '/product/goods' },
      { title: '商品服务', path: '/product/services' },
    ],
  },
  {
    index: 'trade',
    title: '交易中心',
    icon: ShoppingCart,
    children: [
      { title: '商品订单', path: '/trade/orders' },
      { title: '安装服务单', path: '/trade/installation' },
    ],
  },
  {
    index: 'renovation',
    title: '装修业务',
    icon: House,
    children: [
      { title: '预约管理', path: '/renovation/appointment' },
      { title: '装修项目', path: '/renovation/projects' },
    ],
  },
  {
    index: 'customer',
    title: '客户中心',
    icon: User,
    children: [
      { title: '客户管理', path: '/customer/customers' },
      { title: '服务地址', path: '/customer/addresses' },
    ],
  },
  {
    index: 'employee',
    title: '员工中心',
    icon: UserFilled,
    children: [
      { title: '员工管理', path: '/employee/employees' },
      { title: '员工业绩', path: '/employee/performance' },
    ],
  },
  {
    index: 'marketing',
    title: '会员营销',
    icon: Present,
    children: [
      { title: '积分管理', path: '/marketing/points' },
      { title: '优惠券管理', path: '/marketing/coupons' },
    ],
  },
  {
    index: 'support',
    title: '服务支持',
    icon: Service,
    children: [
      { title: '服务网点', path: '/support/outlets' },
      { title: '意见反馈', path: '/support/feedback' },
    ],
  },
  {
    index: 'system',
    title: '系统管理',
    icon: Setting,
    children: [
      { title: '管理员与角色', path: '/system/roles' },
      { title: '字典与参数', path: '/system/dictionary' },
      { title: '消息通知', path: '/system/notifications' },
      { title: '操作日志', path: '/system/logs' },
    ],
  },
]
