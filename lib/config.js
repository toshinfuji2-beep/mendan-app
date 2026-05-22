export const TEACHERS = [
  { id: 'takagi',    name: '高木',  color: '#8E44AD', skipHoliday: true,  calendarEnvKey: 'CAL_TAKAGI' },
  { id: 'kamei',     name: '亀井',  color: '#2980B9', skipHoliday: true,  calendarEnvKey: 'CAL_KAMEI' },
  { id: 'ikura',     name: '以倉',  color: '#27AE60', skipHoliday: true,  calendarEnvKey: 'CAL_IKURA' },
  { id: 'katsumata', name: '勝又',  color: '#F39C12', skipHoliday: false, calendarEnvKey: 'CAL_KATSUMATA' },
  { id: 'tochigi',   name: '栃木',  color: '#D35400', skipHoliday: true,  calendarEnvKey: 'CAL_TOCHIGI' },
];

export const TIME_BY_DOW = {
  0: { start: '10:00', end: '22:00' },
  1: { start: '13:00', end: '22:00' },
  2: { start: '13:00', end: '22:00' },
  3: { start: '13:00', end: '22:00' },
  4: { start: '13:00', end: '22:00' },
  5: { start: '13:00', end: '22:00' },
  6: { start: '10:00', end: '22:00' },
};

export const SLOT_MINUTES = 60;
export const MONTHS_AHEAD = 1;
export const SCHOOL_NAME = '東進ハイスクール藤沢校';
export const NOTIFY_EMAIL = process.env.GMAIL_USER;

export const SHARED_CALENDARS = [
  'toshin.fuji2@gmail.com',
  'aursja33k62l8m4liefq2e2hrc@group.calendar.google.com',
];