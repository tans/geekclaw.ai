import type { Access, FieldAccess, PayloadRequest } from 'payload'

export type AdminRole = 'super-admin' | 'ops' | 'editor'

type UserWithRole = {
  role?: AdminRole | null
}

function getRole(req?: PayloadRequest | null) {
  const user = (req?.user || null) as UserWithRole | null
  return user?.role || null
}

export function getUserRole(user: unknown) {
  if (user && typeof user === 'object' && 'role' in user) {
    return (user as UserWithRole).role || null
  }

  return null
}

export function hasRole(user: unknown, roles: AdminRole[]) {
  const role = getUserRole(user)
  return Boolean(role && roles.includes(role))
}

export function hiddenFromRoles(roles: AdminRole[]) {
  return ({ user }: { user?: unknown }) => !hasRole(user, roles)
}

export function hasAnyRole(req: PayloadRequest | null | undefined, roles: AdminRole[]) {
  const role = getRole(req)
  return Boolean(role && roles.includes(role))
}

export const isSuperAdmin: Access = ({ req }) => hasAnyRole(req, ['super-admin'])
export const canAccessAdmin: Access = ({ req }) => hasAnyRole(req, ['super-admin', 'ops', 'editor'])
export const canManageContent: Access = ({ req }) => hasAnyRole(req, ['super-admin', 'editor'])
export const canManageCommerce: Access = ({ req }) => hasAnyRole(req, ['super-admin', 'ops'])
export const canAccessAdminBoolean = ({ req }: { req: PayloadRequest }) => hasAnyRole(req, ['super-admin', 'ops', 'editor'])
export const canManageContentBoolean = ({ req }: { req: PayloadRequest }) => hasAnyRole(req, ['super-admin', 'editor'])
export const canManageCommerceBoolean = ({ req }: { req: PayloadRequest }) => hasAnyRole(req, ['super-admin', 'ops'])
export const isSuperAdminBoolean = ({ req }: { req: PayloadRequest }) => hasAnyRole(req, ['super-admin'])
export const canManageCommerceField: FieldAccess = ({ req }) => hasAnyRole(req, ['super-admin', 'ops'])

export function ensureRole(req: PayloadRequest | null | undefined, roles: AdminRole[]) {
  if (!hasAnyRole(req, roles)) {
    throw new Error('FORBIDDEN')
  }
}

export function hasSystemAuthorization(headers: Headers) {
  const secret = process.env.CRON_SECRET || ''
  if (!secret) {
    return false
  }

  return headers.get('authorization') === `Bearer ${secret}`
}
