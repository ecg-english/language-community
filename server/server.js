const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

// レート制限の設定（開発環境用に大幅緩和）
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1分
  max: 10000, // 最大10000リクエスト/1分（開発環境用）
  message: {
    error: 'リクエストが多すぎます。しばらく待ってから再試行してください。'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ミドルウェア
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// APIルートにのみレート制限を適用
app.use('/api', limiter);

// ルート
app.use('/api/auth', require('./routes/auth'));
app.use('/api/channels', require('./routes/channels'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/search', require('./routes/search'));
app.use('/api/events', require('./routes/events'));

// ヘルスチェック
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// エラーハンドリング
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'サーバーエラーが発生しました' });
});

// 404ハンドラー
app.use('*', (req, res) => {
  res.status(404).json({ error: 'エンドポイントが見つかりません' });
});

app.listen(PORT, () => {
  console.log(`サーバーがポート${PORT}で起動しました`);
}); 