import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

// 无 Rust engine 模式（schema.prisma 的 engineType = "client"）：
// 用 pg 驱动适配器建立连接池，Vercel 打包不再依赖二进制 query engine，
// 避免 monorepo 部署时 engine 被剥离导致运行时 503。
//
// 本地：DATABASE_URL 指向 127.0.0.1 的 PostgreSQL 16。
// 云端：DATABASE_URL 指向 Neon 的 pooled 连接串（-pooler 端点）。
// 两种环境对业务代码完全透明。
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })

// 单例：Fastify 进程 / Vercel Function 实例内共用连接池。Prisma 是懒连接，
// 进程启动不要求 DB 已就绪，连通性由 /ready 的 checkDatabase() 判定。
export const prisma = new PrismaClient({ adapter })

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect()
}
