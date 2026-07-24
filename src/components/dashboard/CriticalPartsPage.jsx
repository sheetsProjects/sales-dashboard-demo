import { useState, useMemo } from 'react';
import { AlertTriangle, TrendingDown, Filter, X, IndianRupee, CheckCircle2, FileDown } from 'lucide-react';
import DataEmptyState from './DataEmptyState';
import * as XLSX from 'xlsx';
import { formatCurrency, getUniqueValues } from '../../utils/helpers';
import SearchableSelect from './SearchableSelect';

const MONTH_IDX = {
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

const QUARTER_MONTHS = { Q1: [3, 4, 5], Q2: [6, 7, 8], Q3: [9, 10, 11], Q4: [0, 1, 2] };

const QUARTER_OPTIONS = [
  { value: 'Q1', label: 'Q1 (Apr – Jun)' },
  { value: 'Q2', label: 'Q2 (Jul – Sep)' },
  { value: 'Q3', label: 'Q3 (Oct – Dec)' },
  { value: 'Q4', label: 'Q4 (Jan – Mar)' },
];

const monthIdx = (str) => {
  const m = String(str || '').trim().toLowerCase().match(/^([a-z]+)/);
  return m ? (MONTH_IDX[m[1]] ?? null) : null;
};

const getSeverity = (variancePct) => {
  if (variancePct <= -0.50) return 'SEVERE';
  if (variancePct <= -0.35) return 'CRITICAL';
  return 'HIGH';
};

const SEVERITY_STYLES = {
  SEVERE: {
    rowBg: 'hover:bg-red-50/40',
    badge: 'bg-red-50 text-red-700 border-red-200',
    rankBg: 'bg-red-500 text-white',
    varChip: 'bg-red-50 text-red-600 border-red-200',
    varIcon: 'text-red-500',
  },
  CRITICAL: {
    rowBg: 'hover:bg-orange-50/40',
    badge: 'bg-orange-50 text-orange-700 border-orange-200',
    rankBg: 'bg-orange-400 text-white',
    varChip: 'bg-orange-50 text-orange-600 border-orange-200',
    varIcon: 'text-orange-500',
  },
  HIGH: {
    rowBg: 'hover:bg-yellow-50/30',
    badge: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    rankBg: 'bg-yellow-400 text-slate-800',
    varChip: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    varIcon: 'text-yellow-600',
  },
};

const CriticalPartsPage = ({ data, currency, fxRate, onUploadClick }) => {
  const [filters, setFilters] = useState({ project: '', fgPart: '', partNo: '', quarter: '', limit: '' });

  const fmt = (v) => formatCurrency(v, currency, fxRate);

  const clearFilters = () => setFilters({ project: '', fgPart: '', partNo: '', quarter: '', limit: '' });

  const filteredData = useMemo(() => {
    let result = data;
    if (filters.project) result = result.filter(r => r.project === filters.project);
    if (filters.fgPart)  result = result.filter(r => String(r.fg_part) === String(filters.fgPart));
    if (filters.partNo)  result = result.filter(r => r.part_no === filters.partNo);
    if (filters.quarter) {
      const qMonths = QUARTER_MONTHS[filters.quarter];
      if (qMonths) result = result.filter(r => {
        const idx = monthIdx(r.month);
        return idx !== null && qMonths.includes(idx);
      });
    }
    return result;
  }, [data, filters]);

  const criticalParts = useMemo(() => {
    const map = new Map();
    for (const r of filteredData) {
      const key = r.fg_part;
      if (!key) continue;
      const cur = map.get(key);
      if (cur) {
        cur.bom_actual   += Number(r.bom_actual)   || 0;
        cur.bom_variance += Number(r.bom_variance) || 0;
        cur.invoice_inr  += Number(r.invoice_inr)  || 0;
      } else {
        map.set(key, {
          fg_part:     key,
          project:     r.project || '',
          bom_actual:  Number(r.bom_actual)   || 0,
          bom_variance: Number(r.bom_variance) || 0,
          invoice_inr: Number(r.invoice_inr)  || 0,
        });
      }
    }
    return [...map.values()]
      .map(p => ({ ...p, variancePct: p.bom_actual ? p.bom_variance / p.bom_actual : 0 }))
      .filter(p => p.variancePct <= -0.20)
      .sort((a, b) => a.variancePct - b.variancePct);
  }, [filteredData]);

  const limitN = filters.limit ? parseInt(filters.limit, 10) : null;
  const displayedParts = limitN ? criticalParts.slice(0, limitN) : criticalParts;

  const criticalCount   = displayedParts.length;
  const totalCritical   = criticalParts.length;
  const valueAtRisk     = displayedParts.reduce((s, p) => s + p.invoice_inr, 0);
  const totalOverspend  = displayedParts.reduce((s, p) => s + p.bom_variance, 0);
  const avgVariancePct  = criticalCount
    ? displayedParts.reduce((s, p) => s + p.variancePct, 0) / criticalCount
    : 0;

  const handleExportExcel = () => {
    const rows = displayedParts.map((p, i) => ({
      '#':                   i + 1,
      'FG Part':             p.fg_part,
      'Project':             p.project || '',
      'Severity':            getSeverity(p.variancePct),
      'Variance %':          `−${Math.abs(p.variancePct * 100).toFixed(1)}%`,
      'BOM Actual (INR)':    p.bom_actual,
      'BOM Variance (INR)':  p.bom_variance,
      'Invoice Value (INR)': p.invoice_inr,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Critical Parts');
    const date = new Date().toISOString().split('T')[0];
    const name = limitN ? `Critical_Parts_Top${limitN}_${date}` : `Critical_Parts_All_${date}`;
    XLSX.writeFile(wb, `${name}.xlsx`);
  };

  if (!data.length) {
    return <DataEmptyState title="No Data Available" onUploadClick={onUploadClick} />;
  }

  return (
    <div className="space-y-5">

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3 border-t-[3px] border-t-red-500">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-6 h-6 rounded-md bg-red-50 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Critical Parts</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-800 tabular-nums">{criticalCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">of {totalCritical} critical parts</div>
          <div className="mt-2 h-1 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 rounded-full transition-all"
              style={{ width: totalCritical ? `${(criticalCount / totalCritical) * 100}%` : '0%' }}
            />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 border-t-[3px] border-t-cyan-500">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-6 h-6 rounded-md bg-cyan-50 flex items-center justify-center shrink-0">
              <IndianRupee className="w-3.5 h-3.5 text-cyan-600" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Value at Risk</span>
          </div>
          <div className="text-xl font-extrabold text-slate-800 tabular-nums truncate">{fmt(valueAtRisk)}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Invoice value · critical parts</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 border-t-[3px] border-t-orange-500">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-6 h-6 rounded-md bg-orange-50 flex items-center justify-center shrink-0">
              <TrendingDown className="w-3.5 h-3.5 text-orange-500" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Overspend</span>
          </div>
          <div className="text-xl font-extrabold text-slate-800 tabular-nums truncate">
            {totalOverspend < 0 ? '−' : ''}{fmt(Math.abs(totalOverspend))}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">BOM variance · over budget</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 border-t-[3px] border-t-violet-500">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-6 h-6 rounded-md bg-violet-50 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-3.5 h-3.5 text-violet-500" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Avg Variance %</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-800 tabular-nums">
            {avgVariancePct !== 0 ? `−${Math.abs(avgVariancePct * 100).toFixed(1)}%` : '—'}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Average across critical parts</div>
        </div>
      </div>

      <div className="filter-section p-4 bg-white border border-slate-200 rounded-xl space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-semibold text-slate-500 flex items-center gap-2 shrink-0">
            <Filter className="w-4 h-4" /> Filter by:
          </span>
          <SearchableSelect
            label="All Projects"
            value={filters.project}
            options={getUniqueValues(data, 'project')}
            onChange={(v) => setFilters({ ...filters, project: v })}
            width="w-44"
          />
          <SearchableSelect
            label="All FG Parts"
            value={filters.fgPart}
            options={getUniqueValues(data, 'fg_part')}
            onChange={(v) => setFilters({ ...filters, fgPart: v })}
            width="w-44"
          />
          <SearchableSelect
            label="All Part Numbers"
            value={filters.partNo}
            options={getUniqueValues(data, 'part_no')}
            onChange={(v) => setFilters({ ...filters, partNo: v })}
            width="w-48"
          />
          <div className="relative w-40">
            <select
              value={filters.quarter}
              onChange={(e) => setFilters({ ...filters, quarter: e.target.value })}
              className="appearance-none w-full h-[40px] pl-3 pr-8 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:border-cyan-400 hover:border-slate-300 cursor-pointer"
            >
              <option value="">All Quarters</option>
              {QUARTER_OPTIONS.map((q) => (
                <option key={q.value} value={q.value}>{q.label}</option>
              ))}
            </select>
            <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="ml-auto text-xs text-slate-500 shrink-0">
            Showing <b className="text-slate-700">{filteredData.length.toLocaleString()}</b> of {data.length.toLocaleString()} invoice rows
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-32">
            <select
              value={filters.limit}
              onChange={(e) => setFilters({ ...filters, limit: e.target.value })}
              className="appearance-none w-full h-[34px] pl-3 pr-8 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:border-cyan-400 hover:border-slate-300 cursor-pointer"
            >
              <option value="">All Critical</option>
              <option value="10">Top 10</option>
              <option value="20">Top 20</option>
            </select>
            <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          {totalCritical > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-red-50 border border-red-200 text-red-600 text-[11px] font-bold shrink-0 whitespace-nowrap">
              <AlertTriangle className="w-3 h-3" />
              {limitN ? `${criticalCount}/` : ''}{totalCritical} critical
            </span>
          )}
          <button
            onClick={clearFilters}
            className="h-[34px] px-3 bg-slate-100 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-200 flex items-center gap-1 cursor-pointer transition-colors duration-200"
          >
            <X className="w-4 h-4" /> Clear
          </button>
          {displayedParts.length > 0 && (
            <button
              onClick={handleExportExcel}
              className="ml-auto h-[34px] px-3 bg-emerald-500 text-white rounded-lg text-sm font-semibold hover:bg-emerald-600 flex items-center gap-1.5 cursor-pointer transition-colors duration-200 whitespace-nowrap"
            >
              <FileDown className="w-4 h-4" /> Export Excel
            </button>
          )}
        </div>
      </div>

      {criticalParts.length === 0 && (
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl p-10 text-center">
          <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-emerald-700 mb-1">No Critical Parts Found</h3>
          <p className="text-sm text-emerald-600">
            All FG parts are within the acceptable BOM variance threshold (within −20%).
          </p>
        </div>
      )}

      {criticalParts.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden border-t-[3px] border-t-red-500">
          <div className="flex items-start justify-between px-5 pt-4 pb-3 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {limitN ? `Top ${limitN} Critical Parts` : 'Critical Parts'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Showing {displayedParts.length} of {criticalParts.length} · BOM variance ≤ −20% · worst first
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 border border-red-200 rounded-full text-red-600 text-[10px] font-bold shrink-0">
              <AlertTriangle className="w-3 h-3" />
              {criticalParts.length} critical
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-[#0d1b2e]">
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 w-12">#</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">FG Part</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 w-28">Severity</th>
                  <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400 w-28">Var %</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400 w-36">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedParts.map((p, i) => {
                  const severity = getSeverity(p.variancePct);
                  const s = SEVERITY_STYLES[severity];
                  const varAbs = Math.abs(p.variancePct * 100).toFixed(1);

                  return (
                    <tr
                      key={p.fg_part}
                      className={`${s.rowBg} transition-colors duration-150`}
                    >
                      <td className="px-4 py-3">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-extrabold ${s.rankBg}`}>
                          {i + 1}
                        </div>
                      </td>

                      <td className="px-4 py-3 min-w-0">
                        <div className="font-semibold text-sm text-slate-800 truncate max-w-xs">{p.fg_part}</div>
                        {p.project && (
                          <div className="text-[10px] text-slate-400 mt-0.5 truncate">{p.project}</div>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${s.badge}`}>
                          <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                          {severity}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex justify-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-[11px] font-bold ${s.varChip}`}>
                            <TrendingDown className={`w-3 h-3 shrink-0 ${s.varIcon}`} />
                            −{varAbs}%
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-extrabold text-slate-800 tabular-nums">{fmt(p.invoice_inr)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center gap-5 text-[10px] text-slate-400 flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-1.5 rounded bg-red-600 inline-block" />
              SEVERE (≤ −50%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-1.5 rounded bg-red-500 inline-block" />
              CRITICAL (≤ −35%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-1.5 rounded bg-orange-400 inline-block" />
              HIGH (≤ −20%)
            </span>
            <span className="ml-auto">Var % = bom_variance / bom_actual</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CriticalPartsPage;
