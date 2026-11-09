import test from 'node:test';
import assert from 'node:assert/strict';
import {
  wafers, filterWafers, summarize, groupSummary, waferMaps, processCycles, fitLine,
} from '../dist/model.mjs';

test('fixtures have deterministic fictional identities and balanced populations', () => {
  assert.equal(wafers.length, 72);
  assert.equal(new Set(wafers.map((row) => row.id)).size, 72);
  assert.ok(wafers.every((row) => row.id.startsWith('DEMO-') && (row.value === null || Number.isFinite(row.value))));
  assert.equal(wafers.filter((row) => row.value === null).length, 3);
  assert.equal(wafers[0].date, '2026-01-10');
  assert.equal(wafers.at(-1).date, '2026-02-26');
  assert.deepEqual(groupSummary(wafers).map(({ tool, count }) => ({ tool, count })), [
    { tool: 'Tool A', count: 23 }, { tool: 'Tool B', count: 23 }, { tool: 'Tool C', count: 23 },
  ]);
  assert.equal(filterWafers({ process: 'Process A' }).length, 36);
  assert.equal(filterWafers({ process: 'Process B' }).length, 36);
});

test('filters compose and include exact date bounds without changing fixtures', () => {
  const before = JSON.stringify(wafers);
  assert.deepEqual(filterWafers(), wafers);
  const selection = filterWafers({ tool: 'Tool A', process: 'Process B', start: '2026-02-01', end: '2026-02-20' });
  assert.ok(selection.length > 0);
  assert.ok(selection.every((row) => row.tool === 'Tool A' && row.process === 'Process B'
    && row.date >= '2026-02-01' && row.date <= '2026-02-20'));
  const firstDate = filterWafers({ start: '2026-01-10', end: '2026-01-10' });
  assert.ok(firstDate.length > 0);
  assert.ok(firstDate.every((row) => row.date === '2026-01-10'));
  assert.deepEqual(filterWafers({ start: '2026-02-26', end: '2026-01-10' }), []);
  assert.deepEqual(filterWafers({ tool: 'Unknown tool' }), []);
  assert.equal(JSON.stringify(wafers), before);
});

test('descriptive summaries use sample deviation and handle missing or small groups', () => {
  assert.deepEqual(summarize([{ value: 1 }, { value: 2 }, { value: 3 }]), { count: 3, missing: 0, mean: 2, sd: 1 });
  assert.deepEqual(summarize([{ value: 4 }, { value: null }, { value: NaN }]), { count: 1, missing: 2, mean: 4, sd: null });
  assert.deepEqual(summarize([{ value: null }]), { count: 0, missing: 1, mean: null, sd: null });
  assert.deepEqual(summarize([]), { count: 0, missing: 0, mean: null, sd: null });
  assert.deepEqual(groupSummary([]), []);
  const groups = groupSummary(filterWafers({ process: 'Process A' }));
  assert.equal(groups.reduce((sum, row) => sum + row.count, 0), 33);
  assert.equal(groups.reduce((sum, row) => sum + row.missing, 0), 3);
});

test('linked maps share unique chip coordinates and distinguish missing readings', () => {
  assert.equal(waferMaps.length, 149);
  assert.equal(new Set(waferMaps.map((row) => row.id)).size, waferMaps.length);
  assert.equal(new Set(waferMaps.map((row) => `${row.x},${row.y}`)).size, waferMaps.length);
  assert.ok(waferMaps.every((row) => row.x ** 2 + row.y ** 2 <= 49));
  assert.ok(waferMaps.some((row) => row.inspection === null));
  assert.ok(waferMaps.some((row) => row.electrical === null));
  const chip = waferMaps.find((row) => row.x === 3 && row.y === 1);
  assert.equal(chip.inspection, 'Cluster');
  assert.ok(chip.electrical > 1.3);
  const partiallyObserved = waferMaps.find((row) => row.x === 0 && row.y === -5);
  assert.equal(partiallyObserved.electrical, null);
  assert.notEqual(partiallyObserved.inspection, null);
});

test('repeated process cycles retain distinct identities rather than merging wafers', () => {
  assert.equal(processCycles.length, 60);
  assert.equal(new Set(processCycles.map((row) => row.wafer)).size, 48);
  assert.equal(new Set(processCycles.map((row) => row.id)).size, 60);
  assert.equal(new Set(processCycles.map((row) => `${row.wafer}:${row.cycle}`)).size, 60);
  assert.equal(processCycles.filter((row) => row.cycle === 2).length, 12);
  assert.deepEqual(processCycles.filter((row) => row.wafer === 'DEMO-P001').map((row) => row.cycle), [1, 2]);
});

test('descriptive fit matches an exact line and handles degenerate inputs', () => {
  assert.deepEqual(fitLine([{ upstream: 1, response: 3 }, { upstream: 2, response: 5 }, { upstream: 3, response: 7 }]),
    { count: 3, slope: 2, intercept: 1, r2: 1, xMin: 1, xMax: 3 });
  assert.deepEqual(fitLine([]), { count: 0, slope: null, intercept: null, r2: null, xMin: null, xMax: null });
  assert.equal(fitLine([{ upstream: 1, response: 3 }]).slope, null);
  assert.equal(fitLine([{ upstream: 1, response: 3 }, { upstream: 1, response: 4 }]).slope, null);
  assert.equal(fitLine([{ upstream: 1, response: 3 }, { upstream: 2, response: 3 }]).r2, null);
  const subset = processCycles.filter((row) => row.tool === 'Tool A');
  const fit = fitLine(subset);
  assert.equal(fit.count, subset.length);
  assert.ok(fit.slope > 0 && fit.r2 >= 0 && fit.r2 <= 1);
  assert.equal(fit.xMin, Math.min(...subset.map((row) => row.upstream)));
  assert.equal(fit.xMax, Math.max(...subset.map((row) => row.upstream)));
  assert.equal(fitLine([...subset, { upstream: null, response: 1 }]).count, subset.length);
});

test('shared fixtures are frozen and analysis leaves caller-owned arrays unchanged', () => {
  for (const rows of [wafers, waferMaps, processCycles]) {
    assert.ok(Object.isFrozen(rows));
    assert.ok(rows.every(Object.isFrozen));
  }
  assert.throws(() => { wafers[0].value = 100; }, TypeError);
  const selection = [...wafers].reverse();
  const before = JSON.stringify(selection);
  groupSummary(selection);
  summarize(selection);
  assert.equal(JSON.stringify(selection), before);
  const cycles = [...processCycles].reverse();
  const cycleBefore = JSON.stringify(cycles);
  fitLine(cycles);
  assert.equal(JSON.stringify(cycles), cycleBefore);
});
