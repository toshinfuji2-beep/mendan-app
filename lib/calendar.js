import { google } from 'googleapis';
import { TEACHERS, TIME_BY_DOW, SLOT_MINUTES, MONTHS_AHEAD, SHARED_CALENDARS } from './config';

const JAPAN_HOLIDAY_CALENDAR = 'ja.japanese#holiday@group.v.calendar.google.com';

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
  const now = new Date();
  const jstOffset = 9 * 60;
  const jstNow = new Date(now.getTime() + jstOffset * 60 * 1000);
  const todayStr = jstNow.toISOString().split('T')[0];
  const [y, m, d] = todayStr.split('-').map(Number);
  const start = new Date(y, m - 1, d);
  const end = new Date(y, m - 1, d + 21); // 3週間分
  const cur = new Date(start);
  while (cur <= end) {
    const y2 = cur.getFullYear();
    const m2 = String(cur.getMonth() + 1).padStart(2, '0');
    const d2 = String(cur.getDate()).padStart(2, '0');
    dates.push(`${y2}-${m2}-${d2}`);
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

async function getHolidays(calendar, startDate, endDate) {
  try {
    const res = await calendar.events.list({
      calendarId: JAPAN_HOLIDAY_CALENDAR,
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      singleEvents: true,
    });
    const holidays = new Set();
    for (const ev of res.data.items || []) {
      if (ev.start.date) holidays.add(ev.start.date);
    }
    return holidays;
  } catch (e) {
    return new Set();
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
  const jstOffset = 9 * 60 * 60 * 1000;

  // 祝日を一括取得
  const periodStart = new Date(dates[0]);
  const periodEnd = new Date(dates[dates.length - 1]);
  periodEnd.setDate(periodEnd.getDate() + 1);
  const holidays = await getHolidays(calendar, periodStart, periodEnd);

  for (const dateStr of dates) {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const dow = date.getDay();

    const isHoliday = holidays.has(dateStr);
    let timeRange;
    if (isHoliday) {
      timeRange = { start: '10:00', end: '19:00' };
    } else {
      timeRange = TIME_BY_DOW[dow];
    }

    const [sh, sm] = timeRange.start.split(':').map(Number);
    const [eh, em] = timeRange.end.split(':').map(Number);

    const dayStart = new Date(Date.UTC(year, month - 1, day, sh - 9, sm, 0));
    const dayEnd   = new Date(Date.UTC(year, month - 1, day, eh - 9, em, 0));

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
        new Date(Date.UTC(year, month - 1, day, -9, 0, 0)),
        new Date(Date.UTC(year, month - 1, day, 15, 0, 0))
      );
      const isHolidayFlag = allDayEvents.some(
        ev => ev.start.date &&
              ev.summary &&
              ev.summary.includes('公休') &&
              !ev.summary.includes('面談可能') &&
              !ev.summary.includes('面談可')
      );
      if (isHolidayFlag) continue;
    }

    let cur = new Date(dayStart);
    while (cur < dayEnd) {
      const slotEnd = new Date(cur.getTime() + SLOT_MINUTES * 60 * 1000);
      const jstCur = new Date(cur.getTime() + jstOffset);
      const startTime = `${String(jstCur.getUTCHours()).padStart(2,'0')}:${String(jstCur.getUTCMinutes()).padStart(2,'0')}`;
      const jstSlotEnd = new Date(slotEnd.getTime() + jstOffset);
      const endTime = `${String(jstSlotEnd.getUTCHours()).padStart(2,'0')}:${String(jstSlotEnd.getUTCMinutes()).padStart(2,'0')}`;

      const isTaken = allEvents.some(ev => {
        if (!ev.start.dateTime) return false;
        const evStart = new Date(ev.start.dateTime);
        const evEnd   = new Date(ev.end.dateTime);
        return evStart < slotEnd && evEnd > cur;
      });

      if (!isTaken) {
        slots.push({ date: dateStr, startTime, endTime });
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

  const start = new Date(Date.UTC(year, month - 1, day, sh - 9, sm, 0));
  const end   = new Date(Date.UTC(year, month - 1, day, eh - 9, em, 0));

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