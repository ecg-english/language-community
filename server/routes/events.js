const express = require('express');
const router = express.Router();
const Database = require('better-sqlite3');
const { authenticateToken } = require('../middleware/auth');

const db = new Database('language-community.db');

// イベント企画管理テーブルの作成（既存のeventsテーブルとは別）
db.exec(`
  CREATE TABLE IF NOT EXISTS event_planning (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    event_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    visitor_fee INTEGER NOT NULL,
    member_fee INTEGER NOT NULL,
    location TEXT NOT NULL,
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
  )
`);

// イベント企画タスクテーブルの作成
db.exec(`
  CREATE TABLE IF NOT EXISTS event_planning_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    deadline_days_before INTEGER NOT NULL,
    deadline_date DATE NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES event_planning(id) ON DELETE CASCADE
  )
`);

// デフォルトタスクテンプレート
const defaultTasks = [
  { name: 'イベント企画書作成', deadline_days_before: 30, url: '' },
  { name: 'フライヤー作成とLINEで共有', deadline_days_before: 30, url: 'https://utage-system.com/operator/thOIhLyBdzs4/login' },
  { name: 'Instagram投稿', deadline_days_before: 25, url: 'https://www.instagram.com/english_ecg/' },
  { name: 'コミュニティ投稿', deadline_days_before: 30, url: 'https://ecg-english.github.io/language-community' },
  { name: '公式LINE予約投稿', deadline_days_before: 30, url: 'https://utage-system.com/operator/thOIhLyBdzs4/login' },
  { name: '印刷して店舗張り出し', deadline_days_before: 30, url: '' },
  { name: 'Meetup投稿', deadline_days_before: 7, url: '' },
  { name: 'Instagramで単体投稿', deadline_days_before: 7, url: 'https://www.instagram.com/english_ecg/' },
  { name: 'ストーリー投稿', deadline_days_before: 7, url: 'https://www.instagram.com/english_ecg/' },
  { name: 'イベント準備物確認と買い出し', deadline_days_before: 3, url: '' },
  { name: 'ストーリー再投稿', deadline_days_before: 1, url: 'https://www.instagram.com/english_ecg/' },
  { name: 'コミュニティのお知らせ投稿やアクティビティ', deadline_days_before: 1, url: 'https://ecg-english.github.io/language-community' },
  { name: 'イベント実施と反省メモ', deadline_days_before: 0, url: '' }
];

// 締切日を計算する関数
const calculateDeadlineDate = (eventDate, daysBefore) => {
  const deadline = new Date(eventDate);
  deadline.setDate(deadline.getDate() - daysBefore);
  return deadline.toISOString().split('T')[0];
};

// イベント企画一覧取得
router.get('/', authenticateToken, (req, res) => {
  try {
    const events = db.prepare(`
      SELECT e.*, u.username as created_by_name
      FROM event_planning e
      LEFT JOIN users u ON e.created_by = u.id
      ORDER BY e.event_date DESC
    `).all();

    // 各イベントのタスク進捗も取得
    const eventsWithProgress = events.map(event => {
      const tasks = db.prepare(`
        SELECT * FROM event_planning_tasks 
        WHERE event_id = ? 
        ORDER BY deadline_date ASC
      `).all(event.id);

      return {
        ...event,
        tasks: tasks,
        completed_tasks: tasks.filter(task => task.is_completed).length,
        total_tasks: tasks.length
      };
    });

    res.json({ 
      success: true, 
      data: eventsWithProgress 
    });
  } catch (error) {
    console.error('イベント取得エラー:', error);
    res.status(500).json({ 
      success: false, 
      message: 'イベントの取得に失敗しました' 
    });
  }
});

