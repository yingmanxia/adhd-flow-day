// 方案 C：Vercel Function 的「源码入口」。
//
// 这个文件不直接被 Vercel 加载，而是作为 esbuild 的 entry，在 buildCommand 阶段
// 被打包成自包含的 apps/api/dist/vercel-function.bundle.mjs，再由 api/index.js 引用。
//
// 为什么要预打包：Vercel 用 nft 逐个复制 workspace 的 dist 文件到 /var/task，
// 而 core/types 的 dist 里存在无扩展名的相对导入（from './completion'），
// Node ESM 不会补 .js 后缀 → 加载失败 → 所有 /api/* 请求 500。
// esbuild 会把 workspace 代码全部内联进单文件，产物里只剩裸包导入（交给
// Vercel 从 node_modules 解析），扩展名问题从根上消失，业务源码零改动。

import { buildServer } from '../apps/api/dist/server.js'
import { loadConfig } from '../apps/api/dist/common/config.js'

// 模块级缓存：同一函数实例内复用已 ready 的 Fastify，避免每个请求重复注册插件/路由。
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
