function doPost(e) {
  try {
    // POSTデータを取得
    const data = JSON.parse(e.postData.contents);
    
    // 必要なデータを抽出
    const userName = data.userName;
    const userEmail = data.userEmail;
    const lessonTitle = data.lessonTitle;
    const lessonDate = data.lessonDate;
    const lessonTime = data.lessonTime;
    const timestamp = data.timestamp;
    
    // 予約ID生成
    const reservationId = 'ECG-' + new Date().getTime();
    
    // 日本語メールの内容
    const japaneseSubject = 'ECGレッスン予約確認';
    const japaneseBody = `
${userName} 様

ECGレッスンの予約を承りました。

■ 予約詳細
予約ID: ${reservationId}
レッスン名: ${lessonTitle}
日時: ${new Date(lessonDate).toLocaleDateString('ja-JP')} ${lessonTime}
場所: 神戸三宮

レッスン会場の詳細は、開催日が近づきましたら改めてご連絡いたします。

ご質問がございましたら、このメールにご返信ください。

ECG English Community
ecg_english@nauticalmile.jp
`;

    // 英語メールの内容
    const englishSubject = 'ECG Lesson Reservation Confirmation';
    const englishBody = `
Dear ${userName},

Thank you for your reservation for the ECG lesson.

■ Reservation Details
Reservation ID: ${reservationId}
Lesson: ${lessonTitle}
Date & Time: ${new Date(lessonDate).toLocaleDateString('en-US')} ${lessonTime}
Location: Kobe Sannomiya

We will send you detailed venue information closer to the lesson date.

If you have any questions, please reply to this email.

Best regards,
ECG English Community
ecg_english@nauticalmile.jp
`;

    // 日本語メール送信
    MailApp.sendEmail({
      to: userEmail,
      subject: japaneseSubject,
      body: japaneseBody,
      replyTo: 'ecg_english@nauticalmile.jp'
    });

    // 英語メール送信
    MailApp.sendEmail({
      to: userEmail,
      subject: englishSubject,
      body: englishBody,
      replyTo: 'ecg_english@nauticalmile.jp'
    });

    // 管理者への通知メール
    const adminNotificationSubject = '新しいECGレッスン予約 - New ECG Lesson Reservation';
    const adminNotificationBody = `
新しい予約が入りました。
A new reservation has been received.

予約ID / Reservation ID: ${reservationId}
ユーザー名 / User Name: ${userName}
メールアドレス / Email: ${userEmail}
レッスン名 / Lesson: ${lessonTitle}
日時 / Date & Time: ${new Date(lessonDate).toLocaleDateString('ja-JP')} ${lessonTime}
予約時刻 / Reservation Time: ${new Date(timestamp).toLocaleString('ja-JP')}
`;

    MailApp.sendEmail({
      to: 'ecg_english@nauticalmile.jp',
      subject: adminNotificationSubject,
      body: adminNotificationBody
    });

    // Google Sheetsに記録（オプション）
    // スプレッドシートIDを設定してください
    try {
      const sheetId = 'YOUR_GOOGLE_SHEET_ID'; // 実際のスプレッドシートIDに置き換えてください
      const sheet = SpreadsheetApp.openById(sheetId).getActiveSheet();
      
      // ヘッダーが存在しない場合は追加
      if (sheet.getLastRow() === 0) {
        sheet.appendRow([
          '予約ID', 'ユーザー名', 'メールアドレス', 'レッスン名', 
          '日時', '予約時刻', 'ステータス'
        ]);
      }
      
      // 予約データを追加
      sheet.appendRow([
        reservationId,
        userName,
        userEmail,
        lessonTitle,
        `${new Date(lessonDate).toLocaleDateString('ja-JP')} ${lessonTime}`,
        new Date(timestamp).toLocaleString('ja-JP'),
        '予約済み'
      ]);
    } catch (sheetError) {
      console.log('Spreadsheet logging failed:', sheetError);
      // スプレッドシートの記録が失敗してもメール送信は継続
    }

    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: '予約が完了しました',
        reservationId: reservationId
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    console.error('予約処理エラー:', error);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: '予約処理に失敗しました',
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// GETリクエスト用（テスト用）
function doGet(e) {
  return ContentService
    .createTextOutput('ECG Reservation System is running')
    .setMimeType(ContentService.MimeType.TEXT);
} 