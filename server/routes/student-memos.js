const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const dbPath = path.join(__dirname, '..', 'language-community.db');
const db = new Database(dbPath);

// テーブル作成と生徒データ同期
const ensureStudentSync = () => {
  try {
    console.log('=== 生徒データ同期開始 ===');
    
    // class1_studentsテーブル確認・作成
    const studentsTableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='class1_students'").get();
    if (!studentsTableExists) {
      db.prepare(`
        CREATE TABLE class1_students (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          member_number TEXT UNIQUE,
          instructor_id INTEGER,
          email TEXT,
          memo TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run();
      console.log('✅ class1_studentsテーブルを作成しました');
    }

    // 現在のClass1 Membersを取得
    const class1Members = db.prepare(`
      SELECT id, username, email 
      FROM users 
      WHERE role = 'Class1 Members'
    `).all();
    
    console.log(`📋 Class1 Members数: ${class1Members.length}`);
    class1Members.forEach(member => {
      console.log(`  - ${member.username} (ID: ${member.id}, Email: ${member.email})`);
    });

    // 現在のclass1_studentsを取得
    const existingStudents = db.prepare(`
      SELECT id, name, email FROM class1_students
    `).all();
    
    console.log(`📋 既存class1_students数: ${existingStudents.length}`);
    existingStudents.forEach(student => {
      console.log(`  - ${student.name} (ID: ${student.id}, Email: ${student.email})`);
    });

    // 各Class1 MemberをClass1_studentsテーブルに同期
    let syncCount = 0;
    for (const member of class1Members) {
      // 名前またはメールで既存チェック
      const existingStudent = db.prepare(`
        SELECT id FROM class1_students WHERE name = ? OR email = ?
      `).get(member.username, member.email);

      if (!existingStudent) {
        // 新しい生徒を追加
        try {
          const result = db.prepare(`
            INSERT INTO class1_students (name, email, instructor_id, created_at, updated_at)
            VALUES (?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `).run(member.username, member.email);
          
          syncCount++;
          console.log(`✅ 新しい生徒を追加: ${member.username} (新ID: ${result.lastInsertRowid})`);
        } catch (error) {
          console.error(`❌ 生徒追加エラー (${member.username}):`, error);
        }
      } else {
        console.log(`⏭️  既存の生徒をスキップ: ${member.username} (ID: ${existingStudent.id})`);
      }
    }
    
    // 同期後の確認
    const finalStudents = db.prepare(`
      SELECT id, name, email FROM class1_students ORDER BY id
    `).all();
    
    console.log(`🎉 同期完了: ${syncCount}人の新しい生徒を追加`);
    console.log(`📊 最終的なclass1_students数: ${finalStudents.length}`);
    finalStudents.forEach(student => {
      console.log(`  - ${student.name} (ID: ${student.id}, Email: ${student.email})`);
    });
    
    console.log('=== 生徒データ同期完了 ===');
    return { success: true, synced: syncCount, total: finalStudents.length };
  } catch (error) {
    console.error('❌ 生徒データ同期エラー:', error);
    throw error;
  }
};

// 生徒メモ保存 (単純化)
router.post('/:studentId', authenticateToken, (req, res) => {
  try {
    console.log('=== メモ保存リクエスト開始 ===');
    console.log('リクエストパラメータ:', req.params);
    console.log('リクエストボディ:', req.body);
    
    ensureStudentSync(); // 生徒データを同期
    
    const { studentId } = req.params;
    const { memo } = req.body;
    
    console.log('保存パラメータ:', { studentId, memo });
    
    const numericStudentId = parseInt(studentId);
    if (isNaN(numericStudentId)) {
      console.error('無効な生徒ID:', studentId);
      return res.status(400).json({ success: false, message: '無効な生徒IDです' });
    }
    
    // 生徒の存在確認
    const student = db.prepare('SELECT id, name FROM class1_students WHERE id = ?').get(numericStudentId);
    console.log('生徒確認結果:', student);
    
    if (!student) {
      console.log('生徒が見つかりません:', numericStudentId);
      return res.status(404).json({ success: false, message: '生徒が見つかりません' });
    }
    
    // メモを直接class1_studentsテーブルのmemoカラムに保存
    const result = db.prepare(`
      UPDATE class1_students 
      SET memo = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(memo || '', numericStudentId);
    
    console.log('保存結果:', result);
    
    if (result.changes > 0) {
      res.json({ success: true, message: 'メモを保存しました' });
    } else {
      res.status(500).json({ success: false, message: 'メモの保存に失敗しました' });
    }
  } catch (error) {
    console.error('メモ保存エラー:', error);
    res.status(500).json({ success: false, message: 'メモの保存に失敗しました', error: error.message });
  }
});

// 生徒メモ取得 (単純化)
router.get('/:studentId', authenticateToken, (req, res) => {
  try {
    console.log('=== メモ取得リクエスト開始 ===');
    console.log('リクエストパラメータ:', req.params);
    
    ensureStudentSync(); // 生徒データを同期
    
    const { studentId } = req.params;
    
    const numericStudentId = parseInt(studentId);
    if (isNaN(numericStudentId)) {
      console.error('無効な生徒ID:', studentId);
      return res.status(400).json({ success: false, message: '無効な生徒IDです' });
    }
    
    // 生徒の存在確認とメモ取得
    const student = db.prepare('SELECT id, name, memo FROM class1_students WHERE id = ?').get(numericStudentId);
    console.log('生徒データ取得結果:', student);
    
    if (!student) {
      console.log('生徒が見つかりません:', numericStudentId);
      return res.status(404).json({ success: false, message: '生徒が見つかりません' });
    }
    
    res.json({ 
      success: true, 
      data: { 
        student_id: numericStudentId, 
        memo: student.memo || '' 
      } 
    });
  } catch (error) {
    console.error('メモ取得エラー:', error);
    res.status(500).json({ success: false, message: 'メモの取得に失敗しました', error: error.message });
  }
});

// 生徒同期状況確認エンドポイント
router.get('/sync-status', authenticateToken, (req, res) => {
  try {
    console.log('=== 同期状況確認開始 ===');
    
    const syncResult = ensureStudentSync();
    
    // 詳細情報を取得
    const class1Members = db.prepare(`
      SELECT id, username, email FROM users WHERE role = 'Class1 Members'
    `).all();
    
    const class1Students = db.prepare(`
      SELECT id, name, email FROM class1_students
    `).all();
    
    res.json({
      success: true,
      syncResult,
      details: {
        class1Members: class1Members.length,
        class1Students: class1Students.length,
        class1MembersList: class1Members,
        class1StudentsList: class1Students
      }
    });
  } catch (error) {
    console.error('同期状況確認エラー:', error);
    res.status(500).json({ 
      success: false, 
      message: '同期状況の確認に失敗しました', 
      error: error.message 
    });
  }
});

module.exports = router; 