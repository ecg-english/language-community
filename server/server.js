const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 環境変数の確認ログ
console.log('=== Environment Variables Check ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('OpenAI API features temporarily disabled due to quota issues');
console.log('==================================');

const app = express();

// レート制限の設定
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1分
  max: 1000, // 1分間に1000リクエストまで
  message: 'Too many requests from this IP, please try again later.',
});

app.use(limiter);

// CORS設定
app.use(cors({
  origin: function (origin, callback) {
    // 許可するオリジンのリスト
    const allowedOrigins = [
      'https://ecg-english.github.io',
      'https://language-community-frontend.onrender.com',
      'http://localhost:3000'
    ];
    
    // originがnullの場合（同一オリジンリクエスト）も許可
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(null, true); // 開発中は全て許可
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// ボディパーサー（画像アップロード用に制限を増加）
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// リクエストログミドルウェア
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// ファイルアップロード用のディレクトリ作成
let uploadsDir;
if (process.env.NODE_ENV === 'production') {
  // Renderの永続化ディスクを使用
  uploadsDir = '/opt/render/data/uploads';
} else {
  // 開発環境
  uploadsDir = path.join(__dirname, 'uploads');
}

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer設定
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB制限
  },
  fileFilter: function (req, file, cb) {
    // 画像ファイルのみ許可
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// 静的ファイル配信（CORSヘッダーを追加）
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
}, express.static(uploadsDir));

// ヘルスチェックエンドポイント（Render用）
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// テスト用エンドポイント（直接サーバーに追加）
app.get('/api/test/users', (req, res) => {
  try {
    console.log('=== Direct Test Endpoint ===');
    const db = require('./database');
    const users = db.prepare('SELECT id, username, role, avatar_url, created_at FROM users').all();
    
    // アバター画像のURLを自動修正
    const correctedUsers = users.map(user => {
      if (user.avatar_url && user.avatar_url.includes('ecg-english.github.io')) {
        user.avatar_url = user.avatar_url.replace('https://ecg-english.github.io', 'https://language-community-backend.onrender.com');
      }
      return user;
    });
    
    console.log(`Found ${correctedUsers.length} users in direct test`);
    res.json({ users: correctedUsers });
  } catch (error) {
    console.error('Direct test endpoint error:', error);
    res.status(500).json({ error: 'Direct test failed' });
  }
});

// ルート
app.use('/api/auth', require('./routes/auth'));
app.use('/api/channels', require('./routes/channels'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/events', require('./routes/events'));
app.use('/api/study-log', require('./routes/studyLog'));

// ファイルアップロード用ルート
app.post('/api/upload/avatar', upload.single('avatar'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'ファイルがアップロードされていません' });
    }
    
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ 
      message: 'ファイルがアップロードされました',
      fileUrl: fileUrl
    });
  } catch (error) {
    console.error('ファイルアップロードエラー:', error);
    res.status(500).json({ error: 'ファイルのアップロードに失敗しました' });
  }
});

// エラーハンドリングミドルウェア
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  console.error('Error stack:', error.stack);
  res.status(500).json({ error: 'サーバーエラーが発生しました' });
});

// 404ハンドラー
app.use('*', (req, res) => {
  console.log('404 Not Found:', req.method, req.originalUrl);
  res.status(404).json({ error: 'エンドポイントが見つかりません' });
});

const PORT = process.env.PORT || 3001;

// 本番環境でのテスト投稿削除（一度だけ実行）
if (process.env.NODE_ENV === 'production') {
  const db = require('./database');
  
  try {
    console.log('本番環境のテスト投稿削除を実行中...');
    
    // 削除対象の投稿を確認
    const targetPosts = db.prepare(`
      SELECT id, content, created_at 
      FROM posts 
      WHERE content IN ('テストイベント2', 'TESTTESTAAA')
    `).all();
    
    console.log('削除対象の投稿:', targetPosts.length);
    
    if (targetPosts.length > 0) {
      // テスト投稿を削除
      const deleteTestPosts = db.prepare(`
        DELETE FROM posts 
        WHERE content IN ('テストイベント2', 'TESTTESTAAA')
      `);
      
      const result = deleteTestPosts.run();
      console.log('テスト投稿削除完了:', result.changes, '件削除');
    } else {
      console.log('削除対象の投稿が見つかりませんでした。');
    }
  } catch (error) {
    console.error('テスト投稿削除エラー:', error);
  }
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 