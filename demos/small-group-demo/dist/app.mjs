import { DEMO_TODAY, createInitialState, loadState, saveState, setHousehold, setAttendance, clearAttendance, updateMeeting, attendanceSummary, upcomingAssignments } from './model.mjs';

const $ = (selector, root = document) => root.querySelector(selector);
const escape = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
let storage;
try { storage = window.sessionStorage; } catch { storage = null; }
const loaded = loadState(storage);
let state = loaded.state;
let storageAvailable = saveState(storage, state);
let view = 'schedule';
let list = 'upcoming';
let feedbackTimer;
const app = $('#app');
const household = () => state.households.find(h => h.id === state.selectedHouseholdId);
const meeting = id => state.meetings.find(m => m.id === id);
const isClosed = m => m.canceled || m.date < DEMO_TODAY;
const sortedMeetings = () => [...state.meetings].sort((a,b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
const dateParts = value => {
  const date = new Date(value + 'T12:00:00Z');
  return { day:date.toLocaleDateString('en-US',{day:'numeric',timeZone:'UTC'}), weekday:date.toLocaleDateString('en-US',{weekday:'short',timeZone:'UTC'}), month:date.toLocaleDateString('en-US',{month:'short',timeZone:'UTC'}), full:date.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',timeZone:'UTC'}), short:date.toLocaleDateString('en-US',{month:'short',day:'numeric',timeZone:'UTC'}) };
};
const formatTime = value => { const [h,m] = value.split(':').map(Number); return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${h >= 12 ? 'PM' : 'AM'} Central`; };
const person = id => state.households.flatMap(h => h.members).find(p => p.id === id);
const homeName = id => state.households.find(h => h.id === id)?.name || 'Needs assignment';

function announce(text) {
  clearTimeout(feedbackTimer);
  $('#feedback').textContent = text;
  feedbackTimer = setTimeout(() => { $('#feedback').textContent = ''; }, 6500);
}
function commit(next) {
  // Keep open attendance panels visible after updating their contents.
  const openPanels = [...app.querySelectorAll('.meeting-card details')].map((panel, index) => panel.open ? index : -1);
  state = next;
  storageAvailable = saveState(storage, state);
  render();
  app.querySelectorAll('.meeting-card details').forEach((panel, index) => { panel.open = openPanels.includes(index); });
}
function responseLabel(m, h = household()) {
  const response = state.responses[m.id]?.[h.id];
  if (!response) return 'Not answered yet';
  if (!response.memberIds.length && !response.guests) return 'Not going';
  const names = response.memberIds.map(id => h.members.find(p => p.id === id)?.name).filter(Boolean);
  return (names.length === h.members.length ? 'Everyone going' : names.length ? names.join(', ') + ' going' : 'Guests only') + (response.guests ? ` · ${response.guests} guest${response.guests === 1 ? '' : 's'}` : '');
}
function assignmentGrid(m) {
  const own = household();
  const memberIds = own.members.map(p => p.id);
  const assignments = [
    ['Host', homeName(m.assignments.host), m.assignments.host === own.id],
    ['Food', m.assignments.food.map(homeName).join(' / ') || 'Needs assignment', m.assignments.food.includes(own.id)],
    ['Discussion', m.assignments.discussion.map(id => person(id)?.name).join(' / ') || 'Needs assignment', m.assignments.discussion.some(id => memberIds.includes(id))],
    ['Childcare', m.assignments.childcare.map(id => person(id)?.name).join(' / ') || 'Needs assignment', m.assignments.childcare.some(id => memberIds.includes(id))],
  ];
  return `<dl class="assignments">${assignments.map(([label,names,isOwn]) => `<div><dt>${label}</dt><dd>${escape(names)}${isOwn ? '<span class="own-tag">You</span>' : ''}</dd></div>`).join('')}</dl>`;
}
function attendanceForm(m, featured = false) {
  const h = household();
  const chooser = featured ? `<label class="field">Demo household<select id="household-choice" name="household">${state.households.map(home => `<option value="${escape(home.id)}" ${home.id === h.id ? 'selected' : ''}>${escape(home.name)}</option>`).join('')}</select></label>` : '';
  if (isClosed(m)) return chooser + `<p class="rsvp-intro">Attendance closed for this ${m.canceled ? 'canceled' : 'past'} gathering.</p>`;
  const response = state.responses[m.id]?.[h.id];
  const checked = response ? response.memberIds : h.members.map(p => p.id);
  return `<form class="attendance-form" data-meeting="${escape(m.id)}">
    ${chooser}
    <p class="response-status ${response ? 'saved' : ''}">${response ? '✓ ' : ''}${escape(responseLabel(m))}</p>
    <fieldset class="member-list"><legend>Who's coming? <span class="subtle">${featured ? '' : escape(h.name)}</span></legend>${h.members.map(p => `<label class="member-choice"><input type="checkbox" name="member" value="${escape(p.id)}" ${checked.includes(p.id) ? 'checked' : ''}><span>${escape(p.name)}</span></label>`).join('')}</fieldset>
    <label class="guests-row">Fictional guests<input type="number" name="guests" min="0" max="5" step="1" value="${response?.guests || 0}" aria-label="Fictional guests for ${escape(m.topic)}"></label>
    <button class="button save-response" type="submit">Save attendance</button>
    <div class="quick-actions"><button class="text-button" type="button" data-response="all" data-meeting="${escape(m.id)}">All going</button><button class="text-button" type="button" data-response="none" data-meeting="${escape(m.id)}">Not going</button><button class="text-button" type="button" data-response="clear" data-meeting="${escape(m.id)}">Clear response</button></div>
    <p class="form-error" role="alert"></p>
  </form>`;
}
function countLine(m) {
  const counts = attendanceSummary(state, m.id);
  return `<div class="attendance-count"><span class="avatars" aria-hidden="true">${counts.groups.slice(0,4).map(g => `<span>${escape(g.name.slice(0,1))}</span>`).join('')}</span><span><strong>${counts.people} ${counts.people === 1 ? 'person' : 'people'} joining</strong> · ${counts.households} ${counts.households === 1 ? 'household' : 'households'}</span></div>`;
}
function feature(m) {
  const d = dateParts(m.date);
  return `<div class="feature-grid" id="${escape(m.id)}"><article class="featured"><p class="eyebrow">${m.canceled ? 'A week to pause' : 'Next gathering'}</p><div class="feature-top"><div class="date-block" aria-label="${escape(d.full)}"><span>${d.weekday.toUpperCase()}</span><strong>${d.day}</strong><span>${d.month.toUpperCase()}</span></div><div><h2>${escape(m.topic)}</h2><p class="when">${formatTime(m.time)}<span>${escape(m.location)}</span></p></div></div>${m.canceled ? '<p>This gathering is canceled in the demo schedule.</p>' : ''}${assignmentGrid(m)}${m.notes ? `<p class="notes"><strong>Good to know</strong>${escape(m.notes)}</p>` : ''}${countLine(m)}</article><aside class="rsvp-card" aria-label="Household attendance"><h2>Can you make it?</h2><p class="rsvp-intro">Try a household response. Nothing is sent.</p>${attendanceForm(m,true)}</aside></div>`;
}
function personalStrip() {
  const assignments = upcomingAssignments(state, household().id).slice(0,3);
  return `<aside class="personal-strip"><div><strong>Your upcoming assignments</strong><small>${escape(household().name)} · ${assignments.length ? 'A little help makes it happen.' : 'Nothing assigned right now.'}</small></div><div class="assignment-links">${assignments.map(item => { const m = meeting(item.meetingId); return `<a href="#${escape(m.id)}" data-assignment-link>${dateParts(m.date).short} · ${escape(item.roles.join(' & '))}</a>`; }).join('')}</div></aside>`;
}
function meetingCard(m) {
  return `<article class="meeting-card ${m.canceled ? 'canceled' : ''}" id="${escape(m.id)}"><div class="card-top"><p class="eyebrow">${escape(dateParts(m.date).full)}</p>${m.canceled ? '<span class="badge">No meeting</span>' : m.date < DEMO_TODAY ? '<span class="badge">Past</span>' : ''}</div><h3>${escape(m.topic)}</h3><p class="when">${formatTime(m.time)}<span>${escape(m.location)}</span></p><p class="response-status">${isClosed(m) ? 'Attendance closed' : escape(responseLabel(m))}</p><details><summary>Assignments & notes</summary>${assignmentGrid(m)}${m.notes ? `<p class="notes">${escape(m.notes)}</p>` : ''}</details>${!isClosed(m) ? `<details><summary>Update your attendance</summary>${attendanceForm(m)}</details>` : ''}</article>`;
}
function scheduleView() {
  const all = sortedMeetings();
  const featured = all.find(m => m.date >= DEMO_TODAY);
  const remaining = all.filter(m => list === 'past' ? m.date < DEMO_TODAY : m.date >= DEMO_TODAY && m.id !== featured?.id);
  return `<div class="page-heading"><div><h1>Small group schedule</h1><p>See what's coming up, who's joining, and where you can help.</p></div><span class="sample-date">Sample date · October 23, 2026</span></div>${featured ? feature(featured) : '<p class="notice">No upcoming gatherings. Try editing a meeting in Leader tools.</p>'}${personalStrip()}<section aria-labelledby="meetings-heading"><div class="list-heading"><h2 id="meetings-heading">${list === 'past' ? 'Past gatherings' : 'Coming up'}</h2><div class="list-tabs" aria-label="Meeting list"><button type="button" data-list="upcoming" aria-pressed="${list === 'upcoming'}">Upcoming</button><button type="button" data-list="past" aria-pressed="${list === 'past'}">Past gatherings</button></div></div><div class="meeting-grid">${remaining.map(meetingCard).join('') || '<p class="rsvp-intro">No gatherings in this view.</p>'}</div></section>`;
}
function leaderView() {
  return `<div class="page-heading"><div><h1>A clear plan for everyone</h1><p>Try the leader workflow with the same fictional schedule.</p></div><span class="sample-date">Demo editing · no sign-in</span></div><p class="notice">These controls change only this tab's demo. They do not bypass or connect to the real app's protected leader tools.</p><div class="leader-grid">${sortedMeetings().map(m => `<article class="leader-card"><div><p class="eyebrow">${escape(dateParts(m.date).full)}</p><h2>${escape(m.topic)}</h2><p>${formatTime(m.time)}${m.canceled ? ' · Canceled' : ''}</p><p>${attendanceSummary(state,m.id).people} people in saved sample responses</p></div><button type="button" class="button secondary" data-edit="${escape(m.id)}">Edit<span class="sr-only"> ${escape(m.topic)}</span></button></article>`).join('')}</div>`;
}
function render() {
  document.querySelectorAll('[data-view]').forEach(b => {
    if (b.dataset.view === view) b.setAttribute('aria-current','page'); else b.removeAttribute('aria-current');
  });
  app.innerHTML = (!storageAvailable ? '<p class="notice">Session storage is unavailable. You can still explore; changes will reset when you reload.</p>' : '') + (view === 'leader' ? leaderView() : scheduleView());
}
function renderEditor(id) {
  const m = meeting(id);
  const homes = state.households;
  const members = homes.flatMap(h => h.members);
  const choices = (name, values, options) => options.map(o => `<label><input type="checkbox" name="${name}" value="${escape(o.id)}" ${values.includes(o.id) ? 'checked' : ''}>${escape(o.name)}</label>`).join('');
  $('#editor').innerHTML = `<div class="dialog-header"><h2 id="editor-heading">Edit sample gathering</h2><button class="icon-button" type="button" data-close="editor" aria-label="Close meeting editor">×</button></div><p>Use fictional details only. Changes are saved in this tab, not sent to a server.</p><form id="meeting-editor" data-meeting="${escape(id)}"><div class="editor-fields"><label class="field wide">Topic<input name="topic" required maxlength="100" value="${escape(m.topic)}"></label><label class="field">Date<input name="date" type="date" required value="${escape(m.date)}"></label><label class="field">Time (Central)<input name="time" type="time" required value="${escape(m.time)}"></label><label class="field wide">Fictional location<input name="location" required maxlength="100" value="${escape(m.location)}"></label><label class="field wide">Host household<select name="host"><option value="">Needs assignment</option>${homes.map(h => `<option value="${escape(h.id)}" ${m.assignments.host === h.id ? 'selected' : ''}>${escape(h.name)}</option>`).join('')}</select></label><fieldset class="wide"><legend>Food households</legend><div class="assignment-picker">${choices('food',m.assignments.food,homes)}</div></fieldset><fieldset class="wide"><legend>Discussion leaders</legend><div class="assignment-picker">${choices('discussion',m.assignments.discussion,members)}</div></fieldset><fieldset class="wide"><legend>Childcare helpers</legend><div class="assignment-picker">${choices('childcare',m.assignments.childcare,members)}</div></fieldset><label class="field wide">Notes<textarea name="notes" maxlength="500" rows="2">${escape(m.notes)}</textarea></label><label class="cancel-field wide"><input type="checkbox" name="canceled" ${m.canceled ? 'checked' : ''}>No gathering / canceled</label></div><p class="form-error" role="alert"></p><div class="dialog-actions"><button class="button secondary" type="button" data-close="editor">Cancel</button><button class="button" type="submit">Save demo changes</button></div></form>`;
  $('#editor').showModal();
}
function saveMessage(message) { announce(message + (storageAvailable ? ' Saved in this tab only.' : ' Kept in memory until reload.')); }

document.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.dataset.view) { view = button.dataset.view; render(); }
  else if (button.dataset.list) { list = button.dataset.list; render(); $(`[data-list="${list}"]`).focus(); }
  else if (button.dataset.close) $(`#${button.dataset.close}`).close();
  else if (button.dataset.edit) renderEditor(button.dataset.edit);
  else if (button.id === 'reset-demo') $('#reset-dialog').showModal();
  else if (button.id === 'confirm-reset') { $('#reset-dialog').close(); view='schedule'; list='upcoming'; commit(createInitialState()); announce('Fictional demo reset. You have a fresh schedule.'); }
  else if (button.dataset.response) {
    try {
      const action = button.dataset.response;
      const id = button.dataset.meeting;
      const next = action === 'clear' ? clearAttendance(state,id,household().id) : setAttendance(state,id,household().id,{memberIds:action === 'all' ? household().members.map(p=>p.id) : [],guests:0});
      commit(next);
      saveMessage(action === 'clear' ? 'Response cleared.' : 'Attendance updated.');
      $(`[data-meeting="${id}"] .save-response`)?.focus();
    } catch (error) { announce(error.message); }
  }
});
document.addEventListener('change', event => {
  if (event.target.id === 'household-choice') {
    commit(setHousehold(state,event.target.value));
    $('#household-choice')?.focus();
    announce(`Exploring as ${household().name}.`);
  }
});
document.addEventListener('submit', event => {
  const form = event.target;
  event.preventDefault();
  const data = new FormData(form);
  try {
    if (form.classList.contains('attendance-form')) {
      const id = form.dataset.meeting;
      commit(setAttendance(state,id,household().id,{memberIds:data.getAll('member'),guests:Number(data.get('guests'))}));
      saveMessage('Attendance updated.');
      $(`[data-meeting="${id}"] .save-response`)?.focus();
    } else if (form.id === 'meeting-editor') {
      const next = updateMeeting(state,form.dataset.meeting,{topic:data.get('topic').trim(),date:data.get('date'),time:data.get('time'),location:data.get('location').trim(),notes:data.get('notes').trim(),canceled:data.has('canceled'),assignments:{host:data.get('host'),food:data.getAll('food'),discussion:data.getAll('discussion'),childcare:data.getAll('childcare')}});
      $('#editor').close();
      commit(next);
      saveMessage('Schedule updated.');
      $(`[data-edit="${form.dataset.meeting}"]`)?.focus();
    }
  } catch (error) {
    const target = $('.form-error',form);
    if (target) target.textContent=error.message; else announce(error.message);
  }
});
document.addEventListener('click', event => {
  const link = event.target.closest('[data-assignment-link]');
  if (link && list === 'past') { list='upcoming'; render(); }
});
render();
if (loaded.recovered && storageAvailable) announce('The saved demo could not be read. A fresh fictional schedule is ready.');
