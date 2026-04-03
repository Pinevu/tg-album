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

## Project Structure
- `src/` Vue 前端
- `functions/` Pages Functions
- `schema.sql` D1 初始化
