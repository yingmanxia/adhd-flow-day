// Vercel Node Function 入口（纯 JS + 已编译 dist）。
//
// 为什么不用 TS、且只引用 dist：
// - @vercel/node 会对 api/ 下的 .ts 入口做「二次 tsc 编译」，而这次编译
//   不认 monorepo 的 tsconfig paths（@flowday/* → packages/*/dist/index.d.ts），
//   会把 workspace 包的类型解析成空壳，报 TS2305 has no exported member。
// - 改成 .js 入口可跳过二次类型检查；buildCommand（turbo build）已先把
//   apps/api 编译到 dist，这里只引用编译产物，依赖交给 Verc 的 esbuild/nft 打包。
// - 业务代码零改动，本地开发仍走 apps/api/src/server.ts。

import { buildServer } from '../apps/api/dist/server.js'
import { loadConfig } from '../apps/api/dist/common/config.js'

// 模块级缓存：同一函数实例内复用 Fastify app，避免每个请求重新建连接池。
let appPromise

function getApp() {
  if (!appPromise) {
    appPromise = buildServer(loadConfig()).then(async (app) => {
      // 触发插件与路由注册；不调用 listen()，Serverless 环境没有监听端口。
      await app.ready()
      return app
    })
  }
  return appPromise
}

export default async function handler(req, res) {
  const app = await getApp()
  // 把 Vercel 传入的原生 Node 请求交给 Fastify 底层 server 分发，
  // 保留原始 URL（含 /api 前缀），命中现有路由。
  app.server.emit('request', req, res)
}
