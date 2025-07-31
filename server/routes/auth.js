const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const db = require('../database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// ルーターのログ
router.use((req, res, next) => {
  console.log(`=== Auth Router: ${req.method} ${req.path} ===`);
  next();
});

// ユーザー登録
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: '全ての必須フィールドを入力してください' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'パスワードは6文字以上で入力してください' });
    }

    // 既存ユーザーのチェック
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ? OR username = ?').get(email, username);
    if (existingUser) {
      return res.status(400).json({ error: 'ユーザー名またはメールアドレスが既に使用されています' });
    }

    // パスワードのハッシュ化
    const hashedPassword = await bcrypt.hash(password, 10);

    // ユーザーの作成
    const insertUser = db.prepare(`
      INSERT INTO users (username, email, password, role, bio) 
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const result = insertUser.run(username, email, hashedPassword, 'Trial参加者', '');

    // JWTトークンの生成
    const token = jwt.sign(
      { 
        userId: result.lastInsertRowid, 
        username, 
        email, 
        role: 'Trial参加者' 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'ユーザー登録が完了しました',
      token,
      user: {
        id: result.lastInsertRowid,
        username,
        email,
        role: 'Trial参加者',
        bio: ''
      }
    });
  } catch (error) {
    console.error('ユーザー登録エラー:', error);
    res.status(500).json({ error: 'ユーザー登録に失敗しました' });
  }
});

// ログイン
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'メールアドレスとパスワードを入力してください' });
    }

    // ユーザーの検索
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ error: 'メールアドレスまたはパスワードが正しくありません' });
    }

    // パスワードの検証
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'メールアドレスまたはパスワードが正しくありません' });
    }

    // JWTトークンの生成
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('=== Login Debug ===');
    console.log('User from database:', { id: user.id, username: user.username, role: user.role });
    console.log('Token payload:', { userId: user.id, username: user.username, email: user.email, role: user.role });

    res.json({
      message: 'ログインが完了しました',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        bio: user.bio || ''
      }
    });
  } catch (error) {
    console.error('ログインエラー:', error);
    res.status(500).json({ error: 'ログインに失敗しました' });
  }
});

// 現在のユーザー情報を取得
router.get('/me', authenticateToken, (req, res) => {
  try {
    const user = db.prepare('SELECT id, username, email, role, bio, avatar_url FROM users WHERE id = ?').get(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        bio: user.bio || '',
        avatar_url: user.avatar_url
      }
    });
  } catch (error) {
    console.error('ユーザー情報取得エラー:', error);
    res.status(500).json({ error: 'ユーザー情報の取得に失敗しました' });
  }
});

// 特定のユーザーのプロフィールを取得
router.get('/users/:userId', authenticateToken, (req, res) => {
  try {
    const { userId } = req.params;

    const user = db.prepare(`
      SELECT id, username, email, role, bio, avatar_url, goal, message, created_at
      FROM users WHERE id = ?
    `).get(userId);

    if (!user) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }

    res.json({ user });
  } catch (error) {
    console.error('ユーザー取得エラー:', error);
    res.status(500).json({ error: 'ユーザー情報の取得に失敗しました' });
  }
});

// プロフィール更新
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { username, bio, goal, message, avatar_url } = req.body;
    const userId = req.user.userId;

    if (!username || username.trim() === '') {
      return res.status(400).json({ error: 'ユーザー名は必須です' });
    }

    // 既存ユーザーのチェック（自分以外）
    const existingUser = db.prepare('SELECT id FROM users WHERE (email = ? OR username = ?) AND id != ?').get(req.user.email, username, userId);
    if (existingUser) {
      return res.status(400).json({ error: 'ユーザー名が既に使用されています' });
    }

    // プロフィール更新
    const updateUser = db.prepare(`
      UPDATE users 
      SET username = ?, bio = ?, goal = ?, message = ?, avatar_url = ?
      WHERE id = ?
    `);

    updateUser.run(
      username.trim(),
      bio || '',
      goal || '',
      message || '',
      avatar_url || null,
      userId
    );

    // 更新されたユーザー情報を取得
    const updatedUser = db.prepare(`
      SELECT id, username, email, role, bio, avatar_url, goal, message, created_at
      FROM users WHERE id = ?
    `).get(userId);

    res.json({
      message: 'プロフィールが更新されました',
      user: updatedUser
    });
  } catch (error) {
    console.error('プロフィール更新エラー:', error);
    res.status(500).json({ error: 'プロフィールの更新に失敗しました' });
  }
});

// デバッグ用：データベース状態確認
router.get('/debug/db-status', (req, res) => {
  try {
    console.log('=== Database Debug ===');
    
    // テーブル一覧を取得
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('Available tables:', tables);
    
    // ユーザーテーブルの行数を確認
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
    console.log('User count:', userCount);
    
    // 最新のユーザーを確認
    const latestUsers = db.prepare('SELECT id, username, role, created_at FROM users ORDER BY created_at DESC LIMIT 5').all();
    console.log('Latest users:', latestUsers);
    
    res.json({
      tables: tables.map(t => t.name),
      userCount: userCount.count,
      latestUsers: latestUsers
    });
  } catch (error) {
    console.error('Database debug error:', error);
    res.status(500).json({ error: 'データベースデバッグエラー', details: error.message });
  }
});

// ユーザー一覧を取得（誰でも閲覧可、機微情報は除外）
router.get('/users/public', authenticateToken, (req, res) => {
  console.log('=== Users/Public Endpoint Start ===');
  console.log('Request user:', req.user);
  console.log('Fetching public users list...');
  
  try {
    // データベースの状態を確認
    console.log('Checking if users table exists...');
    const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();
    if (!tableCheck) {
      console.error('Users table does not exist');
      console.log('=== Users/Public Endpoint End (table not found) ===');
      return res.status(500).json({ error: 'データベーステーブルが存在しません' });
    }

    console.log('Users table exists, fetching users...');
    const users = db.prepare(`
      SELECT id, username, role, avatar_url, created_at
      FROM users
      ORDER BY created_at DESC
    `).all();

    console.log(`Found ${users.length} users`);
    console.log('Users:', users);
    
    // レスポンスを送信
    console.log('Sending response with users');
    res.json({ users });
    console.log('Response sent successfully');
    console.log('=== Users/Public Endpoint End (success) ===');
  } catch (error) {
    console.error('ユーザー一覧取得エラー:', error);
    console.error('Error stack:', error.stack);
    console.log('=== Users/Public Endpoint End (error) ===');
    res.status(500).json({ error: 'ユーザー一覧の取得に失敗しました' });
  }
});

// ユーザー一覧を取得（管理者のみ、メールアドレス含む）
router.get('/users', authenticateToken, requireAdmin, (req, res) => {
  try {
    const users = db.prepare(`
      SELECT id, username, email, role, avatar_url, created_at
      FROM users
      ORDER BY created_at DESC
    `).all();

    res.json({ users });
  } catch (error) {
    console.error('ユーザー一覧取得エラー:', error);
    res.status(500).json({ error: 'ユーザー一覧の取得に失敗しました' });
  }
});

// ユーザーロールの変更（管理者のみ）
router.put('/users/:userId/role', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    const validRoles = ['サーバー管理者', 'ECG講師', 'JCG講師', 'Class1 Members', 'ECGメンバー', 'JCGメンバー', 'Trial参加者'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: '無効なロールです' });
    }

    const updateRole = db.prepare('UPDATE users SET role = ? WHERE id = ?');
    const result = updateRole.run(role, userId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }

    res.json({ message: 'ユーザーロールが更新されました' });
  } catch (error) {
    console.error('ロール変更エラー:', error);
    res.status(500).json({ error: 'ロールの変更に失敗しました' });
  }
});

module.exports = router; 