// Currency conversion helper
export const convertCurrency = (val, currency, fxRate) => {
  return currency === 'USD' ? val / fxRate : val;
};

// Get currency symbol
export const getCurrencySymbol = (currency) => {
  return currency === 'INR' ? '₹' : '$';
};

// Format currency value
export const formatCurrency = (val, currency, fxRate) => {
  const n = convertCurrency(val || 0, currency, fxRate);
  const sym = getCurrencySymbol(currency);
  if (Math.abs(n) >= 1e7) return sym + (n / 1e7).toFixed(2) + 'Cr';
  if (Math.abs(n) >= 1e5) return sym + (n / 1e5).toFixed(1) + 'L';
  return sym + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
};

// Format variance value — explicit sign on both ends ("+₹X" / "−₹X").
export const formatVariance = (val, currency, fxRate) => {
  const n = convertCurrency(val || 0, currency, fxRate);
  const sign = n >= 0 ? '+' : '−';
  return sign + formatCurrency(Math.abs(val), currency, fxRate);
};

// Format a decimal ratio (e.g. -0.1188) as a percent (-11.88%) per spec.
export const formatPercent = (decimal, digits = 2) => {
  const n = Number(decimal) || 0;
  return (n * 100).toFixed(digits) + '%';
};

// Excel date serial (e.g. 45772) → JS Date (UTC midnight on that day).
export const excelSerialToDate = (serial) => {
  const n = Number(serial);
  if (!Number.isFinite(n)) return null;
  // Excel epoch quirk: serial 25569 = 1970-01-01.
  return new Date(Math.round((n - 25569) * 86400000));
};

// "YYYY-MM-DD" string from a date <input> → epoch ms (UTC start-of-day).
export const isoDateToMs = (iso) => {
  if (!iso) return null;
  const d = new Date(iso + 'T00:00:00Z');
  return isNaN(d.getTime()) ? null : d.getTime();
};

