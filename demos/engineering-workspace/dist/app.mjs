import { filterWafers, summarize, groupSummary, waferMaps, processCycles, fitLine } from './model.mjs';

// All input comes from the independently invented fixture module. No backend is used.
const workspace = document.querySelector('#workspace');
const colors = { 'Tool A': '#087e80', 'Tool B': '#4968ae', 'Tool C': '#b86838' };
const format = (value, digits = 2) => Number.isFinite(value) ? value.toFixed(digits) : 'Not measured';
const toolOptions = '<option value="all">All equipment</option>' + Object.keys(colors).map(tool => `<option>${tool}</option>`).join('');
const legend = () => `<div class="legend">${Object.keys(colors).filter(tool => processTool === 'all' || tool === processTool).map(tool => `<span><i class="swatch tool-${tool.at(-1).toLowerCase()}"></i>${tool}</span>`).join('')}</div>`;
const metric = (label, value, detail) => `<div class="metric"><small>${label}</small><strong>${value}</strong><em>${detail}</em></div>`;
const title = (index, name, description) => `<p class="eyebrow">ENGINEERING WORKSPACE / ${index}</p><h1>${name}</h1><p class="intro">${description}</p>`;
const scale = (value, low, high, start, end) => start + (value - low) / (high - low || 1) * (end - start);
const svg = (content, label, width = 500, height = 270) => `<svg class="chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="${label}">${content}</svg>`;

function yAxis(low, high, width = 500, height = 270, label = 'Response · relative units') {
  return `<text x="48" y="15">${label}</text>` + Array.from({length: 5}, (_, i) => {
    const value = low + (high - low) * i / 4;
    const y = scale(value, low, high, height - 37, 34);
    return `<line class="gridline" x1="48" y1="${y}" x2="${width - 16}" y2="${y}"/><text x="40" y="${y + 4}" text-anchor="end">${value.toFixed(2)}</text>`;
  }).join('');
}

function statsCharts(rows) {
  const measured = rows.filter(row => Number.isFinite(row.value));
  // A fixed scale keeps different filter selections visually comparable.
  const low = 0.7, high = 1.4;
  const groups = groupSummary(rows);
  let distribution = yAxis(low, high);
  groups.forEach((group, index) => {
    const x = 120 + index * 145;
    const members = measured.filter(row => row.tool === group.tool);
    distribution += `<text x="${x}" y="258" text-anchor="middle">${group.tool} · n=${group.count}</text>`;
    members.forEach((row, i) => {
      const px = x + ((i * 7) % 11 - 5) * 3;
      distribution += `<circle cx="${px}" cy="${scale(row.value,low,high,233,34)}" r="4" fill="${colors[row.tool]}" opacity=".65"><title>${row.id}: ${format(row.value)}</title></circle>`;
    });
    if (group.count) {
      const meanY = scale(group.mean, low, high, 233, 34);
      distribution += `<line x1="${x-25}" x2="${x+25}" y1="${meanY}" y2="${meanY}" stroke="#192f3e" stroke-width="3"/>`;
    }
  });
  let trend = yAxis(low, high);
  const start = Date.parse('2026-01-01'), end = Date.parse('2026-03-01');
  measured.forEach(row => {
    trend += `<circle cx="${scale(Date.parse(row.date),start,end,55,478)}" cy="${scale(row.value,low,high,233,34)}" r="4.5" fill="${colors[row.tool]}" opacity=".8"><title>${row.id} · ${row.date} · ${format(row.value)}</title></circle>`;
  });
  ['2026-01-01','2026-02-01','2026-03-01'].forEach(date => {
    trend += `<text x="${scale(Date.parse(date),start,end,55,478)}" y="258" text-anchor="middle">${{'2026-01-01':'Jan 01','2026-02-01':'Feb 01','2026-03-01':'Mar 01'}[date]}</text>`;
  });
  return `<div class="chart-grid"><section class="panel"><h2>Compare equipment</h2><p class="subtitle">Each dot is a measured wafer; dark lines show means.</p>${svg(distribution,'Fictional wafer measurements grouped by equipment')}</section><section class="panel"><h2>Check the date context</h2><p class="subtitle">The same population, placed on its process dates.</p>${svg(trend,'Fictional wafer measurements across process dates')}</section></div>`;
}

