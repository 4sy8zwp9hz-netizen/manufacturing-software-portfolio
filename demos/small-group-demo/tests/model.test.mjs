import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STORAGE_KEY, DEMO_TODAY, createInitialState, validateState, loadState, saveState,
  setHousehold, setAttendance, clearAttendance, updateMeeting, attendanceSummary, upcomingAssignments,
} from '../dist/model.mjs';

const FEATURED = 'meeting-2026-10-23';
const PAST = 'meeting-2026-10-16';
const CANCELED = 'meeting-2026-11-13';

function storage() {
  const records = new Map();
  return { getItem: (key) => records.get(key) ?? null, setItem: (key, value) => records.set(key, value) };
}

test('fixtures are valid, repeatable, fictional, and independently allocated', () => {
  const first = createInitialState();
  const second = createInitialState();
  assert.equal(DEMO_TODAY, '2026-10-23');
  assert.equal(validateState(first), true);
  assert.deepEqual(first, second);
  first.households[0].members[0].name = 'Changed';
  first.meetings[0].assignments.food.push('ellis');
  assert.equal(second.households[0].members[0].name, 'Avery');
  assert.deepEqual(second.meetings[0].assignments.food, ['park']);
  assert.equal(Object.hasOwn(second.responses[FEATURED], 'bennett'), false);
});

test('empty storage loads fixtures without pretending they were saved', () => {
  assert.deepEqual(loadState(storage()), { state: createInitialState(), persisted: false, recovered: false });
});

test('save and load use only the supplied session store and key', () => {
  const first = storage();
  const second = storage();
  const updated = setHousehold(createInitialState(), 'ellis');
  assert.equal(saveState(first, updated), true);
  assert.deepEqual(loadState(first), { state: updated, persisted: true, recovered: false });
  assert.equal(loadState(second).state.selectedHouseholdId, 'bennett');
  assert.notEqual(first.getItem(STORAGE_KEY), null);
});

test('corrupt JSON and invalid saved state recover without trusting the payload', () => {
  for (const content of ['{broken', 'null', '[]', '{"version":99}', JSON.stringify({ ...createInitialState(), token: 'not-allowed' })]) {
    const store = storage();
    store.setItem(STORAGE_KEY, content);
    assert.deepEqual(loadState(store), { state: createInitialState(), persisted: false, recovered: true });
  }
});

test('blocked or full storage never prevents an in-memory demo', () => {
  const blocked = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('full'); } };
  assert.equal(loadState(blocked).recovered, true);
  assert.equal(validateState(loadState(blocked).state), true);
  assert.equal(saveState(blocked, createInitialState()), false);
  assert.equal(saveState(undefined, createInitialState()), false);
  assert.equal(loadState(undefined).persisted, false);
});

test('invalid state is never written', () => {
  let writes = 0;
  assert.equal(saveState({ setItem() { writes += 1; } }, { version: 1 }), false);
  assert.equal(writes, 0);
});

test('household selection is immutable and rejects unknown identities', () => {
  const state = createInitialState();
  const next = setHousehold(state, 'park');
  assert.equal(state.selectedHouseholdId, 'bennett');
  assert.equal(next.selectedHouseholdId, 'park');
  assert.notEqual(next.households, state.households);
  assert.throws(() => setHousehold(state, 'unknown'), /household/);
  assert.throws(() => setHousehold(state, '__proto__'), /household/);
});

test('attendance counts people, responding households, explicit no, and unanswered separately', () => {
  const state = createInitialState();
  assert.deepEqual(attendanceSummary(state, FEATURED), {
    people: 5, households: 2, notGoing: 1, unanswered: 1,
    groups: [
      { householdId: 'reed', name: 'Reed', memberNames: ['Casey', 'Morgan'], guests: 1 },
      { householdId: 'park', name: 'Park', memberNames: ['Taylor', 'Riley'], guests: 0 },
    ],
  });
  const going = setAttendance(state, FEATURED, 'bennett', { memberIds: ['avery', 'quinn'], guests: 2 });
  assert.equal(attendanceSummary(going, FEATURED).people, 9);
  assert.equal(attendanceSummary(going, FEATURED).households, 3);
  assert.equal(attendanceSummary(going, FEATURED).unanswered, 0);
  assert.equal(Object.hasOwn(state.responses[FEATURED], 'bennett'), false);
  const notGoing = setAttendance(going, FEATURED, 'bennett', { memberIds: [], guests: 0 });
  assert.equal(attendanceSummary(notGoing, FEATURED).notGoing, 2);
  const cleared = clearAttendance(notGoing, FEATURED, 'bennett');
  assert.deepEqual(attendanceSummary(cleared, FEATURED), attendanceSummary(state, FEATURED));
});

