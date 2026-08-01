// AutoGlobe Sales Dashboard — deterministic AI insight generator.
// The full angle-set + drill-down rebuild lands in Phase 5. This scaffold keeps
// the upload / sidebar pipeline working during Phase 2 by producing an empty
// insight list so no downstream code crashes on undefined shapes.

import { safeSetItem } from '../utils/parseWorkbook';
import { STORAGE_KEYS } from '../utils/constants';

// Stable cache id derived from the row count + a stringified head. Cheap and
// deterministic — insight cache is invalidated whenever the sales row count
// changes, which is a proxy for "new upload".
const buildCacheId = (workbook) => {
  const n = (workbook.sales || []).length;
  const first = (workbook.sales || [])[0];
  const key = JSON.stringify({ n, first: first?.saleId || '' });
  return btoa(unescape(encodeURIComponent(key))).slice(0, 40);
};

export const generateInsights = async (workbook, onProgress) => {
  const cacheId = buildCacheId(workbook);
  if (onProgress) onProgress({ current: 1, total: 3, stage: 'Computing business angles...' });

  // TODO Phase 5 — compute real angles from workbook (branch vs target,
  // aging inventory, low-CSAT reps, best-margin segments, channel ROI, etc.)
  const angles = [];

  if (onProgress) onProgress({ current: 2, total: 3, stage: 'Ranking insights by impact...' });
  const categories = [];
  const categoryData = {};

  if (onProgress) onProgress({ current: 3, total: 3, stage: 'Finalizing insights...' });

  safeSetItem(`${STORAGE_KEYS.anglesPrefix}${cacheId}`, JSON.stringify(angles));
  safeSetItem(STORAGE_KEYS.cacheId, cacheId);
  safeSetItem(STORAGE_KEYS.categories, JSON.stringify(categories));

  return { categories, categoryData, angles, cacheId };
};

// Placeholder — real drill-down builder lands in Phase 5.
export const buildInsightDetail = async (insightId, angles /*, workbook */) => {
  const angle = angles.find(a => a.angle_id === insightId);
  if (!angle) throw new Error('Insight not found');
  return {
    narrative: angle.context || '',
    key_metrics: angle.metrics || [],
    recommendations: [],
    primary_chart: angle.chart_data || null,
    secondary_chart: null,
  };
};

// Placeholder — real angle matcher lands in Phase 5.
export const matchQueryToAngle = (query, visualType, angles) => {
  const bestMatch = angles && angles.length > 0 ? angles[0] : null;
  return { query, visualType, angle: bestMatch, timestamp: 0 };
};