function showStats() {
  workspace.innerHTML = title('01','Stat Tools','Choose the manufacturing population. Compare the measurements that matter.') + `
    <section class="query" aria-label="Population selection"><div class="query-top"><h2>Define the comparison</h2><span class="micro">Sample data · January–February 2026</span></div>
    <div class="fields"><label>Process step<select id="process-filter"><option>Process A</option><option>Process B</option></select></label><label>Equipment<select id="tool-filter">${toolOptions}</select></label><label>From<input id="start-filter" type="date" value="2026-01-01"></label><label>Through<input id="end-filter" type="date" value="2026-02-28"></label><button id="load">Load comparison</button></div><p class="error" id="query-error" role="status"></p></section>
    <div id="stats-results" aria-live="polite"></div>`;
  const load = () => {
    const start = document.querySelector('#start-filter').value;
    const end = document.querySelector('#end-filter').value;
    const error = document.querySelector('#query-error');
    if (!start || !end || start > end) { error.textContent = 'Choose a valid date range. The previous comparison is unchanged.'; return; }
    error.textContent = '';
    const process = document.querySelector('#process-filter').value;
    const rows = filterWafers({process, tool:document.querySelector('#tool-filter').value, start, end});
    const summary = summarize(rows);
    const groups = groupSummary(rows);
    document.querySelector('#stats-results').innerHTML = `<div class="metrics">${metric('WAFERS IN SCOPE', rows.length, `${process} · one outcome per wafer`)}${metric('MEASURED / MISSING', `${summary.count} / ${summary.missing}`, 'Missing measurements are not zero')}${metric('EQUIPMENT GROUPS', groups.length, 'Descriptive comparison, not a causal test')}</div>` + statsCharts(rows) + `
    <section class="panel"><div class="panel-head"><h2>Know what is being compared</h2><span class="micro">Outcome: response · relative units</span></div><div class="table-wrap"><table><thead><tr><th>Equipment</th><th>Measured wafers</th><th>Missing</th><th>Mean</th><th>Sample standard deviation</th></tr></thead><tbody>${groups.map(group => `<tr><td>${group.tool}</td><td>${group.count}</td><td>${group.missing}</td><td>${format(group.mean)}</td><td>${Number.isFinite(group.sd) ? format(group.sd) : 'Unavailable'}</td></tr>`).join('') || '<tr><td colspan="5">No wafers match this selection. Broaden the dates or equipment filter.</td></tr>'}</tbody></table></div></section><p class="note">Start with the population and date context before interpreting a difference between equipment groups.</p>`;
  };
  document.querySelector('#load').addEventListener('click', load);
  load();
}

const inspectionColors = {Clear:'#c5e4e0', Cluster:'#c87547', Edge:'#e2b95c', 'Surface mark':'#7689b9'};
function electricalColor(value) {
  if (!Number.isFinite(value)) return '#e0e5e8';
  const t = Math.max(0, Math.min(1, (value - 0.8) / 0.7));
  return `rgb(${Math.round(205-170*t)},${Math.round(230-110*t)},${Math.round(234-80*t)})`;
}
let selectedChip = waferMaps.find(row => row.x === 3 && row.y === 1)?.id ?? waferMaps[0].id;
function mapChart(kind) {
  const name = kind === 'inspection' ? 'Inspection' : 'Electrical';
  const cells = waferMaps.map(chip => {
    const x = 215 + chip.x * 22, y = 194 - chip.y * 22;
    const value = kind === 'inspection' ? chip.inspection : chip.electrical;
    const color = kind === 'inspection' ? (inspectionColors[value] ?? '#e0e5e8') : electricalColor(value);
    const label = value === null ? 'Not measured' : kind === 'inspection' ? value : format(value);
    return `<rect x="${x}" y="${y}" width="19" height="19" rx="2" fill="${color}" data-chip="${chip.id}" role="button" tabindex="0" aria-label="${name} chip ${chip.x},${chip.y}" aria-pressed="${chip.id === selectedChip}"><title>${name} · (${chip.x}, ${chip.y}) · ${label}</title></rect>`;
  }).join('');
  return `<svg class="chart map" viewBox="0 0 450 400" aria-label="Fictional ${name.toLowerCase()} wafer map"><circle cx="224" cy="203" r="176" fill="#f6f8f9" stroke="#d5e0e4"/><path d="M214 377 L224 368 L234 377" fill="white" stroke="#d5e0e4"/>${cells}<text x="224" y="397" text-anchor="middle">Shared fictional chip coordinates · x / y</text></svg>`;
}

