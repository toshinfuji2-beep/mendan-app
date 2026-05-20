import nodemailer from 'nodemailer';
import { SCHOOL_NAME } from './config';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASSWORD,
  },
});

export async function sendNotification({ teacher, date, startTime, endTime, studentName, parentName, email, notes }) {
  const dateLabel = formatDate(date);

  // 担任への通知
  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to: process.env.GMAIL_USER,
    subject: `【三者面談予約】${dateLabel} ${startTime}〜 ${studentName}（${parentName}様）`,
    text: `${teacher.name} 先生\n\n三者面談の予約が入りました。\n\n日時: ${dateLabel} ${startTime}〜${endTime}\n生徒: ${studentName}\n保護者: ${parentName}\n連絡先: ${email || '未記入'}\nご要望: ${notes || 'なし'}\n\nGoogleカレンダーに自動登録済みです。\n${SCHOOL_NAME}`,
  });

  // 保護者への確認メール
  if (email) {
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: email,
      subject: `【三者面談予約確認】${dateLabel} ${startTime}〜`,
      text: `${parentName} 様\n\n三者面談のご予約を承りました。\n\n担当: ${teacher.name} 先生\n日時: ${dateLabel} ${startTime}〜${endTime}\n生徒: ${studentName}\n\n当日はよろしくお願いいたします。\n${SCHOOL_NAME}`,
    });
  }
}

export async function sendDuplicateAlert({ email, studentName, parentName, newTeacher, newDate, newStartTime, newEndTime, existing }) {
  const newDateLabel = formatDate(newDate);
  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to: process.env.GMAIL_USER,
    subject: `【要確認】同一メールアドレスから複数予約`,
    text: `同一メールアドレスから複数の予約が入りました。ご確認ください。\n\nメールアドレス: ${email}\n生徒名: ${studentName}\n保護者名: ${parentName}\n\n【今回の予約】\n担当: ${newTeacher.name} 先生\n日時: ${newDateLabel} ${newStartTime}〜${newEndTime}\n\n【過去の予約】\n担当: ${existing.teacherName} 先生\n予約内容: ${existing.summary}\n\n${SCHOOL_NAME}`,
  });
}

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const days = ['日','月','火','水','木','金','土'];
  return `${m}月${d}日（${days[dt.getDay()]}）`;
}