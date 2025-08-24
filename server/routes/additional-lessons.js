const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

// 追加レッスン一覧を取得
router.get('/', authenticateToken, (req, res) => {
  try {
    // テーブルが存在するかチェック
    const tableExists = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='class1_additional_lessons'
    `).get();
    
    if (!tableExists) {
      console.log('class1_additional_lessonsテーブルが存在しません。空の配列を返します。');
      return res.json({ success: true, data: [] });
    }
    
    const additionalLessons = db.prepare(`
      SELECT 
        al.id,
        al.student_id,
        al.week_key,
        al.dm_scheduled,
        al.lesson_completed,
        al.next_lesson_date,
        al.lesson_completed_date,
        al.created_at,
        cs.name as student_name,
        u.username as instructor_name
      FROM class1_additional_lessons al
      JOIN class1_students cs ON al.student_id = cs.id
      JOIN users u ON cs.instructor_id = u.id
      ORDER BY al.created_at DESC
    `).all();

    res.json({ success: true, data: additionalLessons });
  } catch (error) {
    console.error('追加レッスン取得エラー:', error);
    res.status(500).json({ success: false, message: '追加レッスンの取得に失敗しました' });
  }
});

// 週別の追加レッスンを取得
router.get('/week/:weekKey', authenticateToken, (req, res) => {
  try {
    const { weekKey } = req.params;
    
    const additionalLessons = db.prepare(`
      SELECT 
        al.id,
        al.student_id,
        al.week_key,
        al.dm_scheduled,
        al.lesson_completed,
        al.created_at,
        cs.name as student_name,
        u.username as instructor_name
      FROM class1_additional_lessons al
      JOIN class1_students cs ON al.student_id = cs.id
      JOIN users u ON cs.instructor_id = u.id
      WHERE al.week_key = ?
      ORDER BY al.created_at DESC
    `).all(weekKey);

    res.json({ success: true, data: additionalLessons });
  } catch (error) {
    console.error('週別追加レッスン取得エラー:', error);
    res.status(500).json({ success: false, message: '週別追加レッスンの取得に失敗しました' });
  }
});

// 追加レッスンを作成
router.post('/', authenticateToken, (req, res) => {
  try {
    const { student_id, week_key, dm_scheduled, lesson_completed, next_lesson_date, lesson_completed_date } = req.body;
    
    // テーブルが存在するかチェック
    const tableExists = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='class1_additional_lessons'
    `).get();
    
    if (!tableExists) {
      console.log('class1_additional_lessonsテーブルが存在しません。テーブルを作成します。');
      
      // テーブルを作成
      db.prepare(`
        CREATE TABLE class1_additional_lessons (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          student_id INTEGER NOT NULL,
          week_key TEXT NOT NULL,
          dm_scheduled BOOLEAN DEFAULT 0,
          lesson_completed BOOLEAN DEFAULT 0,
          next_lesson_date DATE,
          lesson_completed_date DATE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (student_id) REFERENCES class1_students(id)
        )
      `).run();
      
      console.log('✅ class1_additional_lessonsテーブルを作成しました');
    }
    
    // 既存の追加レッスンを確認
    const existing = db.prepare(`
      SELECT id FROM class1_additional_lessons 
      WHERE student_id = ? AND week_key = ?
    `).get(student_id, week_key);

    if (existing) {
      // 既存データを更新
      db.prepare(`
        UPDATE class1_additional_lessons 
        SET dm_scheduled = ?, lesson_completed = ?, next_lesson_date = ?, lesson_completed_date = ?, created_at = CURRENT_TIMESTAMP
        WHERE student_id = ? AND week_key = ?
      `).run(dm_scheduled ? 1 : 0, lesson_completed ? 1 : 0, next_lesson_date || null, lesson_completed_date || null, student_id, week_key);
    } else {
      // 新規データを作成
      db.prepare(`
        INSERT INTO class1_additional_lessons (student_id, week_key, dm_scheduled, lesson_completed, next_lesson_date, lesson_completed_date)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(student_id, week_key, dm_scheduled ? 1 : 0, lesson_completed ? 1 : 0, next_lesson_date || null, lesson_completed_date || null);
    }

    res.json({ success: true, message: '追加レッスンを保存しました' });
  } catch (error) {
    console.error('追加レッスン作成エラー:', error);
    res.status(500).json({ success: false, message: '追加レッスンの作成に失敗しました' });
  }
});

// 追加レッスンを削除
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    
    db.prepare(`
      DELETE FROM class1_additional_lessons WHERE id = ?
    `).run(id);

    res.json({ success: true, message: '追加レッスンを削除しました' });
  } catch (error) {
    console.error('追加レッスン削除エラー:', error);
    res.status(500).json({ success: false, message: '追加レッスンの削除に失敗しました' });
  }
});

module.exports = router; 