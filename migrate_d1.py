import json
sql = '''
CREATE TABLE IF NOT EXISTS tg_pools (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  bot_token TEXT NOT NULL,
  chat_id TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
ALTER TABLE albums ADD COLUMN visibility TEXT NOT NULL DEFAULT 'private';
ALTER TABLE photos ADD COLUMN tg_pool_id INTEGER;
INSERT OR IGNORE INTO albums (name, parent_id, visibility) VALUES ('未分类', NULL, 'private');
'''
print(json.dumps({'sql': sql}))
