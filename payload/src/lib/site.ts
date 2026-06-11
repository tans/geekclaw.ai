import { getPayload } from 'payload'
import config from '@/payload.config'
import type { Media, SiteSetting } from '@/payload-types'
import { ensureSiteSettingsSchema } from '@/lib/site-schema'

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
    sellerId: string
    gateway: string
    privateKey: string
    publicKey: string
  }
}

export const defaultNavItems: NavItem[] = [
  { label: '首页', href: '/' },
  { label: 'OPC', href: '/opc' },
  { label: 'LiloAvatar', href: '/liloavatar' },
  { label: '主机销售', href: '/shop' },
]

export const siteFallback: SiteData = {
  siteName: 'GeekClaw',
  siteUrl: 'https://geekclaw.ai',
  logo: null,
  contactEmail: 'team@geekclaw.ai',
  primaryColor: '#0f766e',
  seoTitle: 'GeekClaw | 企业 AI、OPC 与 LiloAvatar 产品官网',
  seoDescription: 'GeekClaw 汇集企业智能体、OPC 平台、LiloAvatar 数字人和主机销售后台。',
  footerDescription: '企业 AI、OPC、LiloAvatar 与主机销售后台统一由 GeekClaw 承接。',
  navigation: defaultNavItems,
  payment: {
    provider: 'alipay',
    notifyUrl: 'https://geekclaw.ai/api/pay/alipay/notify',
    returnUrl: 'https://geekclaw.ai/pay-success',
    appId: '',
    sellerId: '',
    gateway: 'https://openapi.alipay.com/gateway.do',
    privateKey: '',
    publicKey: '',
  },
}

const legacySiteDescription = 'GeekClaw 内容站、专题页、博客与商城后台'
const legacyAiDescription = 'GeekClaw 帮助企业完成 AI 能力的部署、接入、权限治理与长期运行。'
const legacyFooterDescription = '企业 AI 内容站、专题页、博客和商品后台将统一由 Payload 管理。'
const legacyPrimaryColor = '#b42318'
const legacyNavSignature = '首页|/|白龙马|/bailongma|博客|/blog|商城|/shop'
const legacyAiNavSignature = '首页|/|部署方案|/#deployment|博客|/blog|商城|/shop'

export async function getSiteData(): Promise<SiteData> {
  ensureSiteSettingsSchema()

  const envPayment = {
    provider: 'alipay' as const,
    notifyUrl:
      process.env.ALIPAY_NOTIFY_URL || `${process.env.NEXT_PUBLIC_SITE_URL || siteFallback.siteUrl}/api/pay/alipay/notify`,
    returnUrl:
      process.env.ALIPAY_RETURN_URL || `${process.env.NEXT_PUBLIC_SITE_URL || siteFallback.siteUrl}/pay-success`,
    appId: process.env.ALIPAY_APP_ID || '',
    sellerId: process.env.ALIPAY_SELLER_ID || '',
    gateway: process.env.ALIPAY_GATEWAY || siteFallback.payment.gateway,
    privateKey: process.env.ALIPAY_PRIVATE_KEY || '',
    publicKey: process.env.ALIPAY_PUBLIC_KEY || '',
  }

  try {
    const payload = await getPayload({ config })
    const global = await payload.findGlobal({
      slug: 'site-settings',
    })
    const payment = (global.payment || {}) as NonNullable<SiteSetting['payment']> & {
      sellerId?: string | null
    }
    const logo = resolveMedia(global.logo)

    const navigation =
      global.navigation?.map((item) => ({
        label: item.label,
        href: item.href,
      })) || siteFallback.navigation

    return {
      siteName: global.siteName || siteFallback.siteName,
      siteUrl: global.siteUrl || siteFallback.siteUrl,
      logo,
      contactEmail: global.contactEmail || siteFallback.contactEmail,
      primaryColor:
        global.primaryColor && global.primaryColor !== legacyPrimaryColor
          ? global.primaryColor
          : siteFallback.primaryColor,
      seoTitle:
        global.seoTitle &&
        global.seoTitle !== 'GeekClaw' &&
        global.seoTitle !== 'GeekClaw | 企业 AI 智能体落地方案'
          ? global.seoTitle
          : siteFallback.seoTitle,
      seoDescription:
        global.seoDescription &&
        global.seoDescription !== legacySiteDescription &&
        global.seoDescription !== legacyAiDescription
          ? global.seoDescription
          : siteFallback.seoDescription,
      footerDescription:
        global.seoDescription &&
        global.seoDescription !== legacySiteDescription &&
        global.seoDescription !== legacyAiDescription &&
        global.seoDescription !== legacyFooterDescription
          ? global.seoDescription
          : siteFallback.footerDescription,
      navigation: isLegacyNavigation(navigation) ? siteFallback.navigation : navigation,
      payment: {
        provider: 'alipay',
        notifyUrl: envPayment.notifyUrl || payment.notifyUrl || siteFallback.payment.notifyUrl,
        returnUrl: envPayment.returnUrl || payment.returnUrl || siteFallback.payment.returnUrl,
        appId: envPayment.appId || payment.appId || '',
        sellerId: envPayment.sellerId || payment.sellerId || '',
        gateway: envPayment.gateway || payment.gateway || siteFallback.payment.gateway,
        privateKey: envPayment.privateKey || payment.privateKey || '',
        publicKey: envPayment.publicKey || payment.publicKey || '',
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

function isLegacyNavigation(navigation: NavItem[]) {
  const signature = navigation.map((item) => `${item.label}|${item.href}`).join('|')
  return signature === legacyNavSignature || signature === legacyAiNavSignature
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
  ensureSiteSettingsSchema()

  try {
    const payload = await getPayload({ config })
    const global = await payload.findGlobal({
      slug: 'site-settings',
    })
    const payment = (global.payment || {}) as NonNullable<SiteSetting['payment']> & {
      sellerId?: string | null
    }

    return {
      provider: payment.provider || 'alipay',
      notifyUrl: payment.notifyUrl || '',
      returnUrl: payment.returnUrl || '',
      appId: payment.appId || '',
      sellerId: payment.sellerId || '',
      gateway: payment.gateway || '',
      privateKey: payment.privateKey || '',
      publicKey: payment.publicKey || '',
    }
  } catch {
    return {
      provider: 'alipay' as const,
      notifyUrl: '',
      returnUrl: '',
      appId: '',
      sellerId: '',
      gateway: '',
      privateKey: '',
      publicKey: '',
    }
  }
}
