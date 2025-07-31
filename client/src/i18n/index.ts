import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// 英語
const en = {
  translation: {
    // 共通
    languageLearningCommunity: 'Language Learning Community',
    login: 'Login',
    register: 'Register',
    logout: 'Logout',
    profile: 'Profile',
    memberList: 'Member List',
    adminPanel: 'Admin Panel',
    features: 'Features',
    events: 'Events',
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    
    // ログイン・登録
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    username: 'Username',
    loginInProgress: 'Logging in...',
    creatingAccount: 'Creating account...',
    noAccount: "Don't have an account? Click here",
    haveAccount: 'Already have an account? Click here',
    
    // コミュニティ
    searchPosts: 'Search posts and users...',
    memberListDescription: 'Check the list of community members',
    featuresDescription: 'Learn about community features',
    noChannels: 'No channels available',
    noPosts: 'No posts yet',
    
    // プロフィール
    learningGoal: 'Learning Goal',
    oneWordMessage: 'One-word Message',
    selfIntroduction: 'Self Introduction',
    goalNotSet: 'Goal not set',
    messageNotSet: 'Message not set',
    bioNotSet: 'Self introduction not set',
    registrationDate: 'Registration Date',
    
    // イベント
    upcomingEvents: 'Upcoming Events',
    noUpcomingEvents: 'No upcoming events',
    eventTitle: 'Event Title',
    details: 'Details',
    targetAudience: 'Target Audience',
    dateTime: 'Date & Time',
    participationMethod: 'Participation Method',
    startTime: 'Start Time',
    endTime: 'End Time',
    
    // 管理者
    userManagement: 'User Management',
    categoryManagement: 'Category Management',
    channelManagement: 'Channel Management',
    createCategory: 'Create New Category',
    createChannel: 'Create New Channel',
    changeRole: 'Change Role',
    
    // ロール
    serverAdmin: 'Server Administrator',
    ecgInstructor: 'ECG Instructor',
    jcgInstructor: 'JCG Instructor',
    class1Members: 'Class1 Members',
    ecgMember: 'ECG Member',
    jcgMember: 'JCG Member',
    trialParticipant: 'Trial Participant',
  }
};

// 日本語
const ja = {
  translation: {
    // 共通
    languageLearningCommunity: '言語学習コミュニティ',
    login: 'ログイン',
    register: '登録',
    logout: 'ログアウト',
    profile: 'プロフィール',
    memberList: 'メンバーリスト',
    adminPanel: '管理者パネル',
    features: 'このコミュニティでできること',
    events: 'イベントスケジュール',
    save: '保存',
    cancel: 'キャンセル',
    edit: '編集',
    delete: '削除',
    loading: '読み込み中...',
    error: 'エラー',
    success: '成功',
    
    // ログイン・登録
    email: 'メールアドレス',
    password: 'パスワード',
    confirmPassword: 'パスワード確認',
    username: 'ユーザー名',
    loginInProgress: 'ログイン中...',
    creatingAccount: 'アカウント作成中...',
    noAccount: 'アカウントをお持ちでない方はこちら',
    haveAccount: '既にアカウントをお持ちの方はこちら',
    
    // コミュニティ
    searchPosts: '投稿やユーザーを検索...',
    memberListDescription: 'コミュニティのメンバー一覧を確認',
    featuresDescription: 'コミュニティの機能を詳しく紹介',
    noChannels: 'チャンネルがありません',
    noPosts: '投稿がありません',
    
    // プロフィール
    learningGoal: '学習目標',
    oneWordMessage: '一言メッセージ',
    selfIntroduction: '自己紹介',
    goalNotSet: '目標が設定されていません',
    messageNotSet: 'メッセージが設定されていません',
    bioNotSet: '自己紹介が設定されていません',
    registrationDate: '登録日',
    
    // イベント
    upcomingEvents: '今後のイベント',
    noUpcomingEvents: '今後のイベントはありません',
    eventTitle: 'イベントタイトル',
    details: '詳細',
    targetAudience: '対象者',
    dateTime: '開催日時',
    participationMethod: '参加方法',
    startTime: '開始時刻',
    endTime: '終了時刻',
    
    // 管理者
    userManagement: 'ユーザー管理',
    categoryManagement: 'カテゴリ管理',
    channelManagement: 'チャンネル管理',
    createCategory: '新しいカテゴリを作成',
    createChannel: '新しいチャンネルを作成',
    changeRole: 'ロール変更',
    
    // ロール
    serverAdmin: 'サーバー管理者',
    ecgInstructor: 'ECG講師',
    jcgInstructor: 'JCG講師',
    class1Members: 'Class1 Members',
    ecgMember: 'ECGメンバー',
    jcgMember: 'JCGメンバー',
    trialParticipant: 'Trial参加者',
  }
};

