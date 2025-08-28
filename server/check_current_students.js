const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'language-community.db');
const db = new Database(dbPath);

console.log('=== 現在のデータベース状況確認 ===');

try {
  // class1_studentsテーブルの全データ
  const class1Students = db.prepare('SELECT * FROM class1_students ORDER BY id').all();
  console.log('\n📊 class1_studentsテーブル:');
  console.log(`データ数: ${class1Students.length}`);
  class1Students.forEach(student => {
    console.log(`  - ID: ${student.id}, Name: ${student.name}, Email: ${student.email}, Instructor: ${student.instructor_id}`);
  });

  // usersテーブルの全データ（Class1 Members）
  const class1Members = db.prepare(`
    SELECT id, username, email, role FROM users WHERE role = 'Class1 Members'
  `).all();
  console.log('\n📊 Class1 Membersユーザー:');
  console.log(`データ数: ${class1Members.length}`);
  class1Members.forEach(user => {
    console.log(`  - ID: ${user.id}, Name: ${user.username}, Email: ${user.email}, Role: ${user.role}`);
  });

  // 全ユーザーのロール確認
  const allUsers = db.prepare('SELECT id, username, email, role FROM users').all();
  console.log('\n📊 全ユーザーとロール:');
  console.log(`データ数: ${allUsers.length}`);
  allUsers.forEach(user => {
    console.log(`  - ID: ${user.id}, Name: ${user.username}, Email: ${user.email}, Role: ${user.role}`);
  });

  // ID 17のユーザーを特定
  const user17 = db.prepare('SELECT * FROM users WHERE id = 17').get();
  console.log('\n🔍 ID 17のユーザー詳細:');
  if (user17) {
    console.log(`  - ID: ${user17.id}, Name: ${user17.username}, Email: ${user17.email}, Role: ${user17.role}`);
  } else {
    console.log('  - ID 17のユーザーは存在しません');
  }

  // TEST-USERの詳細
  const testUser = db.prepare("SELECT * FROM users WHERE username = 'TEST-USER'").get();
  console.log('\n🔍 TEST-USERの詳細:');
  if (testUser) {
    console.log(`  - ID: ${testUser.id}, Name: ${testUser.username}, Email: ${testUser.email}, Role: ${testUser.role}`);
  } else {
    console.log('  - TEST-USERは存在しません');
  }

} catch (error) {
  console.error('エラー:', error);
}

console.log('\n=== 確認完了 ===');
db.close(); 