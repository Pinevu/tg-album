import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const root = path.resolve(__dirname, '..')

const pkgPath = path.join(root, 'package.json')
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))

const safeExec = (cmd, fallback = '') => {
  try {
    return execSync(cmd, { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() || fallback
  } catch {
    return fallback
  }
}

const version = String(pkg.version || '0.0.0')
const appName = String(pkg.name || 'tg-album-admin')
const gitCommit = safeExec('git rev-parse HEAD', 'unknown')
const gitCommitShort = safeExec('git rev-parse --short HEAD', 'unknown')
const gitBranch = safeExec('git branch --show-current', 'unknown')
const gitMessage = safeExec('git log -1 --pretty=%s', '')
const gitCommitTime = safeExec('git log -1 --date=iso-strict --pretty=%ad', '')
const buildTime = new Date().toISOString()

const content = `export const APP_VERSION = ${JSON.stringify(version)} as const
export const APP_NAME = ${JSON.stringify(appName)} as const
export const GIT_COMMIT = ${JSON.stringify(gitCommit)} as const
export const GIT_COMMIT_SHORT = ${JSON.stringify(gitCommitShort)} as const
export const GIT_BRANCH = ${JSON.stringify(gitBranch)} as const
export const GIT_MESSAGE = ${JSON.stringify(gitMessage)} as const
export const GIT_COMMIT_TIME = ${JSON.stringify(gitCommitTime)} as const
export const BUILD_TIME = ${JSON.stringify(buildTime)} as const

export const APP_VERSION_INFO = {
  app_name: APP_NAME,
  version: APP_VERSION,
  git_commit: GIT_COMMIT,
  git_commit_short: GIT_COMMIT_SHORT,
  git_branch: GIT_BRANCH,
  git_message: GIT_MESSAGE,
  git_commit_time: GIT_COMMIT_TIME,
  build_time: BUILD_TIME,
} as const
`

const targets = [
  path.join(root, 'src', 'generated', 'version.ts'),
  path.join(root, 'functions', '_generated', 'version.ts'),
]

for (const target of targets) {
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, content, 'utf8')
  console.log(`generated: ${path.relative(root, target)}`)
}