function showMaps() {
  const chip = waferMaps.find(row => row.id === selectedChip);
  workspace.innerHTML = title('02','Linked wafer maps','Follow the same physical chip across inspection and electrical evidence.') + `
    <div class="callout"><strong>One wafer. Two sources. A shared selection.</strong><p>Demo wafer DEMO-WAFER-01 · Both views use the same fictional coordinate grid.</p></div>
    <div class="selection-strip" aria-live="polite"><div><small>SELECTED CHIP</small><strong>x ${chip.x} / y ${chip.y}</strong></div><div><small>INSPECTION</small><strong>${chip.inspection ?? 'Not measured'}</strong></div><div><small>ELECTRICAL RESPONSE</small><strong>${format(chip.electrical)} <small>relative units</small></strong></div><span>Choose a chip in either map<br>to highlight the same location in both.</span></div>
    <div class="chart-grid map-grid"><section class="panel"><h2>Inspection evidence</h2><p class="subtitle">Recorded categories, not electrical pass/fail.</p>${mapChart('inspection')}<div class="legend"><span><i class="swatch inspection-clear"></i>Clear</span><span><i class="swatch inspection-cluster"></i>Cluster</span><span><i class="swatch inspection-edge"></i>Edge</span><span><i class="swatch inspection-surface"></i>Surface mark</span><span><i class="swatch missing"></i>Not measured</span></div></section><section class="panel"><h2>Electrical evidence</h2><p class="subtitle">Measured response at each chip position.</p>${mapChart('electrical')}<div class="legend"><span><i class="swatch electrical-low"></i>Lower response</span><span><i class="swatch electrical-high"></i>Higher response</span><span><i class="swatch missing"></i>Not measured</span></div></section></div>
    <section class="panel"><h2>Look for correspondence—not just similar colors</h2><p class="note">Linked selection requires verified coordinate alignment. Missing inspection or electrical data stays missing; neither a blank position nor a single measured parameter establishes overall yield.</p></section>`;
  const choose = event => {
    const target = event.target.closest('[data-chip]');
    if (!target || (event.type === 'keydown' && !['Enter',' '].includes(event.key))) return;
    event.preventDefault();
    selectedChip = target.dataset.chip;
    const label = target.getAttribute('aria-label');
    showMaps();
    // Restore keyboard focus after the linked maps are redrawn.
    const replacement = [...workspace.querySelectorAll('[data-chip]')].find(item => item.getAttribute('aria-label') === label);
    replacement?.focus({preventScroll:true});
  };
  workspace.onclick = choose;
  workspace.onkeydown = choose;
}

let selectedCycle = null;
const excluded = new Set();
let processTool = 'Tool A';
function processChart(rows, fit) {
  const width = 610, height = 335;
  const xs = processCycles.map(row => row.upstream), ys = processCycles.map(row => row.response);
  const xLow = Math.floor(Math.min(...xs) * 10 - 1) / 10, xHigh = Math.ceil(Math.max(...xs) * 10 + 1) / 10;
  const yLow = Math.floor(Math.min(...ys) * 10 - 1) / 10, yHigh = Math.ceil(Math.max(...ys) * 10 + 1) / 10;
  const px = x => scale(x,xLow,xHigh,55,590), py = y => scale(y,yLow,yHigh,288,34);
  let chart = yAxis(yLow,yHigh,width,height-10,'Downstream response · relative units');
  for (let i = 0; i < 5; i++) {
    const x = xLow + (xHigh - xLow) * i / 4;
    chart += `<text x="${px(x)}" y="308" text-anchor="middle">${x.toFixed(2)}</text>`;
  }
  chart += '<text x="320" y="331" text-anchor="middle">Upstream measurement · relative units</text>';
  if (Number.isFinite(fit.slope)) {
    chart += `<line x1="${px(fit.xMin)}" x2="${px(fit.xMax)}" y1="${py(fit.intercept + fit.slope*fit.xMin)}" y2="${py(fit.intercept + fit.slope*fit.xMax)}" stroke="#6b8590" stroke-width="2" stroke-dasharray="6 5"/>`;
  }
  for (const row of rows) {
    chart += `<circle class="process-point" cx="${px(row.upstream)}" cy="${py(row.response)}" r="${row.id === selectedCycle ? 8 : 5}" fill="${colors[row.tool]}" stroke="${row.id === selectedCycle ? '#18313f' : 'white'}" stroke-width="${row.id === selectedCycle ? 3 : 1}" role="button" tabindex="0" data-cycle="${row.id}" aria-label="Select ${row.wafer} cycle ${row.cycle}" aria-pressed="${row.id === selectedCycle}"><title>${row.wafer} · cycle ${row.cycle}</title></circle>`;
  }
  return `<svg class="chart" viewBox="0 0 ${width} ${height}" aria-label="Fictional process-cycle observations with a descriptive fitted line">${chart}</svg>`;
}

