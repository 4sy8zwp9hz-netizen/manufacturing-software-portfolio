/** Fictional demo data and pure updates. No production service or network access. */
export const STORAGE_KEY = 'small-group-fictional-demo-v1';
export const DEMO_TODAY = '2026-10-23';

const STATE_KEYS = ['version', 'selectedHouseholdId', 'households', 'meetings', 'responses'];
const MEETING_KEYS = ['id', 'date', 'time', 'topic', 'location', 'notes', 'canceled', 'assignments'];
const ASSIGNMENT_KEYS = ['host', 'food', 'discussion', 'childcare'];
const MEETING_UPDATE_KEYS = MEETING_KEYS.filter((key) => key !== 'id');

export function createInitialState() {
  return {
    version: 1,
    selectedHouseholdId: 'bennett',
    households: [
      { id: 'bennett', name: 'Bennett', members: [{ id: 'avery', name: 'Avery' }, { id: 'jordan', name: 'Jordan' }, { id: 'quinn', name: 'Quinn' }] },
      { id: 'reed', name: 'Reed', members: [{ id: 'casey', name: 'Casey' }, { id: 'morgan', name: 'Morgan' }] },
      { id: 'park', name: 'Park', members: [{ id: 'taylor', name: 'Taylor' }, { id: 'riley', name: 'Riley' }] },
      { id: 'ellis', name: 'Ellis', members: [{ id: 'jamie', name: 'Jamie' }, { id: 'rowan', name: 'Rowan' }] },
    ],
    meetings: [
      {
        id: 'meeting-2026-10-16', date: '2026-10-16', time: '19:00',
        topic: 'Making room for community', location: 'Reed home',
        notes: 'A shared meal and a conversation about belonging.', canceled: false,
        assignments: { host: 'reed', food: ['park'], discussion: ['casey'], childcare: ['jordan'] },
      },
      {
        id: 'meeting-2026-10-23', date: '2026-10-23', time: '19:00',
        topic: 'Practicing hospitality', location: 'Bennett home',
        notes: 'Bring a favorite snack. We will share a meal before the discussion.', canceled: false,
        assignments: { host: 'bennett', food: ['reed', 'park'], discussion: ['jamie'], childcare: ['morgan', 'jordan'] },
      },
      {
        id: 'meeting-2026-10-30', date: '2026-10-30', time: '19:00',
        topic: 'Encouragement in everyday life', location: 'Park home',
        notes: 'An informal evening of conversation and encouragement.', canceled: false,
        assignments: { host: 'park', food: ['bennett'], discussion: ['riley'], childcare: ['rowan'] },
      },
      {
        id: 'meeting-2026-11-06', date: '2026-11-06', time: '19:00',
        topic: 'Serving our neighbors', location: 'Ellis home',
        notes: 'Share ideas for a simple group service activity.', canceled: false,
        assignments: { host: 'ellis', food: ['reed', 'bennett'], discussion: ['avery'], childcare: ['taylor'] },
      },
      {
        id: 'meeting-2026-11-13', date: '2026-11-13', time: '19:00',
        topic: 'No gathering this week', location: 'No meeting',
        notes: 'A planned week off. We will meet again the following Friday.', canceled: true,
        assignments: { host: 'reed', food: [], discussion: [], childcare: [] },
      },
      {
        id: 'meeting-2026-11-20', date: '2026-11-20', time: '18:30',
        topic: 'A table of gratitude', location: 'Reed home',
        notes: 'A potluck evening with space to reflect on the season.', canceled: false,
        assignments: { host: 'reed', food: ['park', 'ellis'], discussion: ['jordan'], childcare: ['jamie'] },
      },
    ],
    responses: {
      'meeting-2026-10-16': {
        bennett: { memberIds: ['avery', 'jordan'], guests: 0 },
        reed: { memberIds: ['casey', 'morgan'], guests: 0 },
      },
      'meeting-2026-10-23': {
        reed: { memberIds: ['casey', 'morgan'], guests: 1 },
        park: { memberIds: ['taylor', 'riley'], guests: 0 },
        ellis: { memberIds: [], guests: 0 },
      },
      'meeting-2026-10-30': { ellis: { memberIds: ['jamie', 'rowan'], guests: 0 } },
    },
  };
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
}

