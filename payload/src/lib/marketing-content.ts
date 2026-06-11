import type { Metadata } from 'next'

export type MarketingCard = {
  title: string
  body: string
  label?: string
}

export type MarketingPageContent = {
  seo: Metadata
  eyebrow: string
  title: string
  lead: string
  primaryAction: {
    label: string
    href: string
  }
  secondaryAction?: {
    label: string
    href: string
  }
  panel: {
    eyebrow: string
    title: string
    body: string
    metrics: Array<{ value: string; label: string }>
  }
  sections: Array<{
    eyebrow: string
    title: string
    body: string
    cards: MarketingCard[]
  }>
  cta: {
    eyebrow: string
    title: string
    body: string
    label: string
    href: string
  }
}

export const homeContent: MarketingPageContent = {
  seo: {
    title: 'GeekClaw | 企业 AI、OPC 与 LiloAvatar 产品官网',
    description: 'GeekClaw 汇集企业智能体、OPC 平台、LiloAvatar 数字人和主机销售后台。',
  },
  eyebrow: 'GeekClaw Product Group',
  title: '企业 AI、开放能力平台与数字人内容系统',
  lead:
    'GeekClaw 统一承接三个方向：面向企业流程的智能体落地、面向开发者与自动化团队的 OPC 能力平台，以及面向内容和服务场景的 LiloAvatar 数字人。',
  primaryAction: {
    label: '联系团队',
    href: 'mailto:team@geekclaw.ai',
  },
  secondaryAction: {
    label: '查看主机销售',
    href: '/shop',
  },
  panel: {
    eyebrow: 'Portfolio',
    title: '一个官网承接三条产品线，交易模块由后台维护。',
    body:
      '官网负责讲清楚产品定位和应用路径；商品、库存、订单、支付与履约由 Payload 后台维护，方便后续销售主机和方案包。',
    metrics: [
      { value: 'AI', label: '企业智能体' },
      { value: 'OPC', label: '开放能力平台' },
      { value: 'Lilo', label: '数字人内容系统' },
    ],
  },
  sections: [
    {
      eyebrow: 'Product Lines',
      title: '产品线规划',
      body: '每条产品线都使用独立叙事，避免混淆品牌，同时保持后台和商业化链路统一。',
      cards: [
        {
          label: 'GeekClaw',
          title: '企业智能体落地',
          body: '面向销售、运营、交付和内部支持，把业务流程拆成可执行任务，接入工具、权限和审计。',
        },
        {
          label: 'OPC',
          title: '开放能力与流程编排',
          body: '面向自动化团队和开发者，把模型、工具、数据源和任务流封装成可复用能力。',
        },
        {
          label: 'LiloAvatar',
          title: '数字人内容与陪伴体验',
          body: '面向品牌内容、客服、培训和互动场景，构建可持续更新的数字人表达系统。',
        },
      ],
    },
    {
      eyebrow: 'Commerce',
      title: '主机销售模块',
      body: '主机、套装、方案包不在前台硬编码，保留在商城后台编辑，便于调整价格、库存、上下架和履约说明。',
      cards: [
        {
          title: '硬件主机',
          body: '可维护 SKU、价格、库存、限购、是否允许预订等字段。',
        },
        {
          title: '部署套装',
          body: '可把主机、系统初始化、远程配置和售后服务组合为商品。',
        },
        {
          title: '订单履约',
          body: '后台已承接支付状态、履约状态、交付方式、备注和事件时间线。',
        },
      ],
    },
  ],
  cta: {
    eyebrow: 'Next Step',
    title: '先把产品线讲清楚，再让商城承接交易',
    body: '当前官网先完成品牌与产品结构，后续主机商品、价格和库存通过后台直接维护。',
    label: '进入商城后台',
    href: '/admin',
  },
}

