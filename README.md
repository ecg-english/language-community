# 言語学習コミュニティ

英語を学ぶ日本人と日本語を学ぶ外国人のためのオンラインコミュニティプラットフォームです。

## 機能

### ユーザー管理
- ユーザー登録・ログイン
- 6種類のロール管理
  - サーバー管理者
  - ECG講師（英語講師）
  - JCG講師（日本語講師）
  - ECGメンバー（英語学習者）
  - JCGメンバー（日本語学習者）
  - Trial参加者

### コミュニティ機能
- **チャンネルカテゴリ**
  - English Learning
  - 日本語学習
  - トグル式で折りたたみ可能

- **チャンネル権限管理**
  - 管理者のみ投稿・講師のみ閲覧
  - 管理者のみ投稿・全員閲覧
  - 講師のみ投稿・全員閲覧
  - 全員投稿・全員閲覧

- **投稿機能**
  - SNS風の投稿表示
  - いいね機能
  - コメント機能
  - ロール表示
  - 投稿・コメント削除（所有者または管理者）

### 管理機能
- ユーザーロール変更
- カテゴリ作成
- チャンネル作成・削除
- 投稿・コメント管理

## 技術スタック

### フロントエンド
- React 18
- TypeScript
- Material-UI (MUI)
- React Router
- Axios
- React Context API

### バックエンド
- Node.js
- Express.js
- SQLite
- JWT認証
- bcryptjs（パスワードハッシュ化）

## セットアップ

### 必要環境
- Node.js 16以上
- npm

### インストール

1. 依存関係のインストール
```bash
npm run install-all
```

2. 開発サーバー起動
```bash
npm run dev
```

これにより以下が同時に起動します：
- フロントエンド: http://localhost:3000
- バックエンドAPI: http://localhost:3001

### 初回セットアップ

1. ブラウザで http://localhost:3000 にアクセス
2. 「アカウント作成」からユーザー登録
3. 最初に作成されたユーザーを管理者に昇格する場合は、データベースを直接編集するか、別の管理者ユーザーが必要です

## API エンドポイント

### 認証
- `POST /api/auth/register` - ユーザー登録
- `POST /api/auth/login` - ログイン
- `GET /api/auth/me` - 現在のユーザー情報
- `GET /api/auth/users` - ユーザー一覧（管理者のみ）
- `PUT /api/auth/users/:userId/role` - ロール変更（管理者のみ）

### カテゴリ・チャンネル
- `GET /api/categories` - カテゴリ一覧
- `POST /api/categories` - カテゴリ作成（管理者のみ）
- `PUT /api/categories/:categoryId/toggle` - カテゴリ折りたたみ
- `GET /api/categories/:categoryId/channels` - チャンネル一覧
- `POST /api/channels` - チャンネル作成（管理者のみ）
- `GET /api/channels/:channelId` - チャンネル詳細
- `DELETE /api/channels/:channelId` - チャンネル削除（管理者のみ）

### 投稿・コメント
- `GET /api/channels/:channelId/posts` - 投稿一覧
- `POST /api/channels/:channelId/posts` - 投稿作成
- `DELETE /api/posts/:postId` - 投稿削除
- `POST /api/posts/:postId/like` - いいね/いいね解除
- `GET /api/posts/:postId/comments` - コメント一覧
- `POST /api/posts/:postId/comments` - コメント作成
- `DELETE /api/comments/:commentId` - コメント削除

## データベース構造

### users
- id, username, email, password, role, avatar_url, created_at

### categories
- id, name, display_order, is_collapsed, created_at

### channels
- id, category_id, name, description, channel_type, created_at

### posts
- id, channel_id, user_id, content, image_url, created_at

### likes
- id, post_id, user_id, created_at

### comments
- id, post_id, user_id, content, created_at

## ライセンス

MIT License 