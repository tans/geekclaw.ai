import type { GlobalConfig } from 'payload'
import { canManageCommerce, canManageCommerceField, hiddenFromRoles } from '@/lib/access'

export const PaymentSettings: GlobalConfig = {
  slug: 'payment-settings',
  access: {
    read: canManageCommerce,
    update: canManageCommerce,
  },
  admin: {
    hidden: hiddenFromRoles(['super-admin', 'ops']),
  },
  hooks: {
    beforeChange: [
      ({ data, originalDoc }) => {
        const nextData = { ...(data || {}) } as Record<string, unknown>
        const privateKey =
          typeof nextData.privateKey === 'string'
            ? nextData.privateKey
            : typeof originalDoc?.privateKey === 'string'
              ? originalDoc.privateKey
              : ''
        const publicKey =
          typeof nextData.publicKey === 'string'
            ? nextData.publicKey
            : typeof originalDoc?.publicKey === 'string'
              ? originalDoc.publicKey
              : ''

        const privateKeyLines = countLines(privateKey)
        const publicKeyLines = countLines(publicKey)

        nextData.privateKeyConfigured = privateKeyLines > 0
        nextData.publicKeyConfigured = publicKeyLines > 0
        nextData.privateKeyLineCount = privateKeyLines
        nextData.publicKeyLineCount = publicKeyLines

        const previousPrivateKey = typeof originalDoc?.privateKey === 'string' ? originalDoc.privateKey : ''
        const previousPublicKey = typeof originalDoc?.publicKey === 'string' ? originalDoc.publicKey : ''

        if (privateKey !== previousPrivateKey || publicKey !== previousPublicKey) {
          nextData.keysUpdatedAt = privateKeyLines > 0 || publicKeyLines > 0 ? new Date().toISOString() : null
        }

        return nextData
      },
    ],
  },
  fields: [
    {
      name: 'provider',
      type: 'select',
      defaultValue: 'alipay',
      options: [{ label: '支付宝', value: 'alipay' }],
      access: {
        read: canManageCommerceField,
        update: canManageCommerceField,
      },
      admin: {
        readOnly: true,
        description: '当前站点仅接入支付宝支付。',
      },
    },
    {
      name: 'notifyUrl',
      type: 'text',
      defaultValue: 'https://geekclaw.ai/api/pay/alipay/notify',
      access: {
        read: canManageCommerceField,
        update: canManageCommerceField,
      },
      admin: {
        description: '支付宝异步通知地址。若同时配置了环境变量，环境变量优先。',
      },
    },
    {
      name: 'returnUrl',
      type: 'text',
      defaultValue: 'https://geekclaw.ai/pay-success',
      access: {
        read: canManageCommerceField,
        update: canManageCommerceField,
      },
      admin: {
        description: '支付宝同步返回地址。建议保持线上 HTTPS 地址。',
      },
    },
    {
      name: 'appId',
      type: 'text',
      access: {
        read: canManageCommerceField,
        update: canManageCommerceField,
      },
      admin: {
        description: '支付宝应用 App ID。真实联调前，可用 /payment-diagnostics 检查当前服务端是否已识别。',
      },
    },
    {
      name: 'sellerId',
      type: 'text',
      access: {
        read: canManageCommerceField,
        update: canManageCommerceField,
      },
      admin: {
        description: '支付宝收款账号对应的 seller_id。配置后可用于异步通知的业务校验。',
      },
    },
    {
      name: 'gateway',
      type: 'text',
      defaultValue: 'https://openapi.alipay.com/gateway.do',
      access: {
        read: canManageCommerceField,
        update: canManageCommerceField,
      },
      admin: {
        description: '默认使用支付宝生产网关。仅在特殊环境下调整。',
      },
    },
    {
      name: 'privateKey',
      type: 'textarea',
      access: {
        read: canManageCommerceField,
        update: canManageCommerceField,
      },
      admin: {
        hidden: true,
        description: '应用私钥。敏感配置更推荐使用环境变量注入；后台填写时仅限 ops / super-admin。',
      },
    },
    {
      name: 'publicKey',
      type: 'textarea',
      access: {
        read: canManageCommerceField,
        update: canManageCommerceField,
      },
      admin: {
        hidden: true,
        description: '支付宝公钥，用于 notify 验签。未配置时，异步通知无法完成验签回写。',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'privateKeyConfigured',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            width: '25%',
            readOnly: true,
            description: '后台回退值是否已保存应用私钥。',
          },
        },
        {
          name: 'privateKeyLineCount',
          type: 'number',
          defaultValue: 0,
          admin: {
            width: '25%',
            readOnly: true,
            description: '当前后台私钥行数摘要。',
          },
        },
        {
          name: 'publicKeyConfigured',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            width: '25%',
            readOnly: true,
            description: '后台回退值是否已保存支付宝公钥。',
          },
        },
        {
          name: 'publicKeyLineCount',
          type: 'number',
          defaultValue: 0,
          admin: {
            width: '25%',
            readOnly: true,
            description: '当前后台公钥行数摘要。',
          },
        },
      ],
    },
    {
      name: 'keysUpdatedAt',
      type: 'date',
      admin: {
        readOnly: true,
        description: '最近一次通过后台更新密钥的时间。',
      },
    },
    {
      name: 'envOverrideNotice',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: '@/components/admin/payment-env-override-note',
        },
      },
    },
    {
      name: 'keyRotationPanel',
      type: 'ui',
      admin: {
        components: {
          Field: '@/components/admin/payment-key-rotation-panel',
        },
      },
    },
  ],
}

function countLines(value: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    return 0
  }

  return trimmed.split(/\r?\n/).filter(Boolean).length
}
