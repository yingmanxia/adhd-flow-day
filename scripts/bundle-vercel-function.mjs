// 把 Vercel Function 源码入口预打包成一个自包含的 ESM 文件。
//
// 目的：workspace 包（@flowday/core / @flowday/types）的编译产物里有
// 无扩展名相对导入（from './completion'），Vercel 的 nft 逐文件复制到
// /var/task 后，Node ESM 不补扩展名 → Cannot find module → /api/* 全 500。
// esbuild 在 build 阶段把这些 workspace 代码内联进单文件，产物里只剩
// 第三方裸包导入（fastify / prisma / pg 等）和 node: 内建模块——这些能被
// Vercel 的 node_modules 正常解析，从而彻底绕开扩展名问题。
//
// 业务源码零改动，本地开发仍走 apps/api/src/server.ts。

import { build } from 'esbuild'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')

// 保持外部：这些是真实 npm 包，Vercel 会从依赖里解析；
// 只有 workspace 包（@flowday/*，通过相对路径进入）需要被内联。
const external = [
  'fastify',
  '@fastify/cors',
  '@prisma/client',
  '@prisma/adapter-pg',
  'pg',
  'dotenv',
  'zod',
  'pino',
  'node:*',
]

await build({
  entryPoints: [resolve(root, 'scripts/vercel-function-entry.js')],
  outfile: resolve(root, 'apps/api/dist/vercel-function.bundle.mjs'),
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  // 不能用 packages:'external'——那会把 @flowday/* 裸导入也外部化，
  // 恰好阻止了我们要的 workspace 内联。只精确列出真正的第三方包。
  external,
  logLevel: 'warning',
})

console.log('[build:function] api function bundle -> apps/api/dist/vercel-function.bundle.mjs')
