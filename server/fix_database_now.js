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

console.log('🔧 IMMEDIATE DATABASE FIX: Database path:', dbPath);

const db = new Database(dbPath);

// 即座にデータベースを修正
const fixDatabaseNow = () => {
  try {
    console.log('🚀 STARTING IMMEDIATE DATABASE FIX...');
    
    // 1. 現在のテーブル構造を確認
    const columns = db.prepare(`
      PRAGMA table_info(class1_students)
    `).all();
    
    console.log('Current table structure:');
    columns.forEach(col => {
      console.log(`  - ${col.name}: ${col.type} (not null: ${col.notnull}, pk: ${col.pk})`);
    });
    
    // 2. member_numberカラムが存在するかチェック
    const memberNumberColumn = columns.find(col => col.name === 'member_number');
    
    if (!memberNumberColumn) {
      console.log('❌ member_number column missing - adding it now...');
      
      // member_numberカラムを追加
      db.prepare(`
        ALTER TABLE class1_students ADD COLUMN member_number TEXT UNIQUE
      `).run();
      
      console.log('✅ member_number column added successfully');
    } else {
      console.log('✅ member_number column already exists');
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
      console.log(`  - ${student.name} (ID: ${student.id}): ${student.member_number}`);
    });
    
    // 7. テーブル構造の最終確認
    const finalColumns = db.prepare(`
      PRAGMA table_info(class1_students)
    `).all();
    
    console.log('\n📋 Final table structure:');
    finalColumns.forEach(col => {
      console.log(`  - ${col.name}: ${col.type} (not null: ${col.notnull}, pk: ${col.pk})`);
    });
    
    console.log('\n✅ IMMEDIATE DATABASE FIX COMPLETED SUCCESSFULLY!');
    console.log('🔄 Please restart your application to see the changes.');
    
  } catch (error) {
    console.error('❌ IMMEDIATE DATABASE FIX ERROR:', error);
    throw error;
  } finally {
    db.close();
  }
};

// 即座に実行
fixDatabaseNow(); 