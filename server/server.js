const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://ecg-english.github.io', 'https://language-community-frontend.onrender.com']
    : ['http://localhost:3000'],
  credentials: true,
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
const uploadsDir = path.join(__dirname, 'uploads');
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

// 静的ファイル配信
app.use('/uploads', express.static(uploadsDir));

// テスト用エンドポイント（直接サーバーに追加）
app.get('/api/test/users', (req, res) => {
  try {
    console.log('=== Direct Test Endpoint ===');
    const db = require('./database');
    const users = db.prepare('SELECT id, username, role FROM users').all();
    console.log(`Found ${users.length} users in direct test`);
    res.json({ users });
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
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 