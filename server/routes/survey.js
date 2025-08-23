const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const db = require('../database');

// 権限チェックミドルウェア
const checkClass1MembersPermission = (req, res, next) => {
  const userRole = req.user.role;
  if (userRole !== 'Class1 Members') {
    return res.status(403).json({ success: false, message: 'Class1 Members権限が必要です' });
  }
  next();
};

// アンケートテーブルの作成
const createSurveyTable = () => {
  try {
    // テーブルが存在するかチェック
    const tableExists = db.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='surveys'
    `).get();
    
    if (!tableExists) {
      // テーブルが存在しない場合は作成
      db.prepare(`
        CREATE TABLE surveys (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          member_number TEXT NOT NULL,
          month TEXT NOT NULL,
          satisfaction_rating INTEGER NOT NULL,
          recommendation_score INTEGER NOT NULL,
          instructor_feedback TEXT,
          lesson_feedback TEXT,
          next_month_goals TEXT,
          other_comments TEXT,
          completed BOOLEAN DEFAULT 0,
          submitted_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(member_number, month)
        )
      `).run();
      console.log('surveysテーブルが作成されました');
    } else {
      // テーブルが存在する場合はmember_numberカラムを追加
      const columns = db.prepare(`
        PRAGMA table_info(surveys)
      `).all();
      
      const memberNumberColumn = columns.find(col => col.name === 'member_number');
      
      if (!memberNumberColumn) {
        db.prepare(`
          ALTER TABLE surveys ADD COLUMN member_number TEXT NOT NULL DEFAULT ''
        `).run();
        console.log('surveysテーブルにmember_numberカラムを追加しました');
      } else {
        console.log('surveysテーブルのmember_numberカラムは既に存在します');
      }
    }
  } catch (error) {
    console.error('surveysテーブル作成エラー:', error);
  }
};

// テーブル作成を実行
createSurveyTable();

// 現在月のアンケートデータを取得
router.get('/current-month', authenticateToken, checkClass1MembersPermission, (req, res) => {
  try {
    const userId = req.user.userId;
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    // ユーザーIDを使って生徒のIDを取得
    const student = db.prepare(`
      SELECT id FROM class1_students WHERE instructor_id = ?
    `).get(userId);
    
    if (!student) {
      return res.json({ success: true, survey: null });
    }
    
    const survey = db.prepare(`
      SELECT 
        satisfaction_rating,
        recommendation_score,
        instructor_feedback,
        lesson_feedback,
        next_month_goals,
        other_comments,
        completed,
        submitted_at,
        member_number
      FROM surveys
      WHERE member_number = ? AND month = ?
    `).get(student.id, currentMonth);

    if (survey) {
      // next_month_goalsをJSONから配列に変換
      survey.next_month_goals = survey.next_month_goals ? JSON.parse(survey.next_month_goals) : [];
    }

    res.json({ success: true, survey });
  } catch (error) {
    console.error('アンケートデータ取得エラー:', error);
    res.status(500).json({ success: false, message: 'アンケートデータの取得に失敗しました' });
  }
});

// アンケートを送信
router.post('/submit', authenticateToken, checkClass1MembersPermission, (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      month,
      member_number,
      satisfaction_rating,
      recommendation_score,
      instructor_feedback,
      lesson_feedback,
      next_month_goals,
      other_comments,
      completed
    } = req.body;

    if (!satisfaction_rating || satisfaction_rating === 0) {
      return res.status(400).json({ success: false, message: '満足度評価は必須です' });
    }

    if (!member_number) {
      return res.status(400).json({ success: false, message: '会員番号は必須です' });
    }

    // IDを会員番号として使用して生徒を確認
    const student = db.prepare(`
      SELECT id, name FROM class1_students WHERE id = ?
    `).get(member_number);

    if (!student) {
      return res.status(400).json({ success: false, message: '会員番号が見つかりません' });
    }

    // next_month_goalsをJSON文字列に変換
    const nextMonthGoalsJson = JSON.stringify(next_month_goals || []);

    // 既存データを確認（IDを会員番号として使用）
    const existing = db.prepare(`
      SELECT id FROM surveys 
      WHERE member_number = ? AND month = ?
    `).get(member_number, month);

    if (existing) {
      // 既存データを更新
      db.prepare(`
        UPDATE surveys 
        SET 
          user_id = ?,
          satisfaction_rating = ?,
          recommendation_score = ?,
          instructor_feedback = ?,
          lesson_feedback = ?,
          next_month_goals = ?,
          other_comments = ?,
          completed = ?,
          submitted_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE member_number = ? AND month = ?
      `).run(
        userId,
        satisfaction_rating,
        recommendation_score,
        instructor_feedback || '',
        lesson_feedback || '',
        nextMonthGoalsJson,
        other_comments || '',
        completed ? 1 : 0,
        member_number,
        month
      );
    } else {
      // 新規データを作成
      db.prepare(`
        INSERT INTO surveys (
          user_id, member_number, month, satisfaction_rating, recommendation_score,
          instructor_feedback, lesson_feedback, next_month_goals,
          other_comments, completed, submitted_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(
        userId,
        member_number,
        month,
        satisfaction_rating,
        recommendation_score,
        instructor_feedback || '',
        lesson_feedback || '',
        nextMonthGoalsJson,
        other_comments || '',
        completed ? 1 : 0
      );
    }

    // マネージャーページ用の月次データも更新
    const existingMonthlyData = db.prepare(`
      SELECT id FROM manager_monthly_data 
      WHERE student_id = ? AND month = ?
    `).get(student.id, month);

    if (existingMonthlyData) {
      db.prepare(`
        UPDATE manager_monthly_data 
        SET survey_completed = ?, survey_answers = ?, updated_at = CURRENT_TIMESTAMP
        WHERE student_id = ? AND month = ?
      `).run(1, JSON.stringify(req.body), student.id, month);
    } else {
      db.prepare(`
        INSERT INTO manager_monthly_data (student_id, month, survey_completed, survey_answers)
        VALUES (?, ?, ?, ?)
      `).run(student.id, month, 1, JSON.stringify(req.body));
    }

    res.json({ success: true, message: 'アンケートを送信しました' });
  } catch (error) {
    console.error('アンケート送信エラー:', error);
    res.status(500).json({ success: false, message: 'アンケートの送信に失敗しました' });
  }
});

// 特定の月のアンケートデータを取得（マネージャー用）
router.get('/month/:month', authenticateToken, (req, res) => {
  try {
    const userRole = req.user.role;
    if (userRole !== 'サーバー管理者') {
      return res.status(403).json({ success: false, message: 'サーバー管理者権限が必要です' });
    }

    const { month } = req.params;
    
    const surveys = db.prepare(`
      SELECT 
        s.id,
        s.user_id,
        s.member_number,
        s.month,
        s.satisfaction_rating,
        s.recommendation_score,
        s.instructor_feedback,
        s.lesson_feedback,
        s.next_month_goals,
        s.other_comments,
        s.completed,
        s.submitted_at,
        u.username,
        cs.name as student_name
      FROM surveys s
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN class1_students cs ON s.member_number = cs.member_number
      WHERE s.month = ?
      ORDER BY s.submitted_at DESC
    `).all(month);

    // next_month_goalsをJSONから配列に変換
    surveys.forEach(survey => {
      survey.next_month_goals = survey.next_month_goals ? JSON.parse(survey.next_month_goals) : [];
    });

    res.json({ success: true, surveys });
  } catch (error) {
    console.error('月次アンケートデータ取得エラー:', error);
    res.status(500).json({ success: false, message: '月次アンケートデータの取得に失敗しました' });
  }
});

module.exports = router; 