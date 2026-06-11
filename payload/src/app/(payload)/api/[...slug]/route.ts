import { REST_GET, REST_POST, REST_PATCH, REST_DELETE } from '@payloadcms/next/routes'
import config from '@/payload.config'

export const GET = REST_GET(config)
export const POST = REST_POST(config)
export const PATCH = REST_PATCH(config)
export const DELETE = REST_DELETE(config)