function hasKeys(value, expected) {
  return isRecord(value) && Object.keys(value).length === expected.length
    && expected.every((key) => Object.hasOwn(value, key));
}

function isId(value) {
  return typeof value === 'string' && /^[a-z][a-z0-9-]{0,63}$/.test(value)
    && !['constructor', 'prototype'].includes(value);
}

function isText(value, maximum, allowEmpty = false, multiline = false) {
  return typeof value === 'string' && value.length <= maximum
    && (allowEmpty || value.trim().length > 0)
    && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)
    && (multiline || !/[\r\n\t]/.test(value));
}

function isDate(value) {
  if (typeof value !== 'string' || !/^20\d{2}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isTime(value) {
  return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function isUniqueList(values, allowed, maximum) {
  return Array.isArray(values) && values.length <= maximum
    && Array.from(values).every((value) => typeof value === 'string' && allowed.has(value))
    && new Set(values).size === values.length;
}

/** Validate browser storage as untrusted input before using any saved state. */
export function validateState(value) {
  try {
    if (!hasKeys(value, STATE_KEYS) || value.version !== 1) return false;
    if (!Array.isArray(value.households) || value.households.length < 1 || value.households.length > 20) return false;
    const householdIds = new Set();
    const memberIds = new Set();
    const householdMembers = new Map();
    for (const household of value.households) {
      if (!hasKeys(household, ['id', 'name', 'members']) || !isId(household.id)
        || householdIds.has(household.id) || !isText(household.name, 60)
        || !Array.isArray(household.members) || household.members.length < 1 || household.members.length > 12) return false;
      const localIds = new Set();
      for (const member of household.members) {
        if (!hasKeys(member, ['id', 'name']) || !isId(member.id)
          || memberIds.has(member.id) || !isText(member.name, 60)) return false;
        memberIds.add(member.id);
        localIds.add(member.id);
      }
      householdIds.add(household.id);
      householdMembers.set(household.id, localIds);
    }
    if (!householdIds.has(value.selectedHouseholdId)) return false;
    if (!Array.isArray(value.meetings) || value.meetings.length < 1 || value.meetings.length > 30) return false;
    const meetingIds = new Set();
    for (const meeting of value.meetings) {
      if (!hasKeys(meeting, MEETING_KEYS) || !isId(meeting.id) || meetingIds.has(meeting.id)
        || !isDate(meeting.date) || !isTime(meeting.time) || !isText(meeting.topic, 100)
        || !isText(meeting.location, 100) || !isText(meeting.notes, 500, true, true)
        || typeof meeting.canceled !== 'boolean' || !hasKeys(meeting.assignments, ASSIGNMENT_KEYS)) return false;
      const assignments = meeting.assignments;
      if ((assignments.host !== '' && !householdIds.has(assignments.host))
        || !isUniqueList(assignments.food, householdIds, 20)
        || !isUniqueList(assignments.discussion, memberIds, 20)
        || !isUniqueList(assignments.childcare, memberIds, 20)) return false;
      meetingIds.add(meeting.id);
    }
    if (!isRecord(value.responses) || Object.keys(value.responses).length > meetingIds.size) return false;
    for (const [meetingId, responses] of Object.entries(value.responses)) {
      if (!meetingIds.has(meetingId) || !isRecord(responses) || Object.keys(responses).length > householdIds.size) return false;
      for (const [householdId, response] of Object.entries(responses)) {
        if (!householdIds.has(householdId) || !hasKeys(response, ['memberIds', 'guests'])
          || !isUniqueList(response.memberIds, householdMembers.get(householdId), 12)
          || !Number.isInteger(response.guests) || response.guests < 0 || response.guests > 5) return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

/** Storage is supplied by the UI; failures never prevent trying the demo. */
export function loadState(storage) {
  try {
    const saved = storage.getItem(STORAGE_KEY);
    if (saved === null) return { state: createInitialState(), persisted: false, recovered: false };
    const state = JSON.parse(saved);
    if (!validateState(state)) throw new Error('Invalid saved demo state.');
    return { state, persisted: true, recovered: false };
  } catch {
    return { state: createInitialState(), persisted: false, recovered: true };
  }
}

export function saveState(storage, state) {
  if (!validateState(state)) return false;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

function assertState(state) {
  if (!validateState(state)) throw new Error('The demo state is invalid. Reset the demo to continue.');
}

function copy(state) {
  return JSON.parse(JSON.stringify(state));
}

function findMeeting(state, meetingId) {
  const meeting = state.meetings.find((item) => item.id === meetingId);
  if (!meeting) throw new Error('Choose a meeting from the demo schedule.');
  return meeting;
}

function assertHousehold(state, householdId) {
  if (!state.households.some((item) => item.id === householdId)) throw new Error('Choose a demo household.');
}

function assertAttendanceOpen(meeting) {
  if (meeting.canceled || meeting.date < DEMO_TODAY) throw new Error('Attendance is closed for this meeting.');
}

export function setHousehold(state, id) {
  assertState(state);
  assertHousehold(state, id);
  return { ...copy(state), selectedHouseholdId: id };
}

export function setAttendance(state, meetingId, householdId, response) {
  assertState(state);
  assertAttendanceOpen(findMeeting(state, meetingId));
  assertHousehold(state, householdId);
  const next = copy(state);
  next.responses[meetingId] ??= {};
  next.responses[meetingId][householdId] = response;
  if (!validateState(next)) throw new Error('Select members from this household and enter 0 to 5 guests.');
  return copy(next);
}

export function clearAttendance(state, meetingId, householdId) {
  assertState(state);
  assertAttendanceOpen(findMeeting(state, meetingId));
  assertHousehold(state, householdId);
  const next = copy(state);
  if (next.responses[meetingId]) delete next.responses[meetingId][householdId];
  return next;
}

/** Partial schedule/assignment edits are supported; IDs and household records are not editable. */
export function updateMeeting(state, meetingId, changes) {
  assertState(state);
  findMeeting(state, meetingId);
  if (!isRecord(changes) || Object.keys(changes).some((key) => !MEETING_UPDATE_KEYS.includes(key))) {
    throw new Error('The meeting update contains an unsupported field.');
  }
  const next = copy(state);
  const index = next.meetings.findIndex((item) => item.id === meetingId);
  const meeting = next.meetings[index];
  if (Object.hasOwn(changes, 'assignments')) {
    if (!isRecord(changes.assignments) || Object.keys(changes.assignments).some((key) => !ASSIGNMENT_KEYS.includes(key))) {
      throw new Error('Choose assignments from the demo households and members.');
    }
  }
  next.meetings[index] = {
    ...meeting,
    ...changes,
    assignments: { ...meeting.assignments, ...(changes.assignments ?? {}) },
  };
  if (!validateState(next)) throw new Error('Check the meeting date, time, text lengths, and assignment selections.');
  // Saved responses are history: cancellation or a date change must not erase them.
  return copy(next);
}

export function attendanceSummary(state, meetingId) {
  assertState(state);
  findMeeting(state, meetingId);
  const responses = state.responses[meetingId] ?? {};
  const summary = { people: 0, households: 0, notGoing: 0, unanswered: 0, groups: [] };
  for (const household of state.households) {
    if (!Object.hasOwn(responses, household.id)) {
      summary.unanswered += 1;
      continue;
    }
    const response = responses[household.id];
    if (response.memberIds.length + response.guests === 0) {
      summary.notGoing += 1;
      continue;
    }
    const memberNames = household.members.filter((member) => response.memberIds.includes(member.id)).map((member) => member.name);
    summary.people += memberNames.length + response.guests;
    summary.households += 1;
    summary.groups.push({ householdId: household.id, name: household.name, memberNames, guests: response.guests });
  }
  return summary;
}

export function upcomingAssignments(state, householdId) {
  assertState(state);
  assertHousehold(state, householdId);
  const members = new Set(state.households.find((item) => item.id === householdId).members.map((member) => member.id));
  return [...state.meetings]
    .filter((meeting) => !meeting.canceled && meeting.date >= DEMO_TODAY)
    .sort((left, right) => `${left.date} ${left.time}`.localeCompare(`${right.date} ${right.time}`))
    .flatMap((meeting) => {
      const roles = [];
      if (meeting.assignments.host === householdId) roles.push('Host');
      if (meeting.assignments.food.includes(householdId)) roles.push('Food');
      if (meeting.assignments.discussion.some((id) => members.has(id))) roles.push('Discussion');
      if (meeting.assignments.childcare.some((id) => members.has(id))) roles.push('Childcare');
      return roles.length ? [{ meetingId: meeting.id, roles }] : [];
    });
}
