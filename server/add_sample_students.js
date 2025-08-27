const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'language-community.db');
const db = new Database(dbPath);

console.log('=== サンプル生徒データ追加開始 ===');

try {
  // 既存の生徒データを確認
  const existingStudents = db.prepare('SELECT * FROM class1_students').all();
  console.log('既存の生徒数:', existingStudents.length);
  
  if (existingStudents.length === 0) {
    // サンプル生徒データを追加
    const insertStudent = db.prepare(`
      INSERT INTO class1_students (name, instructor_id, email, created_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `);
    
    // 生徒1: yyy (ID: 16)
    const result1 = insertStudent.run('yyy', 1, 'yyy@gmail.com');
    console.log('生徒1 (yyy) 追加結果:', result1);
    
    // 生徒2: robertovzz (ID: 15)
    const result2 = insertStudent.run('robertovzz', 5, 'rjvzz98@gmail.com');
    console.log('生徒2 (robertovzz) 追加結果:', result2);
    
    // 追加後の確認
    const newStudents = db.prepare('SELECT * FROM class1_students').all();
    console.log('追加後の生徒数:', newStudents.length);
    console.log('追加後の生徒データ:', newStudents);
    
    // 特定の生徒IDで確認
    const student16 = db.prepare('SELECT * FROM class1_students WHERE id = 16').get();
    console.log('生徒ID 16のデータ:', student16);
    
    const student15 = db.prepare('SELECT * FROM class1_students WHERE id = 15').get();
    console.log('生徒ID 15のデータ:', student15);
    
    console.log('✅ サンプル生徒データの追加が完了しました');
  } else {
    console.log('既に生徒データが存在します');
    console.log('既存の生徒データ:', existingStudents);
  }
} catch (error) {
  console.error('エラー:', error);
}

console.log('=== サンプル生徒データ追加終了 ===');
db.close(); 