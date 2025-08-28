const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const auth = require('../middleware/auth');

// データベースパス
const dbPath = path.join(__dirname, '../database.db');

// データベース接続
const db = new sqlite3.Database(dbPath);

// デフォルトタスクテンプレート
const defaultTasks = [
  { name: 'イベント企画書作成', deadline_days_before: 30, url: '' },
  { name: 'フライヤー作成→グループLINEで共有', deadline_days_before: 30, url: '' },
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

// 企画イベント一覧取得
router.get('/', auth, async (req, res) => {
  try {
    const sql = `
      SELECT e.*, 
        GROUP_CONCAT(
          json_object(
            'id', t.id,
            'event_id', t.event_id,
            'name', t.name,
            'deadline_days_before', t.deadline_days_before,
            'deadline_date', t.deadline_date,
            'is_completed', t.is_completed,
            'url', t.url
          )
        ) as tasks_json
      FROM planning_events e
      LEFT JOIN planning_tasks t ON e.id = t.event_id
      WHERE e.user_id = ?
      GROUP BY e.id
      ORDER BY e.event_date DESC
    `;
    
    db.all(sql, [req.user.id], (err, rows) => {
      if (err) {
        console.error('データベースエラー:', err);
        return res.status(500).json({ error: 'データベースエラー' });
      }
      
      const events = rows.map(row => ({
        ...row,
        tasks: row.tasks_json ? 
          row.tasks_json.split('},{').map((task, index, array) => {
            let taskStr = task;
            if (index === 0 && !taskStr.startsWith('{')) taskStr = '{' + taskStr;
            if (index === array.length - 1 && !taskStr.endsWith('}')) taskStr = taskStr + '}';
            if (index !== 0 && !taskStr.startsWith('{')) taskStr = '{' + taskStr;
            if (index !== array.length - 1 && !taskStr.endsWith('}')) taskStr = taskStr + '}';
            
            try {
              return JSON.parse(taskStr);
            } catch (e) {
              console.error('タスクJSONパースエラー:', e, taskStr);
              return null;
            }
          }).filter(Boolean) : []
      }));
      
      res.json(events);
    });
  } catch (error) {
    console.error('企画イベント取得エラー:', error);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

// 企画イベント作成
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, event_date, start_time, end_time, location, member_fee, visitor_fee } = req.body;
    
    if (!title || !event_date || !start_time || !end_time) {
      return res.status(400).json({ error: '必須フィールドが不足しています' });
    }

    const insertEventSql = `
      INSERT INTO planning_events (user_id, title, description, event_date, start_time, end_time, location, member_fee, visitor_fee)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(insertEventSql, [req.user.id, title, description, event_date, start_time, end_time, location, member_fee, visitor_fee], function(err) {
      if (err) {
        console.error('企画イベント作成エラー:', err);
        return res.status(500).json({ error: 'データベースエラー' });
      }

      const eventId = this.lastID;
      
      // デフォルトタスクを作成
      const insertTaskPromises = defaultTasks.map(task => {
        return new Promise((resolve, reject) => {
          const eventDate = new Date(event_date);
          const deadlineDate = new Date(eventDate);
          deadlineDate.setDate(deadlineDate.getDate() - task.deadline_days_before);
          
          const insertTaskSql = `
            INSERT INTO planning_tasks (event_id, name, deadline_days_before, deadline_date, is_completed, url)
            VALUES (?, ?, ?, ?, 0, ?)
          `;
          
          db.run(insertTaskSql, [eventId, task.name, task.deadline_days_before, deadlineDate.toISOString().split('T')[0], task.url], function(err) {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        });
      });

      Promise.all(insertTaskPromises)
        .then(() => {
          res.status(201).json({ 
            message: '企画イベントとタスクが作成されました',
            eventId: eventId
          });
        })
        .catch(err => {
          console.error('タスク作成エラー:', err);
          res.status(500).json({ error: 'タスク作成エラー' });
        });
    });
  } catch (error) {
    console.error('企画イベント作成エラー:', error);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

// タスク完了状態更新
router.put('/tasks/:taskId', auth, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { is_completed } = req.body;
    
    console.log('タスク更新リクエスト受信:', { taskId, is_completed });
    
    if (typeof is_completed !== 'boolean') {
      return res.status(400).json({ error: 'is_completedはboolean型である必要があります' });
    }

    const updateSql = `
      UPDATE planning_tasks 
      SET is_completed = ? 
      WHERE id = ? AND event_id IN (
        SELECT id FROM planning_events WHERE user_id = ?
      )
    `;

    db.run(updateSql, [is_completed ? 1 : 0, taskId, req.user.id], function(err) {
      if (err) {
        console.error('タスク更新エラー:', err);
        return res.status(500).json({ error: 'データベースエラー' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'タスクが見つからないか、更新権限がありません' });
      }

      console.log('タスク更新成功:', { taskId, is_completed, changes: this.changes });
      res.json({ 
        message: 'タスクが更新されました',
        taskId: taskId,
        is_completed: is_completed
      });
    });
  } catch (error) {
    console.error('タスク更新エラー:', error);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

module.exports = router; 