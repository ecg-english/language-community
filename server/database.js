const Database = require('better-sqlite3');
const path = require('path');

// データベースパスの設定
let dbPath;
if (process.env.DATABASE_PATH) {
  dbPath = process.env.DATABASE_PATH;
} else if (process.env.NODE_ENV === 'production') {
  // Renderの永続化ディスクを使用
  dbPath = '/opt/render/data/language-community.db';
} else {
  // 開発環境
  dbPath = path.join(__dirname, 'language-community.db');
}

console.log('Database path:', dbPath);

const db = new Database(dbPath);

// データベースの初期化
const initializeDatabase = () => {
  try {
    console.log('Initializing database...');
    
    // ユーザーテーブルの作成
    db.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'Trial参加者',
        bio TEXT,
        avatar_url TEXT,
        message TEXT,
        native_language TEXT,
        target_languages TEXT,
        country TEXT,
        timezone TEXT,
        last_monthly_update DATE,
        monthly_reflection TEXT,
        monthly_goal TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // カテゴリテーブルの作成
    db.prepare(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        is_collapsed BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // チャンネルテーブルの作成
    db.prepare(`
      CREATE TABLE IF NOT EXISTS channels (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        channel_type TEXT NOT NULL,
        description TEXT,
        category_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories (id)
      )
    `).run();

    // 投稿テーブルの作成
    db.prepare(`
      CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        user_id INTEGER,
        channel_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (channel_id) REFERENCES channels (id)
      )
    `).run();

    // いいねテーブルの作成
    db.prepare(`
      CREATE TABLE IF NOT EXISTS likes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        post_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (post_id) REFERENCES posts (id),
        UNIQUE(user_id, post_id)
      )
    `).run();

    // コメントテーブルの作成
    db.prepare(`
      CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        user_id INTEGER,
        post_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (post_id) REFERENCES posts (id)
      )
    `).run();

    // イベントテーブルの作成
    db.prepare(`
      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        details TEXT,
        target_audience TEXT,
        start_time DATETIME NOT NULL,
        end_time DATETIME NOT NULL,
        participation_method TEXT,
        created_by INTEGER,
        created_by_name TEXT,
        created_by_role TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users (id)
      )
    `).run();

    // 月次更新通知テーブルの作成
    db.prepare(`
      CREATE TABLE IF NOT EXISTS monthly_notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        year INTEGER NOT NULL,
        month INTEGER NOT NULL,
        is_completed BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        UNIQUE(user_id, year, month)
      )
    `).run();

    // 初期カテゴリの作成（存在しない場合のみ）
    const existingCategories = db.prepare('SELECT COUNT(*) as count FROM categories').get();
    if (existingCategories.count === 0) {
      console.log('Creating initial categories...');
      
      const insertCategory = db.prepare('INSERT INTO categories (name) VALUES (?)');
      insertCategory.run('English Learning');
      insertCategory.run('日本語学習');
      
      console.log('Initial categories created successfully');
    } else {
      console.log('Existing categories found, skipping initial category creation');
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};

// データベースの初期化を実行
initializeDatabase();

module.exports = db; 