// ---------------------------------------------------------------------------
// AutoGlobe Motors — dashboard math.
// Every function takes the already-parsed workbook (or one of its sheets) and
// returns plain arrays / objects ready for React + Recharts. No side effects,
// no localStorage.
// ---------------------------------------------------------------------------

import { AGE_BUCKETS, CHART_COLORS } from './constants';

const sum = (arr, key) => arr.reduce((s, r) => s + (Number(r[key]) || 0), 0);
const avg = (arr, key) => (arr.length ? sum(arr, key) / arr.length : 0);
const uniq = (arr, key) => [...new Set(arr.map((r) => r[key]).filter(Boolean))];

// ---------- Formatters -----------------------------------------------------

// Compact USD, no trailing zeros: $1.2M, $84.5K, $920.
export const fmtUSD = (val) => {
  const n = Number(val) || 0;
  const sign = n < 0 ? '-' : '';
  const a = Math.abs(n);
  if (a >= 1e9) return `${sign}$${(a / 1e9).toFixed(2)}B`;
  if (a >= 1e6) return `${sign}$${(a / 1e6).toFixed(2)}M`;
  if (a >= 1e3) return `${sign}$${(a / 1e3).toFixed(1)}K`;
  return `${sign}$${a.toFixed(0)}`;
};

export const fmtUSDFull = (val) => {
  const n = Number(val) || 0;
  return (n < 0 ? '-$' : '$') + Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
};

export const fmtNum = (val) => (Number(val) || 0).toLocaleString('en-US');

export const fmtPct = (decimalOrPct, digits = 1) => {
  const n = Number(decimalOrPct) || 0;
  // Values in the file are already 0–100 (MarginPct). Values we compute here
  // as ratios (< ~1) get promoted. Simple heuristic: |n| ≤ 1 → treat as ratio.
  const v = Math.abs(n) <= 1 ? n * 100 : n;
  return `${v.toFixed(digits)}%`;
};

export const fmtSigned = (val, formatter = fmtUSD) => {
  const n = Number(val) || 0;
  if (n === 0) return formatter(0);
  return (n > 0 ? '+' : '−') + formatter(Math.abs(n));
};

// ---------- Filters --------------------------------------------------------

// Global filter shape:
//   { dateFrom, dateTo, location, make, bodyType, fuelType, salesChannel }
// Empty strings mean "no filter". Applied to sales rows; adapters below apply
// the ones that make sense to inventory / customers / expenses / targets.
export const filterSales = (sales, f = {}) => {
  return sales.filter((r) => {
    if (f.location     && r.location     !== f.location)     return false;
    if (f.make         && r.make         !== f.make)         return false;
    if (f.bodyType     && r.bodyType     !== f.bodyType)     return false;
    if (f.fuelType     && r.fuelType     !== f.fuelType)     return false;
    if (f.salesChannel && r.salesChannel !== f.salesChannel) return false;
    if (f.dateFrom && r.saleDate && r.saleDate < f.dateFrom) return false;
    if (f.dateTo   && r.saleDate && r.saleDate > f.dateTo)   return false;
    return true;
  });
};

export const filterInventory = (inventory, f = {}) => {
  return inventory.filter((r) => {
    if (f.location && r.location !== f.location) return false;
    if (f.make     && r.make     !== f.make)     return false;
    if (f.bodyType && r.bodyType !== f.bodyType) return false;
    if (f.fuelType && r.fuelType !== f.fuelType) return false;
    return true;
  });
};

const monthInRange = (monthKey, f) => {
  if (!monthKey) return true;
  if (f.dateFrom && monthKey < f.dateFrom.slice(0, 7)) return false;
  if (f.dateTo   && monthKey > f.dateTo.slice(0, 7))   return false;
  return true;
};

export const filterMonthly = (rows, f = {}) => rows.filter((r) => {
  if (f.location && r.location !== f.location) return false;
  return monthInRange(r.month, f);
});

// ---------- Headline KPIs --------------------------------------------------

