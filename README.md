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

## D1 Schema
```
wrangler d1 execute tg_album_db --file=./schema.sql
```

## Deploy
```
npx wrangler pages deploy ./dist --project-name tg-album
```

## Env Vars
- TG_BOT_TOKEN
- TG_CHAT_ID
- JWT_SECRET

## Features Added
- Albums Tree (/api/albums/tree)
- Photo file proxy (/api/photos/file/:id)
- Batch tag/move/delete
- TG deleteMessage on hard delete
- EXIF + dominant color extraction on upload
- Upload remark support
- Recycle bin UI
- Photo detail drawer + remark edit
- Tag selector + album filter
- Masonry layout
