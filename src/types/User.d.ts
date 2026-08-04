/**
 * 用户角色枚举
 * - USER: 普通用户
 * - VIP: 会员
 * - MANAGER: 店长
 * - MANAGER_PRIMARY: 基础店长
 * - MANAGER_SENIOR: 高级店长
 */
export type UserRole = 'USER' | 'VIP' | 'MANAGER' | 'MANAGER_PRIMARY' | 'MANAGER_SENIOR'

/**
 * 通用状态枚举
 * - ACTIVE: 激活
 * - INACTIVE: 未激活
 */
export type CommonStatus = 'ACTIVE' | 'INACTIVE'

/**
 * 用户表实体类型
 * 对应数据库 user 表
 */
export interface UserInfo {
  /** 唯一标识 */
  id: string
  /** 微信的用户标识id */
  openid: string
  /** 用户昵称 */
  nickname: string | null
  /** 用户头像 */
  avatarUrl: string | null
  /** 用户手机号码 */
  mobile: string
  /** 性别 0-未知 1-男 2-女 */
  gender: number
  /** 用户角色 - user普通用户 vip会员 manager店长 */
  role: UserRole
  /** 注册时间 */
  createdAt: Date
  /** 更新时间 */
  updatedAt: Date
  /** 账号状态 - active激活 inactive未激活 */
  status: CommonStatus
  /** 邀请码 */
  referralCode: string
  /** 上级ID */
  inviterId: string
  /** 上级邀请码 */
  inviterCode?: string
  /** vip可绑定的人数，默认为1 */
  vipMaxUsers: number
  /** 会员等级： 1:基础会员, 2:高级会员, 3:至尊会员 */
  vipLevel: number | null
  /** 会员注册时间 */
  vipStartTime: Date | null
  /** 会员到期时间 */
  vipEndTime: Date | null
  /** 会员权益： ['折扣9折', '免费配送'] */
  vipGift: number | null
  /** 会员折扣 */
  vipDiscount: number | null
  /** 邀请码图片链接 */
  myCodeUrl: string | null
  /** 平台积分 */
  score: number
  /** 店长运营资金 */
  operating_balance: number | null
  /** 店长待结算余额  */
  settle_balance: number | null
  /** 冻结金额，当待结算金额进入结算状态，生成账单，待结算金额将进入冻结金额，禁止使用 */
  lockedAmount: number | null
  /** 用户更新头像的次数，超过1天后会重置 */
  avatarUpdateCount: number | null
  /** 更新头像的时间 */
  avatarUpdateAt: Date | null

  // 关联表类型（需提前定义对应类型）

  /** 上级 */
  inviter?: UserInfo
  /** 下级 */
  invitees?: UserInfo[]
  /** 用户积分流水表 */
  pointsFlows: PointsFlow[]
  /** VIP订单表 */
  vipOrder: VipOrder[]
}
