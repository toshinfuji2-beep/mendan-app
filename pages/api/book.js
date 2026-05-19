import { createBooking } from '../../lib/calendar';
import { sendNotification } from '../../lib/mailer';
import { TEACHERS } from '../../lib/config';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { teacherId, date, startTime, endTime, studentName, parentName, email, notes } = req.body;
  if (!teacherId || !date || !startTime || !endTime || !studentName || !parentName) {
    return res.status(400).json({ error: 'error' });
  }

  const teacher = TEACHERS.find(t => t.id === teacherId);
  if (!teacher) return res.status(400).json({ error: 'error' });

  try {
    await createBooking({ teacherId, date, startTime, endTime, studentName, parentName });
    await sendNotification({ teacher, date, startTime, endTime, studentName, parentName, email, notes });
    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
}