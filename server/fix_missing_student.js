const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'language-community.db');
const db = new Database(dbPath);

console.log('=== 不足生徒データ修正開始 ===');

try {
  // 現在のclass1_studentsテーブルを確認
  const currentStudents = db.prepare('SELECT * FROM class1_students ORDER BY id').all();
  console.log('\n📊 現在のclass1_students:');
  currentStudents.forEach(student => {
    console.log(`  - ID: ${student.id}, Name: ${student.name}, Email: ${student.email}`);
  });

  // TEST-USERがclass1_studentsに存在するかチェック
  const testUserInStudents = db.prepare("SELECT * FROM class1_students WHERE name = 'TEST-USER'").get();
  
  if (!testUserInStudents) {
    console.log('\n❌ TEST-USERがclass1_studentsテーブルに存在しません');
    console.log('🔧 TEST-USERを追加します...');
    
    // TEST-USERをID 17で追加
    try {
      const result = db.prepare(`
        INSERT INTO class1_students (id, name, instructor_id, email, created_at, updated_at)
        VALUES (17, 'TEST-USER', 1, 'test@example.com', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).run();
      
      console.log('✅ TEST-USER追加成功:', result);
    } catch (error) {
      console.error('❌ TEST-USER追加エラー:', error);
      
      // 既存のID 17があるかチェック
      const existingId17 = db.prepare('SELECT * FROM class1_students WHERE id = 17').get();
      if (existingId17) {
        console.log('ℹ️  ID 17は既に存在します:', existingId17);
      }
    }
  } else {
    console.log('\n✅ TEST-USERは既にclass1_studentsテーブルに存在します');
    console.log('詳細:', testUserInStudents);
  }

  // ID 17が存在するかチェック
  const id17Student = db.prepare('SELECT * FROM class1_students WHERE id = 17').get();
  if (!id17Student) {
    console.log('\n❌ ID 17の生徒が存在しません');
    
    // 次に使用可能なIDを取得
    const maxId = db.prepare('SELECT MAX(id) as max_id FROM class1_students').get();
    const nextId = (maxId.max_id || 0) + 1;
    
    console.log(`🔧 ID ${nextId}でTEST-USERを追加します...`);
    
    const result = db.prepare(`
      INSERT INTO class1_students (name, instructor_id, email, created_at, updated_at)
      VALUES ('TEST-USER', 1, 'test@example.com', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run();
    
    console.log('✅ TEST-USER追加成功:', result);
    console.log(`新しいID: ${result.lastInsertRowid}`);
  } else {
    console.log('\n✅ ID 17の生徒が存在します:', id17Student);
  }

  // 最終確認
  const finalStudents = db.prepare('SELECT * FROM class1_students ORDER BY id').all();
  console.log('\n📊 修正後のclass1_students:');
  finalStudents.forEach(student => {
    console.log(`  - ID: ${student.id}, Name: ${student.name}, Email: ${student.email}, Instructor: ${student.instructor_id}`);
  });

} catch (error) {
  console.error('エラー:', error);
}

console.log('\n=== 修正完了 ===');
db.close(); 