// Calculate KPIs from data
export const calculateKPIs = (rows) => {
  if (!rows.length) return null;

  const totalSales = rows.reduce((s, r) => s + (r.sales || 0), 0);
  const totalBOM = rows.reduce((s, r) => s + (r.total_bom || 0), 0);
  const totalRM = rows.reduce((s, r) => s + (r.total_rm || 0), 0);
  const totalOS = rows.reduce((s, r) => s + (r.total_os || 0), 0);
  const budgetBOM = rows.reduce((s, r) => s + (r.budget_cost || 0), 0);
  const budgetRM = rows.reduce((s, r) => s + (r.total_rm_budget || 0), 0);
  const budgetOS = rows.reduce((s, r) => s + (r.total_os_budget || 0), 0);
  const actualQty = rows.reduce((s, r) => s + (r.actual_qty || 0), 0);
  const budgetQty = rows.reduce((s, r) => s + (r.budget_qty || 0), 0);
  const avb2526 = rows.reduce((s, r) => s + (r.avb_2526 || 0), 0);
  const avb2627 = rows.reduce((s, r) => s + (r.avb_2627 || 0), 0);
  const projBomActual = rows.reduce((s, r) => s + (r.proj_bom_actual || 0), 0);
  const projBomBudget = rows.reduce((s, r) => s + (r.proj_bom_budget || 0), 0);

  // Invoice Summary aggregates (raw sales-register totals)
  const totalInvoiceQty = rows.reduce((s, r) => s + (r.invoice_qty || 0), 0);
  const totalInvoiceUSD = rows.reduce((s, r) => s + (r.invoice_usd || 0), 0);
  const uniqueInvoices = new Set(rows.map(r => r.invoice_no).filter(Boolean)).size;

  // Contribution Margin (per-unit; Actual − Budget; positive = better than expected)
  const marginActual = rows.reduce((s, r) => s + (r.margin_actual || 0), 0);
  const marginBudget = rows.reduce((s, r) => s + (r.margin_budget || 0), 0);
  // Variance % per spec: average of per-row (margin_diff / po_price_pu)
  const marginPctRows = rows.filter(r => r.po_price_pu);
  const marginVarPct = marginPctRows.length
    ? marginPctRows.reduce((s, r) => s + (r.margin_diff_pct || 0), 0) / marginPctRows.length
    : 0;

  const n = rows.length;
  const avgLbpPct = rows.reduce((s, r) => s + (r.lbp_pct || 0), 0) / n * 100;
  const avgMapPct = rows.reduce((s, r) => s + (r.map_pct || 0), 0) / n * 100;
  const avgOsPct = rows.reduce((s, r) => s + (r.os_pct || 0), 0) / n * 100;
  const avgBomPct = rows.reduce((s, r) => s + (r.bom_pct || 0), 0) / n * 100;

  // Spec convention: Variance = Budget − Actual (negative = over budget),
  //                  Variance % = Variance / Actual (decimal, ×100 at display).
  const bomVar = budgetBOM - totalBOM;
  const rmVar = budgetRM - totalRM;
  const osVar = budgetOS - totalOS;

  // "Total Parts" per spec = count of unique FG Part Numbers (col L), not invoice rows.
  const totalParts = new Set(rows.map(r => r.fg_part).filter(Boolean)).size;
  const totalInvoiceRows = rows.length;

  return {
    totalParts, totalInvoiceRows,
    totalSales, totalBOM, totalRM, totalOS,
    budgetBOM, budgetRM, budgetOS,
    actualQty, budgetQty,
    avb2526, avb2627,
    avgLbpPct, avgMapPct, avgOsPct, avgBomPct,

    // Spec-aligned fields (preferred — used by migrated cards)
    bomActual: totalBOM, bomBudget: budgetBOM,
    bomVar, bomVarPct: totalBOM ? bomVar / totalBOM : 0,
    rmActual: totalRM, rmBudget: budgetRM,
    rmVar, rmVarPct: totalRM ? rmVar / totalRM : 0,
    osActual: totalOS, osBudget: budgetOS,
    osVar, osVarPct: totalOS ? osVar / totalOS : 0,

    // Projected (next-year) BOM aggregates
    projBomActual, projBomBudget,
    projVar: projBomBudget - projBomActual,
    projVarPct: projBomActual ? (projBomBudget - projBomActual) / projBomActual : 0,

    // Invoice Summary
    totalInvoiceQty, totalInvoiceUSD, uniqueInvoices,

    // Contribution Margin (Actual − Budget convention; positive = above budget = good)
    marginActual, marginBudget,
    marginVar: marginActual - marginBudget,
    marginVarPct,

    // Legacy fields (Actual − Budget convention, kept for unmigrated pages)
    bomVariance: totalBOM - budgetBOM,
    rmVariance: totalRM - budgetRM,
    osVariance: totalOS - budgetOS,
    bomVariancePct: budgetBOM ? ((totalBOM - budgetBOM) / budgetBOM * 100) : 0,
    rmVariancePct: budgetRM ? ((totalRM - budgetRM) / budgetRM * 100) : 0,
    osVariancePct: budgetOS ? ((totalOS - budgetOS) / budgetOS * 100) : 0,
  };
};

// Group rows by FG Part No (col L) and split unique FG Parts into Saved /
// Over Budget / Neutral by sign of Σ bom_variance per part.
// Returns { total, positive, negative, zero, parts: Map<fg_part, { variance, project }> }.
export const computeFgPartSplit = (rows) => {
  const map = new Map();
  for (const r of rows) {
    const key = r.fg_part;
    if (!key) continue;
    const prev = map.get(key) || { variance: 0, project: r.project };
    prev.variance += Number(r.bom_variance) || 0;
    map.set(key, prev);
  }
  let positive = 0, negative = 0, zero = 0;
  for (const { variance } of map.values()) {
    if (variance > 0) positive++;
    else if (variance < 0) negative++;
    else zero++;
  }
  return { total: map.size, positive, negative, zero, parts: map };
};

