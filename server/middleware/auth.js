const jwt = require('jsonwebtoken');
const db = require('../database');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// JWT認証ミドルウェア
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log('=== Authentication Debug ===');
  console.log('Auth header:', authHeader);
  console.log('Token:', token ? 'Present' : 'Missing');

  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ error: 'アクセストークンが必要です' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log('Token verification failed:', err.message);
      return res.status(403).json({ error: '無効なトークンです' });
    }
    
    console.log('Token verified successfully');
    console.log('User from token:', { userId: user.userId, username: user.username, role: user.role });
    
    // データベースでユーザーの存在確認
    const dbUser = db.prepare('SELECT id, username, role FROM users WHERE id = ?').get(user.userId);
    if (!dbUser) {
      console.log('User not found in database:', user.userId);
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }
    
    console.log('User found in database:', dbUser);
    req.user = { ...user, ...dbUser };
    next();
  });
};

// ロールチェックミドルウェア
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: '認証が必要です' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'アクセス権限がありません' });
    }

    next();
  };
};

// 管理者権限チェック
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: '認証が必要です' });
  }

  if (req.user.role !== 'サーバー管理者') {
    return res.status(403).json({ error: '管理者権限が必要です' });
  }

  next();
};

// 講師権限チェック
const requireInstructor = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: '認証が必要です' });
  }

  const instructorRoles = ['サーバー管理者', 'ECG講師', 'JCG講師'];
  if (!instructorRoles.includes(req.user.role)) {
    return res.status(403).json({ error: '講師権限が必要です' });
  }

  next();
};

// チャンネル閲覧権限チェック
const checkChannelViewPermission = (req, res, next) => {
  try {
    const { channelId } = req.params;
    const userRole = req.user.role;

    // チャンネル情報を取得
    const channel = db.prepare('SELECT channel_type FROM channels WHERE id = ?').get(channelId);
    
    if (!channel) {
      return res.status(404).json({ error: 'チャンネルが見つかりません' });
    }

    const { channel_type } = channel;

    // チャンネルタイプに基づく権限チェック
    switch (channel_type) {
      case 'admin_only_instructors_view':
        // 管理者、ECG講師、JCG講師のみ閲覧可能
        if (!['サーバー管理者', 'ECG講師', 'JCG講師'].includes(userRole)) {
          return res.status(403).json({ error: 'このチャンネルを閲覧する権限がありません' });
        }
        break;
      
      case 'class1_post_class1_view':
        // Class1メンバー以上のみ閲覧可能
        if (!['サーバー管理者', 'ECG講師', 'JCG講師', 'Class1 Members'].includes(userRole)) {
          return res.status(403).json({ error: 'このチャンネルを閲覧する権限がありません' });
        }
        break;
      
      case 'admin_only_all_view':
      case 'instructors_post_all_view':
      case 'all_post_all_view':
        // 全メンバー閲覧可能
        break;
      
      default:
        return res.status(400).json({ error: '無効なチャンネルタイプです' });
    }

    next();
  } catch (error) {
    console.error('チャンネル閲覧権限チェックエラー:', error);
    res.status(500).json({ error: '権限チェックに失敗しました' });
  }
};

// チャンネル投稿権限チェック
const checkChannelPostPermission = (req, res, next) => {
  try {
    const { channelId } = req.params;
    const userRole = req.user.role;

    // Trial参加者は投稿不可
    if (userRole === 'Trial参加者') {
      return res.status(403).json({ error: 'Trial参加者は投稿できません' });
    }

    const channel = db.prepare('SELECT channel_type FROM channels WHERE id = ?').get(channelId);
    
    if (!channel) {
      return res.status(404).json({ error: 'チャンネルが見つかりません' });
    }

    let canPost = false;
    switch (channel.channel_type) {
      case 'all_post_all_view':
        canPost = true;
        break;
      case 'admin_only_all_view':
        canPost = userRole === 'サーバー管理者';
        break;
      case 'instructors_post_all_view':
        canPost = ['サーバー管理者', 'ECG講師', 'JCG講師'].includes(userRole);
        break;
      case 'admin_only_instructors_view':
        canPost = ['サーバー管理者', 'ECG講師', 'JCG講師'].includes(userRole);
        break;
      case 'class1_post_class1_view':
        canPost = ['サーバー管理者', 'ECG講師', 'JCG講師', 'Class1 Members'].includes(userRole);
        break;
      default:
        canPost = false;
    }

    if (!canPost) {
      return res.status(403).json({ error: 'このチャンネルに投稿する権限がありません' });
    }

    next();
  } catch (error) {
    console.error('投稿権限チェックエラー:', error);
    res.status(500).json({ error: '権限チェックに失敗しました' });
  }
};

module.exports = {
  authenticateToken,
  checkRole,
  requireAdmin,
  requireInstructor,
  checkChannelViewPermission,
  checkChannelPostPermission
}; 