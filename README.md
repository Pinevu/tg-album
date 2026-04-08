# TG Album Admin

## Dev
```
npm install
npm run dev
```

## Build
```
npm run build
```

## Versioning
项目会在 `npm run dev` / `npm run build` 前自动执行：
- `node ./scripts/generate-version.mjs`

它会生成两份版本元数据：
- `src/generated/version.ts`（前端使用）
- `functions/_generated/version.ts`（Pages Functions / API 使用）

因此：
- 前端登录页/后台顶部版本号会自动显示当前 `package.json` 版本 + Git 短提交
- 后端可直接通过 `/api/version` 查看线上实际版本、提交、构建时间

## Pages Deploy
Cloudflare Pages 会自动使用：
- Build command: `npm run build`
- Build output directory: `dist`
- Pages Functions: `functions/`

## D1
执行一次 schema 初始化：
```
wrangler d1 execute tg_album_db --file=./schema.sql
```

## Env Vars
在 Cloudflare Pages 中设置：
- `TG_BOT_TOKEN`
- `TG_CHAT_ID`
- `JWT_SECRET`

## D1 Binding
- `DB` → `tg_album_db`

## Local Notes
- 使用 Hash Router，避免 Pages SPA 刷新 404
- 后端函数入口位于 `functions/api/index.ts`
- 公开健康检查：`/api/health`
- 公开版本接口：`/api/version`

## Project Structure
- `src/` Vue 前端
- `functions/` Pages Functions
- `schema.sql` D1 初始化