// かんたんな、にほんご
const jaSimple = {
  translation: {
    // 共通
    languageLearningCommunity: 'げんごがくしゅうコミュニティ',
    login: 'ログイン',
    register: 'とうろく',
    logout: 'ログアウト',
    profile: 'プロフィール',
    memberList: 'メンバーリスト',
    adminPanel: 'かんりしゃパネル',
    features: 'このコミュニティでできること',
    events: 'イベントスケジュール',
    save: 'ほぞん',
    cancel: 'キャンセル',
    edit: 'へんしゅう',
    delete: 'さくじょ',
    loading: 'よみこみちゅう...',
    error: 'エラー',
    success: 'せいこう',
    
    // ログイン・登録
    email: 'メールアドレス',
    password: 'パスワード',
    confirmPassword: 'パスワードかくにん',
    username: 'ユーザーめい',
    loginInProgress: 'ログインちゅう...',
    creatingAccount: 'アカウントさくせいちゅう...',
    noAccount: 'アカウントをもっていないかたはこちら',
    haveAccount: 'すでにアカウントをもっているかたはこちら',
    
    // コミュニティ
    searchPosts: 'とうこうやユーザーをけんさく...',
    memberListDescription: 'コミュニティのメンバーいちらんをかくにん',
    featuresDescription: 'コミュニティのきのうをくわしくしょうかい',
    noChannels: 'チャンネルがありません',
    noPosts: 'とうこうがありません',
    
    // プロフィール
    learningGoal: 'がくしゅうもくひょう',
    oneWordMessage: 'ひとことメッセージ',
    selfIntroduction: 'じこしょうかい',
    goalNotSet: 'もくひょうがせっていされていません',
    messageNotSet: 'メッセージがせっていされていません',
    bioNotSet: 'じこしょうかいがせっていされていません',
    registrationDate: 'とうろくび',
    
    // イベント
    upcomingEvents: 'こんごのイベント',
    noUpcomingEvents: 'こんごのイベントはありません',
    eventTitle: 'イベントタイトル',
    details: 'しょうさい',
    targetAudience: 'たいしょうしゃ',
    dateTime: 'かいさいにちじ',
    participationMethod: 'さんかほうほう',
    startTime: 'かいしじこく',
    endTime: 'しゅうりょうじこく',
    
    // 管理者
    userManagement: 'ユーザーかんり',
    categoryManagement: 'カテゴリかんり',
    channelManagement: 'チャンネルかんり',
    createCategory: 'あたらしいカテゴリをさくせい',
    createChannel: 'あたらしいチャンネルをさくせい',
    changeRole: 'ロールへんこう',
    
    // ロール
    serverAdmin: 'サーバーかんりしゃ',
    ecgInstructor: 'ECGきょうし',
    jcgInstructor: 'JCGきょうし',
    class1Members: 'Class1 Members',
    ecgMember: 'ECGメンバー',
    jcgMember: 'JCGメンバー',
    trialParticipant: 'Trialさんかしゃ',
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en,
      ja,
      jaSimple
    },
    lng: 'ja', // デフォルト言語
    fallbackLng: 'ja',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n; 