import { getAvailableSlots } from '../../lib/calendar';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  const { teacherId } = req.query;
  if (!teacherId) return res.status(400).json({ error: 'teacherId required' });

  try {
    const slots = await getAvailableSlots(teacherId);
    res.status(200).json({ slots, count: slots.length, hasServiceAccount: !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
}