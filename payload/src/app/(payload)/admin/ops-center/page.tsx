import Link from 'next/link'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { hasAnyRole, type AdminRole } from '@/lib/access'

const sections = [
  {
    title: '内容运营',
    description: '围绕官网首页、页面、博客、专题和分类的日常运营入口。',
    roles: ['super-admin', 'editor'] as AdminRole[],
    links: [
      { label: '站点设置', href: '/admin/globals/site-settings', note: '首页编排、品牌信息和导航' },
      { label: '页面管理', href: '/admin/collections/pages', note: '专题页、普通页面、首页推荐来源' },
      { label: '文章管理', href: '/admin/collections/posts', note: '博客发布、标签和分类运营' },
      { label: '文章分类', href: '/admin/collections/post-categories', note: '博客归档与筛选体系' },
      { label: '商品分类', href: '/admin/collections/product-categories', note: '商城导购与专题分组' },
    ],
  },
  {
    title: '商城与订单',
    description: '围绕商品、库存、订单、履约和录单的运营入口。',
    roles: ['super-admin', 'ops'] as AdminRole[],
    links: [
      { label: '订单工作台', href: '/admin/orders-workbench', note: '待支付、待履约、异常与批量处理' },
      { label: '后台录单', href: '/admin/manual-order', note: '代客下单、线下收款录入' },
      { label: '商品列表', href: '/admin/collections/products', note: '商品编辑、库存策略、上架状态' },
      { label: '库存占用台', href: '/admin/inventory-occupancy', note: '单品库存占用与风险排查' },
      { label: '单品订单台', href: '/admin/product-orders', note: '按商品聚合同类订单处理' },
      { label: '销售与履约报表', href: '/admin/sales-fulfillment', note: '近 30 天成交、履约积压与热销商品' },
    ],
  },
  {
    title: '支付与诊断',
    description: '围绕支付宝联调、支付异常和链路观察的入口。',
    roles: ['super-admin', 'ops'] as AdminRole[],
    links: [
      { label: '支付联调就绪页', href: '/admin/payment-readiness', note: '配置来源、阻断项与重启命令' },
      { label: '支付配置', href: '/admin/globals/payment-settings', note: '支付宝参数、回调地址和密钥回退值' },
      { label: '支付回调观测页', href: '/admin/payment-observability', note: '回跳、notify、查单与异常记录' },
      { label: '前台支付诊断', href: '/payment-diagnostics', note: '快速确认当前服务端是否走真实支付或 mock' },
      { label: '订单列表', href: '/admin/collections/orders', note: '原生筛选、链路标签与编辑入口' },
    ],
  },
  {
    title: '治理与素材',
    description: '围绕内容质量、素材引用和运营健康度的入口。',
    roles: ['super-admin', 'editor'] as AdminRole[],
    links: [
      { label: '内容治理台', href: '/admin/content-governance', note: '页面、文章、商品问题汇总' },
      { label: '素材治理台', href: '/admin/media-governance', note: '未引用素材、低频素材、使用位置' },
      { label: '素材库', href: '/admin/collections/media', note: '图片上传、alt 修订和资产维护' },
      { label: '后台首页', href: '/admin', note: '商家总览、内容运营、库存与质量摘要' },
    ],
  },
  {
    title: '系统管理',
    description: '仅超级管理员可见，用于账户与角色治理。',
    roles: ['super-admin'] as AdminRole[],
    links: [
      { label: '用户管理', href: '/admin/collections/users', note: '新增账号、调整角色、回收权限' },
      { label: '后台首页', href: '/admin', note: '查看完整后台总览' },
    ],
  },
]

