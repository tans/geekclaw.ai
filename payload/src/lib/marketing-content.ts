import type { Metadata } from 'next'

export type MarketingCard = {
  title: string
  body: string
  label?: string
  href?: string
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
    id?: string
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
    title: 'GeekClaw | 企业级 AI Agent 与自动化工作台',
    description: 'GeekClaw 面向企业团队提供可落地的 AI Agent、自动化流程、知识库与私有化部署能力。',
  },
  eyebrow: 'GeekClaw AI Agent',
  title: '让 AI Agent 进入企业真实工作流',
  lead:
    'GeekClaw 围绕企业知识、工具调用、流程自动化和本地化部署，帮助团队把 AI 从问答带入可交付的业务执行。',
  primaryAction: {
    label: '预约演示',
    href: 'mailto:team@geekclaw.ai?subject=GeekClaw%20演示预约',
  },
  secondaryAction: {
    label: '查看部署方案',
    href: '/#deployment',
  },
  panel: {
    eyebrow: 'Product System',
    title: '从知识理解到任务执行，一套企业可控的 Agent 工作台。',
    body:
      '把知识库、业务系统、自动化工具和审批节点连接起来，让 Agent 能查资料、调工具、跑流程，并留下可审计的执行记录。',
    metrics: [
      { value: 'Agent', label: '任务执行' },
      { value: 'Flow', label: '流程自动化' },
      { value: 'Local', label: '本地部署' },
    ],
  },
  sections: [
    {
      id: 'capabilities',
      eyebrow: 'Capabilities',
      title: '企业 Agent 能力',
      body: '围绕企业日常工作，把知识检索、工具调用、流程编排和权限审计放在同一个工作台里。',
      cards: [
        {
          label: 'Knowledge',
          title: '企业知识库',
          body: '接入制度、产品资料、项目文档和 FAQ，让 Agent 在受控范围内检索、引用和生成回答。',
        },
        {
          label: 'Tools',
          title: '工具调用与系统接入',
          body: '连接 CRM、工单、表格、数据库和内部接口，让 Agent 能执行查询、写入、同步和通知。',
        },
        {
          label: 'Governance',
          title: '权限、审批与审计',
          body: '为不同角色设置可用能力和确认节点，保留执行记录，满足企业运营和合规要求。',
        },
      ],
    },
    {
      id: 'scenarios',
      eyebrow: 'Scenarios',
      title: '适用业务场景',
      body: '从销售、客服、运营、交付到内部支持，优先覆盖高频、规则明确、需要跨系统协作的流程。',
      cards: [
        {
          label: 'Sales',
          title: '销售线索与客户跟进',
          body: '自动整理客户信息、生成跟进建议、同步 CRM，并把下一步任务推送给销售团队。',
        },
        {
          label: 'Support',
          title: '客服与内部支持',
          body: '基于知识库回答问题，识别复杂工单并转人工，减少重复咨询和跨部门等待。',
        },
        {
          label: 'Operations',
          title: '运营报表与交付协同',
          body: '汇总多系统数据，生成日报、周报和项目进展，协助团队发现异常并推动处理。',
        },
      ],
    },
    {
      id: 'deployment',
      eyebrow: 'Deployment',
      title: '部署与交付方式',
      body: '支持试点、私有化部署、预装主机和行业模板，按企业现有系统逐步接入。',
      cards: [
        {
          label: 'Pilot',
          title: '业务场景试点',
          body: '选择一个高频流程，完成知识库、工具权限、验收指标和人工确认节点配置。',
        },
        {
          label: 'Private',
          title: '私有化与本地部署',
          body: '支持企业自有网络、私有数据和本地运行环境，降低敏感数据外流风险。',
        },
        {
          label: 'Hardware',
          title: '预装主机与服务包',
          body: '可通过商城承接主机、模板和部署服务，缩短从采购到上线的周期。',
        },
      ],
    },
  ],
  cta: {
    eyebrow: 'Start Building',
    title: '从一个可验收的 Agent 场景开始',
    body: '选一个高频业务流程，接入知识库、工具和权限边界，用 GeekClaw 快速验证 AI Agent 的实际产出。',
    label: '预约部署评估',
    href: 'mailto:team@geekclaw.ai?subject=GeekClaw%20部署评估',
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
