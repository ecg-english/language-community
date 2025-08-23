// 既存のデータベース接続を使用
const db = require('./database');

// member_numberカラムを追加するマイグレーション
const migrateMemberNumber = () => {
  try {
    console.log('Starting member_number column migration...');
    
    // テーブルが存在するかチェック
    const tableExists = db.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='class1_students'
    `).get();
    
    if (!tableExists) {
      console.log('class1_students table does not exist, skipping migration');
      return;
    }
    
    // member_numberカラムが既に存在するかチェック
    const columnExists = db.prepare(`
      PRAGMA table_info(class1_students)
    `).all().some(column => column.name === 'member_number');
    
    if (columnExists) {
      console.log('member_number column already exists, skipping migration');
      return;
    }
    
    // member_numberカラムを追加
    db.prepare(`
      ALTER TABLE class1_students ADD COLUMN member_number TEXT UNIQUE
    `).run();
    
    console.log('member_number column added successfully');
    
    // 既存の生徒にランダムな会員番号を付与
    const existingStudents = db.prepare(`
      SELECT id FROM class1_students WHERE member_number IS NULL
    `).all();
    
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
    
    const updateStmt = db.prepare(`
      UPDATE class1_students SET member_number = ? WHERE id = ?
    `);
    
    for (const student of existingStudents) {
      const memberNumber = generateMemberNumber();
      updateStmt.run(memberNumber, student.id);
      console.log(`Assigned member number ${memberNumber} to student ${student.id}`);
    }
    
    console.log(`Migration completed. Updated ${existingStudents.length} existing students.`);
    
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
};

// マイグレーションを実行
migrateMemberNumber(); 