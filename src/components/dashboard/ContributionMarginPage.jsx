import { useState, useMemo } from 'react';
import React from 'react';
import { Filter, Download } from 'lucide-react';
import DataEmptyState from './DataEmptyState';
import * as XLSX from 'xlsx';
import SearchableSelect from './SearchableSelect';
import { convertCurrency, getCurrencySymbol, formatCurrency } from '../../utils/helpers';

const MONTH_FY_IDX = {
  apr: 0, april: 0,
  may: 1,
  jun: 2, june: 2,
  jul: 3, july: 3,
  aug: 4, august: 4,
  sep: 5, sept: 5, september: 5,
  oct: 6, october: 6,
  nov: 7, november: 7,
  dec: 8, december: 8,
  jan: 9, january: 9,
  feb: 10, february: 10,
  mar: 11, march: 11,
};

const QUARTER_LABELS = {
  Q1: 'Q1 (Apr – Jun)',
  Q2: 'Q2 (Jul – Sep)',
  Q3: 'Q3 (Oct – Dec)',
  Q4: 'Q4 (Jan – Mar)',
};

const FY_MONTH_OPTIONS = [
  'April', 'May', 'June', 'July', 'August', 'September',
  'October', 'November', 'December', 'January', 'February', 'March',
];

const METRICS = [
  { key: 'sales',        label: 'Sales',        isSales: true,  isContrib: false },
  { key: 'rm',           label: 'RM Cost',       isSales: false, isContrib: false },
  { key: 'os',           label: 'OS Cost',       isSales: false, isContrib: false },
  { key: 'bom',          label: 'BOM Cost',      isSales: false, isContrib: false },
  { key: 'contribution', label: 'Contribution',  isSales: false, isContrib: true  },
];

const monthFyIdx = (label) => {
  const m = String(label || '').trim().toLowerCase().match(/^([a-z]+)/);
  return m ? (MONTH_FY_IDX[m[1]] ?? 99) : 99;
};

const quarterOf = (label) => {
  const i = monthFyIdx(label);
  if (i <= 2) return 'Q1';
  if (i <= 5) return 'Q2';
  if (i <= 8) return 'Q3';
  return 'Q4';
};

const shortMonthLabel = (s) => {
  const m = String(s || '').trim().match(/^([a-zA-Z]{3,}?)(\d{2,4})$/i);
  if (!m) return String(s || '').slice(0, 6);
  const n = m[1].slice(0, 3);
  return (n[0].toUpperCase() + n.slice(1).toLowerCase()) + " '" + m[2].slice(-2);
};

const sumRows = (rows) => {
  let sales = 0, rm = 0, os = 0, bom = 0, rm_b = 0, os_b = 0, bom_b = 0;
  for (const r of rows) {
    sales += Number(r.invoice_inr) || 0;
    rm    += Number(r.rm_actual)   || 0;
    os    += Number(r.os_actual)   || 0;
    bom   += Number(r.bom_actual)  || 0;
    rm_b  += Number(r.rm_budget)   || 0;
    os_b  += Number(r.os_budget)   || 0;
    bom_b += Number(r.budget_cost) || 0;
  }
  return {
    actuals:  { sales, rm, os, bom, contribution: sales - bom },
    budgeted: { sales, rm: rm_b, os: os_b, bom: bom_b, contribution: sales - bom_b },
  };
};

const pctStr = (val, sales) =>
  sales ? ((val / sales) * 100).toFixed(2) + '%' : '—';

