const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'language-community.db');
const db = new Database(dbPath);

console.log('=== 生徒データデバッグ開始 ===');

try {
  // テーブル存在確認
  const tableExists = db.prepare(`
    SELECT name FROM sqlite_master WHERE type='table' AND name='class1_students'
  `).get();
  
  console.log('class1_studentsテーブル存在:', !!tableExists);
  
  if (tableExists) {
    // テーブル構造確認
    const tableInfo = db.prepare("PRAGMA table_info(class1_students)").all();
    console.log('テーブル構造:', tableInfo);
    
    // 全生徒データ取得
    const allStudents = db.prepare('SELECT * FROM class1_students').all();
    console.log('全生徒数:', allStudents.length);
    console.log('全生徒データ:', allStudents);
    
    // 特定の生徒IDで検索
    const student16 = db.prepare('SELECT * FROM class1_students WHERE id = 16').get();
    console.log('生徒ID 16のデータ:', student16);
    
    const student15 = db.prepare('SELECT * FROM class1_students WHERE id = 15').get();
    console.log('生徒ID 15のデータ:', student15);
    
    // 生徒IDの範囲確認
    const minId = db.prepare('SELECT MIN(id) as min_id FROM class1_students').get();
    const maxId = db.prepare('SELECT MAX(id) as max_id FROM class1_students').get();
    console.log('生徒ID範囲:', { min: minId.min_id, max: maxId.max_id });
  }
} catch (error) {
  console.error('デバッグエラー:', error);
}

console.log('=== 生徒データデバッグ終了 ===');
db.close(); 