/**
 * angleComputers.js — Generic Statistical Analyzer
 *
 * Inspects every numeric and categorical column in the data and emits "angles"
 * (findings) where statistically interesting patterns are detected. Nothing
 * about the cost-management domain is hardcoded — column display names come
 * from the COLUMNS map and all titles, queries, and metric labels are
 * composed at runtime.
 */

import { COLUMNS } from '../utils/constants';

// ---------- Display helpers ----------

const PALETTE = [
  '#EF4444', '#F59E0B', '#FCD34D', '#3B82F6', '#06B6D4',
  '#8B5CF6', '#EC4899', '#10B981', '#F97316', '#6366F1'
];
const colorAt = (i) => PALETTE[i % PALETTE.length];

const humanize = (key) =>
  String(key)
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

const displayName = (col) => COLUMNS[col] || humanize(col);

const isCurrencyLike = (samples) => {
  if (samples.length === 0) return false;
  const max = Math.max(...samples.map((v) => Math.abs(v)));
  return max >= 1000;
};

const isPercentLike = (col) => /(_pct|percent)$/i.test(col);

const formatNumber = (n, opts = {}) => {
  if (!isFinite(n)) return '0';
  if (opts.percent) return `${n.toFixed(1)}%`;
  if (opts.currency) {
    const abs = Math.abs(n);
    const sign = n < 0 ? '-' : '';
    if (abs >= 1e7) return `${sign}₹${(abs / 1e7).toFixed(2)}Cr`;
    if (abs >= 1e5) return `${sign}₹${(abs / 1e5).toFixed(1)}L`;
    if (abs >= 1e3) return `${sign}₹${(abs / 1e3).toFixed(1)}K`;
    return `${sign}₹${abs.toFixed(0)}`;
  }
  return n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
};

// ---------- Statistics ----------

const sum = (xs) => xs.reduce((s, v) => s + v, 0);
const mean = (xs) => (xs.length ? sum(xs) / xs.length : 0);
const stddev = (xs) => {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(sum(xs.map((v) => (v - m) ** 2)) / xs.length);
};

// ---------- Column profiling ----------

const SKIP_KEYS = new Set(['_id', 'sl']);
const ID_LIKE = new Set(['part_no', 'fg_part']);

const profileColumns = (rows) => {
  const sample = rows[0] || {};
  const numeric = [];
  const categorical = [];

  Object.keys(sample).forEach((col) => {
    if (SKIP_KEYS.has(col)) return;
    const values = rows.map((r) => r[col]).filter((v) => v !== null && v !== undefined && v !== '');
    if (values.length === 0) return;

    const numericValues = values.filter((v) => typeof v === 'number' && isFinite(v));
    if (numericValues.length / values.length > 0.7 && !ID_LIKE.has(col)) {
      numeric.push({ col, values: rows.map((r) => Number(r[col]) || 0), sampleNumeric: numericValues });
    } else if (typeof values[0] === 'string') {
      categorical.push({ col, values: rows.map((r) => r[col]) });
    }
  });

  return { numeric, categorical };
};

// ---------- Finding generators ----------

/**
 * Top-N concentration across a numeric column.
 */
