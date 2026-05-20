import { createBooking, checkDuplicateEmail } from '../../lib/calendar';
import { sendNotification, sendDuplicateAlert } from '../../lib/mailer';
import { TEACHERS } from '../../lib/config';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { teacherId, date, startTime, endTime, studentName, parentName, email, notes } = req.body;
  if (!teacherId || !date || !startTime || !endTime || !studentName || !parentName || !email) {
    return res.status(400).json({ error: 'error' });
  }

  const teacher = TEACHERS.find(t => t.id === teacherId);
  if (!teacher) return res.status(400).json({ error: 'error' });

  try {
    // 同じメールアドレスの予約チェック
    const duplicate = await checkDuplicateEmail(email, teacherId, date, startTime);
    if (duplicate) {
      await sendDuplicateAlert({ email, studentName, parentName, newTeacher: teacher, newDate: date, newStartTime: startTime, newEndTime: endTime, existing: duplicate });
    }

    await createBooking({ teacherId, date, startTime, endTime, studentName, parentName });
    await sendNotification({ teacher, date, startTime, endTime, studentName, parentName, email, notes });
    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
}