export default async function OpsCenterPage() {
  const payload = await getPayload({ config })
  const auth = await payload.auth({ headers: await headers() })
  const role = (auth.user && typeof auth.user === 'object' && 'role' in auth.user ? auth.user.role : null) as AdminRole | null
  const visibleSections = sections.filter((section) => hasAnyRole({ user: { role } } as never, section.roles))
  const contentSectionCount = visibleSections.filter((section) => section.title === '内容运营' || section.title === '治理与素材').reduce((sum, section) => sum + section.links.length, 0)
  const commerceSectionCount = visibleSections.filter((section) => section.title === '商城与订单').reduce((sum, section) => sum + section.links.length, 0)
  const paymentSectionCount = visibleSections.filter((section) => section.title === '支付与诊断').reduce((sum, section) => sum + section.links.length, 0)
  const systemSectionCount = visibleSections.filter((section) => section.title === '系统管理').reduce((sum, section) => sum + section.links.length, 0)

  return (
    <main
      style={{
        padding: 24,
        display: 'grid',
        gap: 20,
        background: '#f5f5f3',
        minHeight: '100vh',
      }}
    >
      <section
        style={{
          border: '1px solid rgba(20,20,20,0.08)',
          borderRadius: 24,
          background: '#fff',
          padding: 24,
          display: 'grid',
          gap: 18,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <p style={eyebrowStyle}>Ops Center</p>
            <h1 style={{ margin: '12px 0 0', fontSize: 32, lineHeight: 1.2 }}>后台运营中枢</h1>
            <p style={descStyle}>
              把现在已经做出的内容、商城、支付、治理功能收拢成一套统一入口。后台同学不需要记页面 URL，也不需要从首页零散按钮反复跳。
            </p>
            <p style={{ margin: '10px 0 0', color: '#8a5b12', fontSize: 13 }}>
              当前角色：{role || '未识别'}。
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignSelf: 'flex-start' }}>
            <Link href="/admin" style={buttonPrimary}>
              返回后台首页
            </Link>
            {hasAnyRole({ user: { role } } as never, ['super-admin', 'ops']) ? (
              <Link href="/admin/orders-workbench" style={buttonSecondary}>
                订单工作台
              </Link>
            ) : null}
            {hasAnyRole({ user: { role } } as never, ['super-admin', 'editor']) ? (
              <Link href="/admin/content-governance" style={buttonSecondary}>
                内容治理台
              </Link>
            ) : null}
          </div>
        </div>

        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <MetricCard label="内容入口" value={String(contentSectionCount)} note="页面、文章、站点设置与治理" tone="#1d1a17" />
          <MetricCard label="商城入口" value={String(commerceSectionCount)} note="商品、订单、库存、履约与报表" tone="#265b35" />
          <MetricCard label="支付入口" value={String(paymentSectionCount)} note="联调、观测、诊断与订单入口" tone="#8a5b12" />
          <MetricCard label="系统入口" value={String(systemSectionCount)} note="用户与角色治理" tone="#b42318" />
        </div>
      </section>

      <section style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        {visibleSections.map((section) => (
          <article
            key={section.title}
            style={{
              borderRadius: 20,
              background: '#fff',
              border: '1px solid rgba(20,20,20,0.08)',
              padding: 20,
              display: 'grid',
              gap: 14,
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: 22 }}>{section.title}</h2>
              <p style={{ margin: '8px 0 0', color: '#5c5048', lineHeight: 1.7 }}>{section.description}</p>
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {section.links.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    borderRadius: 16,
                    border: '1px solid rgba(20,20,20,0.08)',
                    background: '#faf8f7',
                    padding: '12px 14px',
                    textDecoration: 'none',
                    color: '#1d1a17',
                    display: 'grid',
                    gap: 6,
                  }}
                >
                  <strong>{item.label}</strong>
                  <span style={{ color: '#5c5048', fontSize: 13, lineHeight: 1.7 }}>{item.note}</span>
                </Link>
              ))}
            </div>
          </article>
        ))}
      </section>
    </main>
  )
}

function MetricCard({
  label,
  value,
  note,
  tone,
}: {
  label: string
  value: string
  note: string
  tone: string
}) {
  return (
    <article
      style={{
        borderRadius: 18,
        background: '#fff',
        border: '1px solid rgba(20,20,20,0.08)',
        padding: '14px 16px',
        display: 'grid',
        gap: 8,
      }}
    >
      <p style={{ margin: 0, color: '#6f6661', fontSize: 13 }}>{label}</p>
      <p style={{ margin: 0, fontSize: 28, fontWeight: 700, color: tone }}>{value}</p>
      <p style={{ margin: 0, color: '#4f4742', fontSize: 13, lineHeight: 1.7 }}>{note}</p>
    </article>
  )
}

const eyebrowStyle = {
  margin: 0,
  color: '#b42318',
  fontSize: 12,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
} as const

const descStyle = {
  margin: '12px 0 0',
  color: '#5c5048',
  lineHeight: 1.8,
} as const

const buttonPrimary = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 120,
  padding: '10px 14px',
  borderRadius: 999,
  background: '#b42318',
  color: '#fff',
  textDecoration: 'none',
  fontWeight: 600,
} as const

const buttonSecondary = {
  ...buttonPrimary,
  background: '#fff',
  color: '#1d1a17',
  border: '1px solid rgba(20,20,20,0.12)',
} as const
