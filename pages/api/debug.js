import { google } from 'googleapis';

export default async function handler(req, res) {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });
  const calendar = google.calendar({ version: 'v3', auth });

  const calendarId = process.env.CAL_TAKAGI;
  const now = new Date();
  const start = new Date(2026, 4, 19, 0, 0, 0);
  const end = new Date(2026, 4, 20, 0, 0, 0);

  const result = await calendar.events.list({
    calendarId,
    timeMin: start.toISOString(),
    timeMax: end.toISOString(),
    singleEvents: true,
  });

  res.status(200).json({ events: result.data.items });
}