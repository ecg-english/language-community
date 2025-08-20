const db = require('./database');

console.log('Creating vocabulary tables for production...');

try {
  // vocabulary_wordsテーブルの作成
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
  console.log('✅ Created vocabulary_words table');

  // vocabulary_meaningsテーブルの作成
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
  console.log('✅ Created vocabulary_meanings table');

  // vocabulary_learning_contentsテーブルの作成
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
  console.log('✅ Created vocabulary_learning_contents table');

  console.log('🎉 All vocabulary tables created successfully!');
} catch (error) {
  console.error('❌ Error creating vocabulary tables:', error);
} 