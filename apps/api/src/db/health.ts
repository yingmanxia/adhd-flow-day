import { prisma } from './client.js'

export type DatabaseStatus = 'ok' | 'unavailable'

const CHECK_TIMEOUT_MS = 2_000

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined
  return Promise.race([
    promise,
    new Promise<never>((_resolve, reject) => {
      timer = setTimeout(() => reject(new Error('database check timed out')), ms)
    }),
  ]).finally(() => {
    if (timer) clearTimeout(timer)
  })
}

export async function checkDatabase(): Promise<DatabaseStatus> {
  try {
    await withTimeout(prisma.$queryRaw`SELECT 1`, CHECK_TIMEOUT_MS)
    return 'ok'
  } catch {
    return 'unavailable'
  }
}
