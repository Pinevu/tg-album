CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS albums (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  parent_id INTEGER,
  cover_photo_id INTEGER
);
CREATE INDEX IF NOT EXISTS idx_albums_parent ON albums(parent_id);

CREATE TABLE IF NOT EXISTS tg_pools (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  bot_token TEXT NOT NULL,
  chat_id TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  album_id INTEGER,
  tg_pool_id INTEGER,
  tg_file_id TEXT NOT NULL,
  tg_file_unique_id TEXT NOT NULL UNIQUE,
  original_filename TEXT,
  remark TEXT,
  width INTEGER,
  height INTEGER,
  file_size INTEGER,
  dominant_color_hex TEXT,
  uploaded_at INTEGER NOT NULL,
  deleted_at INTEGER,
  tg_message_id INTEGER
);
CREATE INDEX IF NOT EXISTS idx_photos_album ON photos(album_id);
CREATE INDEX IF NOT EXISTS idx_photos_uploaded_at ON photos(uploaded_at);
CREATE INDEX IF NOT EXISTS idx_photos_deleted_at ON photos(deleted_at);
CREATE INDEX IF NOT EXISTS idx_photos_filename ON photos(original_filename);

CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS photo_tags (
  photo_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (photo_id, tag_id)
);
CREATE INDEX IF NOT EXISTS idx_photo_tags_tag ON photo_tags(tag_id);

CREATE TABLE IF NOT EXISTS photo_metadata (
  photo_id INTEGER PRIMARY KEY,
  camera_make TEXT,
  camera_model TEXT,
  lens TEXT,
  aperture TEXT,
  shutter_speed TEXT,
  iso INTEGER,
  focal_length TEXT,
  gps_lat REAL,
  gps_lng REAL,
  taken_at INTEGER,
  raw_exif_json TEXT
);
CREATE INDEX IF NOT EXISTS idx_metadata_taken_at ON photo_metadata(taken_at);
