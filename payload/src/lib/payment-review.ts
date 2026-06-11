export const DEFAULT_PROCESSING_REVIEW_MINUTES = 20

export function getProcessingReviewMinutes() {
  const raw = process.env.PROCESSING_REVIEW_MINUTES
  const parsed = raw ? Number(raw) : NaN

  if (Number.isFinite(parsed) && parsed >= 1) {
    return Math.floor(parsed)
  }

  return DEFAULT_PROCESSING_REVIEW_MINUTES
}

export function getProcessingReviewCutoff(now = new Date()) {
  return new Date(now.getTime() - getProcessingReviewMinutes() * 60 * 1000)
}