test('attendance update does not retain caller-owned arrays', () => {
  const state = createInitialState();
  const response = { memberIds: ['avery'], guests: 1 };
  const next = setAttendance(state, FEATURED, 'bennett', response);
  response.memberIds.push('jordan');
  assert.deepEqual(next.responses[FEATURED].bennett.memberIds, ['avery']);
});

test('attendance rejects incorrect household membership, duplicates, unknown keys, and invalid guests', () => {
  const state = createInitialState();
  for (const response of [
    { memberIds: ['casey'], guests: 0 }, { memberIds: ['missing'], guests: 0 },
    { memberIds: ['avery', 'avery'], guests: 0 }, { memberIds: 'avery', guests: 0 },
    { memberIds: ['avery'], guests: -1 }, { memberIds: ['avery'], guests: 6 },
    { memberIds: ['avery'], guests: 1.5 }, { memberIds: ['avery'], guests: '1' },
    { memberIds: ['avery'], guests: NaN }, { memberIds: ['avery'], guests: 0, other: true },
    { memberIds: ['avery'] }, { memberIds: new Array(1), guests: 0 }, null,
  ]) {
    assert.throws(() => setAttendance(state, FEATURED, 'bennett', response));
  }
  assert.throws(() => setAttendance(state, FEATURED, 'unknown', { memberIds: [], guests: 0 }));
  assert.throws(() => setAttendance(state, 'unknown', 'bennett', { memberIds: [], guests: 0 }));
  assert.deepEqual(state, createInitialState());
});

test('past and canceled attendance is closed for writes and clears, but saved history is valid', () => {
  const state = createInitialState();
  for (const id of [PAST, CANCELED]) {
    assert.throws(() => setAttendance(state, id, 'bennett', { memberIds: ['avery'], guests: 0 }), /closed/);
    assert.throws(() => clearAttendance(state, id, 'bennett'), /closed/);
  }
  assert.equal(attendanceSummary(state, PAST).people, 4);
  assert.equal(validateState(state), true);
});

test('schedule edits support all known fields and partial assignment updates without mutation', () => {
  const state = createInitialState();
  const next = updateMeeting(state, FEATURED, {
    date: '2026-10-24', time: '18:30', topic: 'A fictional potluck', location: 'Community room',
    notes: 'Bring a snack.\nDoors open at six.', assignments: { food: ['ellis'], discussion: ['jordan', 'casey'] },
  });
  const meeting = next.meetings.find((item) => item.id === FEATURED);
  assert.equal(meeting.time, '18:30');
  assert.equal(meeting.date, '2026-10-24');
  assert.deepEqual(meeting.assignments.food, ['ellis']);
  assert.equal(meeting.assignments.host, 'bennett');
  assert.deepEqual(state, createInitialState());
});

test('cancellation and moving into the past preserve responses; resuming permits attendance again', () => {
  const state = createInitialState();
  const canceled = updateMeeting(state, FEATURED, { canceled: true });
  assert.deepEqual(canceled.responses, state.responses);
  assert.equal(validateState(canceled), true);
  assert.throws(() => setAttendance(canceled, FEATURED, 'bennett', { memberIds: [], guests: 0 }), /closed/);
  const resumed = updateMeeting(canceled, FEATURED, { canceled: false });
  assert.equal(validateState(setAttendance(resumed, FEATURED, 'bennett', { memberIds: [], guests: 0 })), true);
  const past = updateMeeting(state, FEATURED, { date: '2026-10-22' });
  assert.deepEqual(past.responses, state.responses);
  assert.throws(() => clearAttendance(past, FEATURED, 'reed'), /closed/);
});

test('a meeting can need a host assignment without accepting an unknown household', () => {
  const state = createInitialState();
  const next = updateMeeting(state, FEATURED, { assignments: { host: '' } });
  assert.equal(validateState(next), true);
  assert.equal(next.meetings.find((meeting) => meeting.id === FEATURED).assignments.host, '');
  assert.equal(upcomingAssignments(next, 'bennett').find((meeting) => meeting.meetingId === FEATURED).roles.includes('Host'), false);
  assert.throws(() => updateMeeting(state, FEATURED, { assignments: { host: 'unknown' } }));
  assert.equal(state.meetings.find((meeting) => meeting.id === FEATURED).assignments.host, 'bennett');
});