function showProcess() {
  const population = processCycles.filter(row => processTool === 'all' || row.tool === processTool);
  const rows = population.filter(row => !excluded.has(row.id));
  if (!rows.some(row => row.id === selectedCycle)) selectedCycle = rows[0]?.id ?? null;
  const selected = rows.find(row => row.id === selectedCycle);
  const fit = fitLine(rows);
  workspace.innerHTML = title('03','Process response analysis','Connect upstream conditions to downstream results—one process cycle at a time.') + `
    <section class="query"><div class="fields"><label>Equipment population<select id="response-tool">${toolOptions}</select></label><div class="micro">Sample process measurements · Repeated cycles remain separate observations</div></div></section>
    <div class="metrics">${metric('PROCESS CYCLES',rows.length,`${new Set(rows.map(row => row.wafer)).size} distinct fictional wafers`)}${metric('FIT R²',Number.isFinite(fit.r2) ? fit.r2.toFixed(2) : 'Unavailable','Descriptive fit within this selection')}${metric('EXCLUDED CYCLES', population.length-rows.length,'Reversible, local to this demo session')}</div>
    <div class="process-grid"><section class="panel"><h2>Inspect the relationship</h2><p class="subtitle">Select an observation to trace its paired measurements.</p>${processChart(rows,fit)}${legend()}<p class="note">Dashed line: descriptive fit within the observed range.</p></section>
    <section class="panel"><h2>Trace the selected cycle</h2>${selected ? `<div class="diagnostic"><span>Wafer</span><b>${selected.wafer}</b></div><div class="diagnostic"><span>Process cycle</span><b>${selected.cycle}</b></div><div class="diagnostic"><span>Equipment</span><b>${selected.tool}</b></div><div class="diagnostic"><span>Upstream</span><b>${format(selected.upstream)}</b></div><div class="diagnostic"><span>Downstream</span><b>${format(selected.response)}</b></div>` : '<p class="note">No observations remain. Reset exclusions to restore the data.</p>'}<div class="actions"><button id="exclude" class="secondary" ${selected ? '' : 'disabled'}>Exclude selected cycle</button><button id="restore" class="secondary" ${excluded.size ? '' : 'disabled'}>Reset exclusions</button></div><p class="note">Exclusions affect this view only. The fictional source records are unchanged.</p></section></div>
    <div class="callout process-note"><strong>A relationship to investigate, not an automatic process change.</strong><p>Repeated cycles are not independent wafers. This descriptive fit does not establish causation, qualify a process, or approve a setting.</p></div>`;
  document.querySelector('#response-tool').value = processTool;
  document.querySelector('#response-tool').addEventListener('change', event => { processTool = event.target.value; showProcess(); });
  document.querySelector('#exclude').addEventListener('click', () => { if (selectedCycle) excluded.add(selectedCycle); showProcess(); });
  document.querySelector('#restore').addEventListener('click', () => { excluded.clear(); showProcess(); });
  const choose = event => {
    const target = event.target.closest('[data-cycle]');
    if (!target || (event.type === 'keydown' && !['Enter',' '].includes(event.key))) return;
    event.preventDefault(); selectedCycle = target.dataset.cycle; showProcess();
    workspace.querySelector(`[data-cycle="${selectedCycle}"]`)?.focus({preventScroll:true});
  };
  workspace.onclick = choose;
  workspace.onkeydown = choose;
}

function render() {
  const view = ['stats','maps','process'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'stats';
  workspace.onclick = null;
  workspace.onkeydown = null;
  document.querySelectorAll('nav a').forEach(link => {
    if (link.hash === '#' + view) link.setAttribute('aria-current','page');
    else link.removeAttribute('aria-current');
  });
  ({stats:showStats,maps:showMaps,process:showProcess})[view]();
}
window.addEventListener('hashchange', render);
document.querySelector('.skip-link').addEventListener('click', event => {
  event.preventDefault();
  workspace.focus();
});
render();
