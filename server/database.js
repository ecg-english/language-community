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
        role TEXT DEFAULT 'ビジター',
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

    // eventsテーブルのマイグレーション
    console.log('Checking events table structure...');
    try {
      const eventsColumns = db.prepare("PRAGMA table_info(events)").all();
      const eventsColumnNames = eventsColumns.map(col => col.name);
      
      // eventsテーブルに新しいカラムを追加
      if (!eventsColumnNames.includes('location')) {
        console.log('Adding location column to events table...');
        db.prepare('ALTER TABLE events ADD COLUMN location TEXT').run();
      }
      
      if (!eventsColumnNames.includes('cover_image')) {
        console.log('Adding cover_image column to events table...');
        db.prepare('ALTER TABLE events ADD COLUMN cover_image TEXT').run();
      }
      
      if (!eventsColumnNames.includes('updated_at')) {
        console.log('Adding updated_at column to events table...');
        db.prepare('ALTER TABLE events ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP').run();
      }
      
      // 古いカラム名を新しいカラム名に変更
      if (eventsColumnNames.includes('details') && !eventsColumnNames.includes('description')) {
        console.log('Renaming details column to description in events table...');
        db.prepare('ALTER TABLE events RENAME COLUMN details TO description').run();
      }
      
      console.log('Events table migration completed');
    } catch (error) {
      console.log('Events table migration error:', error);
    }

    // postsテーブルのマイグレーション
    console.log('Checking posts table structure...');
    try {
      const postsColumns = db.prepare("PRAGMA table_info(posts)").all();
      const postsColumnNames = postsColumns.map(col => col.name);
      
      // postsテーブルに新しいカラムを追加
      if (!postsColumnNames.includes('image_url')) {
        console.log('Adding image_url column to posts table...');
        db.prepare('ALTER TABLE posts ADD COLUMN image_url TEXT').run();
      }
      
      if (!postsColumnNames.includes('event_id')) {
        console.log('Adding event_id column to posts table...');
        db.prepare('ALTER TABLE posts ADD COLUMN event_id INTEGER').run();
      }

      // Q&A関連のカラムを追加
      if (!postsColumnNames.includes('is_anonymous')) {
        console.log('Adding is_anonymous column to posts table...');
        db.prepare('ALTER TABLE posts ADD COLUMN is_anonymous BOOLEAN DEFAULT 0').run();
      }

      if (!postsColumnNames.includes('question_type')) {
        console.log('Adding question_type column to posts table...');
        db.prepare('ALTER TABLE posts ADD COLUMN question_type TEXT').run();
      }

      if (!postsColumnNames.includes('original_user_id')) {
        console.log('Adding original_user_id column to posts table...');
        db.prepare('ALTER TABLE posts ADD COLUMN original_user_id INTEGER').run();
      }

      if (!postsColumnNames.includes('original_username')) {
        console.log('Adding original_username column to posts table...');
        db.prepare('ALTER TABLE posts ADD COLUMN original_username TEXT').run();
      }
      
      console.log('Posts table migration completed');
    } catch (error) {
      console.log('Posts table migration error:', error);
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

    // 既存のカテゴリを開いた状態に更新（マイグレーション）
    db.prepare(`
      UPDATE categories SET is_collapsed = 0 WHERE is_collapsed = 1
    `).run();

    console.log('Categories migration completed: all categories set to expanded state');

    // Study Board用のスキーマを強制適用
    console.log('Applying Study Board schema...');
    
    // postsテーブルにStudy Board用のカラムを追加
    try {
      db.prepare('ALTER TABLE posts ADD COLUMN is_study_log BOOLEAN DEFAULT 0').run();
      console.log('Added is_study_log column to posts table');
    } catch (error) {
      console.log('is_study_log column already exists or error:', error.message);
    }

    try {
      db.prepare('ALTER TABLE posts ADD COLUMN ai_response_enabled BOOLEAN DEFAULT 0').run();
      console.log('Added ai_response_enabled column to posts table');
    } catch (error) {
      console.log('ai_response_enabled column already exists or error:', error.message);
    }

    try {
      db.prepare('ALTER TABLE posts ADD COLUMN study_tags TEXT').run();
      console.log('Added study_tags column to posts table');
    } catch (error) {
      console.log('study_tags column already exists or error:', error.message);
    }

    try {
      db.prepare('ALTER TABLE posts ADD COLUMN study_meaning TEXT').run();
      console.log('Added study_meaning column to posts table');
    } catch (error) {
      console.log('study_meaning column already exists or error:', error.message);
    }

    try {
      db.prepare('ALTER TABLE posts ADD COLUMN target_language TEXT DEFAULT "English"').run();
      console.log('Added target_language column to posts table');
    } catch (error) {
      console.log('target_language column already exists or error:', error.message);
    }
    
    // Study Board用の新しいテーブルを作成
    try {
      db.prepare(`
        CREATE TABLE IF NOT EXISTS ai_responses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          post_id INTEGER NOT NULL,
          content TEXT NOT NULL,
          response_type TEXT DEFAULT 'study_support',
          target_language TEXT,
          generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
        )
      `).run();
      console.log('Created ai_responses table');
    } catch (error) {
      console.log('ai_responses table creation error:', error.message);
    }
    
    try {
      db.prepare(`
        CREATE TABLE IF NOT EXISTS user_vocabulary (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          post_id INTEGER NOT NULL,
          word_or_phrase TEXT NOT NULL,
          meaning TEXT,
          example_sentence TEXT,
          tags TEXT,
          saved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
          UNIQUE(user_id, post_id)
        )
      `).run();
      console.log('Created user_vocabulary table');
    } catch (error) {
      console.log('user_vocabulary table creation error:', error.message);
    }
    
    try {
      db.prepare(`
        CREATE TABLE IF NOT EXISTS saved_posts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          post_id INTEGER NOT NULL,
          saved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
          UNIQUE(user_id, post_id)
        )
      `).run();
      console.log('Created saved_posts table');
    } catch (error) {
      console.log('saved_posts table creation error:', error.message);
    }
    
    console.log('Study Board schema applied successfully');

    // 不足しているテーブルの確認と作成
    console.log('Checking for missing tables...');
    
    try {
      // post_likesテーブルの作成（likesテーブルのエイリアス）
      db.prepare(`
        CREATE TABLE IF NOT EXISTS post_likes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          post_id INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
          UNIQUE(user_id, post_id)
        )
      `).run();
      console.log('Created/verified post_likes table');
    } catch (error) {
      console.log('post_likes table creation error:', error.message);
    }

    // 既存のlikesテーブルからpost_likesへのデータ移行（存在する場合）
    try {
      const likesExists = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='likes'`).get();
      if (likesExists) {
        console.log('Migrating data from likes to post_likes...');
        db.prepare(`
          INSERT OR IGNORE INTO post_likes (user_id, post_id, created_at)
          SELECT user_id, post_id, created_at FROM likes
        `).run();
        console.log('Data migration completed');
      }
    } catch (error) {
      console.log('Data migration error (this is usually okay):', error.message);
    }

    // マイ単語帳専用テーブルの作成
    try {
      db.prepare(`
        CREATE TABLE IF NOT EXISTS vocabulary_words (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          post_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          word TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE(post_id, user_id)
        )
      `).run();
      console.log('Created vocabulary_words table');
    } catch (error) {
      console.log('vocabulary_words table creation error:', error.message);
    }

    try {
      db.prepare(`
        CREATE TABLE IF NOT EXISTS vocabulary_meanings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          post_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          meaning TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE(post_id, user_id)
        )
      `).run();
      console.log('Created vocabulary_meanings table');
    } catch (error) {
      console.log('vocabulary_meanings table creation error:', error.message);
    }

    try {
      db.prepare(`
        CREATE TABLE IF NOT EXISTS vocabulary_learning_contents (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          post_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          content TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE(post_id, user_id)
        )
      `).run();
      console.log('Created vocabulary_learning_contents table');
    } catch (error) {
      console.log('vocabulary_learning_contents table creation error:', error.message);
    }

    // Class1生徒テーブルの作成
    try {
      db.prepare(`
        CREATE TABLE IF NOT EXISTS class1_students (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          member_number TEXT UNIQUE,
          instructor_id INTEGER NOT NULL,
          email TEXT,
          memo TEXT,
          next_lesson_date DATE,
          lesson_completed_date DATE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (instructor_id) REFERENCES users(id)
        )
      `).run();
      console.log('Created class1_students table');
    } catch (error) {
      console.log('class1_students table creation error:', error.message);
    }

    // Class1週次チェックリストテーブル
    db.prepare(`
      CREATE TABLE IF NOT EXISTS class1_weekly_checklist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        week_key TEXT NOT NULL,
        student_id INTEGER NOT NULL,
        dm_scheduled BOOLEAN DEFAULT FALSE,
        lesson_completed BOOLEAN DEFAULT FALSE,
        next_lesson_date TEXT,
        lesson_completed_date TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(week_key, student_id)
      )
    `).run();

    // 注意: 新規ユーザーのデフォルトロールを「ビジター」に変更
    // 既存ユーザーのロールは変更されません
    console.log('New users will be assigned "ビジター" role by default');

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};

// データベースの初期化を実行
initializeDatabase();

module.exports = db; 