const findConcentration = (rows, profile) => {
  const { col, values } = profile;
  const total = sum(values);
  if (total === 0) return null;

  const indexed = values.map((v, i) => ({ v, row: rows[i] }));
  indexed.sort((a, b) => Math.abs(b.v) - Math.abs(a.v));

  const N = Math.min(10, Math.ceil(rows.length * 0.1));
  if (N < 3) return null;

  const top = indexed.slice(0, N);
  const topSum = sum(top.map((t) => t.v));
  const pct = (topSum / total) * 100;
  if (Math.abs(pct) < 30) return null;

  const isCurrency = isCurrencyLike(profile.sampleNumeric);
  const isPct = isPercentLike(col);
  const fmt = (v) => formatNumber(v, { currency: isCurrency, percent: isPct });
  const label = displayName(col);

  const impact = Math.abs(pct) >= 70 ? 'critical' : Math.abs(pct) >= 50 ? 'high' : 'medium';

  return {
    angle_id: `concentration__${col}`,
    angle_type: 'concentration',
    business_relevance: impact,
    score: Math.abs(pct) + (impact === 'critical' ? 25 : impact === 'high' ? 12 : 0),

    facts: {
      column: col,
      column_label: label,
      top_n: N,
      top_sum: topSum,
      total_sum: total,
      concentration_pct: Number(pct.toFixed(2)),
      total_rows: rows.length,
      part_numbers: top.map((t) => t.row.part_no).filter(Boolean)
    },

    suggested_query: `Which entries dominate ${label}?`,
    context: `Top ${N} of ${rows.length} entries account for ${pct.toFixed(1)}% of ${label}.`,

    chart_data: {
      type: 'bar',
      title: `Top ${N} by ${label}`,
      description: `${label} concentration across the ${rows.length}-row dataset`,
      data: top.map((t, i) => ({
        name: t.row.part_no || `#${i + 1}`,
        value: t.v,
        project: t.row.project,
        rank: i + 1,
        color: colorAt(i)
      })),
      x_axis_key: 'name',
      y_axis_key: 'value'
    },

    metrics: [
      { label: `${label} — Top ${N}`, value: fmt(topSum), sublabel: `of ${fmt(total)} total`, impact },
      { label: 'Concentration', value: `${pct.toFixed(1)}%`, sublabel: 'share of total', impact },
      { label: 'Coverage', value: `${N}/${rows.length}`, sublabel: 'rows', impact: 'medium' }
    ]
  };
};

/**
 * Outlier detection by z-score across a numeric column.
 */
const findOutliers = (rows, profile) => {
  const { col, values, sampleNumeric } = profile;
  if (sampleNumeric.length < 10) return null;

  const m = mean(sampleNumeric);
  const sd = stddev(sampleNumeric);
  if (sd === 0) return null;

  const outliers = values
    .map((v, i) => ({ v, z: (v - m) / sd, row: rows[i] }))
    .filter((o) => Math.abs(o.z) > 2)
    .sort((a, b) => Math.abs(b.z) - Math.abs(a.z));

  if (outliers.length === 0) return null;

  const isCurrency = isCurrencyLike(sampleNumeric);
  const isPct = isPercentLike(col);
  const fmt = (v) => formatNumber(v, { currency: isCurrency, percent: isPct });
  const label = displayName(col);
  const impact = outliers.length >= 5 ? 'high' : 'medium';
  const top = outliers.slice(0, 10);

  return {
    angle_id: `outliers__${col}`,
    angle_type: 'outliers',
    business_relevance: impact,
    score: 40 + Math.min(outliers.length * 2, 30),

    facts: {
      column: col,
      column_label: label,
      outlier_count: outliers.length,
      mean: m,
      stddev: sd,
      max_z: Number(Math.max(...outliers.map((o) => Math.abs(o.z))).toFixed(2)),
      part_numbers: top.map((o) => o.row.part_no).filter(Boolean)
    },

    suggested_query: `Which entries are statistical outliers on ${label}?`,
    context: `${outliers.length} entries lie beyond 2σ on ${label} (mean ${fmt(m)}, σ ${fmt(sd)}).`,

    chart_data: {
      type: 'bar',
      title: `${label} — Outliers (|z| > 2)`,
      description: `Top ${top.length} most extreme deviations from the mean`,
      data: top.map((o, i) => ({
        name: o.row.part_no || `#${i + 1}`,
        value: o.v,
        project: o.row.project,
        rank: i + 1,
        color: o.z > 0 ? '#EF4444' : '#22C55E'
      })),
      x_axis_key: 'name',
      y_axis_key: 'value'
    },

    metrics: [
      { label: `${label} Outliers`, value: outliers.length, sublabel: 'beyond 2σ', impact },
      { label: 'Max Deviation', value: `${Math.max(...outliers.map((o) => Math.abs(o.z))).toFixed(2)}σ`, sublabel: 'most extreme', impact },
      { label: 'Mean', value: fmt(m), sublabel: 'across all rows', impact: 'medium' }
    ]
  };
};

/**
 * Sign split for columns that contain meaningful negative values
 * (e.g., variance / delta columns). Splits rows into positive vs negative
 * buckets and reports magnitude on each side.
 */
