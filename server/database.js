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
        display_order INTEGER DEFAULT 0,
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
        display_order INTEGER DEFAULT 0,
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
        description TEXT,
        event_date DATE NOT NULL,
        start_time TIME,
        end_time TIME,
        location TEXT,
        cover_image TEXT,
        target_audience TEXT,
        participation_method TEXT,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users (id)
      )
    `).run();

    // イベント参加者テーブルの作成
    db.prepare(`
      CREATE TABLE IF NOT EXISTS event_attendees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events (id),
        FOREIGN KEY (user_id) REFERENCES users (id),
        UNIQUE(event_id, user_id)
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

    // データベースマイグレーション：ユーザーテーブルに新しいカラムを追加
    console.log('Running database migrations...');
    
    // 新しいカラムが存在するかチェック
    const columns = db.prepare("PRAGMA table_info(users)").all();
    const columnNames = columns.map(col => col.name);
    
    // monthly_reflectionカラムを追加
    if (!columnNames.includes('monthly_reflection')) {
      console.log('Adding monthly_reflection column to users table...');
      db.prepare('ALTER TABLE users ADD COLUMN monthly_reflection TEXT').run();
    }
    
    // monthly_goalカラムを追加
    if (!columnNames.includes('monthly_goal')) {
      console.log('Adding monthly_goal column to users table...');
      db.prepare('ALTER TABLE users ADD COLUMN monthly_goal TEXT').run();
    }
    
    // last_monthly_updateカラムを追加
    if (!columnNames.includes('last_monthly_update')) {
      console.log('Adding last_monthly_update column to users table...');
      db.prepare('ALTER TABLE users ADD COLUMN last_monthly_update DATE').run();
    }
    
    // native_languageカラムを追加
    if (!columnNames.includes('native_language')) {
      console.log('Adding native_language column to users table...');
      db.prepare('ALTER TABLE users ADD COLUMN native_language TEXT').run();
    }
    
    // target_languagesカラムを追加
    if (!columnNames.includes('target_languages')) {
      console.log('Adding target_languages column to users table...');
      db.prepare('ALTER TABLE users ADD COLUMN target_languages TEXT').run();
    }
    
    // countryカラムを追加
    if (!columnNames.includes('country')) {
      console.log('Adding country column to users table...');
      db.prepare('ALTER TABLE users ADD COLUMN country TEXT').run();
    }
    
    // timezoneカラムを追加
    if (!columnNames.includes('timezone')) {
      console.log('Adding timezone column to users table...');
      db.prepare('ALTER TABLE users ADD COLUMN timezone TEXT').run();
    }
    
    // discord_usernameカラムを追加
    if (!columnNames.includes('discord_username')) {
      console.log('Adding discord_username column to users table...');
      db.prepare('ALTER TABLE users ADD COLUMN discord_username TEXT').run();
    }
    
    // instagram_idカラムを追加
    if (!columnNames.includes('instagram_id')) {
      console.log('Adding instagram_id column to users table...');
      db.prepare('ALTER TABLE users ADD COLUMN instagram_id TEXT').run();
    }
    
    // postsテーブルにimage_urlカラムを追加
    const postsColumns = db.prepare("PRAGMA table_info(posts)").all();
    const postsColumnNames = postsColumns.map(col => col.name);
    
    if (!postsColumnNames.includes('image_url')) {
      console.log('Adding image_url column to posts table...');
      db.prepare('ALTER TABLE posts ADD COLUMN image_url TEXT').run();
    }
    
    // categoriesテーブルにdisplay_orderカラムを追加
    const categoriesColumns = db.prepare("PRAGMA table_info(categories)").all();
    const categoriesColumnNames = categoriesColumns.map(col => col.name);
    
    if (!categoriesColumnNames.includes('display_order')) {
      console.log('Adding display_order column to categories table...');
      db.prepare('ALTER TABLE categories ADD COLUMN display_order INTEGER DEFAULT 0').run();
    }
    
    // channelsテーブルにdisplay_orderカラムを追加
    const channelsColumns = db.prepare("PRAGMA table_info(channels)").all();
    const channelsColumnNames = channelsColumns.map(col => col.name);
    
    if (!channelsColumnNames.includes('display_order')) {
      console.log('Adding display_order column to channels table...');
      db.prepare('ALTER TABLE channels ADD COLUMN display_order INTEGER DEFAULT 0').run();
    }
    
    console.log('Database migrations completed.');

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