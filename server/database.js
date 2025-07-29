const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'community.db');
const db = new Database(dbPath);

// WALモードを有効化
db.pragma('journal_mode = WAL');

// テーブルの作成
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Trial参加者',
    bio TEXT DEFAULT '',
    avatar_url TEXT,
    goal TEXT DEFAULT '',
    message TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    is_collapsed BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS channels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    category_id INTEGER NOT NULL,
    channel_type TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    channel_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (channel_id) REFERENCES channels (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    post_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE,
    UNIQUE(user_id, post_id)
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    post_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    target_audience TEXT,
    event_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    participation_method TEXT,
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users (id)
  );
`);

// 初期カテゴリの作成（既存のカテゴリがある場合は作成しない）
const checkExistingCategories = db.prepare('SELECT COUNT(*) as count FROM categories').get();
if (checkExistingCategories.count === 0) {
  console.log('初期カテゴリを作成しています...');
  const insertCategory = db.prepare(`
    INSERT INTO categories (name) VALUES (?)
  `);

  insertCategory.run('English Learning');
  insertCategory.run('日本語学習');
  console.log('初期カテゴリが作成されました');
} else {
  console.log('既存のカテゴリが存在するため、初期カテゴリの作成をスキップします');
}

// 既存のユーザーテーブルにbioカラムを追加（存在しない場合のみ）
try {
  db.exec('ALTER TABLE users ADD COLUMN bio TEXT DEFAULT ""');
  console.log('bioカラムを追加しました');
} catch (error) {
  // カラムが既に存在する場合は無視
  if (!error.message.includes('duplicate column name')) {
    console.error('bioカラムの追加に失敗:', error);
  }
}

console.log('データベースが初期化されました');

module.exports = db; 