export const getTopFgParts = (rows, type) => {
  const map = new Map();
  for (const r of rows) {
    const key = r.fg_part;
    if (!key) continue;
    const cur = map.get(key);
    if (cur) {
      cur.variance += Number(r.bom_variance) || 0;
      cur.rows += 1;
    } else {
      map.set(key, {
        fg_part: key,
        project: r.project || '',
        variance: Number(r.bom_variance) || 0,
        rows: 1,
      });
    }
  }
  const arr = [...map.values()];
  return type === 'gain'
    ? arr.filter(x => x.variance > 0).sort((a, b) => b.variance - a.variance).slice(0, 10)
    : arr.filter(x => x.variance < 0).sort((a, b) => a.variance - b.variance).slice(0, 10);
};

// Legacy invoice-row sort (kept for compatibility; new code should use getTopFgParts).
export const getTop10 = (data, type) => {
  const sorted = [...data].sort((a, b) =>
    type === 'gain' ? (a.avb_2526 || 0) - (b.avb_2526 || 0) : (b.avb_2526 || 0) - (a.avb_2526 || 0)
  );
  return sorted.slice(0, 10);
};

// Get unique values from data
export const getUniqueValues = (data, key) => {
  return [...new Set(data.map(r => r[key]).filter(Boolean))];
};

// Parse "MonthYY" labels (e.g. "April25", "Jan26") into a sortable rank.
// Returns NaN for unrecognized strings, which sort to the end.
const MONTH_NAMES = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};
export const monthLabelRank = (label) => {
  if (!label) return Number.POSITIVE_INFINITY;
  const m = String(label).trim().toLowerCase().match(/^([a-z]+)(\d{2,4})$/);
  if (!m) return Number.POSITIVE_INFINITY;
  const monIdx = MONTH_NAMES[m[1]];
  if (monIdx == null) return Number.POSITIVE_INFINITY;
  let year = parseInt(m[2], 10);
  if (year < 100) year += 2000;
  return year * 12 + monIdx;
};

// One row per FG Part with every metric the Master Table needs.
// Returns [{ fg_part, projects, customers, qty, rmActual, osActual, bomActual,
//            rmBudget, osBudget, bomBudget, variance, variancePct, marginActual,
//            marginBudget, marginPct, projBomActual, projBomBudget, rowCount }]
export const buildFgPartsTable = (rows) => {
  const map = new Map();
  for (const r of rows) {
    const key = r.fg_part;
    if (!key) continue;
    let cur = map.get(key);
    if (!cur) {
      cur = {
        fg_part: key,
        projects: new Set(),
        customers: new Set(),
        qty: 0,
        rmActual: 0, osActual: 0,
        rmBudget: 0, osBudget: 0,
        marginActual: 0, marginBudget: 0,
        projBomActual: 0, projBomBudget: 0,
        marginPctSum: 0, marginPctCount: 0,
        rowCount: 0,
      };
      map.set(key, cur);
    }
    if (r.project)  cur.projects.add(r.project);
    if (r.customer) cur.customers.add(r.customer);
    cur.qty           += Number(r.invoice_qty)     || 0;
    cur.rmActual      += Number(r.rm_actual)       || 0;
    cur.osActual      += Number(r.os_actual)       || 0;
    cur.rmBudget      += Number(r.rm_budget)       || 0;
    cur.osBudget      += Number(r.os_budget)       || 0;
    cur.marginActual  += Number(r.margin_actual)   || 0;
    cur.marginBudget  += Number(r.margin_budget)   || 0;
    cur.projBomActual += Number(r.proj_bom_actual) || 0;
    cur.projBomBudget += Number(r.proj_bom_budget) || 0;
    if (r.po_price_pu) {
      cur.marginPctSum += Number(r.margin_diff_pct) || 0;
      cur.marginPctCount += 1;
    }
    cur.rowCount += 1;
  }
  return [...map.values()].map((c) => {
    const bomActual = c.rmActual + c.osActual;
    const bomBudget = c.rmBudget + c.osBudget;
    const variance = bomBudget - bomActual;
    return {
      fg_part: c.fg_part,
      projects: [...c.projects],
      customers: [...c.customers],
      qty: c.qty,
      rmActual: c.rmActual,
      osActual: c.osActual,
      bomActual,
      rmBudget: c.rmBudget,
      osBudget: c.osBudget,
      bomBudget,
      variance,
      variancePct: bomActual ? variance / bomActual : 0,
      marginActual: c.marginActual,
      marginBudget: c.marginBudget,
      marginPct: c.marginPctCount ? c.marginPctSum / c.marginPctCount : 0,
      projBomActual: c.projBomActual,
      projBomBudget: c.projBomBudget,
      rowCount: c.rowCount,
    };
  });
};

