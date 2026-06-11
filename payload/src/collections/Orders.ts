import type { CollectionConfig } from 'payload'

export const Orders: CollectionConfig = {
  slug: 'orders',
  admin: {
    useAsTitle: 'orderNo',
    defaultColumns: [
      'orderNo',
      'customerName',
      'customerPhone',
      'source',
      'paymentStatus',
      'fulfillmentStatus',
      'deliveryMethod',
      'totalAmount',
      'paidAt',
      'updatedAt',
    ],
    components: {
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
      ({ data, originalDoc, operation }) => {
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
              defaultValue: 'shop',
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
                  required: true,
                  min: 0,
                },
              ],
            },
            {
              name: 'totalAmount',
              type: 'number',
              required: true,
              min: 0,
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
          ],
        },
      ],
    },
  ],
}
