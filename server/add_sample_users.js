const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'language-community.db');
const db = new Database(dbPath);

console.log('=== サンプルユーザーデータ追加開始 ===');

async function addUsers() {
  try {
    // 既存のユーザーデータを確認
    const existingUsers = db.prepare('SELECT * FROM users').all();
    console.log('既存のユーザー数:', existingUsers.length);
    
    if (existingUsers.length === 0) {
      // パスワードをハッシュ化
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      // サンプルユーザーデータを追加
      const insertUser = db.prepare(`
        INSERT INTO users (username, email, password, role, created_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      `);
      
      // ユーザー1: Kairi (サーバー管理者)
      const result1 = insertUser.run('Kairi', 'kairidaiho12@gmail.com', hashedPassword, 'サーバー管理者');
      console.log('ユーザー1 (Kairi) 追加結果:', result1);
      
      // ユーザー2: たいち (サーバー管理者)
      const result2 = insertUser.run('たいち', 'taichimatsuura00@gmail.com', hashedPassword, 'サーバー管理者');
      console.log('ユーザー2 (たいち) 追加結果:', result2);
      
      // ユーザー3: Marino (ECG講師)
      const result3 = insertUser.run('Marino', 'marino@example.com', hashedPassword, 'ECG講師');
      console.log('ユーザー3 (Marino) 追加結果:', result3);
      
      // ユーザー4: robertovzz (Class1 Members)
      const result4 = insertUser.run('robertovzz', 'rjvzz98@gmail.com', hashedPassword, 'Class1 Members');
      console.log('ユーザー4 (robertovzz) 追加結果:', result4);
      
      // ユーザー5: yyy (Class1 Members)
      const result5 = insertUser.run('yyy', 'yyy@gmail.com', hashedPassword, 'Class1 Members');
      console.log('ユーザー5 (yyy) 追加結果:', result5);
      
      // 追加後の確認
      const newUsers = db.prepare('SELECT * FROM users').all();
      console.log('追加後のユーザー数:', newUsers.length);
      console.log('追加後のユーザーデータ:', newUsers);
      
      console.log('✅ サンプルユーザーデータの追加が完了しました');
    } else {
      console.log('既にユーザーデータが存在します');
      console.log('既存のユーザーデータ:', existingUsers);
    }
  } catch (error) {
    console.error('エラー:', error);
  }
}

addUsers().then(() => {
  console.log('=== サンプルユーザーデータ追加終了 ===');
  db.close();
}); 