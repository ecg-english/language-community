-- 既存のテーブル定義...

-- 学習ログ投稿用のテーブル（postsテーブルを拡張）
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_study_log BOOLEAN DEFAULT FALSE;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS ai_response_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS study_tags TEXT; -- JSON形式でタグを保存
ALTER TABLE posts ADD COLUMN IF NOT EXISTS target_language VARCHAR(50); -- 学習対象言語

-- AI返信用のテーブル
CREATE TABLE IF NOT EXISTS ai_responses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT NOT NULL,
  content TEXT NOT NULL,
  response_type VARCHAR(50) DEFAULT 'study_support',
  target_language VARCHAR(50),
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  INDEX idx_post_id (post_id),
  INDEX idx_generated_at (generated_at)
);

-- マイ単語帳用のテーブル
CREATE TABLE IF NOT EXISTS user_vocabulary (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  post_id INT NOT NULL,
  word_or_phrase TEXT NOT NULL,
  meaning TEXT,
  example_sentence TEXT,
  tags TEXT, -- JSON形式
  saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_post (user_id, post_id),
  INDEX idx_user_id (user_id),
  INDEX idx_saved_at (saved_at)
);

-- 投稿の保存機能用のテーブル
CREATE TABLE IF NOT EXISTS saved_posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  post_id INT NOT NULL,
  saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_post_save (user_id, post_id),
  INDEX idx_user_id (user_id),
  INDEX idx_saved_at (saved_at)
); 