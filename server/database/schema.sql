-- 既存のテーブル定義...

-- 学習ログ投稿用のテーブル（postsテーブルを拡張）
ALTER TABLE posts ADD COLUMN is_study_log BOOLEAN DEFAULT 0;
ALTER TABLE posts ADD COLUMN ai_response_enabled BOOLEAN DEFAULT 0;
ALTER TABLE posts ADD COLUMN study_tags TEXT; -- JSON形式でタグを保存
ALTER TABLE posts ADD COLUMN target_language TEXT; -- 学習対象言語

-- AI返信用のテーブル
CREATE TABLE IF NOT EXISTS ai_responses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  response_type TEXT DEFAULT 'study_support',
  target_language TEXT,
  generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

-- マイ単語帳用のテーブル
CREATE TABLE IF NOT EXISTS user_vocabulary (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  post_id INTEGER NOT NULL,
  word_or_phrase TEXT NOT NULL,
  meaning TEXT,
  example_sentence TEXT,
  tags TEXT, -- JSON形式
  saved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  UNIQUE(user_id, post_id)
);

-- 投稿の保存機能用のテーブル
CREATE TABLE IF NOT EXISTS saved_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  post_id INTEGER NOT NULL,
  saved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  UNIQUE(user_id, post_id)
); 