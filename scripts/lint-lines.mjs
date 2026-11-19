import { readdirSync, readFileSync, statSync } from 'node:fs'
import { extname, join, relative } from 'node:path'

const ROOTS = ['apps', 'packages']
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs'])
const IGNORED_DIRS = new Set(['node_modules', 'dist', '.turbo', 'coverage'])
const WARN_LINES = 400
const FAIL_LINES = 1000

const warnings = []
const failures = []

function visit(directory) {
  for (const entry of readdirSync(directory)) {
    if (IGNORED_DIRS.has(entry)) continue
    const path = join(directory, entry)
    if (statSync(path).isDirectory()) {
      visit(path)
      continue
    }
    if (!SOURCE_EXTENSIONS.has(extname(path))) continue
    const lines = readFileSync(path, 'utf8').split('\n').length
    const label = `${relative(process.cwd(), path)}: ${lines} 行`
    if (lines > FAIL_LINES) failures.push(label)
    else if (lines > WARN_LINES) warnings.push(label)
  }
}

for (const root of ROOTS) visit(root)

if (warnings.length > 0) {
  console.warn(
    `[lint:lines] 超过 ${WARN_LINES} 行，建议拆分：\n${warnings.map((x) => `  - ${x}`).join('\n')}`,
  )
}
if (failures.length > 0) {
  console.error(
    `[lint:lines] 超过硬上限 ${FAIL_LINES} 行，必须拆分：\n${failures.map((x) => `  - ${x}`).join('\n')}`,
  )
  process.exit(1)
}
console.log(`[lint:lines] 通过：无文件超过 ${FAIL_LINES} 行（告警 ${warnings.length} 个）`)
