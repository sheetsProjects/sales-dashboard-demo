import { computeAllAngles } from './angleComputers';
import { safeSetItem } from '../utils/parseRow';

const IMPACT_COLORS = {
  Critical: '#EF4444',
  High: '#F59E0B',
  Medium: '#3B82F6',
  Positive: '#22C55E'
};

const IMPACT_RANK = { Critical: 100, High: 70, Positive: 60, Medium: 40, Low: 20 };

const normalizeImpact = (raw) => {
  if (!raw) return 'Medium';
  const v = String(raw).toLowerCase();
  if (v.startsWith('crit')) return 'Critical';
  if (v.startsWith('high') || v === 'high_impact') return 'High';
  if (v.startsWith('pos')) return 'Positive';
  if (v.startsWith('low')) return 'Low';
  return 'Medium';
};

const sumBy = (rows, key) => rows.reduce((s, r) => s + (Number(r[key]) || 0), 0);

const pickHeadlineImpact = (angle) => {
  const candidates = [
    ...(angle.metrics || []).map(m => normalizeImpact(m.impact)),
    normalizeImpact(angle.business_relevance)
  ];
  return candidates.sort((a, b) => (IMPACT_RANK[b] || 0) - (IMPACT_RANK[a] || 0))[0] || 'Medium';
};

const buildInsightTitle = (angle) => {
  const metrics = angle.metrics || [];
  const ranked = [...metrics].sort(
    (a, b) => (IMPACT_RANK[normalizeImpact(b.impact)] || 0) - (IMPACT_RANK[normalizeImpact(a.impact)] || 0)
  );
  const top = ranked[0];

  if (top && top.value) {
    const sub = top.sublabel ? ` ${top.sublabel}` : '';
    return `${top.label}: ${top.value}${sub}`.trim();
  }

  return angle.suggested_query || angle.angle_id;
};

const scoreAngle = (angle) => {
  if (typeof angle.score === 'number' && isFinite(angle.score)) return angle.score;

  const impact = pickHeadlineImpact(angle);
  let score = IMPACT_RANK[impact] || 30;

  const f = angle.facts || {};
  const numericFacts = Object.values(f).filter(v => typeof v === 'number' && isFinite(v));
  if (numericFacts.length > 0) {
    const magnitude = Math.log10(1 + Math.max(...numericFacts.map(Math.abs)));
    score += Math.min(magnitude, 10);
  }

  return score;
};

const buildCategoryData = (rows, insights) => {
  const out = {};

  insights.forEach(insight => {
    const insightRows = rows.filter(r => insight.partNumbers.includes(r.part_no));

    out[insight.id] = {
      summary: {
        totalParts: insightRows.length,
        totalBOM: sumBy(insightRows, 'total_bom'),
        totalRM: sumBy(insightRows, 'total_rm'),
        totalOS: sumBy(insightRows, 'total_os'),
        totalSales: sumBy(insightRows, 'sales'),
        avgVariance: insightRows.length > 0 ? sumBy(insightRows, 'avb_2526') / insightRows.length : 0,
        budgetedCost: sumBy(insightRows, 'budget_cost')
      },
      breakdown: [
        { name: 'Raw Material', value: sumBy(insightRows, 'total_rm'), color: '#3B82F6' },
        { name: 'Outsourcing', value: sumBy(insightRows, 'total_os'), color: '#F59E0B' }
      ],
      topParts: [...insightRows].sort((a, b) => (b.total_bom || 0) - (a.total_bom || 0)).slice(0, 10),
      rows: insightRows
    };
  });

  return out;
};

