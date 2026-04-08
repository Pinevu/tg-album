# Cloudflare Pages 环境变量配置清单

## 1. D1 数据库（已完成）
- Database name: tg_album_db
- Database ID: 7a0efaea-1991-4865-98bc-5327bfb587c4
- Region: APAC

## 2. Cloudflare Pages 环境变量
在你的 Pages 项目里添加以下变量：

### 必填
- **Variable name**: TG_BOT_TOKEN
- **Value**: 你的 Telegram Bot Token

- **Variable name**: TG_CHAT_ID
- **Value**: 你的 Telegram Chat ID

- **Variable name**: JWT_SECRET
- **Value**: 你的 JWT 密钥（建议用随机字符串，32-64 位）
  - 示例：`7f4c0b6e3d8a1f92c5b7e4a9d1c8f2036e7b5a1c9d4f8e2b6a3c7d1e9f0a4b2`

## 3. 版本接口
部署后可直接访问：
- `/api/version`

返回内容包含：
- `version`（来自 `package.json`）
- `git_commit` / `git_commit_short`
- `git_branch`
- `git_message`
- `git_commit_time`
- `build_time`

说明：版本元数据会在构建前由 `scripts/generate-version.mjs` 自动生成，因此前端显示和 API 返回保持一致。

## 4. 访问地址
部署完成后，访问地址会在 GitHub Actions 日志里显示，例如：
- https://tg-album.pages.dev
- https://tg-album.your-account.pages.dev

## 5. 下一步
配置完环境变量后，GitHub Actions 会自动执行：
1. 安装依赖
2. 自动生成版本元数据
3. 构建前端
4. 应用 D1 schema
5. 部署到 Cloudflare Pages

你可以在 GitHub 仓库的 **Actions** 页面查看部署进度：
- [Actions 页面](https://github.com/Pinevu/tg-album/actions)
