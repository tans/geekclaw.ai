import { getPayload } from 'payload'
import config from '@/payload.config'
import type { Media } from '@/payload-types'

export type NavItem = {
  label: string
  href: string
}

export type SiteData = {
  siteName: string
  siteUrl: string
  logo?: {
    url: string
    alt: string
  } | null
  contactEmail: string
  primaryColor: string
  seoTitle: string
  seoDescription: string
  footerDescription: string
  navigation: NavItem[]
  payment: {
    provider: 'alipay'
    notifyUrl: string
    returnUrl: string
    appId: string
    gateway: string
    privateKey: string
    publicKey: string
  }
}

export const defaultNavItems: NavItem[] = [
  { label: '首页', href: '/' },
  { label: '白龙马', href: '/bailongma' },
  { label: '博客', href: '/blog' },
  { label: '商城', href: '/shop' },
]

export const siteFallback: SiteData = {
  siteName: 'GeekClaw',
  siteUrl: 'https://geekclaw.ai',
  logo: null,
  contactEmail: 'team@geekclaw.ai',
  primaryColor: '#b42318',
  seoTitle: 'GeekClaw',
  seoDescription: 'GeekClaw 内容站、专题页、博客与商城后台',
  footerDescription: '企业 AI 内容站、专题页、博客和商品后台将统一由 Payload 管理。',
  navigation: defaultNavItems,
  payment: {
    provider: 'alipay',
    notifyUrl: 'https://geekclaw.ai/api/pay/alipay/notify',
    returnUrl: 'https://geekclaw.ai/pay-success',
    appId: '',
    gateway: 'https://openapi.alipay.com/gateway.do',
    privateKey: '',
    publicKey: '',
  },
}

export async function getSiteData(): Promise<SiteData> {
  const envPayment = {
    provider: 'alipay' as const,
    notifyUrl:
      process.env.ALIPAY_NOTIFY_URL || `${process.env.NEXT_PUBLIC_SITE_URL || siteFallback.siteUrl}/api/pay/alipay/notify`,
    returnUrl:
      process.env.ALIPAY_RETURN_URL || `${process.env.NEXT_PUBLIC_SITE_URL || siteFallback.siteUrl}/pay-success`,
    appId: process.env.ALIPAY_APP_ID || '',
    gateway: process.env.ALIPAY_GATEWAY || siteFallback.payment.gateway,
    privateKey: process.env.ALIPAY_PRIVATE_KEY || '',
    publicKey: process.env.ALIPAY_PUBLIC_KEY || '',
  }

  try {
    const payload = await getPayload({ config })
    const global = await payload.findGlobal({
      slug: 'site-settings',
    })
    const logo = resolveMedia(global.logo)

    return {
      siteName: global.siteName || siteFallback.siteName,
      siteUrl: global.siteUrl || siteFallback.siteUrl,
      logo,
      contactEmail: global.contactEmail || siteFallback.contactEmail,
      primaryColor: global.primaryColor || siteFallback.primaryColor,
      seoTitle: global.seoTitle || global.siteName || siteFallback.seoTitle,
      seoDescription: global.seoDescription || siteFallback.seoDescription,
      footerDescription: global.seoDescription || siteFallback.footerDescription,
      navigation:
        global.navigation?.map((item) => ({
          label: item.label,
          href: item.href,
        })) || siteFallback.navigation,
      payment: {
        provider: 'alipay',
        notifyUrl: envPayment.notifyUrl || global.payment?.notifyUrl || siteFallback.payment.notifyUrl,
        returnUrl: envPayment.returnUrl || global.payment?.returnUrl || siteFallback.payment.returnUrl,
        appId: envPayment.appId || global.payment?.appId || '',
        gateway: envPayment.gateway || global.payment?.gateway || siteFallback.payment.gateway,
        privateKey: envPayment.privateKey || global.payment?.privateKey || '',
        publicKey: envPayment.publicKey || global.payment?.publicKey || '',
      },
    }
  } catch (error) {
    console.error('[site] falling back to defaults', error)
    return {
      ...siteFallback,
      payment: envPayment,
    }
  }
}

function resolveMedia(value: number | Media | null | undefined) {
  if (!value || typeof value !== 'object' || !value.url) {
    return null
  }

  return {
    url: value.url,
    alt: value.alt || siteFallback.siteName,
  }
}

export async function getRawSitePaymentConfig() {
  try {
    const payload = await getPayload({ config })
    const global = await payload.findGlobal({
      slug: 'site-settings',
    })

    return {
      provider: global.payment?.provider || 'alipay',
      notifyUrl: global.payment?.notifyUrl || '',
      returnUrl: global.payment?.returnUrl || '',
      appId: global.payment?.appId || '',
      gateway: global.payment?.gateway || '',
      privateKey: global.payment?.privateKey || '',
      publicKey: global.payment?.publicKey || '',
    }
  } catch {
    return {
      provider: 'alipay' as const,
      notifyUrl: '',
      returnUrl: '',
      appId: '',
      gateway: '',
      privateKey: '',
      publicKey: '',
    }
  }
}