test('schedule rejects malformed dates, times, texts, references, duplicate assignments, and unknown fields', () => {
  const state = createInitialState();
  for (const changes of [
    { date: '2026-02-30' }, { date: '2026-13-01' }, { date: '2026-1-01' }, { date: 'not-a-date' },
    { time: '24:00' }, { time: '19:60' }, { time: '7:00' }, { topic: '' }, { location: ' ' },
    { topic: 'a'.repeat(101) }, { notes: 'a'.repeat(501) }, { topic: 'two\nlines' },
    { notes: '\u0000' }, { canceled: 'false' }, { id: 'replacement' }, { extra: true },
    { assignments: { host: 'unknown' } }, { assignments: { food: ['avery'] } },
    { assignments: { discussion: ['bennett'] } }, { assignments: { food: ['reed', 'reed'] } },
    { assignments: { childcare: ['missing'] } }, { assignments: { unsupported: [] } },
    { assignments: { food: new Array(1) } }, { assignments: null }, { assignments: [] }, null,
  ]) {
    assert.throws(() => updateMeeting(state, FEATURED, changes));
  }
  assert.throws(() => updateMeeting(state, 'unknown', { topic: 'Another topic' }));
  assert.deepEqual(state, createInitialState());
});

test('assignments combine household and member roles and exclude past and canceled dates', () => {
  const state = createInitialState();
  assert.deepEqual(upcomingAssignments(state, 'bennett'), [
    { meetingId: FEATURED, roles: ['Host', 'Childcare'] },
    { meetingId: 'meeting-2026-10-30', roles: ['Food'] },
    { meetingId: 'meeting-2026-11-06', roles: ['Food', 'Discussion'] },
    { meetingId: 'meeting-2026-11-20', roles: ['Discussion'] },
  ]);
  assert.throws(() => upcomingAssignments(state, 'unknown'));
});

test('validation rejects unknown fields and duplicate or dangling identities throughout stored data', () => {
  const mutations = [
    (state) => { state.version = 2; },
    (state) => { state.selectedHouseholdId = 'unknown'; },
    (state) => { state.extra = true; },
    (state) => { state.households[0].id = '__proto__'; },
    (state) => { state.households.push(state.households[0]); },
    (state) => { state.households[1].members[0].id = 'avery'; },
    (state) => { state.households[0].members[0].extra = true; },
    (state) => { state.meetings.push(state.meetings[0]); },
    (state) => { state.meetings[0].assignments.food = ['unknown']; },
    (state) => { state.responses.unknown = {}; },
    (state) => { state.responses[FEATURED].unknown = { memberIds: [], guests: 0 }; },
    (state) => { state.responses[FEATURED].reed.memberIds = ['avery']; },
    (state) => { state.responses[FEATURED].reed.extra = true; },
    (state) => { state.households = []; },
    (state) => { state.meetings = []; },
    (state) => { state.responses = []; },
  ];
  for (const mutate of mutations) {
    const state = createInitialState();
    mutate(state);
    assert.equal(validateState(state), false);
  }
  assert.equal(validateState(null), false);
  assert.equal(validateState(undefined), false);
  assert.equal(validateState(Object.create({ version: 1 })), false);
  assert.equal(validateState(JSON.parse('{"__proto__":{"polluted":true}}')), false);
  assert.equal({}.polluted, undefined);
});

test('invalid input state is rejected without modifying it', () => {
  const state = createInitialState();
  state.version = 3;
  assert.throws(() => setHousehold(state, 'bennett'), /invalid/);
  assert.throws(() => attendanceSummary(state, FEATURED), /invalid/);
  assert.equal(state.version, 3);
});

test('valid leap day and maximum guests remain supported', () => {
  const state = createInitialState();
  const next = updateMeeting(state, FEATURED, { date: '2028-02-29' });
  assert.equal(validateState(next), true);
  const withGuests = setAttendance(next, FEATURED, 'bennett', { memberIds: [], guests: 5 });
  assert.equal(attendanceSummary(withGuests, FEATURED).people, 10);
  assert.equal(attendanceSummary(withGuests, FEATURED).households, 3);
});
