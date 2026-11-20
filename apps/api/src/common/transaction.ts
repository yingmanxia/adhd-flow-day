import { prisma } from '../db/client.js'

/**
 * 多步写入统一走事务；Service 不直接碰 prisma.$transaction，
 * 便于单测时只 mock 这一个入口。
 */
export function inTransaction<T>(work: (tx: typeof prisma) => Promise<T>): Promise<T> {
  return prisma.$transaction((tx) => work(tx as typeof prisma))
}
