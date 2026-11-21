import type { IncomingMessage, ServerResponse } from 'node:http'
import { buildServer } from '../apps/api/src/server.js'
import { loadConfig } from '../apps/api/src/common/config.js'

// 从 buildServer 的返回类型推导，避免在根目录直接 import 'fastify'——
// 根包未声明该依赖，Vercel 的 pnpm 隔离安装下会报 TS2307。
type App = Awaited<ReturnType<typeof buildServer>>

/**
 * Vercel Node Function 入口：复用既有 Fastify buildServer，零业务代码改动。
 * 不在模块加载时初始化，避免冷启动阶段的环境变量缺失直接抛错；
 * 首个请求到达时构建一次，之后同一实例内复用。
 */
let appPromise: Promise<App> | undefined

function getApp(): Promise<App> {
  if (!appPromise) {
    appPromise = buildServer(loadConfig()).then(async (app) => {
      // 触发插件与路由注册；不调用 listen()，Serverless 环境没有监听端口。
      await app.ready()
      return app
    })
  }
  return appPromise
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const app = await getApp()
  // 把 Vercel 传入的原生 Node 请求交给 Fastify 底层 server 分发，
  // 保留原始 URL（含 /api 前缀），命中现有路由。
  app.server.emit('request', req, res)
}
