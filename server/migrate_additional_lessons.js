const db = require('./database');

console.log('=== 追加レッスンテーブル作成開始 ===');

try {
  console.log('class1_additional_lessonsテーブルを作成中...');
  
  db.prepare(`
    CREATE TABLE IF NOT EXISTS class1_additional_lessons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      week_key TEXT NOT NULL,
      dm_scheduled BOOLEAN DEFAULT 0,
      lesson_completed BOOLEAN DEFAULT 0,
      next_lesson_date DATE,
      lesson_completed_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES class1_students(id)
    )
  `).run();
  
  console.log('✅ class1_additional_lessonsテーブルを作成しました');
  
  // テーブル構造を確認
  const columns = db.prepare(`PRAGMA table_info(class1_additional_lessons)`).all();
  console.log('class1_additional_lessonsテーブルのカラム:', columns.map(col => `${col.name} (${col.type}${col.notnull ? ' NOT NULL' : ''})`));
  
  console.log('=== 追加レッスンテーブル作成完了 ===');
} catch (error) {
  console.error('❌ 追加レッスンテーブル作成エラー:', error);
  throw error;
} 