export const calculateKPIs = (workbook, filters = {}) => {
  if (!workbook || !workbook.sales) return null;

  const sales     = filterSales(workbook.sales, filters);
  const inventory = filterInventory(workbook.inventory || [], filters);
  const targets   = filterMonthly(workbook.targets  || [], filters);
  const expenses  = filterMonthly(workbook.expenses || [], filters);

  const totalRevenue = sum(sales, 'salePrice');
  const totalCost    = sum(sales, 'costPrice');
  const totalProfit  = sum(sales, 'profit');
  const unitsSold    = sales.length;
  const avgMarginPct = sales.length ? (totalProfit / totalRevenue) * 100 : 0;
  const avgDealSize  = sales.length ? totalRevenue / sales.length : 0;

  const revenueTarget = sum(targets, 'revenueTarget');
  const unitTarget    = sum(targets, 'unitTarget');
  const revenueVsTargetPct = revenueTarget ? (totalRevenue / revenueTarget) * 100 : 0;
  const unitsVsTargetPct   = unitTarget    ? (unitsSold    / unitTarget)    * 100 : 0;

  const totalExpenses = sum(expenses, 'totalExpenses');
  const netProfit     = totalProfit - totalExpenses;

  const avgCSAT = sales.length
    ? sales.reduce((s, r) => s + (r.customerSatisfaction || 0), 0) / sales.length
    : 0;

  const avgDaysInInventory = sales.length ? avg(sales, 'daysInInventory') : 0;
  const unsoldUnits        = inventory.length;
  const unsoldValue        = sum(inventory, 'askingPrice');
  const avgDaysListed      = inventory.length ? avg(inventory, 'daysListed') : 0;

  return {
    totalRevenue, totalCost, totalProfit, netProfit,
    unitsSold, avgMarginPct, avgDealSize,
    revenueTarget, unitTarget, revenueVsTargetPct, unitsVsTargetPct,
    totalExpenses,
    avgCSAT, avgDaysInInventory,
    unsoldUnits, unsoldValue, avgDaysListed,
    salesRowCount: sales.length,
    inventoryRowCount: inventory.length,
  };
};

// ---------- Aggregations ---------------------------------------------------

// Revenue trend by month: [{ month, revenue, profit, units }]. Sorted asc.
export const revenueByMonth = (sales) => {
  const map = new Map();
  for (const r of sales) {
    const key = r.monthKey;
    if (!key) continue;
    const cur = map.get(key) || { month: key, revenue: 0, profit: 0, units: 0 };
    cur.revenue += r.salePrice;
    cur.profit  += r.profit;
    cur.units   += 1;
    map.set(key, cur);
  }
  return [...map.values()].sort((a, b) => a.month.localeCompare(b.month));
};

// Revenue-by-branch, sorted by revenue desc. Each row: revenue, profit, units, avgDeal.
export const revenueByLocation = (sales) => {
  const map = new Map();
  for (const r of sales) {
    const key = r.location || '—';
    const cur = map.get(key) || { location: key, revenue: 0, profit: 0, units: 0 };
    cur.revenue += r.salePrice;
    cur.profit  += r.profit;
    cur.units   += 1;
    map.set(key, cur);
  }
  return [...map.values()]
    .map((c) => ({ ...c, avgDeal: c.units ? c.revenue / c.units : 0, marginPct: c.revenue ? (c.profit / c.revenue) * 100 : 0 }))
    .sort((a, b) => b.revenue - a.revenue);
};

// Top makes by revenue.
export const topMakes = (sales, limit = 10) => {
  const map = new Map();
  for (const r of sales) {
    const key = r.make || '—';
    const cur = map.get(key) || { make: key, revenue: 0, profit: 0, units: 0 };
    cur.revenue += r.salePrice;
    cur.profit  += r.profit;
    cur.units   += 1;
    map.set(key, cur);
  }
  return [...map.values()]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit)
    .map((c) => ({ ...c, marginPct: c.revenue ? (c.profit / c.revenue) * 100 : 0, avgPrice: c.units ? c.revenue / c.units : 0 }));
};

// Top models by revenue (with make label).
export const topModels = (sales, limit = 10) => {
  const map = new Map();
  for (const r of sales) {
    const key = `${r.make}|${r.model}`;
    const cur = map.get(key) || { key, make: r.make, model: r.model, revenue: 0, profit: 0, units: 0 };
    cur.revenue += r.salePrice;
    cur.profit  += r.profit;
    cur.units   += 1;
    map.set(key, cur);
  }
  return [...map.values()]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit)
    .map((c) => ({ ...c, label: `${c.make} ${c.model}`, marginPct: c.revenue ? (c.profit / c.revenue) * 100 : 0 }));
};

// Sales channel mix: [{ channel, units, revenue, share }].
export const channelMix = (sales) => {
  const map = new Map();
  for (const r of sales) {
    const key = r.salesChannel || '—';
    const cur = map.get(key) || { channel: key, units: 0, revenue: 0 };
    cur.units   += 1;
    cur.revenue += r.salePrice;
    map.set(key, cur);
  }
  const total = sales.length || 1;
  return [...map.values()]
    .map((c) => ({ ...c, share: c.units / total }))
    .sort((a, b) => b.units - a.units);
};

