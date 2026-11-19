import { PrismaClient } from '@prisma/client'

// 单例：Fastify 进程内共用连接池。Prisma 是懒连接，进程启动不要求 DB 已就绪，
// 真正的连通性由 /ready 的 checkDatabase() 判定（S11 要求 DB 挂掉时 /ready 非 200）。
export const prisma = new PrismaClient()

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect()
}