const findSignSplit = (rows, profile) => {
  const { col, values, sampleNumeric } = profile;
  const negatives = sampleNumeric.filter((v) => v < 0);
  const positives = sampleNumeric.filter((v) => v > 0);
  if (negatives.length === 0 || positives.length === 0) return null;
  const ratio = Math.min(negatives.length, positives.length) / Math.max(negatives.length, positives.length);
  if (ratio < 0.1) return null;

  const indexed = values.map((v, i) => ({ v, row: rows[i] }));
  const posSum = sum(indexed.filter((x) => x.v > 0).map((x) => x.v));
  const negSum = sum(indexed.filter((x) => x.v < 0).map((x) => x.v));
  const flagged = [...indexed.filter((x) => x.v > 0).sort((a, b) => b.v - a.v).slice(0, 8)];

  const isCurrency = isCurrencyLike(sampleNumeric);
  const isPct = isPercentLike(col);
  const fmt = (v) => formatNumber(v, { currency: isCurrency, percent: isPct });
  const label = displayName(col);
  const impact = Math.abs(posSum) > Math.abs(negSum) * 1.5 ? 'high' : 'medium';

  return {
    angle_id: `sign_split__${col}`,
    angle_type: 'sign_split',
    business_relevance: impact,
    score: 35 + Math.min(Math.abs(posSum + negSum) / 1e6, 20),

    facts: {
      column: col,
      column_label: label,
      positive_count: positives.length,
      negative_count: negatives.length,
      positive_sum: posSum,
      negative_sum: negSum,
      net: posSum + negSum,
      part_numbers: flagged.map((x) => x.row.part_no).filter(Boolean)
    },

    suggested_query: `How does ${label} split between positive and negative entries?`,
    context: `${positives.length} entries positive (${fmt(posSum)}), ${negatives.length} entries negative (${fmt(negSum)}). Net ${fmt(posSum + negSum)}.`,

    chart_data: {
      type: 'pie',
      title: `${label} — Sign Distribution`,
      description: `Counts and totals for positive vs negative entries`,
      data: [
        { name: 'Positive', value: positives.length, amount: posSum, color: '#EF4444' },
        { name: 'Negative', value: negatives.length, amount: negSum, color: '#22C55E' }
      ]
    },

    metrics: [
      { label: `${label} Positive`, value: fmt(posSum), sublabel: `${positives.length} entries`, impact },
      { label: `${label} Negative`, value: fmt(Math.abs(negSum)), sublabel: `${negatives.length} entries`, impact: 'positive' },
      { label: 'Net', value: fmt(posSum + negSum), sublabel: 'positive − negative', impact: posSum + negSum > 0 ? impact : 'positive' }
    ]
  };
};

/**
 * Dispersion: high coefficient of variation indicates inconsistency that may
 * be worth investigating.
 */
const findDispersion = (rows, profile) => {
  const { col, sampleNumeric } = profile;
  if (sampleNumeric.length < 10) return null;

  const m = mean(sampleNumeric);
  if (m === 0) return null;
  const sd = stddev(sampleNumeric);
  const cv = sd / Math.abs(m);
  if (cv < 1) return null;

  const isCurrency = isCurrencyLike(sampleNumeric);
  const isPct = isPercentLike(col);
  const fmt = (v) => formatNumber(v, { currency: isCurrency, percent: isPct });
  const label = displayName(col);
  const impact = cv > 2.5 ? 'high' : 'medium';

  return {
    angle_id: `dispersion__${col}`,
    angle_type: 'dispersion',
    business_relevance: impact,
    score: 25 + Math.min(cv * 3, 25),

    facts: {
      column: col,
      column_label: label,
      mean: m,
      stddev: sd,
      coefficient_of_variation: Number(cv.toFixed(2)),
      part_numbers: []
    },

    suggested_query: `How dispersed is ${label} across entries?`,
    context: `${label} shows coefficient of variation ${cv.toFixed(2)} — values are spread widely around the mean.`,

    chart_data: null,

    metrics: [
      { label: `${label} CV`, value: cv.toFixed(2), sublabel: 'σ / mean', impact },
      { label: 'Mean', value: fmt(m), sublabel: `${rows.length} entries`, impact: 'medium' },
      { label: 'Std. Deviation', value: fmt(sd), sublabel: 'spread', impact }
    ]
  };
};