// イベント企画作成
router.post('/', authenticateToken, (req, res) => {
  try {
    const { 
      title, 
      description, 
      event_date, 
      start_time, 
      end_time, 
      visitor_fee, 
      member_fee, 
      location 
    } = req.body;

    const userId = req.user.userId; // req.user.id から req.user.userId に修正

    console.log('イベント作成リクエスト:', {
      title,
      description,
      event_date,
      start_time,
      end_time,
      visitor_fee,
      member_fee,
      location,
      userId
    });

    // バリデーション
    if (!title || !description || !event_date || !start_time || !end_time || !location) {
      return res.status(400).json({ 
        success: false, 
        message: '必須項目が不足しています' 
      });
    }

    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'ユーザー認証に失敗しました' 
      });
    }

    // イベント企画を作成
    const insertEvent = db.prepare(`
      INSERT INTO event_planning (
        title, description, event_date, start_time, end_time, 
        visitor_fee, member_fee, location, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertEvent.run(
      title, description, event_date, start_time, end_time,
      parseInt(visitor_fee) || 0, parseInt(member_fee) || 0, location, userId
    );

    const eventId = result.lastInsertRowid;

    // デフォルトタスクを作成
    const insertTask = db.prepare(`
      INSERT INTO event_planning_tasks (
        event_id, name, deadline_days_before, deadline_date, url
      ) VALUES (?, ?, ?, ?, ?)
    `);

    defaultTasks.forEach(task => {
      const deadlineDate = calculateDeadlineDate(event_date, task.deadline_days_before);
      insertTask.run(
        eventId,
        task.name,
        task.deadline_days_before,
        deadlineDate,
        task.url || null
      );
    });

    console.log('イベント作成成功:', { eventId });

    res.json({ 
      success: true, 
      message: 'イベントを作成しました',
      data: { id: eventId }
    });
  } catch (error) {
    console.error('イベント作成エラー:', error);
    res.status(500).json({ 
      success: false, 
      message: 'イベントの作成に失敗しました' 
    });
  }
});

// イベント企画のタスク一覧取得
router.get('/:eventId/tasks', authenticateToken, (req, res) => {
  try {
    const eventId = req.params.eventId;

    console.log('タスク取得リクエスト:', { eventId });

    const tasks = db.prepare(`
      SELECT * FROM event_planning_tasks 
      WHERE event_id = ? 
      ORDER BY deadline_date ASC
    `).all(eventId);

    console.log('取得されたタスク:', { 
      eventId, 
      tasksCount: tasks.length, 
      tasks: tasks.slice(0, 3) // 最初の3つを表示
    });

    res.json({ 
      success: true, 
      data: tasks 
    });
  } catch (error) {
    console.error('タスク取得エラー:', error);
    res.status(500).json({ 
      success: false, 
      message: 'タスクの取得に失敗しました' 
    });
  }
});

// タスクの完了状態を更新
router.put('/tasks/:taskId', authenticateToken, (req, res) => {
  try {
    const taskId = req.params.taskId;
    const { is_completed } = req.body;

    const updateTask = db.prepare(`
      UPDATE event_planning_tasks 
      SET is_completed = ? 
      WHERE id = ?
    `);

    updateTask.run(is_completed, taskId);

    res.json({ 
      success: true, 
      message: 'タスクを更新しました' 
    });
  } catch (error) {
    console.error('タスク更新エラー:', error);
    res.status(500).json({ 
      success: false, 
      message: 'タスクの更新に失敗しました' 
    });
  }
});

// イベント企画削除
router.delete('/:eventId', authenticateToken, (req, res) => {
  try {
    const eventId = req.params.eventId;
    const userId = req.user.userId; // req.user.id から req.user.userId に修正

    // イベントの作成者または管理者のみ削除可能
    const event = db.prepare(`
      SELECT * FROM event_planning WHERE id = ?
    `).get(eventId);

    if (!event) {
      return res.status(404).json({ 
        success: false, 
        message: 'イベントが見つかりません' 
      });
    }

    if (event.created_by !== userId && req.user.role !== 'サーバー管理者') {
      return res.status(403).json({ 
        success: false, 
        message: 'イベントを削除する権限がありません' 
      });
    }

    // タスクとイベントを削除（CASCADE設定済み）
    db.prepare('DELETE FROM event_planning WHERE id = ?').run(eventId);

    res.json({ 
      success: true, 
      message: 'イベントを削除しました' 
    });
  } catch (error) {
    console.error('イベント削除エラー:', error);
    res.status(500).json({ 
      success: false, 
      message: 'イベントの削除に失敗しました' 
    });
  }
});

module.exports = router; 