// Auto-flagged risk signals shown as the dashboard's Smart Alerts strip.
// Computes everything from the filtered rows + already-built KPI object.
export const computeSmartAlerts = (rows, kpi) => {
  // Critical FG Parts (variance % ≤ −20 per FG Part)
  const fgMap = new Map();
  for (const r of rows) {
    const k = r.fg_part;
    if (!k) continue;
    const cur = fgMap.get(k) || { actual: 0, variance: 0 };
    cur.actual   += Number(r.bom_actual)   || 0;
    cur.variance += Number(r.bom_variance) || 0;
    fgMap.set(k, cur);
  }
  let critical = 0;
  for (const { actual, variance } of fgMap.values()) {
    if (actual && variance / actual <= -0.20) critical += 1;
  }

  // Top contributing project (largest absolute Σ variance)
  const projMap = new Map();
  let totalAbsVariance = 0;
  for (const r of rows) {
    const k = r.project;
    if (!k) continue;
    const v = Number(r.bom_variance) || 0;
    projMap.set(k, (projMap.get(k) || 0) + v);
    totalAbsVariance += Math.abs(v);
  }
  let topProject = null;
  let topProjectVar = 0;
  for (const [name, v] of projMap.entries()) {
    if (Math.abs(v) > Math.abs(topProjectVar)) {
      topProjectVar = v;
      topProject = name;
    }
  }
  // Share of the project's variance in the absolute total (so a small project
  // that swings hard one way still surfaces).
  const topProjectShare = totalAbsVariance ? Math.abs(topProjectVar) / totalAbsVariance : 0;

  // Currency exposure (col T) by Σ Invoice INR per currency
  const curMap = new Map();
  let totalInr = 0;
  for (const r of rows) {
    const k = r.currency || 'OTHER';
    const v = Number(r.invoice_inr) || 0;
    curMap.set(k, (curMap.get(k) || 0) + v);
    totalInr += v;
  }
  const usdShare = totalInr ? (curMap.get('USD') || 0) / totalInr : 0;
  const eurShare = totalInr ? (curMap.get('EURO') || curMap.get('EUR') || 0) / totalInr : 0;

  // Trend direction — current year vs projected variance %
  let trend = 'stable';
  if (kpi) {
    const cur = kpi.bomVarPct  ?? 0;
    const prj = kpi.projVarPct ?? 0;
    if (prj < cur - 0.005) trend = 'worsening';
    else if (prj > cur + 0.005) trend = 'improving';
  }

  return {
    critical,
    totalParts: fgMap.size,
    topProject,
    topProjectVar,
    topProjectShare,
    usdShare,
    eurShare,
    trend,
    bomVarPct:  kpi?.bomVarPct  ?? 0,
    projVarPct: kpi?.projVarPct ?? 0,
  };
};

// Top FG Parts ranked by Σ margin_actual.
//   type='profit'  → highest margin first (most profitable)
//   type='loss'    → lowest margin first (loss-making / least profitable)
export const getTopMarginFgParts = (rows, type, limit = 10) => {
  const map = new Map();
  for (const r of rows) {
    const key = r.fg_part;
    if (!key) continue;
    const cur = map.get(key);
    if (cur) {
      cur.margin += Number(r.margin_actual) || 0;
      cur.marginPctSum += r.po_price_pu ? (Number(r.margin_diff_pct) || 0) : 0;
      cur.marginPctCount += r.po_price_pu ? 1 : 0;
      cur.rows += 1;
    } else {
      map.set(key, {
        fg_part: key,
        project: r.project || '',
        margin: Number(r.margin_actual) || 0,
        marginPctSum: r.po_price_pu ? (Number(r.margin_diff_pct) || 0) : 0,
        marginPctCount: r.po_price_pu ? 1 : 0,
        rows: 1,
      });
    }
  }
  const arr = [...map.values()].map((c) => ({
    ...c,
    marginPct: c.marginPctCount ? c.marginPctSum / c.marginPctCount : 0,
  }));
  return type === 'profit'
    ? arr.sort((a, b) => b.margin - a.margin).slice(0, limit)
    : arr.sort((a, b) => a.margin - b.margin).slice(0, limit);
};

