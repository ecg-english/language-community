const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

// カレンダーイベントテーブルを作成
const createCalendarEventsTable = () => {
  try {
    const tableExists = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='calendar_events'
    `).get();
    
    if (!tableExists) {
      db.prepare(`
        CREATE TABLE calendar_events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          student_id INTEGER NOT NULL,
          date DATE NOT NULL,
          type TEXT NOT NULL CHECK (type IN ('scheduled', 'completed')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (student_id) REFERENCES class1_students(id),
          UNIQUE(student_id, date)
        )
      `).run();
      console.log('✅ calendar_eventsテーブルを作成しました');
    }
  } catch (error) {
    console.error('calendar_eventsテーブル作成エラー:', error);
  }
};

// テーブル作成を実行
createCalendarEventsTable();

// カレンダーイベントを作成・更新
router.post('/', authenticateToken, (req, res) => {
  try {
    const { student_id, date, type } = req.body;
    
    if (!student_id || !date || !type) {
      return res.status(400).json({ 
        success: false, 
        message: '必要なパラメータが不足しています' 
      });
    }

    // 既存のイベントを確認
    const existing = db.prepare(`
      SELECT id FROM calendar_events 
      WHERE student_id = ? AND date = ?
    `).get(student_id, date);

    if (existing) {
      // 既存データを更新
      db.prepare(`
        UPDATE calendar_events 
        SET type = ?, updated_at = CURRENT_TIMESTAMP
        WHERE student_id = ? AND date = ?
      `).run(type, student_id, date);
    } else {
      // 新規データを作成
      db.prepare(`
        INSERT INTO calendar_events (student_id, date, type)
        VALUES (?, ?, ?)
      `).run(student_id, date, type);
    }

    res.json({ success: true, message: 'カレンダーイベントを保存しました' });
  } catch (error) {
    console.error('カレンダーイベント作成エラー:', error);
    res.status(500).json({ 
      success: false, 
      message: 'カレンダーイベントの作成に失敗しました' 
    });
  }
});

// カレンダーイベントを削除
router.delete('/', authenticateToken, (req, res) => {
  try {
    const { student_id, date } = req.body;
    
    if (!student_id || !date) {
      return res.status(400).json({ 
        success: false, 
        message: '必要なパラメータが不足しています' 
      });
    }

    db.prepare(`
      DELETE FROM calendar_events 
      WHERE student_id = ? AND date = ?
    `).run(student_id, date);

    res.json({ success: true, message: 'カレンダーイベントを削除しました' });
  } catch (error) {
    console.error('カレンダーイベント削除エラー:', error);
    res.status(500).json({ 
      success: false, 
      message: 'カレンダーイベントの削除に失敗しました' 
    });
  }
});

// カレンダーイベント一覧を取得
router.get('/', authenticateToken, (req, res) => {
  try {
    const events = db.prepare(`
      SELECT 
        ce.id,
        ce.student_id,
        ce.date,
        ce.type,
        ce.created_at,
        cs.name as student_name,
        u.username as instructor_name
      FROM calendar_events ce
      JOIN class1_students cs ON ce.student_id = cs.id
      JOIN users u ON cs.instructor_id = u.id
      ORDER BY ce.date DESC, cs.name
    `).all();

    res.json({ success: true, data: events });
  } catch (error) {
    console.error('カレンダーイベント取得エラー:', error);
    res.status(500).json({ 
      success: false, 
      message: 'カレンダーイベントの取得に失敗しました' 
    });
  }
});

module.exports = router; 