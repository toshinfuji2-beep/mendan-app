import { google } from 'googleapis';
import { TEACHERS, TIME_BY_DOW, SLOT_MINUTES, MONTHS_AHEAD, SHARED_CALENDARS } from './config';

function getAuth() {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    return new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });
  }
  const path = require('path');
  const keyFile = path.join(process.cwd(), 'service-account.json');
  return new google.auth.GoogleAuth({
    keyFile,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });
}

function getDates() {
  const dates = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(today);
  end.setMonth(end.getMonth() + MONTHS_AHEAD);
  const cur = new Date(today);
  while (cur <= end) {
    dates.push(cur.toISOString().split('T')[0]);
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

async function getEvents(calendar, calendarId, timeMin, timeMax) {
  try {
    const res = await calendar.events.list({
      calendarId,
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      timeZone: 'Asia/Tokyo',
    });
    return res.data.items || [];
  } catch (e) {
    return [];
  }
}

export async function getAvailableSlots(teacherId) {
  const teacher = TEACHERS.find(t => t.id === teacherId);
  if (!teacher) return [];

  const calendarId = process.env[teacher.calendarEnvKey];
  if (!calendarId) return [];

  const auth = getAuth();
  const calendar = google.calendar({ version: 'v3', auth });
  const slots = [];
  const dates = getDates();

  for (const dateStr of dates) {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const dow = date.getDay();
    const timeRange = TIME_BY_DOW[dow];
    const [sh, sm] = timeRange.start.split(':').map(Number);
    const [eh, em] = timeRange.end.split(':').map(Number);

    const dayStart = new Date(year, month - 1, day, sh, sm, 0);
    const dayEnd   = new Date(year, month - 1, day, eh, em, 0);

    const teacherEvents = await getEvents(calendar, calendarId, dayStart, dayEnd);

    const sharedEvents = [];
    for (const sharedCalId of SHARED_CALENDARS) {
      const events = await getEvents(calendar, sharedCalId, dayStart, dayEnd);
      sharedEvents.push(...events);
    }

    const allEvents = [...teacherEvents, ...sharedEvents];

    if (teacher.skipHoliday) {
      const allDayEvents = await getEvents(
        calendar, calendarId,
        new Date(year, month - 1, day),
        new Date(year, month - 1, day + 1)
      );
      const isHoliday = allDayEvents.some(
        ev => ev.start.date &&
              ev.summary &&
              ev.summary.includes('公休') &&
              !ev.summary.includes('面談可能') &&
              !ev.summary.includes('面談可')
      );
      if (isHoliday) continue;
    }

    let cur = new Date(dayStart);
    while (cur < dayEnd) {
      const slotEnd = new Date(cur.getTime() + SLOT_MINUTES * 60 * 1000);
      const startTime = `${String(cur.getHours()).padStart(2,'0')}:${String(cur.getMinutes()).padStart(2,'0')}`;

      const isTaken = allEvents.some(ev => {
        if (!ev.start.dateTime) return false;
        const evStart = new Date(ev.start.dateTime);
        const evEnd   = new Date(ev.end.dateTime);
        return evStart < slotEnd && evEnd > cur;
      });

      if (!isTaken) {
        slots.push({
          date: dateStr,
          startTime,
          endTime: `${String(slotEnd.getHours()).padStart(2,'0')}:${String(slotEnd.getMinutes()).padStart(2,'0')}`,
        });
      }
      cur = slotEnd;
    }
  }

  return slots;
}

export async function createBooking({ teacherId, date, startTime, endTime, studentName, parentName }) {
  const teacher = TEACHERS.find(t => t.id === teacherId);
  if (!teacher) throw new Error('担任が見つかりません');

  const calendarId = process.env[teacher.calendarEnvKey];
  const auth = getAuth();
  const calendar = google.calendar({ version: 'v3', auth });

  const [year, month, day] = date.split('-').map(Number);
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);

  const start = new Date(year, month - 1, day, sh, sm, 0);
  const end   = new Date(year, month - 1, day, eh, em, 0);

  const check = await calendar.events.list({
    calendarId,
    timeMin: start.toISOString(),
    timeMax: end.toISOString(),
    singleEvents: true,
  });
  if ((check.data.items || []).length > 0) {
    throw new Error('その時間はすでに予約済みです。別の時間をお選びください。');
  }

  await calendar.events.insert({
    calendarId,
    requestBody: {
      summary: `${studentName} 三者面談（${parentName}様）`,
      start: { dateTime: start.toISOString(), timeZone: 'Asia/Tokyo' },
      end:   { dateTime: end.toISOString(),   timeZone: 'Asia/Tokyo' },
      description: `生徒: ${studentName}\n保護者: ${parentName}`,
    },
  });
}