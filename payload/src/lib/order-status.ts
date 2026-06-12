import type { OrderPaymentEvent } from '@/lib/orders'

export function formatOrderSource(value: string | null | undefined) {
  switch (value) {
    case 'landing':
      return '专题页'
    case 'manual':
      return '后台录单'
    case 'shop':
    default:
      return '商城'
  }
}

export function formatPaymentMode(value: string) {
  return value === 'mock' ? 'Mock 联调' : '支付宝跳转'
}

export function formatPaymentStatus(value: string | null | undefined) {
  return (
    {
      unpaid: '未支付',
      processing: '支付中',
      paid: '支付成功',
      failed: '支付失败',
      refunded: '已退款',
    }[value || ''] || value || '-'
  )
}

export function formatOrderStatus(value: string | null | undefined) {
  return (
    {
      pending: '待支付',
      paid: '已支付',
      failed: '支付失败',
      cancelled: '已取消',
      refunded: '已退款',
    }[value || ''] || value || '-'
  )
}

export function formatFulfillmentStatus(value: string | null | undefined) {
  switch (value) {
    case 'processing':
      return '准备中'
    case 'shipped':
      return '已发货/已交付'
    case 'completed':
      return '已完成'
    case 'pending':
    default:
      return '待处理'
  }
}

export function formatDeliveryMethod(value: string | null | undefined) {
  switch (value) {
    case 'shipping':
      return '快递物流'
    case 'service':
      return '人工服务'
    case 'digital':
    default:
      return '数字交付'
  }
}

export function formatEventStatus(value: string | undefined) {
  if (!value) {
    return '无状态'
  }

  return (
    {
      unpaid: '未支付',
      processing: '处理中',
      paid: '支付成功',
      failed: '支付失败',
      pending: '待处理',
      completed: '已完成',
      cancelled: '已取消',
      query_pending: '查单中',
      redirect: '跳转中',
      mock: '模拟支付',
      shipped: '已发货/已交付',
      manual_review_failed: '人工复核失败',
      TRADE_CLOSED: '交易关闭',
      refunded: '已退款',
    }[value] || value
  )
}

export function labelEventType(value: OrderPaymentEvent['type']) {
  return (
    {
      payment_initiated: '支付发起',
      payment_paid: '支付成功',
      payment_failed: '支付失败',
      order_cancelled: '订单取消',
      order_expired: '超时关闭',
      payment_review_requested: '支付复核',
      notify_invalid: '无效回调',
      notify_received: '收到回调',
      notify_error: '回调异常',
      fulfillment_updated: '履约更新',
      operator_note_updated: '运营备注更新',
    }[value] || value
  )
}

export function labelEventSource(value: OrderPaymentEvent['source']) {
  return (
    {
      checkout: '支付流程',
      mock: 'Mock',
      'alipay-notify': '支付宝通知',
      'alipay-return': '支付宝回跳',
      fulfillment: '履约',
      operator: '运营',
      system: '系统',
    }[value] || value
  )
}
