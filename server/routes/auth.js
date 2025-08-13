const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const router = express.Router();
const db = require('../database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'language-community-secret-key-2024';

// ルーターのログ
router.use((req, res, next) => {
  console.log(`=== Auth Router: ${req.method} ${req.path} ===`);
  next();
});

// エラーハンドリングミドルウェア（authルーター用）
router.use((error, req, res, next) => {
  console.error('Auth router error:', error);
  res.status(500).json({ error: 'Auth router error' });
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
    
    const result = insertUser.run(username, email, hashedPassword, 'ビジター', '');

    // JWTトークンの生成
    const token = jwt.sign(
      { 
        userId: result.lastInsertRowid, 
        username, 
        email, 
        role: 'ビジター' 
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
        role: 'ビジター',
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
      SELECT id, username, email, role, bio, avatar_url, message, 
             native_language, target_languages, country, timezone,
             discord_username, instagram_id, created_at
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
    console.log('=== Profile Update Request ===');
    console.log('Request body:', req.body);
    console.log('User ID:', req.user.userId);
    
    const { 
      username, 
      bio, 
      message, 
      avatar_url, 
      native_language, 
      target_languages, 
      country, 
      timezone,
      discord_username,
      instagram_id
    } = req.body;
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
      SET username = ?, bio = ?, message = ?, avatar_url = ?, 
          native_language = ?, target_languages = ?, country = ?, timezone = ?,
          discord_username = ?, instagram_id = ?
      WHERE id = ?
    `);

    updateUser.run(
      username.trim(),
      bio || '',
      message || '',
      avatar_url || '',
      native_language || '',
      target_languages || '',
      country || '',
      timezone || '',
      discord_username || '',
      instagram_id || '',
      userId
    );

    console.log('プロフィールが更新されました:', { userId, username: username.trim() });

    res.json({
      message: 'プロフィールが更新されました',
      user: {
        id: userId,
        username: username.trim(),
        bio: bio || '',
        message: message || '',
        avatar_url: avatar_url || '',
        native_language: native_language || '',
        target_languages: target_languages || '',
        country: country || '',
        timezone: timezone || '',
        discord_username: discord_username || '',
        instagram_id: instagram_id || ''
      }
    });
  } catch (error) {
    console.error('プロフィール更新エラー:', error);
    res.status(500).json({ error: 'プロフィールの更新に失敗しました' });
  }
});

// プロフィール情報を取得（テンプレート投稿用）
router.get('/profile/template', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    
    const user = db.prepare(`
      SELECT bio, message 
      FROM users 
      WHERE id = ?
    `).get(userId);

    if (!user) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }

    res.json({
      bio: user.bio || '',
      message: user.message || ''
    });
  } catch (error) {
    console.error('プロフィール情報取得エラー:', error);
    res.status(500).json({ error: 'プロフィール情報の取得に失敗しました' });
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
    
    // ユーザーテーブルのスキーマを確認
    const userSchema = db.prepare("PRAGMA table_info(users)").all();
    console.log('Users table schema:', userSchema);
    
    res.json({
      tables: tables.map(t => t.name),
      userCount: userCount.count,
      latestUsers: latestUsers,
      userSchema: userSchema
    });
  } catch (error) {
    console.error('Database debug error:', error);
    res.status(500).json({ error: 'データベースデバッグエラー', details: error.message });
  }
});

// デバッグ用：環境変数確認
router.get('/debug/env', (req, res) => {
  try {
    console.log('=== Environment Debug ===');
    console.log('JWT_SECRET present:', !!process.env.JWT_SECRET);
    console.log('JWT_SECRET length:', process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0);
    
    res.json({
      jwtSecretPresent: !!process.env.JWT_SECRET,
      jwtSecretLength: process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0,
      nodeEnv: process.env.NODE_ENV,
      port: process.env.PORT
    });
  } catch (error) {
    console.error('Environment debug error:', error);
    res.status(500).json({ error: '環境変数デバッグエラー', details: error.message });
  }
});

// テスト用：認証なしでユーザー一覧を取得
router.get('/users/test', (req, res) => {
  try {
    console.log('=== Test Endpoint: No Authentication ===');
    
    const users = db.prepare(`
      SELECT id, username, role, avatar_url, bio, message, 
             native_language, target_languages, country, timezone,
             discord_username, instagram_id,
             monthly_reflection, monthly_goal, created_at
      FROM users
      ORDER BY created_at DESC
    `).all();

    console.log(`Found ${users.length} users in test endpoint`);
    res.json({ users });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({ error: 'テストエンドポイントエラー' });
  }
});

// ユーザー一覧を取得（誰でも閲覧可、機微情報は除外）
router.get('/users/public', (req, res) => {
  console.log('=== Users/Public Endpoint Start ===');
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
      SELECT id, username, role, avatar_url, bio, message, 
             native_language, target_languages, country, timezone,
             discord_username, instagram_id,
             monthly_reflection, monthly_goal, created_at
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

// 月次振り返り・目標設定
router.post('/monthly-update', authenticateToken, async (req, res) => {
  try {
    const { reflection, goal } = req.body;
    const userId = req.user.userId;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // getMonth()は0ベース

    // 月次更新を記録
    const updateMonthly = db.prepare(`
      UPDATE users 
      SET monthly_reflection = ?, monthly_goal = ?, last_monthly_update = ?
      WHERE id = ?
    `);

    updateMonthly.run(
      reflection || '',
      goal || '',
      now.toISOString().split('T')[0], // YYYY-MM-DD形式
      userId
    );

    // 月次通知を完了としてマーク
    const markNotificationComplete = db.prepare(`
      INSERT OR REPLACE INTO monthly_notifications 
      (user_id, year, month, is_completed) VALUES (?, ?, ?, 1)
    `);

    markNotificationComplete.run(userId, currentYear, currentMonth);

    res.json({
      message: '月次振り返り・目標が更新されました',
      year: currentYear,
      month: currentMonth
    });
  } catch (error) {
    console.error('月次更新エラー:', error);
    res.status(500).json({ error: '月次更新に失敗しました' });
  }
});

// 月次通知の確認
router.get('/monthly-notification', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // 今月の通知が完了しているかチェック
    const notification = db.prepare(`
      SELECT is_completed FROM monthly_notifications 
      WHERE user_id = ? AND year = ? AND month = ?
    `).get(userId, currentYear, currentMonth);

    // 今月1日以降で、まだ更新していない場合は通知
    const shouldNotify = now.getDate() >= 1 && (!notification || !notification.is_completed);

    res.json({
      shouldNotify,
      currentYear,
      currentMonth
    });
  } catch (error) {
    console.error('月次通知確認エラー:', error);
    res.status(500).json({ error: '月次通知確認に失敗しました' });
  }
});

// ユーザーの月次情報を取得
router.get('/monthly-info/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = db.prepare(`
      SELECT monthly_reflection, monthly_goal, last_monthly_update
      FROM users WHERE id = ?
    `).get(userId);

    if (!user) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }

    res.json({
      monthly_reflection: user.monthly_reflection,
      monthly_goal: user.monthly_goal,
      last_monthly_update: user.last_monthly_update
    });
  } catch (error) {
    console.error('月次情報取得エラー:', error);
    res.status(500).json({ error: '月次情報の取得に失敗しました' });
  }
});

// ユーザーの月次履歴を取得
router.get('/monthly-history/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // 月次通知テーブルから履歴を取得
    const monthlyEntries = db.prepare(`
      SELECT mn.year, mn.month, mn.is_completed,
             u.monthly_reflection, u.monthly_goal, u.last_monthly_update
      FROM monthly_notifications mn
      LEFT JOIN users u ON mn.user_id = u.id
      WHERE mn.user_id = ? AND mn.is_completed = 1
      ORDER BY mn.year DESC, mn.month DESC
    `).all(userId);

    console.log(`Found ${monthlyEntries.length} monthly entries for user ${userId}`);

    res.json({
      monthlyEntries: monthlyEntries.map(entry => ({
        year: entry.year,
        month: entry.month,
        reflection: entry.monthly_reflection,
        goal: entry.monthly_goal,
        last_monthly_update: entry.last_monthly_update
      }))
    });
  } catch (error) {
    console.error('月次履歴取得エラー:', error);
    res.status(500).json({ error: '月次履歴の取得に失敗しました' });
  }
});

// アバター画像URL修正API（一時的に認証なし）
router.post('/fix-avatar-urls', (req, res) => {
  try {
    console.log('=== Avatar URL Fix API Called ===');
    
    // すべてのユーザーのアバターURLを修正
    const users = db.prepare('SELECT id, username, avatar_url FROM users WHERE avatar_url IS NOT NULL AND avatar_url != ""').all();
    console.log(`Found ${users.length} users with avatar URLs`);
    
    let fixedCount = 0;
    for (const user of users) {
      console.log(`Checking user ${user.username}: ${user.avatar_url}`);
      if (user.avatar_url && user.avatar_url.includes('ecg-english.github.io')) {
        // 間違ったURLを正しいURLに修正
        const fileName = user.avatar_url.split('/').pop();
        const correctUrl = `${process.env.NODE_ENV === 'production' 
          ? 'https://language-community-backend.onrender.com' 
          : 'http://localhost:3001'}/uploads/${fileName}`;
        
        const updateAvatar = db.prepare('UPDATE users SET avatar_url = ? WHERE id = ?');
        updateAvatar.run(correctUrl, user.id);
        fixedCount++;
        
        console.log(`Fixed avatar URL for user ${user.username}: ${user.avatar_url} -> ${correctUrl}`);
      }
    }
    
    console.log(`Fixed ${fixedCount} avatar URLs`);
    res.json({
      message: `${fixedCount}個のアバターURLを修正しました`,
      fixedCount
    });
  } catch (error) {
    console.error('アバターURL修正エラー:', error);
    res.status(500).json({ 
      error: 'アバターURLの修正に失敗しました',
      details: error.message 
    });
  }
});

// アバター画像アップロード
router.post('/upload/avatar', authenticateToken, (req, res) => {
  try {
    console.log('=== Avatar Upload API Called ===');
    console.log('Request body keys:', Object.keys(req.body));
    
    const { imageData } = req.body;
    const userId = req.user.userId;
    
    console.log('User ID:', userId);
    console.log('Image data length:', imageData ? imageData.length : 0);
    
    if (!imageData) {
      return res.status(400).json({ error: '画像データが提供されていません' });
    }

    // Base64データをデコードしてバリデーション
    const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    console.log('Buffer length:', buffer.length);
    
    // ファイルサイズチェック（2MB制限）
    if (buffer.length > 2 * 1024 * 1024) {
      return res.status(400).json({ error: '画像サイズは2MB以下にしてください' });
    }

    // 画像形式チェック
    const header = buffer.toString('hex', 0, 4);
    const validFormats = ['89504e47', 'ffd8ffdb', 'ffd8ffe0', 'ffd8ffe1', 'ffd8ffe2', 'ffd8ffe3', 'ffd8ffe8'];
    
    if (!validFormats.some(format => header.startsWith(format))) {
      return res.status(400).json({ error: '対応していない画像形式です。PNG、JPEG形式のみ対応しています' });
    }

    // 画像を保存（Renderの永続化ディスクを使用）
    const fileName = `avatar_${userId}_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
    let uploadsDir;
    
    if (process.env.NODE_ENV === 'production') {
      // Renderの永続化ディスクを使用
      uploadsDir = '/opt/render/data/uploads';
    } else {
      // 開発環境
      uploadsDir = path.join(__dirname, '../uploads');
    }

    console.log('Uploads directory:', uploadsDir);

    // ディレクトリが存在しない場合は作成
    const fs = require('fs');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('Created uploads directory');
    }

    const filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, buffer);
    console.log('File saved to:', filePath);

    // 画像URLを生成
    const imageUrl = `${process.env.NODE_ENV === 'production' 
      ? 'https://language-community-backend.onrender.com' 
      : 'http://localhost:3001'}/uploads/${fileName}`;

    // データベースにアバターURLを保存
    const updateAvatar = db.prepare('UPDATE users SET avatar_url = ? WHERE id = ?');
    updateAvatar.run(imageUrl, userId);

    console.log('アバター画像がアップロードされました:', { userId, imageUrl });

    res.json({
      message: 'アバター画像がアップロードされました',
      avatar_url: imageUrl
    });
  } catch (error) {
    console.error('アバターアップロードエラー:', error);
    res.status(500).json({ 
      error: 'アバター画像のアップロードに失敗しました',
      details: error.message 
    });
  }
});

