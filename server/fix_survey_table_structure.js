const db = require('./database');

console.log('=== surveysテーブル構造修正開始 ===');

try {
  // 既存のテーブルを削除
  console.log('既存のsurveysテーブルを削除中...');
  db.prepare('DROP TABLE IF EXISTS surveys').run();
  console.log('✅ 既存のsurveysテーブルを削除しました');

  // 新しいテーブルを作成
  console.log('新しいsurveysテーブルを作成中...');
  db.prepare(`
    CREATE TABLE surveys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      member_number TEXT NOT NULL,
      month TEXT NOT NULL,
      satisfaction_rating INTEGER NOT NULL,
      recommendation_score INTEGER NOT NULL,
      instructor_feedback TEXT,
      lesson_feedback TEXT,
      next_month_goals TEXT,
      other_comments TEXT,
      completed BOOLEAN DEFAULT 0,
      submitted_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(member_number, month)
    )
  `).run();
  console.log('✅ 新しいsurveysテーブルを作成しました');

  // テーブル構造を確認
  console.log('テーブル構造を確認中...');
  const columns = db.prepare(`PRAGMA table_info(surveys)`).all();
  console.log('surveysテーブルのカラム:', columns.map(col => `${col.name} (${col.type}${col.notnull ? ' NOT NULL' : ''})`));

  console.log('=== surveysテーブル構造修正完了 ===');
} catch (error) {
  console.error('❌ surveysテーブル構造修正エラー:', error);
  throw error;
} 