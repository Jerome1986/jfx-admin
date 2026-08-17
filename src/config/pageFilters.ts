import type {
  DateRangeFilter,
  FilterOption,
  PageFilter,
  SelectFilter,
  TextFilter,
} from '@/types/pageFilter'

// 将字符串列表转换为下拉筛选选项。
const options = (...labels: string[]): FilterOption[] =>
  labels.map((label) => ({ label, value: label }))

// 创建文本筛选字段配置。
const text = (key: string, label: string, placeholder: string): TextFilter => ({
  key,
  label,
  type: 'text',
  placeholder,
})

// 创建下拉筛选字段配置。
const select = (key: string, label: string, values: string[]): SelectFilter => ({
  key,
  label,
  type: 'select',
  placeholder: `全部${label}`,
  options: options(...values),
})

// 创建日期范围筛选字段配置。
const dates = (key: string, label: string): DateRangeFilter => ({
  key,
  label,
  type: 'date-range',
})

// 汇总各业务页面使用的筛选字段配置。
export const pageFilters = {
  cases: [
    text('title', '案例标题', '请输入案例标题'),
    select('publishStatus', '发布状态', ['草稿', '已上架', '已下架']),
  ],
  plans: [
    text('name', '方案名称', '请输入方案名称'),
    select('status', '上下架状态', ['已上架', '已下架']),
  ],
  goods: [
    text('keyword', '商品', '请输入商品名称或编码'),
    select('category', '商品分类', []),
    select('status', '商品状态', ['草稿', '已上架', '已下架']),
    select('stockStatus', '库存状态', ['充足', '库存预警', '缺货']),
  ],
  orders: [
    text('keyword', '订单信息', '请输入订单号、客户或手机号'),
    select('status', '订单状态', [
      '待付款',
      '待安装',
      '服务中',
      '已完成',
      '已取消',
      '退款中',
      '已退款',
    ]),
    dates('createdAt', '下单时间'),
  ],
  installation: [
    text('keyword', '服务单', '请输入订单号或客户'),
    select('status', '安装状态', ['待预约', '待派单', '待上门', '服务中', '已完成', '已取消']),
    dates('appointmentAt', '预约时间'),
  ],
  appointment: [
    text('keyword', '客户信息', '请输入客户或手机号'),
    select('type', '预约类型', ['装修预算', '免费量房', '房屋报价']),
    select('status', '预约状态', ['待联系', '待上门', '已完成']),
    dates('visitAt', '上门日期'),
  ],
  projects: [
    text('keyword', '项目信息', '请输入项目名称或客户'),
    text('owner', '负责人', '请输入负责人姓名'),
    select('status', '项目状态', ['待确认', '服务中', '已完成']),
  ],
  customers: [
    text('keyword', '客户信息', '请输入姓名或手机号'),
    select('source', '客户来源', ['自然注册', '装修预约', '商品订单', '员工录入']),
    select('status', '客户状态', ['正常', '已冻结']),
  ],
  addresses: [
    text('keyword', '联系人', '请输入联系人或手机号'),
    select('city', '城市', ['北京', '上海', '广州', '深圳', '杭州']),
    select('status', '地址状态', ['正常', '已停用']),
  ],
  employees: [
    text('keyword', '员工信息', '请输入姓名或手机号'),
    select('department', '部门', ['销售部', '设计部', '工程部', '安装部', '客服部']),
    select('status', '在职状态', ['在职', '离职']),
  ],
  performance: [
    dates('month', '月份'),
    select('department', '部门', ['销售部', '设计部', '工程部', '安装部']),
    text('employee', '员工', '请输入员工姓名'),
  ],
  points: [
    text('keyword', '客户信息', '请输入客户或手机号'),
    select('type', '流水类型', ['收入', '使用', '人工调整', '过期']),
    dates('occurredAt', '发生时间'),
  ],
  coupons: [
    text('name', '券名称', '请输入优惠券名称'),
    select('status', '券状态', ['未开始', '进行中', '已结束', '已停用']),
    dates('validAt', '有效期'),
  ],
  outlets: [
    text('name', '网点名称', '请输入网点名称'),
    select('city', '城市', ['北京', '上海', '广州', '深圳', '杭州']),
    select('status', '网点状态', ['启用', '停用']),
  ],
  feedback: [
    text('keyword', '反馈信息', '请输入反馈编号、客户或联系方式'),
    select('status', '处理状态', ['待处理', '处理中', '已回复', '已关闭']),
    dates('submittedAt', '提交时间'),
  ],
  roles: [
    text('keyword', '管理员', '请输入管理员名称或手机号'),
    select('role', '角色', [
      '超级管理员',
      '内容管理员',
      '商城运营',
      '客服',
      '装修顾问',
      '项目经理',
    ]),
    select('status', '账号状态', ['启用', '停用']),
  ],
  notifications: [
    text('keyword', '通知信息', '请输入模板名称或接收人'),
    select('channel', '发送渠道', ['短信', '订阅消息', '站内通知']),
    select('status', '发送状态', ['待发送', '发送中', '成功', '失败']),
    dates('sentAt', '发送时间'),
  ],
  logs: [
    text('keyword', '操作信息', '请输入操作人或关键词'),
    select('module', '业务模块', [
      '内容管理',
      '商品中心',
      '交易中心',
      '装修业务',
      '客户中心',
      '系统管理',
    ]),
    dates('operatedAt', '操作时间'),
  ],
} as const satisfies Record<string, readonly PageFilter[]>
