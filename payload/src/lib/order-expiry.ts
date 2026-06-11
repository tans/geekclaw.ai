export const DEFAULT_UNPAID_ORDER_EXPIRE_MINUTES = 30

export function getUnpaidOrderExpireMinutes() {
  const raw = process.env.ORDER_EXPIRE_MINUTES
  const parsed = raw ? Number(raw) : NaN

  if (Number.isFinite(parsed) && parsed >= 1) {
    return Math.floor(parsed)
  }

  return DEFAULT_UNPAID_ORDER_EXPIRE_MINUTES
}

export function getUnpaidOrderExpireCutoff(now = new Date()) {
  return new Date(now.getTime() - getUnpaidOrderExpireMinutes() * 60 * 1000)
}