export const generateInsights = async (dataRows, onProgress) => {
  const cacheKey = JSON.stringify(dataRows.map(r => r.part_no).sort()).slice(0, 500);
  const cacheId = btoa(encodeURIComponent(cacheKey).replace(/%([0-9A-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))).slice(0, 50);

  if (onProgress) onProgress({ current: 1, total: 3, stage: 'Computing business angles...' });
  const angles = computeAllAngles(dataRows);
  safeSetItem(`angles_v1_${cacheId}`, JSON.stringify(angles));
  safeSetItem('currentCacheId', cacheId);

  if (onProgress) onProgress({ current: 2, total: 3, stage: 'Ranking insights by impact...' });
  const ranked = [...angles]
    .map(angle => ({ angle, score: scoreAngle(angle) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 7);

  if (onProgress) onProgress({ current: 3, total: 3, stage: 'Finalizing insights...' });
  const categories = ranked.map(({ angle }) => {
    const impact = pickHeadlineImpact(angle);
    const partNumbers = angle.facts?.part_numbers || [];

    return {
      id: angle.angle_id,
      title: buildInsightTitle(angle),
      query: angle.suggested_query,
      impact,
      metric: angle.metrics?.[0]?.value || '',
      partNumbers,
      count: partNumbers.length,
      actionable: angle.context || '',
      color: IMPACT_COLORS[impact] || '#64748B'
    };
  });

  const categoryData = buildCategoryData(dataRows, categories);

  const result = { categories, categoryData, angles, cacheId };

  // Persist only the lightweight categories list. categoryData and the full
  // insights bundle include row arrays that can exceed the 5 MB localStorage
  // quota for invoice-level datasets — recompute them after upload instead.
  safeSetItem('aiCategories', JSON.stringify(categories));

  return result;
};

const buildNarrative = (angle) => {
  const metrics = (angle.metrics || []).slice(0, 3);
  if (metrics.length === 0) {
    return angle.context || `Insight for: ${angle.suggested_query || angle.angle_id}.`;
  }

  const sentences = metrics.map(m => {
    const sub = m.sublabel ? ` ${m.sublabel}` : '';
    return `${m.label} stands at ${m.value}${sub}.`;
  });

  if (angle.context) sentences.push(angle.context);
  return sentences.join(' ');
};

const buildRecommendations = (angle) => {
  const metrics = angle.metrics || [];
  if (metrics.length === 0) return [];

  const firstPart = (angle.facts?.part_numbers || [])[0];
  const startWith = firstPart ? ` — starting with ${firstPart}` : '';

  const impactToPriority = (i) => {
    const v = normalizeImpact(i);
    if (v === 'Critical') return 'high';
    if (v === 'High') return 'high';
    if (v === 'Positive') return 'low';
    return 'medium';
  };

  return metrics.slice(0, 4).map(m => ({
    priority: impactToPriority(m.impact),
    action: `Review "${m.label}" (${m.value}${m.sublabel ? ' ' + m.sublabel : ''})${startWith}`,
    reason: angle.context || angle.suggested_query || 'Driven by computed angle metrics.',
    owner: 'Owner',
    timeline: normalizeImpact(m.impact) === 'Critical' ? 'Immediate' : 'Next Review'
  }));
};

export const buildInsightDetail = async (insightId, angles, rows) => {
  const angle = angles.find(a => a.angle_id === insightId);
  if (!angle) throw new Error('Insight not found');

  return {
    narrative: buildNarrative(angle),
    key_metrics: angle.metrics || [],
    recommendations: buildRecommendations(angle),
    primary_chart: angle.chart_data,
    secondary_chart: null
  };
};

export const matchQueryToAngle = (query, visualType, angles) => {
  const q = (query || '').toLowerCase();
  const tokens = q.split(/\W+/).filter(t => t.length > 2);

  let bestMatch = null;
  let bestScore = 0;

  angles.forEach(a => {
    const haystack = `${a.angle_id} ${a.suggested_query || ''} ${a.context || ''}`.toLowerCase();
    const score = tokens.reduce((s, t) => (haystack.includes(t) ? s + 1 : s), 0);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = a;
    }
  });

  if (!bestMatch && angles.length > 0) bestMatch = angles[0];

  return { query, visualType, angle: bestMatch, timestamp: Date.now() };
};