export const opcContent: MarketingPageContent = {
  seo: {
    title: 'OPC | 开放能力与流程编排平台',
    description: 'OPC 面向开发者和自动化团队，连接模型、工具、数据和任务流。',
  },
  eyebrow: 'OPC Platform',
  title: '把模型、工具和业务流程编排成可复用能力',
  lead:
    'OPC 面向需要快速搭建 AI 自动化流程的团队。它关注能力接入、任务编排、运行监控和交付复用，而不是只提供一个聊天入口。',
  primaryAction: {
    label: '咨询 OPC',
    href: 'mailto:team@geekclaw.ai?subject=OPC%20咨询',
  },
  secondaryAction: {
    label: '查看产品组合',
    href: '/',
  },
  panel: {
    eyebrow: 'For Builders',
    title: '从一次性脚本走向可治理的能力平台。',
    body:
      '把工具调用、数据访问、任务步骤和结果回写封装为可配置流程，方便团队复用、审计和持续优化。',
    metrics: [
      { value: 'API', label: '工具接入' },
      { value: 'Flow', label: '流程编排' },
      { value: 'Ops', label: '运行治理' },
    ],
  },
  sections: [
    {
      eyebrow: 'Core Modules',
      title: 'OPC 应该承接的核心模块',
      body: 'OPC 的定位是开放、编排、治理和交付，帮助团队把 AI 能力接入真实生产链路。',
      cards: [
        {
          title: '能力连接',
          body: '把模型、插件、内部系统、数据源和业务接口连接为标准能力。',
        },
        {
          title: '任务编排',
          body: '把复杂任务拆成多步骤流程，支持人工确认、失败重试和结果回写。',
        },
        {
          title: '运行观测',
          body: '保留调用、状态、异常和产出记录，方便运营和技术团队共同排查。',
        },
      ],
    },
    {
      eyebrow: 'Scenarios',
      title: '适用场景',
      body: 'OPC 更适合已经有工具、数据和流程基础，希望把 AI 能力接入实际生产链路的团队。',
      cards: [
        {
          title: '内部自动化',
          body: '日报、数据整理、工单分派、客户资料补全和跨系统同步。',
        },
        {
          title: '智能体工作台',
          body: '为销售、运营、客服和交付角色配置不同的任务入口和权限边界。',
        },
        {
          title: '行业方案交付',
          body: '把交付经验沉淀成模板，再根据客户环境调整工具和流程。',
        },
      ],
    },
  ],
  cta: {
    eyebrow: 'Deployment',
    title: 'OPC 可以和 GeekClaw 主站、商城和订单后台一起交付',
    body: '官网负责获客和说明，后台负责商品、订单和履约，OPC 负责把 AI 能力接入业务执行。',
    label: '查看主机与方案',
    href: '/shop',
  },
}

export const liloAvatarContent: MarketingPageContent = {
  seo: {
    title: 'LiloAvatar | 数字人内容与陪伴体验系统',
    description: 'LiloAvatar 面向品牌、客服、培训和互动内容场景，构建可持续运营的数字人体验。',
  },
  eyebrow: 'LiloAvatar',
  title: '让数字人拥有可持续运营的内容、记忆和交互能力',
  lead:
    'LiloAvatar 面向品牌内容、客户服务、培训讲解和互动陪伴场景。重点不是单次生成形象，而是让数字人可以持续表达、持续学习和持续被运营。',
  primaryAction: {
    label: '咨询 LiloAvatar',
    href: 'mailto:team@geekclaw.ai?subject=LiloAvatar%20咨询',
  },
  secondaryAction: {
    label: '查看主机销售',
    href: '/shop',
  },
  panel: {
    eyebrow: 'Persistent Avatar',
    title: '从形象生成走向长期可运营的数字人。',
    body:
      '围绕角色设定、知识库、内容脚本、互动记录和渠道发布搭建完整流程，让数字人能服务真实业务。',
    metrics: [
      { value: 'Role', label: '角色设定' },
      { value: 'Memory', label: '记忆资料' },
      { value: 'Content', label: '内容运营' },
    ],
  },
  sections: [
    {
      eyebrow: 'Experience',
      title: 'LiloAvatar 的内容规划',
      body: 'LiloAvatar 聚焦可持续运营的数字人体验，把角色、知识、互动和发布流程放在一起设计。',
      cards: [
        {
          title: '角色与人格',
          body: '定义身份、语气、边界和知识范围，让不同场景有不同的表达方式。',
        },
        {
          title: '记忆与知识',
          body: '将产品资料、品牌语料、FAQ 和服务流程接入数字人可调用内容。',
        },
        {
          title: '互动与发布',
          body: '支持咨询、讲解、培训、活动和内容分发等长期运营场景。',
        },
      ],
    },
    {
      eyebrow: 'Use Cases',
      title: '适用场景',
      body: '适合希望用数字人承接持续内容和服务互动，而不是只做一次性视频素材的团队。',
      cards: [
        {
          title: '品牌导览',
          body: '用于官网、展会和活动页面，解释产品、方案和服务流程。',
        },
        {
          title: '客户服务',
          body: '承接常见咨询、售前介绍、资料收集和后续转人工流程。',
        },
        {
          title: '培训讲解',
          body: '把课程、手册和操作流程变成可互动的数字人讲解体验。',
        },
      ],
    },
  ],
  cta: {
    eyebrow: 'Hardware Ready',
    title: '数字人运行环境和主机销售可在商城后台维护',
    body: '主机、摄像头、部署服务和内容制作套餐可以作为商品维护，不在前台写死。',
    label: '查看商城',
    href: '/shop',
  },
}
