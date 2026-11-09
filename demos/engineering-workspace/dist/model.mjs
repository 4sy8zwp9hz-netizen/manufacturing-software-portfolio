/**
 * Independently invented, deterministic fixtures for the public workspace demo.
 * Values, identities, relationships, and geometry do not represent production.
 * All measurements use arbitrary relative units; there are no operating limits.
 */

const TOOLS = Object.freeze(['Tool A', 'Tool B', 'Tool C']);
const round = (value, digits = 3) => Number(value.toFixed(digits));
const freezeRows = (rows) => Object.freeze(rows.map((row) => Object.freeze(row)));

export const wafers = freezeRows(Array.from({ length: 72 }, (_, index) => {
  const toolIndex = index % 3;
  const processIndex = Math.floor(index / 3) % 2;
  const dayOffset = Math.floor(index * 47 / 71);
  const date = new Date(Date.UTC(2026, 0, 10 + dayOffset)).toISOString().slice(0, 10);
  const variation = Math.sin(index * 1.71) * 0.11 + Math.cos(index * 0.83) * 0.055;
  return {
    id: `DEMO-W${String(index + 1).padStart(3, '0')}`,
    tool: TOOLS[toolIndex],
    process: `Process ${processIndex === 0 ? 'A' : 'B'}`,
    date,
    value: [7, 38, 54].includes(index) ? null
      : round(1 + [0, 0.17, 0.045][toolIndex] + processIndex * 0.035 + variation),
  };
}));

/** Inclusive date filters; an empty field leaves that bound unrestricted. */
export function filterWafers({ tool = 'all', process = 'all', start = '', end = '' } = {}) {
  return wafers.filter((row) =>
    (tool === 'all' || row.tool === tool) &&
    (process === 'all' || row.process === process) &&
    (!start || row.date >= start) &&
    (!end || row.date <= end));
}

/** Count and sample standard deviation refer only to finite numeric values. */
export function summarize(rows) {
  const values = rows.map((row) => row.value).filter(Number.isFinite);
  const count = values.length;
  const missing = rows.length - count;
  if (count === 0) return { count: 0, missing, mean: null, sd: null };
  const mean = values.reduce((sum, value) => sum + value, 0) / count;
  const sd = count > 1
    ? Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (count - 1))
    : null;
  return { count, missing, mean, sd };
}

export function groupSummary(rows) {
  return [...new Set(rows.map((row) => row.tool))].sort().map((tool) => ({
    tool,
    ...summarize(rows.filter((row) => row.tool === tool)),
  }));
}

const mapRows = [];
for (let y = -7; y <= 7; y += 1) {
  for (let x = -7; x <= 7; x += 1) {
    if (x * x + y * y > 49) continue;
    const cluster = x >= 2 && x <= 4 && y >= -2 && y <= 2;
    const edge = x * x + y * y >= 40;
    const missingInspection = x === -3 && y === 2;
    const missingElectrical = (x === -3 && y === 2) || (x === 0 && y === -5);
    mapRows.push({
      id: `DEMO-C${String(mapRows.length + 1).padStart(3, '0')}`,
      x,
      y,
      inspection: missingInspection ? null : cluster ? 'Cluster' : edge ? 'Edge'
        : x === -2 && y === -1 ? 'Surface mark' : 'Clear',
      electrical: missingElectrical ? null : round(
        1.03 + 0.022 * x + 0.011 * y + (cluster ? 0.29 : 0) + Math.sin(x * 2 + y) * 0.035,
      ),
    });
  }
}

// Both maps read the same physical-coordinate fixture. Null is missing, not pass.
export const waferMaps = freezeRows(mapRows);

export const processCycles = freezeRows(Array.from({ length: 60 }, (_, index) => {
  const waferIndex = index < 48 ? index : index - 48;
  const cycle = index < 48 ? 1 : 2;
  const toolIndex = waferIndex % 3;
  const upstream = round(0.65 + ((index * 17) % 59) / 59 * 1.15);
  const scatter = Math.sin(index * 2.13) * 0.11 + Math.cos(index * 0.71) * 0.055;
  return {
    id: `DEMO-P${String(waferIndex + 1).padStart(3, '0')}-C${cycle}`,
    wafer: `DEMO-P${String(waferIndex + 1).padStart(3, '0')}`,
    cycle,
    tool: TOOLS[toolIndex],
    upstream,
    response: round(0.28 + upstream * 0.67 + [0, 0.055, -0.035][toolIndex] + scatter),
  };
}));

/** A descriptive least-squares fit, not a causal model or a setting recommendation. */
export function fitLine(rows) {
  const points = rows.filter((row) => Number.isFinite(row.upstream) && Number.isFinite(row.response));
  const count = points.length;
  const xMin = count ? Math.min(...points.map((row) => row.upstream)) : null;
  const xMax = count ? Math.max(...points.map((row) => row.upstream)) : null;
  const empty = { count, slope: null, intercept: null, r2: null, xMin, xMax };
  if (count < 2) return empty;
  const meanX = points.reduce((sum, row) => sum + row.upstream, 0) / count;
  const meanY = points.reduce((sum, row) => sum + row.response, 0) / count;
  const xx = points.reduce((sum, row) => sum + (row.upstream - meanX) ** 2, 0);
  if (xx === 0) return empty;
  const xy = points.reduce((sum, row) => sum + (row.upstream - meanX) * (row.response - meanY), 0);
  const slope = xy / xx;
  const intercept = meanY - slope * meanX;
  const total = points.reduce((sum, row) => sum + (row.response - meanY) ** 2, 0);
  const residual = points.reduce((sum, row) => sum + (row.response - (intercept + slope * row.upstream)) ** 2, 0);
  return { count, slope, intercept, r2: total === 0 ? null : Math.max(0, Math.min(1, 1 - residual / total)), xMin, xMax };
}