// Body / fuel / condition breakdowns — all the same shape.
const dimensionBreakdown = (sales, field, labelKey) => {
  const map = new Map();
  for (const r of sales) {
    const key = r[field] || '—';
    const cur = map.get(key) || { [labelKey]: key, units: 0, revenue: 0, profit: 0 };
    cur.units   += 1;
    cur.revenue += r.salePrice;
    cur.profit  += r.profit;
    map.set(key, cur);
  }
  return [...map.values()]
    .map((c) => ({ ...c, marginPct: c.revenue ? (c.profit / c.revenue) * 100 : 0 }))
    .sort((a, b) => b.revenue - a.revenue);
};

export const salesByBody      = (sales) => dimensionBreakdown(sales, 'bodyType', 'bodyType');
export const salesByFuel      = (sales) => dimensionBreakdown(sales, 'fuelType', 'fuelType');
export const salesByCondition = (sales) => dimensionBreakdown(sales, 'condition', 'condition');

// Rep leaderboard: units, revenue, avgDeal, avgCSAT, marginPct.
export const repLeaderboard = (sales) => {
  const map = new Map();
  for (const r of sales) {
    const key = r.salesRep || '—';
    const cur = map.get(key) || {
      salesRep: key, location: r.location, units: 0,
      revenue: 0, profit: 0, csatSum: 0, csatCount: 0,
    };
    cur.units   += 1;
    cur.revenue += r.salePrice;
    cur.profit  += r.profit;
    if (r.customerSatisfaction) {
      cur.csatSum   += r.customerSatisfaction;
      cur.csatCount += 1;
    }
    map.set(key, cur);
  }
  return [...map.values()]
    .map((c) => ({
      ...c,
      avgDeal: c.units ? c.revenue / c.units : 0,
      avgCSAT: c.csatCount ? c.csatSum / c.csatCount : 0,
      marginPct: c.revenue ? (c.profit / c.revenue) * 100 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);
};

// Inventory aging histogram: [{ bucket, label, count, value, color }]
export const inventoryAging = (inventory) => {
  const buckets = AGE_BUCKETS.map((b) => ({ ...b, count: 0, value: 0 }));
  for (const r of inventory) {
    const b = buckets.find((x) => x.key === r.ageBucket) || buckets[buckets.length - 1];
    b.count += 1;
    b.value += r.askingPrice;
  }
  return buckets;
};

// Inventory by make: units and asking-value on the lot.
export const inventoryByMake = (inventory, limit = 10) => {
  const map = new Map();
  for (const r of inventory) {
    const key = r.make || '—';
    const cur = map.get(key) || { make: key, units: 0, value: 0, avgDaysListed: 0, _daysSum: 0 };
    cur.units    += 1;
    cur.value    += r.askingPrice;
    cur._daysSum += r.daysListed;
    map.set(key, cur);
  }
  return [...map.values()]
    .map((c) => ({ ...c, avgDaysListed: c.units ? c._daysSum / c.units : 0 }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
};

export const inventoryByLocation = (inventory) => {
  const map = new Map();
  for (const r of inventory) {
    const key = r.location || '—';
    const cur = map.get(key) || { location: key, units: 0, value: 0 };
    cur.units += 1;
    cur.value += r.askingPrice;
    map.set(key, cur);
  }
  return [...map.values()].sort((a, b) => b.value - a.value);
};

// Branch performance: joins sales + targets + expenses by location.
// [{ location, revenue, target, achievedPct, profit, expenses, netProfit, units, unitTarget }]
export const branchPerformance = (workbook, filters = {}) => {
  const sales = filterSales(workbook.sales || [], filters);
  const targets = filterMonthly(workbook.targets || [], filters);
  const expenses = filterMonthly(workbook.expenses || [], filters);

  const map = new Map();
  const ensure = (loc) => {
    if (!map.has(loc)) {
      map.set(loc, {
        location: loc, revenue: 0, profit: 0, units: 0,
        target: 0, unitTarget: 0, expenses: 0,
      });
    }
    return map.get(loc);
  };

  for (const r of sales) {
    const c = ensure(r.location || '—');
    c.revenue += r.salePrice;
    c.profit  += r.profit;
    c.units   += 1;
  }
  for (const t of targets) {
    const c = ensure(t.location || '—');
    c.target     += t.revenueTarget;
    c.unitTarget += t.unitTarget;
  }
  for (const e of expenses) {
    const c = ensure(e.location || '—');
    c.expenses += e.totalExpenses;
  }

  return [...map.values()]
    .map((c) => ({
      ...c,
      netProfit: c.profit - c.expenses,
      achievedPct: c.target ? (c.revenue / c.target) * 100 : 0,
      unitsAchievedPct: c.unitTarget ? (c.units / c.unitTarget) * 100 : 0,
      marginPct: c.revenue ? (c.profit / c.revenue) * 100 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);
};

// Expenses breakdown per branch (Rent/Salaries/Marketing/…)
export const expensesBreakdown = (expenses) => {
  const map = new Map();
  for (const e of expenses) {
    const key = e.location || '—';
    const cur = map.get(key) || {
      location: key, rent: 0, salaries: 0, marketing: 0,
      utilities: 0, maintenance: 0, other: 0, total: 0,
    };
    cur.rent        += e.rent;
    cur.salaries    += e.salaries;
    cur.marketing   += e.marketing;
    cur.utilities   += e.utilities;
    cur.maintenance += e.maintenance;
    cur.other       += e.other;
    cur.total       += e.totalExpenses;
    map.set(key, cur);
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
};

// Customer acquisition channel mix.
export const customerChannelMix = (customers) => {
  const map = new Map();
  for (const c of customers) {
    const key = c.acquisitionChannel || '—';
    const cur = map.get(key) || { channel: key, count: 0, ltv: 0 };
    cur.count += 1;
    cur.ltv   += c.lifetimeValue;
    map.set(key, cur);
  }
  const total = customers.length || 1;
  return [...map.values()]
    .map((c) => ({ ...c, share: c.count / total, avgLtv: c.count ? c.ltv / c.count : 0 }))
    .sort((a, b) => b.count - a.count);
};

// LTV histogram (quintile-ish buckets).
export const ltvBuckets = (customers) => {
  const buckets = [
    { key: 'low',      label: '< $10K',     min: 0,      max: 10000,   color: '#94a3b8', count: 0, value: 0 },
    { key: 'mid_low',  label: '$10–20K',    min: 10000,  max: 20000,   color: '#3b82f6', count: 0, value: 0 },
    { key: 'mid',      label: '$20–40K',    min: 20000,  max: 40000,   color: '#8b5cf6', count: 0, value: 0 },
    { key: 'high',     label: '$40–80K',    min: 40000,  max: 80000,   color: '#f59e0b', count: 0, value: 0 },
    { key: 'top',      label: '≥ $80K',     min: 80000,  max: Infinity, color: '#ef4444', count: 0, value: 0 },
  ];
  for (const c of customers) {
    const b = buckets.find((x) => c.lifetimeValue >= x.min && c.lifetimeValue < x.max);
    if (b) {
      b.count += 1;
      b.value += c.lifetimeValue;
    }
  }
  return buckets;
};

// Demographics.
export const genderMix = (customers) => {
  const map = new Map();
  for (const c of customers) {
    const key = c.gender || '—';
    map.set(key, (map.get(key) || 0) + 1);
  }
  return [...map.entries()].map(([gender, count]) => ({ gender, count }));
};

export const ageBuckets = (customers) => {
  const buckets = [
    { label: '<25',   min: 0,  max: 25, count: 0 },
    { label: '25–34', min: 25, max: 35, count: 0 },
    { label: '35–44', min: 35, max: 45, count: 0 },
    { label: '45–54', min: 45, max: 55, count: 0 },
    { label: '55–64', min: 55, max: 65, count: 0 },
    { label: '65+',   min: 65, max: Infinity, count: 0 },
  ];
  for (const c of customers) {
    const b = buckets.find((x) => c.age >= x.min && c.age < x.max);
    if (b) b.count += 1;
  }
  return buckets;
};

// ---------- Utility --------------------------------------------------------

export const getUniqueValues = (rows, key) => uniq(rows, key);

export const getColorByRank = (index) => CHART_COLORS[index % CHART_COLORS.length];

// Human-friendly month label: "2025-01" → "Jan 2025".
export const formatMonthKey = (mk) => {
  if (!mk || mk.length < 7) return mk || '';
  const [y, m] = mk.split('-');
  const names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${names[Number(m) - 1] || m} ${y}`;
};

// z-score for outlier detection (used by insights).
export const calculateZScore = (value, dataset) => {
  if (!dataset || !dataset.length) return 0;
  const mean = dataset.reduce((s, v) => s + v, 0) / dataset.length;
  const variance = dataset.reduce((s, v) => s + (v - mean) ** 2, 0) / dataset.length;
  const std = Math.sqrt(variance);
  return std === 0 ? 0 : (value - mean) / std;
};

// Impact colour (used by insight cards + drill-down badges).
export const getColorForImpact = (impact) => {
  const map = {
    Critical: '#ef4444', critical: '#ef4444',
    High:     '#f59e0b', high:     '#f59e0b',
    Medium:   '#3b82f6', medium:   '#3b82f6',
    Positive: '#22c55e', positive: '#22c55e',
    Low:      '#64748b', low:      '#64748b',
  };
  return map[impact] || '#64748b';
};
