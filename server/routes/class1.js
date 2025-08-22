const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// データベース接続
const db = require('../database');

// 権限チェックミドルウェア
const checkClass1Permission = (req, res, next) => {
  const userRole = req.user.role;
  if (userRole === 'ECG講師' || userRole === 'JCG講師' || userRole === 'サーバー管理者') {
    next();
  } else {
    res.status(403).json({ success: false, message: '権限がありません' });
  }
};

// 生徒一覧を取得
router.get('/students', authenticateToken, checkClass1Permission, async (req, res) => {
  try {
    console.log('Class1 students API called');
    
    // テーブルが存在するかチェック
    const tableExists = db.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='class1_students'
    `).get();
    
    if (!tableExists) {
      console.error('class1_students table does not exist');
      return res.json({ success: true, students: [] });
    }
    
    const students = db.prepare(`
      SELECT 
        s.id,
        s.name,
        s.instructor_id,
        u.username as instructor_name,
        s.email,
        s.memo,
        s.next_lesson_date,
        s.lesson_completed_date,
        CASE WHEN s.next_lesson_date IS NOT NULL THEN 1 ELSE 0 END as dm_scheduled,
        CASE WHEN s.lesson_completed_date IS NOT NULL THEN 1 ELSE 0 END as lesson_completed,
        s.created_at
      FROM class1_students s
      LEFT JOIN users u ON s.instructor_id = u.id
      ORDER BY s.created_at DESC
    `).all();

    console.log('Students found:', students.length);
    res.json({ success: true, students });
  } catch (error) {
    console.error('生徒一覧取得エラー:', error);
    res.status(500).json({ success: false, message: '生徒一覧の取得に失敗しました: ' + error.message });
  }
});

// 生徒を追加
router.post('/students', authenticateToken, checkClass1Permission, async (req, res) => {
  try {
    console.log('Add student API called with body:', req.body);
    const { name, instructor_id, memo, email } = req.body;

    if (!name || !instructor_id) {
      return res.status(400).json({ success: false, message: '生徒名と担当講師は必須です' });
    }

    const result = db.prepare(`
      INSERT INTO class1_students (name, instructor_id, memo, email, created_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(name, instructor_id, memo || null, email || null);

    console.log('Student added successfully:', result.lastInsertRowid);
    res.json({ 
      success: true, 
      message: '生徒を追加しました',
      studentId: result.lastInsertRowid 
    });
  } catch (error) {
    console.error('生徒追加エラー:', error);
    res.status(500).json({ success: false, message: '生徒の追加に失敗しました: ' + error.message });
  }
});

// レッスン日を更新
router.put('/students/:studentId/lesson-date', authenticateToken, checkClass1Permission, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { field, value } = req.body;

    if (!['next_lesson_date', 'lesson_completed_date'].includes(field)) {
      return res.status(400).json({ success: false, message: '無効なフィールドです' });
    }

    // 動的フィールド名を安全に処理
    if (field === 'next_lesson_date') {
      db.prepare(`
        UPDATE class1_students 
        SET next_lesson_date = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(value || null, studentId);
    } else {
      db.prepare(`
        UPDATE class1_students 
        SET lesson_completed_date = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(value || null, studentId);
    }

    res.json({ success: true, message: 'レッスン日を更新しました' });
  } catch (error) {
    console.error('レッスン日更新エラー:', error);
    res.status(500).json({ success: false, message: 'レッスン日の更新に失敗しました: ' + error.message });
  }
});

// 生徒を削除
router.delete('/students/:studentId', authenticateToken, checkClass1Permission, async (req, res) => {
  try {
    console.log('Delete student API called for ID:', req.params.studentId);
    const { studentId } = req.params;

    const result = db.prepare('DELETE FROM class1_students WHERE id = ?').run(studentId);
    console.log('Delete result:', result.changes);

    res.json({ success: true, message: '生徒を削除しました' });
  } catch (error) {
    console.error('生徒削除エラー:', error);
    res.status(500).json({ success: false, message: '生徒の削除に失敗しました: ' + error.message });
  }
});

// 週次チェックリストの取得
router.get('/weekly-checklist/:weekKey', checkClass1Permission, async (req, res) => {
  try {
    const { weekKey } = req.params;
    
    const checklist = db.prepare(`
      SELECT * FROM class1_weekly_checklist 
      WHERE week_key = ?
    `).all(weekKey);
    
    res.json({
      success: true,
      checklist: checklist
    });
  } catch (error) {
    console.error('週次チェックリスト取得エラー:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 週次チェックリストの更新
router.put('/weekly-checklist/:weekKey/:studentId', checkClass1Permission, async (req, res) => {
  try {
    const { weekKey, studentId } = req.params;
    const { dm_scheduled, lesson_completed, next_lesson_date, lesson_completed_date } = req.body;
    
    // 既存データを確認
    const existing = db.prepare(`
      SELECT * FROM class1_weekly_checklist 
      WHERE week_key = ? AND student_id = ?
    `).get(weekKey, studentId);
    
    if (existing) {
      // 更新
      db.prepare(`
        UPDATE class1_weekly_checklist 
        SET dm_scheduled = ?, lesson_completed = ?, next_lesson_date = ?, lesson_completed_date = ?, updated_at = CURRENT_TIMESTAMP
        WHERE week_key = ? AND student_id = ?
      `).run(dm_scheduled, lesson_completed, next_lesson_date, lesson_completed_date, weekKey, studentId);
    } else {
      // 新規作成
      db.prepare(`
        INSERT INTO class1_weekly_checklist 
        (week_key, student_id, dm_scheduled, lesson_completed, next_lesson_date, lesson_completed_date)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(weekKey, studentId, dm_scheduled, lesson_completed, next_lesson_date, lesson_completed_date);
    }
    
    res.json({
      success: true,
      message: '週次チェックリストが更新されました'
    });
  } catch (error) {
    console.error('週次チェックリスト更新エラー:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router; 