const METRIC_COLORS = {
  sales:        { dot: '#0891b2', rowBg: 'bg-cyan-50/40',   val: 'text-cyan-700 font-bold',   pct: 'text-cyan-500',   stickyBg: 'bg-cyan-50'      },
  rm:           { dot: '#3b82f6', rowBg: '',                 val: 'text-blue-700',             pct: 'text-blue-400',   stickyBg: 'bg-white'        },
  os:           { dot: '#f59e0b', rowBg: '',                 val: 'text-amber-700',            pct: 'text-amber-500',  stickyBg: 'bg-white'        },
  bom:          { dot: '#94a3b8', rowBg: '',                 val: 'text-slate-700',            pct: 'text-slate-400',  stickyBg: 'bg-white'        },
  contribution: { dot: '#10b981', rowBg: 'bg-emerald-50/60', val: 'text-emerald-700 font-extrabold', pct: 'text-emerald-500 font-semibold', stickyBg: 'bg-emerald-50'   },
};

const ContributionMarginPage = ({ data, currency, fxRate, onUploadClick }) => {
  const [selectedMonth,   setSelectedMonth]   = useState('');
  const [selectedQuarter, setSelectedQuarter] = useState('');

  const handleMonthChange = (val) => {
    setSelectedMonth(val);
    if (val) setSelectedQuarter('');
  };
  const handleQuarterChange = (val) => {
    setSelectedQuarter(val);
    if (val) setSelectedMonth('');
  };

  const fmt = (val) => formatCurrency(val, currency, fxRate);

  const tableData = useMemo(() => {
    if (!data.length) return { periods: [], ytd: null, byPeriod: {}, periodLabels: [], ytdLabel: 'YTD' };

    if (selectedQuarter) {
      const qRows = data.filter(r => r.month && quarterOf(r.month) === selectedQuarter);
      const ytd = sumRows(qRows);
      const monthMap = new Map();
      for (const r of qRows) {
        const k = r.month; if (!k) continue;
        if (!monthMap.has(k)) monthMap.set(k, []);
        monthMap.get(k).push(r);
      }
      const periods = [...monthMap.keys()].sort((a, b) => monthFyIdx(a) - monthFyIdx(b));
      const byPeriod = Object.fromEntries(periods.map(p => [p, sumRows(monthMap.get(p))]));
      return { periods, ytd, byPeriod, periodLabels: periods.map(shortMonthLabel), ytdLabel: `YTD (${selectedQuarter})` };
    }

    const ytd = sumRows(data);
    const monthMap = new Map();
    for (const r of data) {
      const k = r.month; if (!k) continue;
      if (!monthMap.has(k)) monthMap.set(k, []);
      monthMap.get(k).push(r);
    }
    let periods = [...monthMap.keys()].sort((a, b) => monthFyIdx(a) - monthFyIdx(b));

    if (selectedMonth) {
      const sel = selectedMonth.toLowerCase();
      periods = periods.filter(p => String(p).toLowerCase().startsWith(sel.slice(0, 3)));
    }

    const byPeriod = Object.fromEntries(periods.map(p => [p, sumRows(monthMap.get(p))]));
    return { periods, ytd, byPeriod, periodLabels: periods.map(shortMonthLabel), ytdLabel: 'YTD' };
  }, [data, selectedMonth, selectedQuarter]);

  if (!data.length) {
    return <DataEmptyState title="No Data Available" onUploadClick={onUploadClick} />;
  }

  const { periods, ytd, byPeriod, periodLabels, ytdLabel } = tableData;
  const showYtd    = !selectedMonth;
  const allPeriods = showYtd ? ['__ytd__', ...periods] : periods;
  const allLabels  = showYtd ? [ytdLabel,  ...periodLabels] : periodLabels;
  const colCount   = 1 + allPeriods.length * 2;

  const getGroup = (section, pKey) => {
    const d = pKey === '__ytd__' ? ytd : byPeriod[pKey];
    return d ? (section === 'actuals' ? d.actuals : d.budgeted) : null;
  };

  const renderSection = (section) => {
    const isActuals = section === 'actuals';

    return (
      <>
        <tr>
          <td
            colSpan={colCount}
            className={`py-2 text-[10px] font-extrabold uppercase tracking-[0.2em] border-y ${
              isActuals
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-cyan-700'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-600'
            }`}
          >
            <span className="sticky left-5 inline-block">
              {isActuals ? '▲  Actuals' : '▽  Budgeted'}
            </span>
          </td>
        </tr>

        {METRICS.map((m) => {
          const mc         = METRIC_COLORS[m.key] || METRIC_COLORS.bom;
          const isContrib  = m.isContrib;

          return (
            <tr
              key={`${section}-${m.key}`}
              className={`transition-colors group ${isContrib ? 'border-t-2 border-t-slate-300' : ''} ${mc.rowBg} hover:brightness-95`}
            >
              <td className={`sticky left-0 z-10 px-5 py-2.5 whitespace-nowrap border-r border-slate-200 shadow-[2px_0_4px_-2px_rgba(15,23,42,0.08)] text-sm ${mc.stickyBg}`}>
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: mc.dot }} />
                  <span className={isContrib ? 'font-extrabold text-slate-900' : m.isSales ? 'font-bold text-slate-800' : 'font-medium text-slate-600'}>
                    {m.label}
                  </span>
                </span>
              </td>

              {allPeriods.map((p, pi) => {
                const grp    = getGroup(section, p);
                const val    = grp ? (grp[m.key] ?? 0) : 0;
                const sls    = grp ? (grp.sales  ?? 0) : 0;
                const pct    = pctStr(val, sls);
                const isNeg  = isContrib && val < 0;
                const isYtd  = showYtd && pi === 0;
                const ytdBg  = isYtd ? 'bg-amber-50/70' : '';

                const valCls = isContrib
                  ? (isNeg ? 'font-extrabold text-red-600' : 'font-extrabold text-emerald-700')
                  : mc.val;

                const pctCls = isContrib
                  ? (isNeg ? 'font-semibold text-red-400' : 'font-semibold text-emerald-500')
                  : mc.pct;

                return (
                  <React.Fragment key={p}>
                    <td className={`px-3 py-2.5 text-right text-sm tabular-nums whitespace-nowrap border-l border-slate-100 ${valCls} ${ytdBg}`}>
                      {fmt(val)}
                    </td>
                    <td className={`px-2.5 py-2.5 text-right tabular-nums whitespace-nowrap ${ytdBg}`}>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${pctCls} bg-white/60`}>
                        {pct}
                      </span>
                    </td>
                  </React.Fragment>
                );
              })}
            </tr>
          );
        })}
      </>
    );
  };

  const handleExportExcel = () => {
    const sym = getCurrencySymbol(currency);
    const cv  = (v) => convertCurrency(v, currency, fxRate);

    const header = ['Metric'];
    allPeriods.forEach((p, i) => {
      header.push(`${allLabels[i]} Value (${sym})`, `${allLabels[i]} %`);
    });

    const buildRows = (section) => {
      const sectionLabel = section === 'actuals' ? 'ACTUALS' : 'BUDGETED';
      const rows = [[sectionLabel, ...Array(allPeriods.length * 2).fill('')]];
      METRICS.forEach((m) => {
        const row = [m.label];
        allPeriods.forEach((p) => {
          const grp = getGroup(section, p);
          const val = grp ? (grp[m.key] ?? 0) : 0;
          const sls = grp ? (grp.sales ?? 0) : 0;
          const converted = parseFloat(cv(val).toFixed(2));
          const pct = sls ? parseFloat(((val / sls) * 100).toFixed(2)) : '';
          row.push(converted, pct);
        });
        rows.push(row);
      });
      return rows;
    };

    const sheetData = [
      header,
      ...buildRows('actuals'),
      [],
      ...buildRows('budgeted'),
    ];

    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Contribution Margin');

    const filterTag = selectedMonth || (selectedQuarter ? selectedQuarter : 'Full-FY');
    XLSX.writeFile(wb, `Contribution_Margin_${filterTag}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-5">
      <div className="filter-section p-4 bg-white border border-slate-200 rounded-xl">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-semibold text-slate-500 flex items-center gap-2 shrink-0">
            <Filter className="w-4 h-4" /> Filter by:
          </span>

          <SearchableSelect
            label="All Months"
            value={selectedMonth}
            options={FY_MONTH_OPTIONS}
            onChange={handleMonthChange}
            width="w-44"
          />

          <SearchableSelect
            label="All Quarters"
            value={selectedQuarter ? QUARTER_LABELS[selectedQuarter] : ''}
            options={Object.values(QUARTER_LABELS)}
            onChange={(v) => handleQuarterChange(
              v ? (Object.keys(QUARTER_LABELS).find(k => QUARTER_LABELS[k] === v) ?? '') : ''
            )}
            width="w-52"
          />

          <span className="text-xs text-slate-500 shrink-0">
            Showing <b className="text-slate-700">{periods.length}</b> month{periods.length !== 1 ? 's' : ''}
            {selectedQuarter && ` in ${QUARTER_LABELS[selectedQuarter]}`}
            {showYtd && ' · YTD shown'}
          </span>

          <button
            onClick={handleExportExcel}
            className="ml-auto h-[40px] px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer shrink-0"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-max w-full border-collapse">
            <thead>
              <tr className="bg-[#0d1b2e]">
                <th
                  scope="col"
                  className="sticky left-0 z-20 bg-[#0d1b2e] px-5 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap min-w-[160px] border-r border-white/10 shadow-[2px_0_4px_-2px_rgba(15,23,42,0.25)]"
                >
                  Metric
                </th>
                {allPeriods.map((p, i) => {
                  const isYtd = showYtd && i === 0;
                  return (
                    <th
                      key={p}
                      colSpan={2}
                      scope="colgroup"
                      className={`px-3 py-3.5 text-center text-xs font-extrabold uppercase tracking-wide whitespace-nowrap border-l border-white/10 ${
                        isYtd
                          ? 'bg-amber-500 text-white'
                          : 'text-slate-200'
                      }`}
                    >
                      {allLabels[i]}
                    </th>
                  );
                })}
              </tr>

              <tr className="bg-slate-100 border-b-2 border-slate-200">
                <th className="sticky left-0 z-20 bg-slate-100 px-5 py-2 border-r border-slate-200 shadow-[2px_0_4px_-2px_rgba(15,23,42,0.08)]" />
                {allPeriods.map((p, i) => {
                  const isYtd = showYtd && i === 0;
                  return (
                    <React.Fragment key={p}>
                      <th
                        scope="col"
                        className={`px-3 py-2 text-right text-[9px] font-bold uppercase tracking-wider border-l border-slate-200 ${
                          isYtd ? 'bg-amber-50 text-amber-700' : 'text-slate-500'
                        }`}
                      >
                        Value
                      </th>
                      <th
                        scope="col"
                        className={`px-3 py-2 text-right text-[9px] font-bold uppercase tracking-wider ${
                          isYtd ? 'bg-amber-50 text-amber-500' : 'text-slate-400'
                        }`}
                      >
                        %
                      </th>
                    </React.Fragment>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {renderSection('actuals')}

              <tr>
                <td colSpan={colCount} className="h-2.5 bg-slate-100" />
              </tr>

              {renderSection('budgeted')}

              <tr>
                <td colSpan={colCount} className="h-2 bg-white" />
              </tr>
            </tbody>
          </table>
        </div>

        <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center gap-5 text-[10px] text-slate-400 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-gradient-to-r from-cyan-500 to-blue-500 inline-block" />
            Actuals
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-gradient-to-r from-amber-400 to-orange-400 inline-block" />
            Budgeted
          </span>
          {showYtd && (
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-400 inline-block" />
              YTD column
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            Contribution
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 inline-block" />
            Sales
          </span>
          <span className="ml-auto">% = share of Sales for that period</span>
        </div>
      </div>
    </div>
  );
};

export default ContributionMarginPage;
