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

console.log('Database path:', dbPath);

const db = new Database(dbPath);

// 強制マイグレーション実行
const forceMigrateMemberNumber = () => {
  try {
    console.log('=== FORCE MIGRATION: member_number column ===');
    
    // テーブルが存在するかチェック
    const tableExists = db.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='class1_students'
    `).get();
    
    if (!tableExists) {
      console.log('❌ class1_students table does not exist');
      return;
    }
    
    console.log('✅ class1_students table exists');
    
    // 現在のテーブル構造を確認
    const columns = db.prepare(`
      PRAGMA table_info(class1_students)
    `).all();
    
    console.log('Current table structure:');
    columns.forEach(col => {
      console.log(`  - ${col.name}: ${col.type} (not null: ${col.notnull}, pk: ${col.pk})`);
    });
    
    // member_numberカラムが存在するかチェック
    const memberNumberColumn = columns.find(col => col.name === 'member_number');
    
    if (!memberNumberColumn) {
      console.log('❌ member_number column does not exist - adding it now...');
      
      // member_numberカラムを追加
      db.prepare(`
        ALTER TABLE class1_students ADD COLUMN member_number TEXT UNIQUE
      `).run();
      
      console.log('✅ member_number column added successfully');
    } else {
      console.log('✅ member_number column already exists');
    }
    
    // 既存の生徒データを確認
    const existingStudents = db.prepare(`
      SELECT id, name, member_number FROM class1_students
    `).all();
    
    console.log(`\nExisting students (${existingStudents.length}):`);
    existingStudents.forEach(student => {
      console.log(`  - ID: ${student.id}, Name: ${student.name}, Member Number: ${student.member_number || 'NULL'}`);
    });
    
    // member_numberがNULLの生徒を確認
    const nullMemberNumbers = existingStudents.filter(s => !s.member_number);
    
    if (nullMemberNumbers.length > 0) {
      console.log(`\n⚠️  ${nullMemberNumbers.length} students have NULL member_number - assigning now...`);
      
      // 会員番号生成関数
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
      
      // NULLの生徒に会員番号を付与
      const updateStmt = db.prepare(`
        UPDATE class1_students SET member_number = ? WHERE id = ?
      `);
      
      for (const student of nullMemberNumbers) {
        const memberNumber = generateMemberNumber();
        updateStmt.run(memberNumber, student.id);
        console.log(`  ✅ Assigned ${memberNumber} to ${student.name} (ID: ${student.id})`);
      }
      
      console.log('✅ All NULL member numbers have been assigned');
    } else {
      console.log('✅ All students already have member numbers');
    }
    
    // 最終確認
    const finalStudents = db.prepare(`
      SELECT id, name, member_number FROM class1_students
    `).all();
    
    console.log('\n=== FINAL STATUS ===');
    console.log('All students with member numbers:');
    finalStudents.forEach(student => {
      console.log(`  - ${student.name}: ${student.member_number}`);
    });
    
    console.log('\n✅ FORCE MIGRATION COMPLETED SUCCESSFULLY');
    
  } catch (error) {
    console.error('❌ Force migration error:', error);
    throw error;
  } finally {
    db.close();
  }
};

// 強制マイグレーションを実行
forceMigrateMemberNumber(); 