// Distribution of FG Parts by variance % bucket. Each FG Part is computed once
// (variance / actual across all its rows) and slotted into one of 7 bands.
const VAR_BUCKETS = [
  { key: 'crit_neg', label: '≤ −20%',     min: -Infinity, max: -0.20, color: '#b91c1c', tone: 'Critical over' },
  { key: 'high_neg', label: '−20% to −10%', min: -0.20,    max: -0.10, color: '#ef4444', tone: 'High over' },
  { key: 'med_neg',  label: '−10% to −5%',  min: -0.10,    max: -0.05, color: '#f97316', tone: 'Watch over' },
  { key: 'healthy',  label: '−5% to +5%',   min: -0.05,    max:  0.05, color: '#22c55e', tone: 'Healthy' },
  { key: 'med_pos',  label: '+5% to +10%',  min:  0.05,    max:  0.10, color: '#0ea5e9', tone: 'Good' },
  { key: 'high_pos', label: '+10% to +20%', min:  0.10,    max:  0.20, color: '#3b82f6', tone: 'Strong' },
  { key: 'crit_pos', label: '≥ +20%',     min:  0.20,    max:  Infinity, color: '#1d4ed8', tone: 'Excellent' },
];

export const varianceHistogram = (rows) => {
  const map = new Map();
  for (const r of rows) {
    const key = r.fg_part;
    if (!key) continue;
    const cur = map.get(key) || { actual: 0, variance: 0 };
    cur.actual   += Number(r.bom_actual)   || 0;
    cur.variance += Number(r.bom_variance) || 0;
    map.set(key, cur);
  }
  const buckets = VAR_BUCKETS.map((b) => ({ ...b, count: 0 }));
  for (const { actual, variance } of map.values()) {
    if (!actual) continue;
    const pct = variance / actual;
    const idx = buckets.findIndex((b) => pct >= b.min && pct < b.max);
    const slot = idx === -1 ? buckets.length - 1 : idx;
    buckets[slot].count += 1;
  }
  return { buckets, totalParts: map.size };
};

// Top N customers (col G) by total Invoice Value INR. Each entry also carries
// BOM Actual / Budget / variance for the variance% chip.
export const getTopCustomers = (rows, limit = 10) => {
  const map = new Map();
  for (const r of rows) {
    const key = r.customer;
    if (!key) continue;
    const cur = map.get(key) || { customer: key, sales: 0, bomActual: 0, bomBudget: 0, rows: 0 };
    cur.sales     += Number(r.invoice_inr) || 0;
    cur.bomActual += Number(r.bom_actual)  || 0;
    cur.bomBudget += Number(r.bom_budget)  || 0;
    cur.rows += 1;
    map.set(key, cur);
  }
  return [...map.values()]
    .map((c) => ({
      ...c,
      variance: c.bomBudget - c.bomActual,
      variancePct: c.bomActual ? (c.bomBudget - c.bomActual) / c.bomActual : 0,
    }))
    .sort((a, b) => b.sales - a.sales)
    .slice(0, limit);
};

// Group rows by Project (col B) and sum BOM Actual / Budget per project.
// Returns [{ project, actual, budget, variance, variancePct, rows }] sorted by
// absolute variance descending so the biggest issues sit at the top of the chart.
export const groupByProject = (rows) => {
  const map = new Map();
  for (const r of rows) {
    const key = r.project || '—';
    const cur = map.get(key) || { project: key, actual: 0, budget: 0, rows: 0 };
    cur.actual += Number(r.bom_actual) || 0;
    cur.budget += Number(r.bom_budget) || 0;
    cur.rows += 1;
    map.set(key, cur);
  }
  const arr = [...map.values()].map((x) => ({
    ...x,
    variance: x.budget - x.actual,
    variancePct: x.actual ? (x.budget - x.actual) / x.actual : 0,
  }));
  arr.sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance));
  return arr;
};

