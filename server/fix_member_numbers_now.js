const Database = require('better-sqlite3');
const path = require('path');

// データベースパスの設定
let dbPath;
if (process.env.DATABASE_PATH) {
  dbPath = process.env.DATABASE_PATH;
} else if (process.env.NODE_ENV === 'production') {
  // Renderの永続化ディスクを使用
  dbPath = '/opt/render/data/language-community.db';
} else {
  // 開発環境
  dbPath = path.join(__dirname, 'language-community.db');
}

console.log('🔧 IMMEDIATE FIX: Database path:', dbPath);

const db = new Database(dbPath);

// 即座に会員番号を修正
const fixMemberNumbersNow = () => {
  try {
    console.log('🚀 STARTING IMMEDIATE MEMBER NUMBER FIX...');
    
    // 1. テーブル存在確認
    const tableExists = db.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='class1_students'
    `).get();
    
    if (!tableExists) {
      console.log('❌ class1_students table does not exist - creating it');
      db.prepare(`
        CREATE TABLE class1_students (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          member_number TEXT UNIQUE,
          instructor_id INTEGER NOT NULL,
          email TEXT,
          memo TEXT,
          next_lesson_date TEXT,
          lesson_completed_date TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run();
      console.log('✅ class1_students table created');
    } else {
      console.log('✅ class1_students table exists');
    }
    
    // 2. member_numberカラムの存在確認と追加
    const columns = db.prepare(`
      PRAGMA table_info(class1_students)
    `).all();
    
    console.log('Current columns:', columns.map(col => col.name));
    
    const memberNumberColumn = columns.find(col => col.name === 'member_number');
    
    if (!memberNumberColumn) {
      console.log('❌ member_number column missing - adding it now');
      db.prepare(`
        ALTER TABLE class1_students ADD COLUMN member_number TEXT UNIQUE
      `).run();
      console.log('✅ member_number column added');
    } else {
      console.log('✅ member_number column exists');
    }
    
    // 3. 既存の生徒データを確認
    const existingStudents = db.prepare(`
      SELECT id, name, member_number FROM class1_students
    `).all();
    
    console.log(`📊 Found ${existingStudents.length} students:`);
    existingStudents.forEach(student => {
      console.log(`  - ID: ${student.id}, Name: ${student.name}, Member Number: ${student.member_number || 'NULL'}`);
    });
    
    // 4. 会員番号生成関数
    const generateMemberNumber = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < 3; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      
      // 既存の会員番号と重複しないかチェック
      const existing = db.prepare(`
        SELECT member_number FROM class1_students WHERE member_number = ?
      `).get(result);
      
      if (existing) {
        return generateMemberNumber();
      }
      
      return result;
    };
    
    // 5. NULLまたは未設定の会員番号を持つ生徒を修正
    const studentsToFix = existingStudents.filter(s => !s.member_number);
    
    if (studentsToFix.length > 0) {
      console.log(`🔧 Fixing ${studentsToFix.length} students with missing member numbers...`);
      
      const updateStmt = db.prepare(`
        UPDATE class1_students SET member_number = ? WHERE id = ?
      `);
      
      for (const student of studentsToFix) {
        const memberNumber = generateMemberNumber();
        updateStmt.run(memberNumber, student.id);
        console.log(`  ✅ Fixed: ${student.name} (ID: ${student.id}) → ${memberNumber}`);
      }
      
      console.log('✅ All missing member numbers have been fixed!');
    } else {
      console.log('✅ All students already have member numbers');
    }
    
    // 6. 最終確認
    const finalStudents = db.prepare(`
      SELECT id, name, member_number FROM class1_students
    `).all();
    
    console.log('\n🎉 FINAL RESULT:');
    console.log('All students with member numbers:');
    finalStudents.forEach(student => {
      console.log(`  - ${student.name}: ${student.member_number}`);
    });
    
    console.log('\n✅ IMMEDIATE FIX COMPLETED SUCCESSFULLY!');
    console.log('🔄 Please restart your application to see the changes.');
    
  } catch (error) {
    console.error('❌ IMMEDIATE FIX ERROR:', error);
    throw error;
  } finally {
    db.close();
  }
};

// 即座に実行
fixMemberNumbersNow(); 