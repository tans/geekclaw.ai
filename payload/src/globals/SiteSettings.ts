import type { GlobalConfig } from 'payload'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
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
      defaultValue: '#b42318',
    },
    {
      name: 'seoTitle',
      type: 'text',
      defaultValue: 'GeekClaw',
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
      name: 'payment',
      type: 'group',
      fields: [
        {
          name: 'provider',
          type: 'select',
          defaultValue: 'alipay',
          options: [
            { label: '支付宝', value: 'alipay' },
          ],
        },
        {
          name: 'notifyUrl',
          type: 'text',
          defaultValue: 'https://geekclaw.ai/api/pay/alipay/notify',
          admin: {
            description: '支付宝异步通知地址。若同时配置了环境变量，环境变量优先。',
          },
        },
        {
          name: 'returnUrl',
          type: 'text',
          defaultValue: 'https://geekclaw.ai/pay-success',
          admin: {
            description: '支付宝同步返回地址。建议保持线上 HTTPS 地址。',
          },
        },
        {
          name: 'appId',
          type: 'text',
          admin: {
            description: '支付宝应用 App ID。真实联调前，可用 /payment-diagnostics 检查当前服务端是否已识别。',
          },
        },
        {
          name: 'gateway',
          type: 'text',
          defaultValue: 'https://openapi.alipay.com/gateway.do',
          admin: {
            description: '默认使用支付宝生产网关。仅在特殊环境下调整。',
          },
        },
        {
          name: 'privateKey',
          type: 'textarea',
          admin: {
            description: '应用私钥。敏感配置更推荐使用环境变量注入。',
          },
        },
        {
          name: 'publicKey',
          type: 'textarea',
          admin: {
            description: '支付宝公钥，用于 notify 验签。未配置时，异步通知无法完成验签回写。',
          },
        },
      ],
    },
  ],
}
