import { spawn } from 'node:child_process'

const closeIntervalMinutes = Number(process.env.CLOSE_EXPIRED_INTERVAL_MINUTES || '5')
const syncIntervalMinutes = Number(process.env.SYNC_PROCESSING_INTERVAL_MINUTES || '10')
const startupDelaySeconds = Number(process.env.ORDERS_MAINTENANCE_STARTUP_DELAY_SECONDS || '45')

function toMs(minutes: number) {
  return Math.max(1, minutes) * 60 * 1000
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function runScript(label: string, script: string) {
  const startedAt = new Date().toISOString()

  console.log(`[orders-maintenance] ${label} started startedAt=${startedAt}`)

  await new Promise<void>((resolve) => {
    const child = spawn(process.execPath, ['--experimental-strip-types', script], {
      cwd: process.cwd(),
      env: process.env,
      stdio: 'inherit',
    })

    child.on('exit', (code, signal) => {
      if (code === 0) {
        console.log(`[orders-maintenance] ${label} finished startedAt=${startedAt}`)
      } else {
        console.error(
          `[orders-maintenance] ${label} failed startedAt=${startedAt} code=${code ?? 'null'} signal=${signal ?? 'null'}`,
        )
      }
      resolve()
    })

    child.on('error', (error) => {
      console.error(`[orders-maintenance] ${label} failed startedAt=${startedAt}`, error)
      resolve()
    })
  })
}

function schedule(label: string, script: string, intervalMinutes: number) {
  const intervalMs = toMs(intervalMinutes)

  console.log(`[orders-maintenance] schedule ${label} every ${intervalMinutes} minute(s)`)

  setInterval(() => {
    void runScript(label, script)
  }, intervalMs)

  return () => runScript(label, script)
}

const runCloseExpired = schedule('close-expired-orders', 'src/scripts/close-expired-orders.ts', closeIntervalMinutes)
const runSyncProcessing = schedule('sync-processing-orders', 'src/scripts/sync-processing-orders.ts', syncIntervalMinutes)

async function bootstrap() {
  const startupDelayMs = Math.max(0, startupDelaySeconds) * 1000

  if (startupDelayMs > 0) {
    console.log(`[orders-maintenance] startup delay ${startupDelaySeconds} second(s)`)
    await sleep(startupDelayMs)
  }

  await Promise.all([runCloseExpired(), runSyncProcessing()])
}

void bootstrap()
