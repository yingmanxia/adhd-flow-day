/**
 * 认证空口子（架构 §5.5）：v1 单人本地，固定返回种子用户。
 * 后续 S13 接 JWT 时只改这个文件——从请求上下文取 userId，业务代码零改动。
 */
export const DEMO_USER_ID = '00000000-0000-4000-8000-000000000001'

export function currentUserId(): string {
  return DEMO_USER_ID
}
