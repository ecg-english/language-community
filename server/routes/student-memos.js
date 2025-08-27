const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new Database(dbPath);

// 生徒メモテーブルの存在確認と作成
const ensureMemoTable = () => {
  try {
    console.log('メモテーブル確認開始');
    
    // class1_studentsテーブルの存在確認
    const studentsTableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='class1_students'").get();
    console.log('class1_studentsテーブル確認結果:', studentsTableExists);
    
    if (!studentsTableExists) {
      console.error('class1_studentsテーブルが存在しません');
      // テーブルが存在しない場合は作成を試行
      try {
        db.prepare(`
          CREATE TABLE IF NOT EXISTS class1_students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            member_number TEXT UNIQUE,
            instructor_id INTEGER NOT NULL,
            email TEXT,
            memo TEXT,
            next_lesson_date DATE,
            lesson_completed_date DATE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `).run();
        console.log('class1_studentsテーブルを作成しました');
      } catch (createError) {
        console.error('class1_studentsテーブル作成エラー:', createError);
        throw new Error('class1_studentsテーブルの作成に失敗しました');
      }
    }
    
    // class1_student_memosテーブルの作成
    db.exec(`
      CREATE TABLE IF NOT EXISTS class1_student_memos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        month TEXT NOT NULL,
        memo TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(student_id, month)
      )
    `);
    console.log('メモテーブル作成/確認完了');
  } catch (error) {
    console.error('メモテーブル作成エラー:', error);
    throw error;
  }
};

// 生徒の月別メモを取得
router.get('/:studentId/:month', authenticateToken, (req, res) => {
  try {
    console.log('メモ取得リクエスト:', req.params);
    ensureMemoTable();
    
    const { studentId, month } = req.params;
    
    // 生徒の存在確認
    const student = db.prepare('SELECT id FROM class1_students WHERE id = ?').get(studentId);
    console.log('生徒確認結果:', student);
    if (!student) {
      return res.status(404).json({ success: false, message: '生徒が見つかりません' });
    }

    // メモを取得
    const memo = db.prepare(`
      SELECT memo FROM class1_student_memos 
      WHERE student_id = ? AND month = ?
    `).get(studentId, month);
    console.log('メモ取得結果:', memo);

    res.json({ 
      success: true, 
      data: { 
        student_id: parseInt(studentId), 
        month, 
        memo: memo ? memo.memo : '' 
      } 
    });
  } catch (error) {
    console.error('メモ取得エラー:', error);
    console.error('エラー詳細:', error.message);
    res.status(500).json({ success: false, message: 'メモの取得に失敗しました', error: error.message });
  }
});

// 生徒の月別メモを保存・更新
router.post('/:studentId/:month', authenticateToken, (req, res) => {
  try {
    console.log('メモ保存リクエスト:', req.params, req.body);
    ensureMemoTable();
    
    const { studentId, month } = req.params;
    const { memo } = req.body;
    
    console.log('保存パラメータ:', { studentId, month, memo });
    
    // 生徒の存在確認
    console.log('生徒ID確認:', studentId);
    const student = db.prepare('SELECT id, name FROM class1_students WHERE id = ?').get(studentId);
    console.log('生徒確認結果:', student);
    
    // テーブル内の全生徒を確認
    const allStudents = db.prepare('SELECT id, name FROM class1_students').all();
    console.log('テーブル内の全生徒:', allStudents);
    
    if (!student) {
      console.log('生徒が見つかりません:', studentId);
      return res.status(404).json({ success: false, message: '生徒が見つかりません' });
    }

    // テーブル構造確認
    const tableInfo = db.prepare("PRAGMA table_info(class1_student_memos)").all();
    console.log('テーブル構造:', tableInfo);

    // メモを保存・更新（UPSERT）
    const result = db.prepare(`
      INSERT INTO class1_student_memos (student_id, month, memo, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(student_id, month) 
      DO UPDATE SET memo = ?, updated_at = CURRENT_TIMESTAMP
    `).run(studentId, month, memo || '', memo || '');
    
    console.log('保存結果:', result);

    res.json({ success: true, message: 'メモを保存しました' });
  } catch (error) {
    console.error('メモ保存エラー:', error);
    console.error('エラー詳細:', error.message);
    console.error('エラースタック:', error.stack);
    res.status(500).json({ success: false, message: 'メモの保存に失敗しました', error: error.message });
  }
});

// 生徒の月別メモを削除
router.delete('/:studentId/:month', authenticateToken, (req, res) => {
  try {
    const { studentId, month } = req.params;
    
    // メモを削除
    const result = db.prepare(`
      DELETE FROM class1_student_memos 
      WHERE student_id = ? AND month = ?
    `).run(studentId, month);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'メモが見つかりません' });
    }

    res.json({ success: true, message: 'メモを削除しました' });
  } catch (error) {
    console.error('メモ削除エラー:', error);
    res.status(500).json({ success: false, message: 'メモの削除に失敗しました' });
  }
});

module.exports = router; 