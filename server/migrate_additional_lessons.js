const db = require('./database');

console.log('=== 追加レッスンテーブル作成開始 ===');

try {
  console.log('class1_additional_lessonsテーブルを作成中...');
  
  // テーブルが存在するかチェック
  const tableExists = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='class1_additional_lessons'
  `).get();
  
  if (tableExists) {
    console.log('✅ class1_additional_lessonsテーブルは既に存在します');
  } else {
    console.log('class1_additional_lessonsテーブルを作成中...');
    
    db.prepare(`
      CREATE TABLE class1_additional_lessons (
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
  }
  
  // テーブル構造を確認
  const columns = db.prepare(`PRAGMA table_info(class1_additional_lessons)`).all();
  console.log('class1_additional_lessonsテーブルのカラム:', columns.map(col => `${col.name} (${col.type}${col.notnull ? ' NOT NULL' : ''})`));
  
  // 日付カラムが存在するかチェック
  const hasNextLessonDate = columns.some(col => col.name === 'next_lesson_date');
  const hasLessonCompletedDate = columns.some(col => col.name === 'lesson_completed_date');
  
  if (!hasNextLessonDate) {
    console.log('next_lesson_dateカラムを追加中...');
    db.prepare('ALTER TABLE class1_additional_lessons ADD COLUMN next_lesson_date DATE').run();
    console.log('✅ next_lesson_dateカラムを追加しました');
  }
  
  if (!hasLessonCompletedDate) {
    console.log('lesson_completed_dateカラムを追加中...');
    db.prepare('ALTER TABLE class1_additional_lessons ADD COLUMN lesson_completed_date DATE').run();
    console.log('✅ lesson_completed_dateカラムを追加しました');
  }
  
  console.log('=== 追加レッスンテーブル作成完了 ===');
} catch (error) {
  console.error('❌ 追加レッスンテーブル作成エラー:', error);
  // エラーが発生してもサーバーは起動させる
  console.log('⚠️ エラーが発生しましたが、サーバーは起動を続行します');
} 