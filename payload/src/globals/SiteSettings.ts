import type { GlobalConfig } from 'payload'
import { canAccessAdmin, canManageContent, hiddenFromRoles, isSuperAdmin } from '@/lib/access'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  access: {
    read: canAccessAdmin,
    update: ({ req }) => Boolean(canManageContent({ req }) || isSuperAdmin({ req })),
  },
  admin: {
    hidden: hiddenFromRoles(['super-admin', 'ops', 'editor']),
    components: {
      elements: {
        beforeDocumentControls: ['@/components/admin/site-settings-home-summary'],
      },
    },
  },
  fields: [
    {
      name: 'siteName',
      type: 'text',
      defaultValue: 'GeekClaw',
      required: true,
    },
    {
      name: 'siteUrl',
      type: 'text',
      defaultValue: 'https://geekclaw.ai',
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'primaryColor',
      type: 'text',
      defaultValue: '#1457d9',
    },
    {
      name: 'seoTitle',
      type: 'text',
      defaultValue: 'GeekClaw | 企业级 AI Agent 与自动化工作台',
    },
    {
      name: 'seoDescription',
      type: 'textarea',
    },
    {
      name: 'contactEmail',
      type: 'email',
    },
    {
      name: 'navigation',
      type: 'array',
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
        },
        {
          name: 'href',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'home',
      type: 'group',
      fields: [
        {
          name: 'eyebrow',
          type: 'text',
          defaultValue: 'GeekClaw AI Agent',
        },
        {
          name: 'heroTitle',
          type: 'text',
          defaultValue: '一个 7 x 24 小时帮团队干活的 AI Agent',
          required: true,
        },
        {
          name: 'heroDescription',
          type: 'textarea',
          defaultValue:
            'GeekClaw 连接企业知识、业务系统和自动化工具，让 Agent 能理解目标、拆解任务、调用工具、推动流程，并把结果交付给团队。',
        },
        {
          name: 'primaryActionLabel',
          type: 'text',
          defaultValue: '预约演示',
        },
        {
          name: 'primaryActionHref',
          type: 'text',
          defaultValue: 'mailto:team@geekclaw.ai?subject=GeekClaw%20演示预约',
        },
        {
          name: 'secondaryActionLabel',
          type: 'text',
          defaultValue: '查看部署方案',
        },
        {
          name: 'secondaryActionHref',
          type: 'text',
          defaultValue: '/#deployment',
        },
        {
          name: 'panelEyebrow',
          type: 'text',
          defaultValue: 'Product System',
        },
        {
          name: 'panelTitle',
          type: 'text',
          defaultValue: '像助理一样理解任务，像系统一样稳定执行。',
        },
        {
          name: 'panelBody',
          type: 'textarea',
          defaultValue:
            '把知识库、业务系统、自动化工具和审批节点连接起来，形成从对话到执行的闭环，并留下可审计的过程记录。',
        },
        {
          name: 'panelMetrics',
          type: 'array',
          fields: [
            {
              name: 'value',
              type: 'text',
              required: true,
            },
            {
              name: 'label',
              type: 'text',
              required: true,
            },
          ],
          defaultValue: [
            { value: 'Agent', label: '任务执行' },
            { value: 'Flow', label: '流程自动化' },
            { value: 'Local', label: '本地部署' },
          ],
        },
        {
          name: 'featuredPagesHeading',
          type: 'text',
          defaultValue: '从聊天到行动的 Agent 能力',
        },
        {
          name: 'featuredPagesDescription',
          type: 'textarea',
          defaultValue: '围绕企业日常工作，把知识检索、工具调用、流程编排和权限审计放在同一个工作台里。',
        },
        {
          name: 'featuredPages',
          type: 'relationship',
          relationTo: 'pages',
          hasMany: true,
        },
        {
          name: 'featuredPostsHeading',
          type: 'text',
          defaultValue: '覆盖团队每天都会遇到的任务',
        },
        {
          name: 'featuredPostsDescription',
          type: 'textarea',
          defaultValue: '从销售、客服、运营、交付到内部支持，优先覆盖高频、规则明确、需要跨系统协作的流程。',
        },
        {
          name: 'featuredPosts',
          type: 'relationship',
          relationTo: 'posts',
          hasMany: true,
        },
        {
          name: 'featuredProductsHeading',
          type: 'text',
          defaultValue: '部署与交付方式',
        },
        {
          name: 'featuredProductsDescription',
          type: 'textarea',
          defaultValue: '支持试点、私有化部署、预装主机和行业模板，按企业现有系统逐步接入。',
        },
        {
          name: 'featuredProducts',
          type: 'relationship',
          relationTo: 'products',
          hasMany: true,
        },
        {
          name: 'ctaEyebrow',
          type: 'text',
          defaultValue: 'Start Building',
        },
        {
          name: 'ctaTitle',
          type: 'text',
          defaultValue: '从一个可验收的 Agent 场景开始',
        },
        {
          name: 'ctaDescription',
          type: 'textarea',
          defaultValue: '选一个高频业务流程，接入知识库、工具和权限边界，用 GeekClaw 快速验证 AI Agent 的实际产出。',
        },
        {
          name: 'ctaLabel',
          type: 'text',
          defaultValue: '预约部署评估',
        },
        {
          name: 'ctaHref',
          type: 'text',
          defaultValue: 'mailto:team@geekclaw.ai?subject=GeekClaw%20部署评估',
        },
      ],
    },
  ],
}
