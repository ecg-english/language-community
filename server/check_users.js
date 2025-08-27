const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'language-community.db');
const db = new Database(dbPath);

console.log('=== ユーザーデータ確認開始 ===');

try {
  // テーブル存在確認
  const tableExists = db.prepare(`
    SELECT name FROM sqlite_master WHERE type='table' AND name='users'
  `).get();
  
  console.log('usersテーブル存在:', !!tableExists);
  
  if (tableExists) {
    // 全ユーザーデータ取得
    const allUsers = db.prepare('SELECT * FROM users').all();
    console.log('全ユーザー数:', allUsers.length);
    console.log('全ユーザーデータ:', allUsers);
    
    // 講師ロールのユーザーを確認
    const instructors = db.prepare(`
      SELECT * FROM users 
      WHERE role IN ('ECG講師', 'JCG講師', 'サーバー管理者')
    `).all();
    console.log('講師数:', instructors.length);
    console.log('講師データ:', instructors);
  }
} catch (error) {
  console.error('エラー:', error);
}

console.log('=== ユーザーデータ確認終了 ===');
db.close(); 