// ユーザー削除（管理者のみ）
router.delete('/users/:userId', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user.userId;

    // 自分自身を削除しようとしている場合はエラー
    if (parseInt(userId) === requestingUserId) {
      return res.status(400).json({ error: '自分自身を削除することはできません' });
    }

    // 削除対象のユーザーを確認
    const userToDelete = db.prepare('SELECT id, username, role FROM users WHERE id = ?').get(userId);
    if (!userToDelete) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }

    // サーバー管理者を削除しようとしている場合はエラー
    if (userToDelete.role === 'サーバー管理者') {
      return res.status(400).json({ error: 'サーバー管理者は削除できません' });
    }

    // ユーザーに関連するデータを削除（投稿、コメント、いいねなど）
    db.prepare('DELETE FROM likes WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM comments WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM posts WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM event_attendees WHERE user_id = ?').run(userId);
    
    // ユーザーを削除
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);

    console.log(`ユーザーが削除されました: ${userToDelete.username} (ID: ${userId})`);

    res.json({
      message: 'ユーザーが削除されました',
      deletedUser: {
        id: userToDelete.id,
        username: userToDelete.username
      }
    });
  } catch (error) {
    console.error('ユーザー削除エラー:', error);
    res.status(500).json({ error: 'ユーザーの削除に失敗しました' });
  }
});

module.exports = router; 