/**
 * Categorical dominance: if a single category accounts for a large share of a
 * key numeric column (the largest-magnitude numeric column), surface it.
 */
const findCategoricalDominance = (rows, catProfile, numProfiles) => {
  if (numProfiles.length === 0) return null;
  const target = numProfiles
    .map((p) => ({ p, total: sum(p.values.map(Math.abs)) }))
    .sort((a, b) => b.total - a.total)[0]?.p;
  if (!target) return null;

  const grouped = {};
  rows.forEach((r) => {
    const key = r[catProfile.col];
    if (!key) return;
    grouped[key] = (grouped[key] || 0) + (Number(r[target.col]) || 0);
  });

  const entries = Object.entries(grouped);
  if (entries.length < 2) return null;

  const total = sum(entries.map(([, v]) => v));
  if (total === 0) return null;

  entries.sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
  const [topName, topVal] = entries[0];
  const pct = (topVal / total) * 100;
  if (Math.abs(pct) < 30) return null;

  const isCurrency = isCurrencyLike(target.sampleNumeric);
  const isPct = isPercentLike(target.col);
  const fmt = (v) => formatNumber(v, { currency: isCurrency, percent: isPct });
  const catLabel = displayName(catProfile.col);
  const numLabel = displayName(target.col);
  const impact = Math.abs(pct) >= 60 ? 'high' : 'medium';

  return {
    angle_id: `dominance__${catProfile.col}__${target.col}`,
    angle_type: 'group_dominance',
    business_relevance: impact,
    score: Math.abs(pct) * 0.8,

    facts: {
      group_column: catProfile.col,
      group_label: catLabel,
      metric_column: target.col,
      metric_label: numLabel,
      top_group: topName,
      top_value: topVal,
      total: total,
      share_pct: Number(pct.toFixed(2)),
      group_count: entries.length,
      part_numbers: rows.filter((r) => r[catProfile.col] === topName).map((r) => r.part_no).filter(Boolean)
    },

    suggested_query: `Which ${catLabel.toLowerCase()} dominates ${numLabel}?`,
    context: `"${topName}" leads ${numLabel} with ${pct.toFixed(1)}% share across ${entries.length} ${catLabel.toLowerCase()} groups.`,

    chart_data: {
      type: 'bar',
      title: `${numLabel} by ${catLabel}`,
      description: `Per-${catLabel.toLowerCase()} totals of ${numLabel}`,
      data: entries.slice(0, 10).map(([name, value], i) => ({
        name,
        value,
        rank: i + 1,
        color: colorAt(i)
      })),
      x_axis_key: 'name',
      y_axis_key: 'value'
    },

    metrics: [
      { label: `Top ${catLabel}`, value: topName, sublabel: `${pct.toFixed(1)}% share`, impact },
      { label: numLabel, value: fmt(topVal), sublabel: `for "${topName}"`, impact },
      { label: `${catLabel} Groups`, value: entries.length, sublabel: 'distinct values', impact: 'medium' }
    ]
  };
};

// ---------- Orchestrator ----------

/**
 * Main entry: profile every column, run every detector, and return all
 * findings sorted by score descending.
 */
export const computeAllAngles = (rows) => {
  if (!rows || rows.length === 0) return [];

  const { numeric, categorical } = profileColumns(rows);
  const findings = [];

  numeric.forEach((profile) => {
    const c = findConcentration(rows, profile);
    if (c) findings.push(c);

    const o = findOutliers(rows, profile);
    if (o) findings.push(o);

    const s = findSignSplit(rows, profile);
    if (s) findings.push(s);

    const d = findDispersion(rows, profile);
    if (d) findings.push(d);
  });

  categorical.forEach((cat) => {
    const dom = findCategoricalDominance(rows, cat, numeric);
    if (dom) findings.push(dom);
  });

  findings.sort((a, b) => (b.score || 0) - (a.score || 0));
  return findings;
};