// Group rows by month label (col C) and sum BOM Actual / Budget per month.
// Returns array sorted chronologically: [{ month, actual, budget, variance, rows }].
export const groupByMonth = (rows) => {
  const map = new Map();
  for (const r of rows) {
    const key = r.month || '—';
    const cur = map.get(key) || { month: key, actual: 0, budget: 0, rows: 0 };
    cur.actual += Number(r.bom_actual) || 0;
    cur.budget += Number(r.bom_budget) || 0;
    cur.rows += 1;
    map.set(key, cur);
  }
  const arr = [...map.values()].map((x) => ({ ...x, variance: x.budget - x.actual }));
  arr.sort((a, b) => monthLabelRank(a.month) - monthLabelRank(b.month));
  return arr;
};

// Get project-wise data for charts
export const getProjectData = (data, currency, fxRate) => {
  const byProject = {};
  data.forEach(r => {
    if (!byProject[r.project]) byProject[r.project] = { bom: 0, rm: 0, os: 0 };
    byProject[r.project].bom += r.total_bom || 0;
    byProject[r.project].rm += r.total_rm || 0;
    byProject[r.project].os += r.total_os || 0;
  });
  return Object.entries(byProject).map(([name, vals]) => ({
    name,
    bom: convertCurrency(vals.bom, currency, fxRate),
    rm: convertCurrency(vals.rm, currency, fxRate),
    os: convertCurrency(vals.os, currency, fxRate)
  }));
};

// Get cost breakdown for pie chart
export const getCostBreakdown = (kpi, currency, fxRate) => {
  if (!kpi) return [];
  return [
    { name: 'Raw Material', value: convertCurrency(kpi.totalRM, currency, fxRate), color: '#3B82F6' },
    { name: 'Outsourcing', value: convertCurrency(kpi.totalOS, currency, fxRate), color: '#F59E0B' },
  ];
};

// Format for chart axes (compact notation)
export const formatShort = (value, currency = 'INR') => {
  if (!value && value !== 0) return currency === 'USD' ? '$0' : '₹0';

  const absValue = Math.abs(value);
  const symbol = currency === 'USD' ? '$' : '₹';
  const sign = value < 0 ? '-' : '';

  if (absValue >= 10000000) {
    return `${sign}${symbol}${(absValue / 10000000).toFixed(1)}Cr`;
  } else if (absValue >= 100000) {
    return `${sign}${symbol}${(absValue / 100000).toFixed(1)}L`;
  } else if (absValue >= 1000) {
    return `${sign}${symbol}${(absValue / 1000).toFixed(1)}K`;
  }
  return `${sign}${symbol}${absValue.toFixed(0)}`;
};

// Map impact level to colors
export const getColorForImpact = (impactLevel) => {
  const colors = {
    'Critical': '#EF4444',
    'critical': '#EF4444',
    'High': '#F59E0B',
    'high': '#F59E0B',
    'Medium': '#3B82F6',
    'medium': '#3B82F6',
    'Positive': '#22C55E',
    'positive': '#22C55E',
    'Low': '#64748B',
    'low': '#64748B'
  };
  return colors[impactLevel] || '#64748B';
};

// Calculate z-score for outlier detection
export const calculateZScore = (value, dataset) => {
  if (!dataset || dataset.length === 0) return 0;
  const mean = dataset.reduce((s, v) => s + v, 0) / dataset.length;
  const variance = dataset.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / dataset.length;
  const stdDev = Math.sqrt(variance);

  if (stdDev === 0) return 0;
  return (value - mean) / stdDev;
};

// Get color by rank (for charts)
export const getColorByRank = (index) => {
  const colors = [
    '#EF4444', '#F59E0B', '#FCD34D', '#3B82F6', '#06B6D4',
    '#8B5CF6', '#EC4899', '#10B981', '#F97316', '#6366F1'
  ];
  return colors[index % colors.length];
};
