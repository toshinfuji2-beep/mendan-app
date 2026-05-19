export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { password } = req.body;
  if (password === process.env.SITE_PASSWORD) {
    res.status(200).json({ ok: true });
  } else {
    res.status(200).json({ ok: false });
  }
}