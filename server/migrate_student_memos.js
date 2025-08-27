const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

console.log('生徒メモテーブルマイグレーション開始...');

try {
  // 生徒メモテーブルを作成
  db.exec(`
    CREATE TABLE IF NOT EXISTS class1_student_memos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      month TEXT NOT NULL,
      memo TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(student_id, month),
      FOREIGN KEY (student_id) REFERENCES class1_students(id) ON DELETE CASCADE
    )
  `);

  console.log('✅ 生徒メモテーブル作成完了');

  // インデックスを作成
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_student_memos_student_month 
    ON class1_student_memos(student_id, month)
  `);

  console.log('✅ 生徒メモインデックス作成完了');

} catch (error) {
  console.error('❌ 生徒メモテーブル作成エラー:', error);
  process.exit(1);
}

console.log('✅ 生徒メモテーブルマイグレーション完了'); 