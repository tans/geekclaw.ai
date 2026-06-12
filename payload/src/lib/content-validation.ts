const genericPageReservedSlugs = new Set(['liloavatar', 'opc', 'blog', 'shop', 'payment-diagnostics'])

export function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export function normalizeSlugValue(value: unknown) {
  const raw = normalizeText(value).toLowerCase()

  return raw
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function buildSlugFromTitle(value: unknown) {
  return normalizeSlugValue(value)
}

export function isReservedGenericPageSlug(slug: string) {
  return genericPageReservedSlugs.has(slug)
}

export function hasLexicalContent(value: unknown): boolean {
  if (!value || typeof value !== 'object') {
    return false
  }

  const root = 'root' in value ? (value as { root?: unknown }).root : null

  if (!root || typeof root !== 'object' || !('children' in root)) {
    return false
  }

  const children = (root as { children?: unknown }).children

  if (!Array.isArray(children) || children.length === 0) {
    return false
  }

  return children.some((node) => hasLexicalNodeContent(node))
}

function hasLexicalNodeContent(node: unknown): boolean {
  if (!node || typeof node !== 'object') {
    return false
  }

  const text = 'text' in node ? (node as { text?: unknown }).text : ''

  if (typeof text === 'string' && text.trim()) {
    return true
  }

  const children = 'children' in node ? (node as { children?: unknown }).children : null

  return Array.isArray(children) ? children.some((child) => hasLexicalNodeContent(child)) : false
}
