import type { CollectionConfig } from 'payload'
import { canAccessAdmin, canManageCommerce, canManageCommerceBoolean, hiddenFromRoles } from '@/lib/access'
import { buildOrderPaymentChainFieldPatch } from '../lib/order-payment-labels.ts'

export const Orders: CollectionConfig = {
  slug: 'orders',
  access: {
    admin: canManageCommerceBoolean,
    create: canManageCommerce,
    delete: canManageCommerce,
    read: canAccessAdmin,
    update: canManageCommerce,
  },
  admin: {
    useAsTitle: 'orderNo',
    hidden: hiddenFromRoles(['super-admin', 'ops']),
    defaultColumns: [
      'orderNo',
      'customerName',
      'customerPhone',
      'source',
      'paymentStatus',
      'paymentChainTags',
      'paymentHasNotifyIssue',
      'fulfillmentStatus',
      'deliveryMethod',
      'totalAmount',
      'paidAt',
      'updatedAt',
    ],
    components: {
      edit: {
        beforeDocumentControls: ['@/components/admin/order-edit-ops-summary'],
      },
      beforeList: ['@/components/admin/orders-list-toolbar'],
      views: {
        edit: {
          paymentEvents: {
            path: '/payment-events',
            Component: '@/components/admin/order-payment-events-view',
            tab: {
              label: '订单时间线',
              order: 300,
            },
          },
        },
      },
    },
  },
  hooks: {
    beforeChange: [
      async ({ data, originalDoc, operation, req }) => {
        const nextData = { ...(data || {}) } as Record<string, unknown>
        const currentStatus = typeof nextData.status === 'string' ? nextData.status : originalDoc?.status
        const currentPaymentStatus =
          typeof nextData.paymentStatus === 'string' ? nextData.paymentStatus : originalDoc?.paymentStatus
        const currentFulfillmentStatus =
          typeof nextData.fulfillmentStatus === 'string' ? nextData.fulfillmentStatus : originalDoc?.fulfillmentStatus
        const currentPaidAt =
          typeof nextData.paidAt === 'string' && nextData.paidAt
            ? nextData.paidAt
            : typeof originalDoc?.paidAt === 'string'
              ? originalDoc.paidAt
              : null
        const currentFulfilledAt =
          typeof nextData.fulfilledAt === 'string' && nextData.fulfilledAt
            ? nextData.fulfilledAt
            : typeof originalDoc?.fulfilledAt === 'string'
              ? originalDoc.fulfilledAt
              : null

        if (currentPaymentStatus === 'paid' && !currentPaidAt) {
          nextData.paidAt = new Date().toISOString()
        }

        if (currentPaymentStatus === 'refunded') {
          nextData.status = 'refunded'
        } else if (currentPaymentStatus === 'failed' && currentStatus !== 'cancelled') {
          nextData.status = 'failed'
        } else if (currentPaymentStatus === 'paid' && currentStatus === 'pending') {
          nextData.status = 'paid'
        }

        if (currentFulfillmentStatus === 'completed' && !currentFulfilledAt) {
          nextData.fulfilledAt = new Date().toISOString()
        }

        if (currentFulfillmentStatus !== 'completed' && operation === 'update' && nextData.fulfilledAt === '') {
          nextData.fulfilledAt = null
        }

        if (!nextData.orderNo || typeof nextData.orderNo !== 'string' || !nextData.orderNo.trim()) {
          nextData.orderNo = `GC${Date.now()}${Math.floor(Math.random() * 9000 + 1000)}`
        }

        const rawItems =
          Array.isArray(nextData.items) && nextData.items.length
            ? (nextData.items as Array<Record<string, unknown>>)
            : Array.isArray(originalDoc?.items)
              ? (originalDoc.items as Array<Record<string, unknown>>)
              : []

        const normalizedItems = await Promise.all(
          rawItems.map(async (item) => {
            const productValue = item.product
            const productId =
              typeof productValue === 'number'
                ? productValue
                : typeof productValue === 'object' && productValue && 'id' in productValue
                  ? Number((productValue as { id?: number }).id)
                  : null

            let fallbackUnitPrice = typeof item.unitPrice === 'number' ? item.unitPrice : null

            if (productId) {
              const product = await req.payload.findByID({
                collection: 'products',
                id: productId,
                depth: 0,
              }).catch(() => null)

              if (product && typeof product.price === 'number') {
                fallbackUnitPrice = product.price
              }
            }

            return {
              ...item,
              quantity: typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1,
              unitPrice: typeof fallbackUnitPrice === 'number' ? fallbackUnitPrice : 0,
            }
          }),
        )

        nextData.items = normalizedItems
        nextData.totalAmount = normalizedItems.reduce((sum, item) => {
          const quantity = typeof item.quantity === 'number' ? item.quantity : 0
          const unitPrice = typeof item.unitPrice === 'number' ? item.unitPrice : 0
          return sum + quantity * unitPrice
        }, 0)

        const paymentEvents =
          nextData.paymentEvents !== undefined ? nextData.paymentEvents : originalDoc?.paymentEvents
        const paymentLastError =
          typeof nextData.paymentLastError === 'string'
            ? nextData.paymentLastError
            : typeof originalDoc?.paymentLastError === 'string'
              ? originalDoc.paymentLastError
              : null

        Object.assign(
          nextData,
          buildOrderPaymentChainFieldPatch({
            paymentEvents,
            paymentLastError,
          }),
        )

        return nextData
      },
    ],
  },
  fields: [
    {
      name: 'orderNo',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        readOnly: true,
      },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: '订单信息',
          fields: [
            {
              name: 'status',
              type: 'select',
              defaultValue: 'pending',
              options: [
                { label: '待支付', value: 'pending' },
                { label: '已支付', value: 'paid' },
                { label: '支付失败', value: 'failed' },
                { label: '已取消', value: 'cancelled' },
                { label: '已退款', value: 'refunded' },
              ],
              required: true,
            },
            {
              name: 'source',
              type: 'select',
              defaultValue: 'manual',
              options: [
                { label: '商城', value: 'shop' },
                { label: '专题页', value: 'landing' },
                { label: '后台录入', value: 'manual' },
              ],
              required: true,
            },
            {
              name: 'items',
              type: 'array',
              required: true,
              fields: [
                {
                  name: 'product',
                  type: 'relationship',
                  relationTo: 'products',
                  required: true,
                },
                {
                  name: 'quantity',
                  type: 'number',
                  required: true,
                  min: 1,
                },
                {
                  name: 'unitPrice',
                  type: 'number',
                  min: 0,
                  admin: {
                    description: '留空时会按当前商品价格自动回填。',
                  },
                },
              ],
            },
            {
              name: 'totalAmount',
              type: 'number',
              min: 0,
              admin: {
                readOnly: true,
                description: '保存时会根据商品数量和单价自动计算总价。',
              },
            },
          ],
        },
        {
          label: '客户信息',
          fields: [
            {
              name: 'customerName',
              type: 'text',
            },
            {
              name: 'customerPhone',
              type: 'text',
            },
            {
              name: 'customerEmail',
              type: 'email',
            },
            {
              name: 'shippingAddress',
              type: 'textarea',
            },
            {
              name: 'operatorNote',
              type: 'textarea',
              admin: {
                description: '后台运营备注，不对前台展示。',
              },
            },
          ],
        },
        {
          label: '履约信息',
          fields: [
            {
              name: 'fulfillmentStatus',
              type: 'select',
              defaultValue: 'pending',
              options: [
                { label: '待处理', value: 'pending' },
                { label: '准备中', value: 'processing' },
                { label: '已发货/已交付', value: 'shipped' },
                { label: '已完成', value: 'completed' },
              ],
              required: true,
            },
            {
              name: 'deliveryMethod',
              type: 'select',
              defaultValue: 'digital',
              options: [
                { label: '数字交付', value: 'digital' },
                { label: '快递物流', value: 'shipping' },
                { label: '人工服务', value: 'service' },
              ],
              required: true,
            },
            {
              name: 'trackingNo',
              type: 'text',
            },
            {
              name: 'deliveryNote',
              type: 'textarea',
              admin: {
                description: '给客户的交付备注或发货说明，可同步展示到前台订单详情。',
              },
            },
            {
              name: 'fulfilledAt',
              type: 'date',
            },
          ],
        },
        {
          label: '支付信息',
          fields: [
            {
              name: 'paymentProvider',
              type: 'text',
              defaultValue: 'alipay',
              admin: {
                readOnly: true,
              },
            },
            {
              name: 'paymentStatus',
              type: 'select',
              defaultValue: 'unpaid',
              options: [
                { label: '未支付', value: 'unpaid' },
                { label: '支付中', value: 'processing' },
                { label: '支付成功', value: 'paid' },
                { label: '支付失败', value: 'failed' },
                { label: '已退款', value: 'refunded' },
              ],
              required: true,
            },
            {
              name: 'paymentOrderNo',
              type: 'text',
              admin: {
                readOnly: true,
              },
            },
            {
              name: 'paymentTradeNo',
              type: 'text',
              admin: {
                readOnly: true,
              },
            },
            {
              name: 'paymentPayload',
              type: 'json',
              admin: {
                readOnly: true,
              },
            },
            {
              name: 'paidAt',
              type: 'date',
              admin: {
                readOnly: true,
              },
            },
            {
              name: 'paymentLastError',
              type: 'textarea',
              admin: {
                readOnly: true,
              },
            },
            {
              name: 'paymentEvents',
              type: 'json',
              admin: {
                readOnly: true,
                description: '支付发起、回调、验签和失败信息都会记录在这里，便于联调排查。',
              },
            },
            {
              name: 'paymentChainTags',
              type: 'json',
              admin: {
                readOnly: true,
                description: '用于原生订单列表和工作台的链路筛选标签。',
              },
            },
            {
              name: 'paymentHasIssue',
              type: 'checkbox',
              admin: {
                readOnly: true,
              },
            },
            {
              name: 'paymentHasNotifyIssue',
              type: 'checkbox',
              admin: {
                readOnly: true,
              },
            },
            {
              name: 'paymentHasReturnRecord',
              type: 'checkbox',
              admin: {
                readOnly: true,
              },
            },
            {
              name: 'paymentHasQueryRecord',
              type: 'checkbox',
              admin: {
                readOnly: true,
              },
            },
            {
              name: 'paymentHasFinalResult',
              type: 'checkbox',
              admin: {
                readOnly: true,
              },
            },
          ],
        },
      ],
    },
  ],
}
