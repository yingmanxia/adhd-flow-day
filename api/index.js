// Vercel Node Function 入口（薄壳）。
//
// 真正的 handler 在 buildCommand 阶段由 `pnpm build:function` 预打包成
// apps/api/dist/vercel-function.bundle.mjs（见 scripts/bundle-vercel-function.mjs）：
// workspace 代码（@flowday/core / @flowday/types）被内联成单文件，产物里没有任何
// 相对导入，只剩第三方裸包导入（由 Vercel 从 node_modules 解析）。
//
// 这样 Vercel 的 nft 没有 workspace dist 文件可逐块复制，也就不会触发 Node ESM
// 对无扩展名相对导入的解析失败（Cannot find module ... → /api/* 500）。
// 详细踩坑记录见 onestep/docs/ADHD-踩坑日记.md。

import handler from '../apps/api/dist/vercel-function.bundle.mjs'

export default handler
