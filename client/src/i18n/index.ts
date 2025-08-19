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
    monthlyHistory: 'Monthly History',
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    back: 'Back',
    close: 'Close',
    confirm: 'Confirm',
    open: 'Open',
    
    // Features Page
    featuresTitle: 'What You Can Do in This Community',
    featuresSubtitle: 'An Introduction to the Main Content of the Language Learning Community',
    welcomeMessage: 'Welcome, {{username}}!',
    pronunciationCorrection: 'Weekly Pronunciation Correction',
    pronunciationDescription: 'Submit your audio once a week! We’ll correct it and send it back!',
    studyLog: 'Everyone’s Study Log',
    studyLogDescription: 'Share your study logs to motivate each other’s growth.',
    motivationPlace: 'Motivation Space',
    pronunciationVideo: 'Lecture Videos',
    pronunciationVideoDescription: 'Video lectures available exclusively for Class1 members!',
    freePronunciationCourse: 'Learn Language and Culture in Depth!',

    
    // ログイン・登録
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    username: 'Username',
    loginInProgress: 'Logging in...',
    creatingAccount: 'Creating account...',
    noAccount: "Don't have an account? Click here",
    haveAccount: 'Already have an account? Click here',
    loginFailed: 'Login failed',
    registrationFailed: 'Registration failed',
    passwordMismatch: 'Passwords do not match',
    loginTitle: 'Language Learning Community',
    loginSubtitle: 'Premium community for Japanese learning English and foreigners learning Japanese',
    forgotPassword: 'Forgot your password?',
    premiumCommunityDescription: 'Premium community for Japanese learning English and foreigners learning Japanese',
    passwordTooShort: 'Password must be at least 6 characters long',
    
    // コミュニティ
    membersCommunity: 'Members Community',
    communityWelcome: 'Hello {{username}}',
    searchPosts: 'Search posts and users...',
    memberListDescription: 'Check the list of community members',
    featuresDescription: 'Learn about community features',
    favoriteChannel: 'Favorite Channel',
    favoriteChannelDescription: 'Quick access to your most used channel',
    selectFavoriteChannel: 'Select Favorite Channel',
    noFavoriteChannel: 'No favorite channel set',
    setFavoriteChannel: 'Set as Favorite',
    removeFavoriteChannel: 'Remove Favorite',
    editFavoriteChannel: 'Edit Favorite Channel',
    noDescription: 'No description',
    noChannels: 'No channels available',
    noPosts: 'No posts yet',
    channelNotFound: 'Channel not found',
    noCategories: 'No categories available',
    waitAdmin: 'Please wait for the administrator to create categories',
    communityChannels: 'channels',
    communitySearchPlaceholder: 'Search posts and users...',
    noPostPermission: 'No posting permission',
    postContent: 'Post content',
    post: 'Post',
    like: 'Like',
    comment: 'Comment',
    comments: 'Comments',
    noComments: 'No comments yet',
    writeComment: 'Write a comment...',
    sendComment: 'Send',
    addImage: 'Add Image',
    templatePost: 'Template Post',
    
    // チャンネルタイプ
    channelTypeStaffOnly: 'Staff Only',
    channelTypeAnnouncement: 'Announcement',
    channelTypeInstructorPost: 'Instructor Post',
    channelTypeGeneralPost: 'General Post',
    channelTypeClass1Only: 'Class1 Only',
    unknown: 'Unknown',
    
    // セットアップガイドボタン
    setupGuideProfile: 'Profile',
    setupGuideIntroduce: 'Introduce',
    setupGuideAnnouncements: 'Announcements',
    
    // チェックリストガイド
    setupGuide: 'Setup Guide',
    setupGuideTitle: 'What to do when joining the community',
    setupGuideSubtitle: 'Complete these steps to get started',
    profileCompletion: 'Complete your profile!',
    profileCompletionDesc: 'Set up your profile with self-introduction and one-word message',
    introduceYourself: 'Post a greeting message in the "🙋 Introduce Yourself" channel!',
    introduceYourselfDesc: 'Use the template post feature to introduce yourself',
    checkAnnouncements: 'Check the "📢 Announcements" channel for updates!',
    checkAnnouncementsDesc: 'Stay updated with community announcements',
    class1Section: 'Class1 Members Only',
    contactInstructor: 'Let’s wait to hear from the instructor on Instagram or Discord!',
    contactInstructorDesc: 'Set up your first lesson date with your instructor',
    markComplete: 'Mark as complete',
    markIncomplete: 'Mark as incomplete',
    progress: 'Progress',
    nextStep: 'Next step',
    completed: 'Completed',
    pending: 'Pending',
    hideSetupGuide: 'Hide Setup Guide',
    
    // チャンネル
    channels: 'Channels',
    
    // このコミュニティでできること
    whatYouCanDo: 'What You Can Do',
    whatYouCanDoDescription: 'An Introduction to the Main Content of the Language Learning Community',
    
    // プロフィール
    learningGoal: 'Learning Goal',
    oneWordMessage: 'One-word Message',
    selfIntroduction: 'Self Introduction',
    goalNotSet: 'Goal not set',
    messageNotSet: 'Message not set',
    bioNotSet: 'Self introduction not set',
    registrationDate: 'Registration Date',
    profileUpdateSuccess: 'Profile updated successfully',
    profileUpdateFailed: 'Failed to update profile',
    nativeLanguage: 'Native Language',
    targetLanguages: 'Languages to Learn',
    currentCountry: 'Current Country',
    avatar: 'Avatar',
    uploadAvatar: 'Upload Avatar',
    
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
    addEvent: 'Add Event',
    editEvent: 'Edit Event',
    deleteEvent: 'Delete Event',
    eventAdded: 'Event added successfully',
    eventUpdated: 'Event updated successfully',
    eventDeleted: 'Event deleted successfully',
    eventFailed: 'Failed to manage event',
    eventDetails: 'Event Details',
    attend: 'Attend',
    cancelAttendance: 'Cancel Attendance',
    attendees: 'Attendees',
    postEvent: 'Post Event',
    createEvent: 'Create Event',
    coverImage: 'Cover Image',
    selectCoverImage: 'Please select a cover image',
    coverImagePreview: 'Cover image preview',
    pastEvents: 'Past Events',
    
    // 営業日予約
    businessDayReservation: 'Business Day Reservation',
    businessDayReservationECG: 'ECG Business Day Reservation',
    businessDayReservationJCG: 'JCG Business Day Reservation',
    businessDayDateTime: 'Date & Time',
    businessDayLocation: 'Location',
    openMap: 'Open Map',
    reservationCompleteMessage: 'Reservation complete! Confirmation email will be sent.',
    reservationFailedMessage: 'Reservation failed. Please try again.',
    reservationInProgress: 'Reserving...',
    reserveBusinessDay: 'Reserve Business Day',
    businessDayCancel: 'Cancel',
    reservationNote: 'After business day reservation is complete, we will send a confirmation email.',
    
    // Q&A System
    postQuestion: 'Post Question',
    answered: 'Answered',
    normalQuestion: 'Normal Question',
    anonymousQuestion: 'Anonymous Question',
    questionContent: 'Please enter your question content...',
    enterAnswer: 'Enter Answer',
    transfer: 'Transfer',
    rejectAnswer: 'Reject Answer',
    answerInput: 'Answer Input:',
    saveAnswer: 'Save Answer',
    questioner: 'Questioner',
    anonymous: 'Anonymous',
    submissionComplete: 'Submission complete! Please wait for a response!',
    anonymousQuestionNote: 'This will be posted as an anonymous question. The questioner name will be displayed as [Anonymous].',
    normalQuestionNote: 'This will be posted as a normal question. The questioner name will be displayed.',

    
    // Monthly History
    monthlyHistoryTitle: 'Monthly Reflections & Goals History',
    monthlyHistoryDescription: 'View the history of your recorded monthly reflections and goals',
    currentMonthTitle: 'This Month’s Reflections & Goals',
    previousMonthTitle: 'Last Month’s Reflections & Goals',
    historicalTitle: 'Past History',
    currentMonthGoal: 'This Month’s Goal',
    currentMonthReflection: 'Last Month’s Reflection',
    previousMonthGoal: 'Last Month’s Goal',
    previousMonthReflection: 'Last Month’s Reflection',
    goal: 'Goal',
    reflection: 'Reflection',
    noRecord: 'No records found',
    noMonthlyHistory: 'No monthly reflections or goals recorded yet',
    noMonthlyHistoryDescription: 'Once you record reflections and goals in the monthly update dialog, your history will appear here',

    
    // 管理者
    userManagement: 'User Management',
    categoryManagement: 'Category Management',
    channelManagement: 'Channel Management',
    createCategory: 'Create New Category',
    createChannel: 'Create New Channel',
    changeRole: 'Change Role',
    categoryName: 'Category Name',
    channelName: 'Channel Name',
    channelType: {
      all_post_all_view: 'All members post, All members view',
      admin_only_all_view: 'Admin only post, All members view',
      instructors_post_all_view: 'Instructors only post, All members view',
      admin_only_instructors_view: 'Admin only post, Instructors only view',
      class1_post_class1_view: 'Class1 Members post, Class1 Members view'
    },
    allPostAllView: 'All members post, All members view',
    adminOnlyAllView: 'Admin only post, All members view',
    adminOnlyInstructorsView: 'Instructors only post, Instructors only view',
    instructorsPostAllView: 'Instructors only post, All members view',
    class1PostClass1View: 'Class1 Members post, Class1 Members view',
    create: 'Create',
    update: 'Update',
    roleChanged: 'Role changed successfully',
    roleChangeFailed: 'Failed to change role',
    
    // ロール
    serverAdmin: 'Server Administrator',
    ecgInstructor: 'ECG Instructor',
    jcgInstructor: 'JCG Instructor',
    class1Members: 'Class1 Members',
    ecgMember: 'ECG Member',
    jcgMember: 'JCG Member',
    trialParticipant: 'Trial Participant',
    
    // エラーメッセージ
    userListFailed: 'Failed to get user list',
    channelInfoFailed: 'Failed to get channel information',
    postsLoadFailed: 'Failed to load posts',
    eventLoadFailed: 'Failed to load events',
    networkError: 'Network error occurred',
    serverError: 'Server error occurred',
    unauthorized: 'Unauthorized access',
    forbidden: 'Access forbidden',
    notFound: 'Resource not found',
  },
  // マイ単語帳関連
  vocabulary: {
    en: 'My Vocabulary Book',
    ja: 'マイ単語帳',
    jaSimple: 'マイ単語帳'
  },
  vocabularyEmpty: {
    en: 'My Vocabulary Book is empty',
    ja: 'マイ単語帳は空です',
    jaSimple: 'マイ単語帳は空です'
  },
  vocabularyEmptyMessage: {
    en: 'Save interesting posts from Study Board!',
    ja: 'Study Boardで気になる投稿を保存してみましょう！',
    jaSimple: 'Study Boardで気になる投稿を保存してみましょう！'
  },
  savedPosts: {
    en: 'Saved Posts',
    ja: '保存済み投稿',
    jaSimple: '保存済み投稿'
  },
  searchResults: {
    en: 'Search Results',
    ja: '検索結果',
    jaSimple: '検索結果'
  },
  searchPlaceholder: {
    en: 'Search by content, username, or tags...',
    ja: '投稿内容、ユーザー名、タグで検索...',
    jaSimple: '投稿内容、ユーザー名、タグで検索...'
  },
  noSearchResults: {
    en: 'No search results found',
    ja: '検索結果が見つかりません',
    jaSimple: '検索結果が見つかりません'
  },
  tryDifferentKeyword: {
    en: 'Try searching with different keywords',
    ja: '別のキーワードで検索してみてください',
    jaSimple: '別のキーワードで検索してみてください'
  },
  removeFromVocabulary: {
    en: 'Remove from Vocabulary Book',
    ja: 'マイ単語帳から削除',
    jaSimple: 'マイ単語帳から削除'
  },
  backToStudyBoard: {
    en: 'Back to Study Board',
    ja: 'Study Boardに戻る',
    jaSimple: 'Study Boardに戻る'
  },
  commentHelp: {
    en: 'Press Enter to send, Shift+Enter for new line',
    ja: 'Enterで送信、Shift+Enterで改行',
    jaSimple: 'Enterで送信、Shift+Enterで改行'
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
    monthlyHistory: '月次履歴',
    save: '保存',
    cancel: 'キャンセル',
    edit: '編集',
    delete: '削除',
    loading: '読み込み中...',
    error: 'エラー',
    success: '成功',
    back: '戻る',
    close: '閉じる',
    confirm: '確認',
    open: '開く',
    
    // Features Page
    featuresTitle: 'このコミュニティでできること',
    featuresSubtitle: '言語学習コミュニティの主な内容を紹介',
    welcomeMessage: 'ようこそ、{{username}}！',
    pronunciationCorrection: '週間発音訂正',
    pronunciationDescription: '週に一回、音声を提出可能！添削して返信します！',
    studyLog: '全員の学習ログ',
    studyLogDescription: '学習ログを共有し、互いの成長を動機付けましょう。',
    motivationPlace: '動機付けの場所',
    pronunciationVideo: '講義動画',
    pronunciationVideoDescription: 'Class1の人限定で動画講座を見ることができます！',
    freePronunciationCourse: '言語と文化を詳しく学べます！',
    
    // ログイン・登録
    email: 'メールアドレス',
    password: 'パスワード',
    confirmPassword: 'パスワード確認',
    username: 'ユーザー名',
    loginInProgress: 'ログイン中...',
    creatingAccount: 'アカウント作成中...',
    noAccount: 'アカウントをお持ちでない方はこちら',
    haveAccount: '既にアカウントをお持ちの方はこちら',
    loginFailed: 'ログインに失敗しました',
    registrationFailed: 'ユーザー登録に失敗しました',
    passwordMismatch: 'パスワードが一致しません',
    loginTitle: '言語学習コミュニティ',
    loginSubtitle: '英語を学ぶ日本人と日本語を学ぶ外国人のためのプレミアムコミュニティ',
    forgotPassword: 'パスワードをお忘れですか？',
    premiumCommunityDescription: '英語を学ぶ日本人と日本語を学ぶ外国人のためのプレミアムコミュニティ',
    passwordTooShort: 'パスワードは6文字以上で入力してください',
    
    // コミュニティ
    membersCommunity: 'メンバーズコミュニティ',
    communityWelcome: 'こんにちは {{username}}',
    searchPosts: '投稿やユーザーを検索...',
    memberListDescription: 'コミュニティのメンバー一覧を確認',
    featuresDescription: 'コミュニティの機能を詳しく紹介',
    favoriteChannel: 'お気に入りチャンネル',
    favoriteChannelDescription: 'よく使うチャンネルに素早くアクセス',
    selectFavoriteChannel: 'お気に入りチャンネルを選択',
    noFavoriteChannel: 'お気に入りチャンネルが設定されていません',
    setFavoriteChannel: 'お気に入りに設定',
    removeFavoriteChannel: 'お気に入りを解除',
    editFavoriteChannel: 'お気に入りチャンネルを編集',
    noDescription: '説明なし',
    noChannels: 'チャンネルがありません',
    noPosts: '投稿がありません',
    channelNotFound: 'チャンネルが見つかりません',
    noCategories: 'カテゴリがありません',
    waitAdmin: '管理者がカテゴリを作成するまでお待ちください',
    communityChannels: 'チャンネル',
    communitySearchPlaceholder: '投稿やユーザーを検索...',
    noPostPermission: '投稿権限がありません',
    postContent: '投稿内容',
    post: '投稿',
    like: 'いいね',
    comment: 'コメント',
    comments: 'コメント',
    noComments: 'コメントがありません',
    writeComment: 'コメントを書く...',
    sendComment: '送信',
    addImage: '画像を追加',
    templatePost: 'テンプレート投稿',
    
    // チャンネルタイプ
    channelTypeStaffOnly: 'スタッフ専用通知',
    channelTypeAnnouncement: 'お知らせ',
    channelTypeInstructorPost: '講師投稿',
    channelTypeGeneralPost: '一般投稿',
    channelTypeClass1Only: 'Class1限定',
    unknown: '不明',
    
    // セットアップガイドボタン
    setupGuideProfile: 'プロフィール',
    setupGuideIntroduce: '自己紹介',
    setupGuideAnnouncements: 'お知らせ',
    
    // チェックリストガイド
    setupGuide: 'セットアップガイド',
    setupGuideTitle: 'コミュニティに参加する際の手順',
    setupGuideSubtitle: 'スタートするためにこれらの手順を完了させましょう',
    profileCompletion: 'プロフィールを完成させましょう！',
    profileCompletionDesc: '自己紹介と一言メッセージを設定してください',
    introduceYourself: '「🙋 自己紹介」チャンネルに挨拶メッセージを投稿しましょう！',
    introduceYourselfDesc: '自己紹介をするためにテンプレート投稿機能を使用します',
    checkAnnouncements: '「📢 お知らせ」チャンネルをチェックして更新を受け取りましょう！',
    checkAnnouncementsDesc: 'コミュニティのお知らせを最新情報として受け取ります',
    class1Section: 'Class1メンバーのみ',
    contactInstructor: 'InstagramやDiscordで講師からの連絡を待ちましょう！',
    contactInstructorDesc: '講師と最初のレッスン日を設定します',
    markComplete: '完了としてマーク',
    markIncomplete: '未完了としてマーク',
    progress: '進捗',
    nextStep: '次のステップ',
    completed: '完了済み',
    pending: '保留中',
    hideSetupGuide: 'セットアップガイドを非表示にする',
    
    // チャンネル
    channels: 'チャンネル',
    
    // このコミュニティでできること
    whatYouCanDo: 'このコミュニティでできること',
    whatYouCanDoDescription: '言語学習コミュニティの主な内容を紹介',
    
    // プロフィール
    learningGoal: '学習目標',
    oneWordMessage: '一言メッセージ',
    selfIntroduction: '自己紹介',
    goalNotSet: '目標が設定されていません',
    messageNotSet: 'メッセージが設定されていません',
    bioNotSet: '自己紹介が設定されていません',
    registrationDate: '登録日',
    profileUpdateSuccess: 'プロフィールが更新されました',
    profileUpdateFailed: 'プロフィールの更新に失敗しました',
    nativeLanguage: '母語',
    targetLanguages: '学習したい言語',
    currentCountry: '現在の国',
    avatar: 'アバター',
    uploadAvatar: 'アバターをアップロード',
    
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
    addEvent: 'イベント追加',
    editEvent: 'イベント編集',
    deleteEvent: 'イベント削除',
    eventAdded: 'イベントが追加されました',
    eventUpdated: 'イベントが更新されました',
    eventDeleted: 'イベントが削除されました',
    eventFailed: 'イベントの操作に失敗しました',
    eventDetails: 'イベント詳細',
    attend: '参加する',
    cancelAttendance: '参加をキャンセル',
    attendees: '参加者',
    postEvent: 'イベントを投稿',
    createEvent: 'イベントを作成',
    coverImage: 'カバー画像',
    selectCoverImage: 'カバー画像を選択してください',
    coverImagePreview: 'カバー画像プレビュー',
    pastEvents: '過去のイベント',
    
    // 営業日予約
    businessDayReservation: '営業日予約',
    businessDayReservationECG: 'ECG営業日予約',
    businessDayReservationJCG: 'JCG営業日予約',
    businessDayDateTime: '日時',
    businessDayLocation: '場所',
    openMap: '地図を開く',
    reservationCompleteMessage: '営業日予約完了です！確認メールを送信しました。',
    reservationFailedMessage: '営業日予約の送信に失敗しました。もう一度お試しください。',
    reservationInProgress: '予約中...',
    reserveBusinessDay: '営業日予約する',
    businessDayCancel: 'キャンセル',
    reservationNote: '営業日予約完了後、確認メールをお送りします。',

    // Q&Aシステム
    postQuestion: '質問を投稿',
    answered: '回答済み',
    normalQuestion: '通常質問',
    anonymousQuestion: '匿名質問',
    questionContent: '質問内容を入力してください...',
    enterAnswer: '回答を入力',
    transfer: '転送',
    rejectAnswer: '回答拒否',
    answerInput: '回答を入力:',
    saveAnswer: '回答を保存',
    questioner: '質問者',
    anonymous: '匿名',
    submissionComplete: '送信完了！回答までしばらくお待ちください！',
    anonymousQuestionNote: '匿名質問として投稿されます。質問者名は[匿名]と表示されます。',
    normalQuestionNote: '通常質問として投稿されます。質問者名が表示されます。',

    
    // 月次履歴
    monthlyHistoryTitle: '月次振り返り・目標履歴',
    monthlyHistoryDescription: 'これまでに記録した月次振り返りと目標の履歴を確認できます',
    currentMonthTitle: '今月の振り返り・目標',
    previousMonthTitle: '先月の振り返り・目標',
    historicalTitle: '過去の履歴',
    currentMonthGoal: '今月の目標',
    currentMonthReflection: '先月の振り返り',
    previousMonthGoal: '先月の目標',
    previousMonthReflection: '先月の振り返り',
    goal: '目標',
    reflection: '振り返り',
    noRecord: '記録されていません',
    noMonthlyHistory: 'まだ月次振り返り・目標の記録がありません',
    noMonthlyHistoryDescription: '月次更新ダイアログで振り返りと目標を記録すると、ここに履歴が表示されます',
    
    // 管理者
    userManagement: 'ユーザー管理',
    categoryManagement: 'カテゴリ管理',
    channelManagement: 'チャンネル管理',
    createCategory: '新しいカテゴリを作成',
    createChannel: '新しいチャンネルを作成',
    changeRole: 'ロール変更',
    categoryName: 'カテゴリ名',
    channelName: 'チャンネル名',
    channelType: {
      all_post_all_view: '全メンバー発言可能・全メンバー閲覧可能',
      admin_only_all_view: 'サーバー管理者のみ発言可能・全メンバー閲覧可能',
      instructors_post_all_view: 'サーバー管理者、ECG講師、JCG講師のみ発言可能・全メンバー閲覧可能',
      admin_only_instructors_view: 'サーバー管理者のみ発言可能・サーバー管理者、ECG講師、JCG講師のみ閲覧可能',
      class1_post_class1_view: 'Class1 Members投稿・Class1 Members閲覧'
    },
    allPostAllView: '全メンバー発言可能・全メンバー閲覧可能',
    adminOnlyAllView: 'サーバー管理者のみ発言可能・全メンバー閲覧可能',
    adminOnlyInstructorsView: 'サーバー管理者、ECG講師、JCG講師のみ発言可能・サーバー管理者、ECG講師、JCG講師のみ閲覧可能',
    instructorsPostAllView: 'サーバー管理者、ECG講師、JCG講師のみ発言可能・全メンバー閲覧可能',
    class1PostClass1View: '投稿: 管理者・講師・Class1 Members, 閲覧: 管理者・講師・Class1 Members',
    create: '作成',
    update: '更新',
    roleChanged: 'ロールが変更されました',
    roleChangeFailed: 'ロールの変更に失敗しました',
    
    // ロール
    serverAdmin: 'サーバー管理者',
    ecgInstructor: 'ECG講師',
    jcgInstructor: 'JCG講師',
    class1Members: 'Class1 Members',
    ecgMember: 'ECGメンバー',
    jcgMember: 'JCGメンバー',
    trialParticipant: 'Trial参加者',
    
    // エラーメッセージ
    userListFailed: 'ユーザー一覧の取得に失敗しました',
    channelInfoFailed: 'チャンネル情報の取得に失敗しました',
    postsLoadFailed: '投稿の読み込みに失敗しました',
    eventLoadFailed: 'イベントの読み込みに失敗しました',
    networkError: 'ネットワークエラーが発生しました',
    serverError: 'サーバーエラーが発生しました',
    unauthorized: '認証が必要です',
    forbidden: 'アクセスが拒否されました',
    notFound: 'リソースが見つかりません',
  },
  // マイ単語帳関連
  vocabulary: {
    en: 'My Vocabulary Book',
    ja: 'マイ単語帳',
    jaSimple: 'マイ単語帳'
  },
  vocabularyEmpty: {
    en: 'My Vocabulary Book is empty',
    ja: 'マイ単語帳は空です',
    jaSimple: 'マイ単語帳は空です'
  },
  vocabularyEmptyMessage: {
    en: 'Save interesting posts from Study Board!',
    ja: 'Study Boardで気になる投稿を保存してみましょう！',
    jaSimple: 'Study Boardで気になる投稿を保存してみましょう！'
  },
  savedPosts: {
    en: 'Saved Posts',
    ja: '保存済み投稿',
    jaSimple: '保存済み投稿'
  },
  searchResults: {
    en: 'Search Results',
    ja: '検索結果',
    jaSimple: '検索結果'
  },
  searchPlaceholder: {
    en: 'Search by content, username, or tags...',
    ja: '投稿内容、ユーザー名、タグで検索...',
    jaSimple: '投稿内容、ユーザー名、タグで検索...'
  },
  noSearchResults: {
    en: 'No search results found',
    ja: '検索結果が見つかりません',
    jaSimple: '検索結果が見つかりません'
  },
  tryDifferentKeyword: {
    en: 'Try searching with different keywords',
    ja: '別のキーワードで検索してみてください',
    jaSimple: '別のキーワードで検索してみてください'
  },
  removeFromVocabulary: {
    en: 'Remove from Vocabulary Book',
    ja: 'マイ単語帳から削除',
    jaSimple: 'マイ単語帳から削除'
  },
  backToStudyBoard: {
    en: 'Back to Study Board',
    ja: 'Study Boardに戻る',
    jaSimple: 'Study Boardに戻る'
  },
  commentHelp: {
    en: 'Press Enter to send, Shift+Enter for new line',
    ja: 'Enterで送信、Shift+Enterで改行',
    jaSimple: 'Enterで送信、Shift+Enterで改行'
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
    monthlyHistory: 'まいつきのりれき',
    save: 'ほぞん',
    cancel: 'キャンセル',
    edit: 'へんしゅう',
    delete: 'さくじょ',
    loading: 'よみこみちゅう...',
    error: 'エラー',
    success: 'せいこう',
    back: 'もどる',
    close: 'しめる',
    confirm: 'かくにん',
    open: 'ひらく',
    
    // Features Page
    featuresTitle: 'このコミュニティでできること',
    featuresSubtitle: 'げんごがくしゅうコミュニティのおもなないようをしょうかい',
    welcomeMessage: 'ようこそ、{{username}}！',
    pronunciationCorrection: 'しゅうかんはつおんていせい',
    pronunciationDescription: 'しゅうにいっかい、にほんごのおんせいをていしゅつかのう！てんさくしてへんしんします！',
    studyLog: 'ぜんいんのがくしゅうログ',
    studyLogDescription: 'がくしゅうログをきょうゆうし、おたがいのせいちょうをうながしましょう。',
    motivationPlace: 'モチベーションこうじょう',
    pronunciationVideo: 'こうぎどうが',
    pronunciationVideoDescription: 'Class1のひとげんていで、どうがこうざをみることができます！',
    freePronunciationCourse: 'げんごとぶんかをくわしくまなべる！',
    
    // ログイン・登録
    email: 'メールアドレス',
    password: 'パスワード',
    confirmPassword: 'パスワードかくにん',
    username: 'ユーザーめい',
    loginInProgress: 'ログインちゅう...',
    creatingAccount: 'アカウントさくせいちゅう...',
    noAccount: 'アカウントをもっていないかたはこちら',
    haveAccount: 'すでにアカウントをもっているかたはこちら',
    loginFailed: 'ログインにしっぱいしました',
    registrationFailed: 'ユーザーとうろくにしっぱいしました',
    passwordMismatch: 'パスワードがいっちしません',
    loginTitle: 'げんごがくしゅうコミュニティ',
    loginSubtitle: 'えいごをまなぶにほんじんとにほんごをまなぶがいこくじんのためのプレミアムコミュニティ',
    forgotPassword: 'パスワードをわすれましたか？',
    premiumCommunityDescription: 'えいごをまなぶにほんじんとにほんごをまなぶがいこくじんのためのプレミアムコミュニティ',
    passwordTooShort: 'パスワードは6もじいじょうでにゅうりょくしてください',
    
    // コミュニティ
    membersCommunity: 'メンバーズコミュニティ',
    communityWelcome: 'こんにちは {{username}}',
    searchPosts: 'とうこうやユーザーをけんさく...',
    memberListDescription: 'コミュニティのメンバーいちらんをかくにん',
    featuresDescription: 'コミュニティのきのうをくわしくしょうかい',
    favoriteChannel: 'おきにいりチャンネル',
    favoriteChannelDescription: 'よくつかうチャンネルにすばやくアクセス',
    selectFavoriteChannel: 'おきにいりチャンネルをせんたく',
    noFavoriteChannel: 'おきにいりチャンネルがせっていされていません',
    setFavoriteChannel: 'おきにいりにせってい',
    removeFavoriteChannel: 'おきにいりをかいじょ',
    editFavoriteChannel: 'おきにいりチャンネルをへんしゅう',
    noDescription: 'せつめいなし',
    noChannels: 'チャンネルがありません',
    noPosts: 'とうこうがありません',
    channelNotFound: 'チャンネルが見つかりません',
    noCategories: 'カテゴリがありません',
    waitAdmin: 'かんりしゃがカテゴリをさくせいするまでおまちください',
    communityChannels: 'チャンネル',
    communitySearchPlaceholder: 'とうこうやユーザーをけんさく...',
    noPostPermission: 'とうこうけんげんがありません',
    postContent: 'とうこうないよう',
    post: 'とうこう',
    like: 'いいね',
    comment: 'コメント',
    comments: 'コメント',
    noComments: 'コメントがありません',
    writeComment: 'コメントをかく...',
    sendComment: 'そうしん',
    addImage: 'がぞうをついか',
    templatePost: 'テンプレートとうこう',
    
    // チャンネルタイプ
    channelTypeStaffOnly: 'スタッフせんよう',
    channelTypeAnnouncement: 'おしらせ',
    channelTypeInstructorPost: 'きょうしのとうこう',
    channelTypeGeneralPost: 'みんなのとうこう',
    channelTypeClass1Only: 'Class1せんよう',
    unknown: 'ふめい',
    
    // セットアップガイドボタン
    setupGuideProfile: 'プロフィール',
    setupGuideIntroduce: '自己紹介',
    setupGuideAnnouncements: 'お知らせ',
    
    // チェックリストガイド
    setupGuide: 'セットアップガイド',
    setupGuideTitle: 'コミュニティにさんかするときのてじゅん',
    setupGuideSubtitle: 'スタートするためにこれらのてじゅんをかんりょうさせましょう',
    profileCompletion: 'プロフィールをかんせいさせましょう！',
    profileCompletionDesc: 'じこしょうかいとひとことメッセージをせっていしてください',
    introduceYourself: '「🙋 Introduce Yourself」チャンネルにあいさつメッセージをとうこうしましょう！',
    introduceYourselfDesc: '自己紹介をするためにテンプレートとうこうきのうをつかいます',
    checkAnnouncements: '「📢 Announcements」チャンネルをチェックしておしらせをかくにんしましょう！',
    checkAnnouncementsDesc: 'コミュニティのおしらせをさいしんじょうほうとしてうけとります',
    class1Section: 'Class1メンバーのみ',
    contactInstructor: 'InstagramやDiscordできょうしからのれんらくをまちましょう！',
    contactInstructorDesc: 'きょうしとさいしょのレッスンのひをせっていします',
    markComplete: 'かんりょうとしてマーク',
    markIncomplete: 'みかんりょうとしてマーク',
    progress: 'しんちょく',
    nextStep: 'つぎのステップ',
    completed: 'かんりょうずみ',
    pending: 'ほりゅうちゅう',
    hideSetupGuide: 'セットアップガイドをひひょうじにする',
    
    // チャンネル
    channels: 'チャンネル',
    
    // このコミュニティでできること
    whatYouCanDo: 'このコミュニティでできること',
    whatYouCanDoDescription: 'このコミュニティのおもなないようをしょうかい！',
    
    // プロフィール
    learningGoal: 'がくしゅうもくひょう',
    oneWordMessage: 'ひとことメッセージ',
    selfIntroduction: 'じこしょうかい',
    goalNotSet: 'もくひょうがせっていされていません',
    messageNotSet: 'メッセージがせっていされていません',
    bioNotSet: 'じこしょうかいがせっていされていません',
    registrationDate: 'とうろくび',
    profileUpdateSuccess: 'プロフィールがこうしんされました',
    profileUpdateFailed: 'プロフィールのこうしんにしっぱいしました',
    nativeLanguage: 'ぼご',
    targetLanguages: 'がくしゅうしたいげんご',
    currentCountry: 'げんざいのくに',
    avatar: 'アバター',
    uploadAvatar: 'アバターをアップロード',
    
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
    addEvent: 'イベントついか',
    editEvent: 'イベントへんしゅう',
    deleteEvent: 'イベントさくじょ',
    eventAdded: 'イベントがついかされました',
    eventUpdated: 'イベントがこうしんされました',
    eventDeleted: 'イベントがさくじょされました',
    eventFailed: 'イベントのそうさにしっぱいしました',
    eventDetails: 'イベントしょうさい',
    attend: 'さんかする',
    cancelAttendance: 'さんかをキャンセル',
    attendees: 'さんかしゃ',
    postEvent: 'イベントをとうこう',
    createEvent: 'イベントをさくせい',
    coverImage: 'カバーがぞう',
    selectCoverImage: 'カバーがぞうをせんたくしてください',
    coverImagePreview: 'カバーがぞうプレビュー',
    pastEvents: 'かこのイベント',
    
    // 営業日予約
    businessDayReservation: 'えいぎょうびよやく',
    businessDayReservationECG: 'ECGえいぎょうびよやく',
    businessDayReservationJCG: 'JCGえいぎょうびよやく',
    businessDayDateTime: 'にちじ',
    businessDayLocation: 'ばしょ',
    openMap: 'ちずをひらく',
    reservationCompleteMessage: 'えいぎょうびよやくかんりょうです！かくにんメールをそうしんしました。',
    reservationFailedMessage: 'えいぎょうびよやくのそうしんにしっぱいしました。もういちどおためしください。',
    reservationInProgress: 'よやくちゅう...',
    reserveBusinessDay: 'えいぎょうびよやくする',
    businessDayCancel: 'キャンセル',
    reservationNote: 'えいぎょうびよやくかんりょうご、かくにんメールをおおくりします。',

    // Q&Aシステム
    postQuestion: 'しつもんをとうこう',
    answered: 'かいとうずみ',
    normalQuestion: 'つうじょうしつもん',
    anonymousQuestion: 'とくめいしつもん',
    questionContent: 'しつもんないようをにゅうりょくしてください...',
    enterAnswer: 'かいとうをにゅうりょく',
    transfer: 'てんそう',
    rejectAnswer: 'かいとうきょひ',
    answerInput: 'かいとうをにゅうりょく:',
    saveAnswer: 'かいとうをほぞん',
    questioner: 'しつもんしゃ',
    anonymous: 'とくめい',
    submissionComplete: 'そうしんかんりょう！かいとうまでしばらくおまちください！',
    anonymousQuestionNote: 'とくめいしつもんとしてとうこうされます。しつもんしゃめいは[とくめい]とひょうじされます。',
    normalQuestionNote: 'つうじょうしつもんとしてとうこうされます。しつもんしゃめいがひょうじされます。',

    
    // 月次履歴
    monthlyHistoryTitle: 'げつじふりかえり・もくひょうれきし',
    monthlyHistoryDescription: 'これまでにきろくしたげつじふりかえりともくひょうのれきしをかくにんできます',
    currentMonthTitle: 'こんげつのふりかえり・もくひょう',
    previousMonthTitle: 'せんげつのふりかえり・もくひょう',
    historicalTitle: 'かこのれきし',
    currentMonthGoal: 'こんげつのもくひょう',
    currentMonthReflection: 'せんげつのふりかえり',
    previousMonthGoal: 'せんげつのもくひょう',
    previousMonthReflection: 'せんげつのふりかえり',
    goal: 'もくひょう',
    reflection: 'ふりかえり',
    noRecord: 'きろくされていません',
    noMonthlyHistory: 'まだげつじふりかえり・もくひょうのきろくがありません',
    noMonthlyHistoryDescription: 'げつじこうしんダイアログでふりかえりともくひょうをきろくすると、ここにれきしがひょうじされます',
    
    // 管理者
    userManagement: 'ユーザーかんり',
    categoryManagement: 'カテゴリかんり',
    channelManagement: 'チャンネルかんり',
    createCategory: 'あたらしいカテゴリをさくせい',
    createChannel: 'あたらしいチャンネルをさくせい',
    changeRole: 'ロールへんこう',
    categoryName: 'カテゴリめい',
    channelName: 'チャンネルめい',
    channelType: {
      all_post_all_view: 'ぜんメンバーはつげんかのう・ぜんメンバーえつらんかのう',
      admin_only_all_view: 'サーバーかんりしゃのみはつげんかのう・ぜんメンバーえつらんかのう',
      instructors_post_all_view: 'サーバーかんりしゃ、ECGきょうし、JCGきょうしのみはつげんかのう・ぜんメンバーえつらんかのう',
      admin_only_instructors_view: 'サーバーかんりしゃのみはつげんかのう・サーバーかんりしゃ、ECGきょうし、JCGきょうしのみえつらんかのう',
      class1_post_class1_view: 'Class1 Membersとうこう・Class1 Membersえつらん'
    },
    allPostAllView: '全メンバー発言可能・全メンバー閲覧可能',
    adminOnlyAllView: 'サーバー管理者のみ発言可能・全メンバー閲覧可能',
    adminOnlyInstructorsView: 'サーバー管理者、ECG講師、JCG講師のみ発言可能・サーバー管理者、ECG講師、JCG講師のみ閲覧可能',
    instructorsPostAllView: 'サーバー管理者、ECG講師、JCG講師のみ発言可能・全メンバー閲覧可能',
    class1PostClass1View: 'とうこう: かんりしゃ・きょうし・Class1 Members, えつらん: かんりしゃ・きょうし・Class1 Members',
    create: 'さくせい',
    update: 'こうしん',
    roleChanged: 'ロールがへんこうされました',
    roleChangeFailed: 'ロールのへんこうにしっぱいしました',
    
    // ロール
    serverAdmin: 'サーバーかんりしゃ',
    ecgInstructor: 'ECGきょうし',
    jcgInstructor: 'JCGきょうし',
    class1Members: 'Class1 Members',
    ecgMember: 'ECGメンバー',
    jcgMember: 'JCGメンバー',
    trialParticipant: 'Trialさんかしゃ',
    
    // エラーメッセージ
    userListFailed: 'ユーザーいちらんのしゅとくにしっぱいしました',
    channelInfoFailed: 'チャンネルじょうほうのしゅとくにしっぱいしました',
    postsLoadFailed: 'とうこうのよみこみにしっぱいしました',
    eventLoadFailed: 'イベントのよみこみにしっぱいしました',
    networkError: 'ネットワークエラーがはっせいしました',
    serverError: 'サーバーエラーがはっせいしました',
    unauthorized: 'にんしょうがひつようです',
    forbidden: 'アクセスがきょひされました',
    notFound: 'リソースが見つかりません',
  },
  // マイ単語帳関連
  vocabulary: {
    en: 'My Vocabulary Book',
    ja: 'マイ単語帳',
    jaSimple: 'マイ単語帳'
  },
  vocabularyEmpty: {
    en: 'My Vocabulary Book is empty',
    ja: 'マイ単語帳は空です',
    jaSimple: 'マイ単語帳は空です'
  },
  vocabularyEmptyMessage: {
    en: 'Save interesting posts from Study Board!',
    ja: 'Study Boardで気になる投稿を保存してみましょう！',
    jaSimple: 'Study Boardで気になる投稿を保存してみましょう！'
  },
  savedPosts: {
    en: 'Saved Posts',
    ja: '保存済み投稿',
    jaSimple: '保存済み投稿'
  },
  searchResults: {
    en: 'Search Results',
    ja: '検索結果',
    jaSimple: '検索結果'
  },
  searchPlaceholder: {
    en: 'Search by content, username, or tags...',
    ja: '投稿内容、ユーザー名、タグで検索...',
    jaSimple: '投稿内容、ユーザー名、タグで検索...'
  },
  noSearchResults: {
    en: 'No search results found',
    ja: '検索結果が見つかりません',
    jaSimple: '検索結果が見つかりません'
  },
  tryDifferentKeyword: {
    en: 'Try searching with different keywords',
    ja: '別のキーワードで検索してみてください',
    jaSimple: '別のキーワードで検索してみてください'
  },
  removeFromVocabulary: {
    en: 'Remove from Vocabulary Book',
    ja: 'マイ単語帳から削除',
    jaSimple: 'マイ単語帳から削除'
  },
  backToStudyBoard: {
    en: 'Back to Study Board',
    ja: 'Study Boardに戻る',
    jaSimple: 'Study Boardに戻る'
  },
  commentHelp: {
    en: 'Press Enter to send, Shift+Enter for new line',
    ja: 'Enterで送信、Shift+Enterで改行',
    jaSimple: 'Enterで送信、Shift+Enterで改行'
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