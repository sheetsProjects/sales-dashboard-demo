import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Upload, Filter, X, FileText, IndianRupee, DollarSign, Hash, TrendingUp, Target, Activity, Percent, AlertTriangle, TrendingDown, ArrowUpRight, Globe2 } from 'lucide-react';
import { formatCurrency, formatVariance, formatPercent, getTopFgParts, getUniqueValues, computeFgPartSplit, groupByMonth, groupByProject, getTopCustomers, varianceHistogram, getTopMarginFgParts, computeSmartAlerts } from '../../utils/helpers';
import SearchableSelect from './SearchableSelect';
import DateRangeFilter from './DateRangeFilter';
import FgPartsTable from './FgPartsTable';

const ACCENT = {
  amber:  { ring: 'border-t-amber-500',  text: 'text-amber-500',  tile: 'bg-amber-50 border-amber-200',  tileText: 'text-amber-700',  bar: 'bg-amber-500' },
  violet: { ring: 'border-t-violet-500', text: 'text-violet-500', tile: 'bg-violet-50 border-violet-200', tileText: 'text-violet-700', bar: 'bg-violet-500' },
  cyan:   { ring: 'border-t-cyan-500',   text: 'text-cyan-500',   tile: 'bg-cyan-50 border-cyan-200',   tileText: 'text-cyan-700',   bar: 'bg-cyan-500' },
  indigo: { ring: 'border-t-indigo-500', text: 'text-indigo-500', tile: 'bg-indigo-50 border-indigo-200', tileText: 'text-indigo-700', bar: 'bg-indigo-500' },
};

const VarianceCard = ({ title, actualLabel, budgetLabel, actual, budget, variance, variancePct, accent, format, formatVar }) => {
  const a = ACCENT[accent] || ACCENT.amber;
  const isUnder = variance >= 0;
  const varColor = isUnder ? 'text-green-600' : 'text-red-600';
  return (
    <div className={`bg-white border border-slate-200 rounded-2xl p-4 border-t-[3px] ${a.ring} flex flex-col min-w-0`}>
      <div className="flex justify-between items-start gap-2 mb-3">
        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">{title}</div>
        <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold whitespace-nowrap shrink-0 ${isUnder ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {isUnder ? 'Under Budget' : 'Over Budget'}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className={`border rounded-lg p-2.5 min-w-0 ${a.tile}`}>
          <div className={`text-[9px] font-bold mb-1 tracking-wide ${a.tileText}`}>{actualLabel}</div>
          <div className={`text-[15px] font-extrabold leading-tight whitespace-nowrap overflow-hidden ${a.text}`}>{format(actual)}</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-2.5 min-w-0">
          <div className="text-[9px] text-green-700 font-bold mb-1 tracking-wide">{budgetLabel}</div>
          <div className="text-[15px] font-extrabold leading-tight whitespace-nowrap overflow-hidden text-green-600">{format(budget)}</div>
        </div>
      </div>
      <div className="mt-auto">
        <div className="flex justify-between items-center text-[11px] mb-1 gap-2">
          <span className="text-slate-500 shrink-0">Variance</span>
          <span className={`font-bold whitespace-nowrap ${varColor}`}>{formatVar(variance)}</span>
        </div>
        <div className="flex justify-between items-center text-[11px] mb-2 gap-2">
          <span className="text-slate-500 shrink-0">Variance %</span>
          <span className={`font-bold whitespace-nowrap ${varColor}`}>{formatPercent(variancePct)}</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full ${a.bar} rounded-full transition-all`} style={{ width: `${Math.min(Math.abs(variancePct * 100), 100)}%` }} />
        </div>
      </div>
    </div>
  );
};

const DashboardPage = ({
  data,
  filteredData,
  kpi,
  filters,
  setFilters,
  currency,
  fxRate,
  onUploadClick,
  clearFilters
}) => {
  const format = (val) => formatCurrency(val, currency, fxRate);
  const formatVar = (val) => formatVariance(val, currency, fxRate);

  // FG-Part-level split for the Quantity card (respects filters).
  const fgSplit = computeFgPartSplit(filteredData.length ? filteredData : data);
  const fgPosPct = fgSplit.total ? (fgSplit.positive / fgSplit.total) * 100 : 0;
  const fgNegPct = fgSplit.total ? (fgSplit.negative / fgSplit.total) * 100 : 0;

  // Month-by-month BOM Actual vs Budget series for the trend chart.
  const monthlySeries = groupByMonth(filteredData.length ? filteredData : data);
  // Per-project BOM rollup for the project bar chart.
  const projectSeries = groupByProject(filteredData.length ? filteredData : data);
  // Top 10 customers by Σ Invoice INR.
  const topCustomers = getTopCustomers(filteredData.length ? filteredData : data, 10);
  // Variance distribution (FG Parts bucketed by variance %).
  const varHist = varianceHistogram(filteredData.length ? filteredData : data);
  // Smart alerts (auto-flagged risk signals).
  const alerts = computeSmartAlerts(filteredData.length ? filteredData : data, kpi);

  // Compact axis tick formatter for ₹ amounts (uses current currency toggle).
  const shortMoney = (v) => {
    const n = Number(v) || 0;
    const conv = currency === 'USD' ? n / fxRate : n;
    const sym = currency === 'USD' ? '$' : '₹';
    const abs = Math.abs(conv);
    if (abs >= 1e7) return `${conv < 0 ? '-' : ''}${sym}${(abs / 1e7).toFixed(1)}Cr`;
    if (abs >= 1e5) return `${conv < 0 ? '-' : ''}${sym}${(abs / 1e5).toFixed(1)}L`;
    if (abs >= 1e3) return `${conv < 0 ? '-' : ''}${sym}${(abs / 1e3).toFixed(1)}K`;
    return `${sym}${conv.toFixed(0)}`;
  };

  if (!data.length) {
    return (
      <div className="text-center py-20">
        <Upload className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-slate-600 mb-2">No Data Loaded</h3>
        <p className="text-slate-500 mb-6">Upload an Excel file to view dashboard</p>
        <button onClick={onUploadClick} className="px-6 py-3 bg-cyan-500 text-white rounded-xl font-semibold hover:bg-cyan-600 transition cursor-pointer">
          Upload Excel File
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Smart Alerts — auto-flagged risk signals from the filtered data */}
      {kpi && alerts && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Critical Parts */}
          <div className={`rounded-xl border-l-4 px-4 py-3 flex items-start gap-3 ${alerts.critical > 0 ? 'bg-red-50 border-red-500' : 'bg-emerald-50 border-emerald-500'}`}>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${alerts.critical > 0 ? 'bg-red-100' : 'bg-emerald-100'}`}>
              <AlertTriangle className={`w-4 h-4 ${alerts.critical > 0 ? 'text-red-600' : 'text-emerald-600'}`} />
            </div>
            <div className="min-w-0">
              <div className={`text-[10px] font-bold uppercase tracking-wider ${alerts.critical > 0 ? 'text-red-700' : 'text-emerald-700'}`}>Critical Parts</div>
              <div className="text-lg font-extrabold text-slate-800 leading-tight">
                {alerts.critical} <span className="text-[11px] text-slate-500 font-normal">/ {alerts.totalParts.toLocaleString()}</span>
              </div>
              <div className="text-[10px] text-slate-500">FG Parts with variance ≤ −20%</div>
            </div>
          </div>

          {/* Trend direction */}
          <div className={`rounded-xl border-l-4 px-4 py-3 flex items-start gap-3 ${
            alerts.trend === 'worsening' ? 'bg-amber-50 border-amber-500' :
            alerts.trend === 'improving' ? 'bg-emerald-50 border-emerald-500' :
                                            'bg-slate-50  border-slate-400'
          }`}>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              alerts.trend === 'worsening' ? 'bg-amber-100' :
              alerts.trend === 'improving' ? 'bg-emerald-100' : 'bg-slate-100'
            }`}>
              {alerts.trend === 'worsening' && <TrendingDown className="w-4 h-4 text-amber-600" />}
              {alerts.trend === 'improving' && <ArrowUpRight  className="w-4 h-4 text-emerald-600" />}
              {alerts.trend === 'stable'    && <Activity      className="w-4 h-4 text-slate-600" />}
            </div>
            <div className="min-w-0">
              <div className={`text-[10px] font-bold uppercase tracking-wider ${
                alerts.trend === 'worsening' ? 'text-amber-700' :
                alerts.trend === 'improving' ? 'text-emerald-700' : 'text-slate-700'
              }`}>Trend Direction</div>
              <div className="text-lg font-extrabold text-slate-800 leading-tight capitalize">{alerts.trend}</div>
              <div className="text-[10px] text-slate-500 truncate">
                Now {formatPercent(alerts.bomVarPct)} → projected {formatPercent(alerts.projVarPct)}
              </div>
            </div>
          </div>

          {/* Top contributing project */}
          <div className="rounded-xl border-l-4 bg-violet-50 border-violet-500 px-4 py-3 flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
              <Target className="w-4 h-4 text-violet-600" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold text-violet-700 uppercase tracking-wider">Top Contributor</div>
              <div className="text-lg font-extrabold text-slate-800 leading-tight truncate">{alerts.topProject || '—'}</div>
              <div className="text-[10px] text-slate-500 truncate">
                {alerts.topProject ? (
                  <>{(alerts.topProjectShare * 100).toFixed(1)}% of total variance · <span className={alerts.topProjectVar < 0 ? 'text-red-600' : 'text-emerald-600'}>{formatVar(alerts.topProjectVar)}</span></>
                ) : 'Not enough data'}
              </div>
            </div>
          </div>

          {/* Currency exposure */}
          <div className="rounded-xl border-l-4 bg-sky-50 border-sky-500 px-4 py-3 flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-sky-100 flex items-center justify-center shrink-0">
              <Globe2 className="w-4 h-4 text-sky-600" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold text-sky-700 uppercase tracking-wider">FX Exposure</div>
              <div className="text-lg font-extrabold text-slate-800 leading-tight">{(alerts.usdShare * 100).toFixed(1)}% USD</div>
              <div className="text-[10px] text-slate-500 truncate">
                {(alerts.eurShare * 100).toFixed(1)}% EUR · sales-mix risk on FX moves
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters — searchable comboboxes for Project / FG Part / Part No / Customer + Month + Date range */}
      <div className="filter-section p-4 bg-white border border-slate-200 rounded-xl">
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
          <SearchableSelect
            label="All Months"
            value={filters.month}
            options={getUniqueValues(data, 'month')}
            onChange={(v) => setFilters({ ...filters, month: v })}
            width="w-36"
          />

          <DateRangeFilter
            from={filters.dateFrom}
            to={filters.dateTo}
            onChange={({ from, to }) => setFilters({ ...filters, dateFrom: from, dateTo: to })}
          />

          <button
            onClick={clearFilters}
            className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-200 flex items-center gap-1 cursor-pointer"
          >
            <X className="w-4 h-4" /> Clear
          </button>

          <span className="ml-auto text-xs text-slate-500 shrink-0">
            Showing <b className="text-slate-700">{filteredData.length.toLocaleString()}</b> of {data.length.toLocaleString()} invoice rows
          </span>
        </div>
      </div>

      {/* Variance Cards — 4 uniform cards: BOM / RM / OS / Projected BOM */}
      {kpi && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <VarianceCard
            title="Total BOM Cost"
            actualLabel="ACTUAL"  budgetLabel="BUDGET"
            actual={kpi.bomActual} budget={kpi.bomBudget}
            variance={kpi.bomVar} variancePct={kpi.bomVarPct}
            accent="amber" format={format} formatVar={formatVar}
          />
          <VarianceCard
            title="Raw Material Cost"
            actualLabel="ACTUAL"  budgetLabel="BUDGET"
            actual={kpi.rmActual}  budget={kpi.rmBudget}
            variance={kpi.rmVar}   variancePct={kpi.rmVarPct}
            accent="violet" format={format} formatVar={formatVar}
          />
          <VarianceCard
            title="Outsourcing Cost"
            actualLabel="ACTUAL"  budgetLabel="BUDGET"
            actual={kpi.osActual} budget={kpi.osBudget}
            variance={kpi.osVar}  variancePct={kpi.osVarPct}
            accent="cyan" format={format} formatVar={formatVar}
          />
          <VarianceCard
            title="Projected BOM"
            actualLabel="PROJ ACTUAL"  budgetLabel="PROJ BUDGET"
            actual={kpi.projBomActual} budget={kpi.projBomBudget}
            variance={kpi.projVar}     variancePct={kpi.projVarPct}
            accent="indigo" format={format} formatVar={formatVar}
          />
        </div>
      )}

      {/* Quantity card — full-width hero showing 664 unique FG Parts split by Σ BOM Variance */}
      {kpi && (
        <div className="bg-white border border-slate-200 rounded-2xl border-t-[3px] border-t-sky-500 p-5">
          <div className="flex flex-col lg:flex-row lg:items-center gap-5">
            {/* Total */}
            <div className="lg:w-56 lg:border-r lg:border-slate-200 lg:pr-5">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Parts</div>
              <div className="flex items-baseline gap-2">
                <div className="text-4xl font-extrabold text-sky-600">{fgSplit.total.toLocaleString()}</div>
                <div className="text-[11px] text-slate-500">unique FG Parts</div>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Grouped from {(filteredData.length || data.length).toLocaleString()} invoice rows</div>
            </div>

            {/* Saved + Over Budget mini-cards */}
            <div className="flex-1 grid grid-cols-2 gap-3">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-green-700 font-bold tracking-wider">SAVED</span>
                  <span className="text-[10px] text-green-700 font-semibold">{fgPosPct.toFixed(1)}%</span>
                </div>
                <div className="text-2xl font-extrabold text-green-600">{fgSplit.positive.toLocaleString()}</div>
                <div className="text-[11px] text-slate-500">FG Parts under budget</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-red-600 font-bold tracking-wider">OVER BUDGET</span>
                  <span className="text-[10px] text-red-600 font-semibold">{fgNegPct.toFixed(1)}%</span>
                </div>
                <div className="text-2xl font-extrabold text-red-600">{fgSplit.negative.toLocaleString()}</div>
                <div className="text-[11px] text-slate-500">FG Parts over budget</div>
              </div>
            </div>

            {/* Split bar */}
            <div className="lg:w-56 lg:pl-5 lg:border-l lg:border-slate-200">
              <div className="text-[11px] text-slate-500 mb-2">Distribution</div>
              <div className="h-3 bg-slate-200 rounded-full overflow-hidden flex">
                <div className="h-full bg-green-500 transition-all" style={{ width: `${fgPosPct}%` }} />
                <div className="h-full bg-red-500 transition-all" style={{ width: `${fgNegPct}%` }} />
              </div>
              <div className="flex justify-between text-[11px] mt-2">
                <span className="text-green-600 font-semibold">+{fgSplit.positive}</span>
                {fgSplit.zero > 0 && <span className="text-slate-400">{fgSplit.zero} neutral</span>}
                <span className="text-red-600 font-semibold">−{fgSplit.negative}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Summary — sales-register totals straight from the upload */}
      {kpi && (
        <div className="bg-white border border-slate-200 rounded-2xl border-t-[3px] border-t-emerald-500 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Invoice Summary</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Raw sales register · FY 2025-26</div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">From sales register</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                <Hash className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Invoice Qty</div>
                <div className="text-lg font-extrabold text-slate-800 leading-tight whitespace-nowrap">{kpi.totalInvoiceQty.toLocaleString('en-IN')}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3">
              <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                <IndianRupee className="w-4 h-4 text-blue-600" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Invoice Value (INR)</div>
                <div className="text-lg font-extrabold text-blue-700 leading-tight whitespace-nowrap">{formatCurrency(kpi.totalSales, 'INR', fxRate)}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3">
              <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                <DollarSign className="w-4 h-4 text-amber-600" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Invoice Value (USD)</div>
                <div className="text-lg font-extrabold text-amber-700 leading-tight whitespace-nowrap">${kpi.totalInvoiceUSD.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3">
              <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-violet-600" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Unique Invoices</div>
                <div className="text-lg font-extrabold text-violet-700 leading-tight whitespace-nowrap">{kpi.uniqueInvoices.toLocaleString('en-IN')}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contribution Margin — Actual vs Budgeted profitability per unit
          Convention: Variance = Actual − Budget (positive = above budget = good) */}
      {kpi && (() => {
        const marginGood = kpi.marginVar >= 0;
        const marginColor = marginGood ? 'text-green-600' : 'text-red-600';
        return (
          <div className="bg-white border border-slate-200 rounded-2xl border-t-[3px] border-t-rose-500 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Contribution Margin</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Per-unit profit (PO Price − BOM Cost) summed across rows</div>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold whitespace-nowrap ${marginGood ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {marginGood ? 'Above Budget' : 'Below Budget'}
              </span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-xl p-3">
                <div className="w-9 h-9 rounded-lg bg-rose-100 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4 text-rose-600" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] text-rose-700 font-semibold uppercase tracking-wider">Actual Margin</div>
                  <div className="text-lg font-extrabold text-rose-700 leading-tight whitespace-nowrap">{format(kpi.marginActual)}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-3">
                <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                  <Target className="w-4 h-4 text-green-600" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] text-green-700 font-semibold uppercase tracking-wider">Budgeted Margin</div>
                  <div className="text-lg font-extrabold text-green-700 leading-tight whitespace-nowrap">{format(kpi.marginBudget)}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${marginGood ? 'bg-green-100' : 'bg-red-100'}`}>
                  <Activity className={`w-4 h-4 ${marginGood ? 'text-green-600' : 'text-red-600'}`} />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Variance</div>
                  <div className={`text-lg font-extrabold leading-tight whitespace-nowrap ${marginColor}`}>{formatVar(kpi.marginVar)}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${marginGood ? 'bg-green-100' : 'bg-red-100'}`}>
                  <Percent className={`w-4 h-4 ${marginGood ? 'text-green-600' : 'text-red-600'}`} />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Variance %</div>
                  <div className={`text-lg font-extrabold leading-tight whitespace-nowrap ${marginColor}`}>{formatPercent(kpi.marginVarPct)}</div>
                </div>
              </div>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${marginGood ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${Math.min(Math.abs(kpi.marginVarPct * 100), 100)}%` }} />
            </div>
          </div>
        );
      })()}

      {/* KPI Strip — 7 metrics per spec */}
      {kpi && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          <div className="bg-white border border-slate-200 rounded-xl p-4 border-t-[3px] border-t-blue-500">
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Parts</div>
            <div className="text-2xl font-extrabold text-blue-600 leading-tight">{kpi.totalParts.toLocaleString('en-IN')}</div>
            <div className="text-[10px] text-slate-400 mt-1">unique FG Parts</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 border-t-[3px] border-t-emerald-500">
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Sales 25-26</div>
            <div className="text-xl font-extrabold text-emerald-700 leading-tight whitespace-nowrap">{format(kpi.totalSales)}</div>
            <div className="text-[10px] text-slate-400 mt-1">{currency} · invoice value</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 border-t-[3px] border-t-sky-500">
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Avg LBP RM%</div>
            <div className="text-2xl font-extrabold text-sky-600 leading-tight">{kpi.avgLbpPct.toFixed(2)}%</div>
            <div className="text-[10px] text-slate-400 mt-1">RM LBP ÷ PO Price</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 border-t-[3px] border-t-violet-500">
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Avg MAP RM%</div>
            <div className="text-2xl font-extrabold text-violet-600 leading-tight">{kpi.avgMapPct.toFixed(2)}%</div>
            <div className="text-[10px] text-slate-400 mt-1">RM MAP ÷ PO Price</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 border-t-[3px] border-t-cyan-500">
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Avg OS%</div>
            <div className="text-2xl font-extrabold text-cyan-600 leading-tight">{kpi.avgOsPct.toFixed(2)}%</div>
            <div className="text-[10px] text-slate-400 mt-1">OS ÷ PO Price</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 border-t-[3px] border-t-amber-500">
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Avg BOM%</div>
            <div className="text-2xl font-extrabold text-amber-600 leading-tight">{kpi.avgBomPct.toFixed(2)}%</div>
            <div className="text-[10px] text-slate-400 mt-1">BOM ÷ PO Price</div>
          </div>
          <div className={`bg-white border border-slate-200 rounded-xl p-4 border-t-[3px] ${kpi.bomVar >= 0 ? 'border-t-green-500' : 'border-t-red-500'}`}>
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Actual vs Budget</div>
            <div className={`text-lg font-extrabold leading-tight whitespace-nowrap ${kpi.bomVar >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatVar(kpi.bomVar)}
            </div>
            <span className={`inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${kpi.bomVar >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {kpi.bomVar >= 0 ? 'Under Budget' : 'Over Budget'}
            </span>
          </div>
        </div>
      )}

      {/* Monthly Trend — Σ BOM Actual vs Σ BOM Budget per month (col C) */}
      {monthlySeries.length > 1 && (
        <div className="bg-white border border-slate-200 rounded-2xl border-t-[3px] border-t-blue-500 p-5">
          <div className="flex items-start justify-between mb-4 gap-3">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Monthly Trend</div>
              <div className="text-[11px] text-slate-400 mt-0.5">BOM Actual vs Budget by month · {monthlySeries.length} months in view</div>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /><span className="text-slate-600 font-medium">Actual</span></span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /><span className="text-slate-600 font-medium">Budget</span></span>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlySeries} margin={{ top: 5, right: 16, left: -8, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tickFormatter={shortMoney} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  formatter={(v) => format(v)}
                  labelStyle={{ fontWeight: 600, fontSize: 12 }}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                />
                <Legend wrapperStyle={{ display: 'none' }} />
                <Line type="monotone" dataKey="actual" name="Actual"  stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="budget" name="Budget"  stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Cost Composition — RM vs OS share of Total BOM, Actual & Budget side by side */}
      {kpi && (kpi.bomActual > 0 || kpi.bomBudget > 0) && (() => {
        const actualPie = [
          { name: 'Raw Material', value: kpi.rmActual, color: '#3b82f6' },
          { name: 'Outsourcing',  value: kpi.osActual, color: '#f59e0b' },
        ];
        const budgetPie = [
          { name: 'Raw Material', value: kpi.rmBudget, color: '#10b981' },
          { name: 'Outsourcing',  value: kpi.osBudget, color: '#06b6d4' },
        ];
        const pct = (n, total) => (total ? ((n / total) * 100).toFixed(1) : '0') + '%';
        return (
          <div className="bg-white border border-slate-200 rounded-2xl border-t-[3px] border-t-amber-500 p-5">
            <div className="flex items-start justify-between mb-4 gap-3">
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cost Composition</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Where the BOM cost goes — Raw Material vs Outsourcing</div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Actual */}
              <div className="border border-slate-200 rounded-xl p-4">
                <div className="text-center mb-2">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Actual</div>
                  <div className="text-base font-extrabold text-slate-800 mt-0.5">{format(kpi.bomActual)}</div>
                </div>
                <div className="h-44 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={actualPie} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={2} dataKey="value" stroke="none">
                        {actualPie.map((e) => <Cell key={e.name} fill={e.color} />)}
                      </Pie>
                      <Tooltip formatter={(v, n) => [`${format(v)} (${pct(v, kpi.bomActual)})`, n]} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {actualPie.map((seg) => (
                    <div key={seg.name} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: seg.color }} />
                        <span className="text-[11px] text-slate-600 truncate">{seg.name}</span>
                      </div>
                      <span className="text-[11px] font-bold text-slate-800 whitespace-nowrap">{pct(seg.value, kpi.bomActual)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Budget */}
              <div className="border border-slate-200 rounded-xl p-4">
                <div className="text-center mb-2">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Budget</div>
                  <div className="text-base font-extrabold text-slate-800 mt-0.5">{format(kpi.bomBudget)}</div>
                </div>
                <div className="h-44 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={budgetPie} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={2} dataKey="value" stroke="none">
                        {budgetPie.map((e) => <Cell key={e.name} fill={e.color} />)}
                      </Pie>
                      <Tooltip formatter={(v, n) => [`${format(v)} (${pct(v, kpi.bomBudget)})`, n]} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {budgetPie.map((seg) => (
                    <div key={seg.name} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: seg.color }} />
                        <span className="text-[11px] text-slate-600 truncate">{seg.name}</span>
                      </div>
                      <span className="text-[11px] font-bold text-slate-800 whitespace-nowrap">{pct(seg.value, kpi.bomBudget)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Project-wise BOM — Σ Actual vs Σ Budget per project (col B), sorted by absolute variance */}
      {projectSeries.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl border-t-[3px] border-t-violet-500 p-5">
          <div className="flex items-start justify-between mb-4 gap-3">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Project-wise BOM</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{projectSeries.length} project{projectSeries.length === 1 ? '' : 's'} · sorted by variance magnitude</div>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /><span className="text-slate-600 font-medium">Actual</span></span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /><span className="text-slate-600 font-medium">Budget</span></span>
            </div>
          </div>
          <div style={{ height: Math.max(220, projectSeries.length * 42) + 'px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectSeries} layout="vertical" margin={{ top: 5, right: 24, left: 16, bottom: 5 }} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" tickFormatter={shortMoney} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis type="category" dataKey="project" tick={{ fontSize: 11, fill: '#475569', fontWeight: 500 }} width={90} />
                <Tooltip
                  formatter={(v, name) => [format(v), name]}
                  labelStyle={{ fontWeight: 600, fontSize: 12 }}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                  cursor={{ fill: '#f1f5f9' }}
                />
                <Bar dataKey="actual" name="Actual" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                <Bar dataKey="budget" name="Budget" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Per-project variance summary chips */}
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 text-[11px]">
            {projectSeries.slice(0, 8).map((p) => (
              <div key={p.project} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                <span className="font-semibold text-slate-700 truncate mr-2">{p.project}</span>
                <span className={`font-bold whitespace-nowrap ${p.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercent(p.variancePct)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Variance distribution — FG Parts bucketed by Σ variance % per part */}
      {varHist.totalParts > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl border-t-[3px] border-t-rose-500 p-5">
          <div className="flex items-start justify-between mb-4 gap-3">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Variance Distribution</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {varHist.totalParts.toLocaleString()} FG Parts grouped by BOM variance % — left = over budget, right = under budget
              </div>
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={varHist.buckets} margin={{ top: 5, right: 16, left: -8, bottom: 5 }} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b' }} interval={0} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip
                  formatter={(v, n, p) => [`${v} FG Parts`, p.payload.tone]}
                  labelStyle={{ fontWeight: 600, fontSize: 12 }}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                  cursor={{ fill: '#f1f5f9' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {varHist.buckets.map((b) => <Cell key={b.key} fill={b.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mt-3">
            {varHist.buckets.map((b) => (
              <div key={b.key} className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-center">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: b.color }} />
                  <span className="text-[10px] text-slate-500 font-semibold">{b.label}</span>
                </div>
                <div className="text-base font-extrabold text-slate-800">{b.count}</div>
                <div className="text-[9px] text-slate-400">{b.tone}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Customers — top 10 customers (col G) by Invoice Value INR */}
      {topCustomers.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl border-t-[3px] border-t-fuchsia-500 p-5">
          <div className="flex items-start justify-between mb-4 gap-3">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Top Customers</div>
              <div className="text-[11px] text-slate-400 mt-0.5">By total invoice value · variance % shows BOM cost performance for each customer</div>
            </div>
          </div>
          <div className="space-y-2">
            {topCustomers.map((c, i) => {
              const maxSales = topCustomers[0]?.sales || 1;
              const widthPct = (c.sales / maxSales) * 100;
              const varGood = c.variance >= 0;
              return (
                <div key={c.customer} className="flex items-center gap-3">
                  <span className="w-5 text-[10px] font-bold text-slate-400 text-right shrink-0">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1 gap-2">
                      <span className="text-xs font-semibold text-slate-700 truncate">{c.customer}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${varGood ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {formatPercent(c.variancePct)}
                        </span>
                        <span className="text-xs font-extrabold text-slate-800 whitespace-nowrap w-24 text-right">{format(c.sales)}</span>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-fuchsia-400 to-fuchsia-600 rounded-full transition-all" style={{ width: `${widthPct}%` }} />
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">{c.rows.toLocaleString()} invoice{c.rows === 1 ? '' : 's'}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top 10 Lists — grouped by FG Part No (col L), Σ BOM Variance per FG Part */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top 10 Saved — biggest positive Σ variance */}
        <div className="bg-white border border-green-200 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 bg-green-50 border-b border-green-200 flex items-center justify-between gap-2">
            <div>
              <div className="text-sm font-bold text-green-700">Top 10 — Saved</div>
              <div className="text-[10px] text-green-600">FG Parts with the largest savings (Budget − Actual &gt; 0)</div>
            </div>
            <span className="text-[10px] text-green-700 font-semibold bg-white border border-green-200 rounded-full px-2 py-0.5">FY 25-26</span>
          </div>
          <div className="divide-y divide-slate-100">
            {getTopFgParts(filteredData, 'gain').map((r, i) => (
              <div key={r.fg_part} className="px-4 py-2.5 flex items-center justify-between hover:bg-slate-50">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-5 text-[10px] font-bold text-slate-400 text-right shrink-0">#{i + 1}</span>
                  <span className={`w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-bold text-white shrink-0 ${['bg-blue-500', 'bg-green-500', 'bg-amber-500', 'bg-purple-500', 'bg-cyan-500'][i % 5]}`}>
                    {r.project?.charAt(0) || '?'}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-blue-600 truncate">{r.fg_part}</div>
                    <div className="text-[10px] text-slate-400 truncate">{r.project} · {r.rows} invoice{r.rows === 1 ? '' : 's'}</div>
                  </div>
                </div>
                <span className="text-sm font-bold text-green-600 whitespace-nowrap">{formatVar(r.variance)}</span>
              </div>
            ))}
            {getTopFgParts(filteredData, 'gain').length === 0 && (
              <div className="px-4 py-6 text-center text-xs text-slate-400">No FG Parts under budget for the current filter.</div>
            )}
          </div>
        </div>

        {/* Top 10 Over Budget — biggest negative Σ variance */}
        <div className="bg-white border border-red-200 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 bg-red-50 border-b border-red-200 flex items-center justify-between gap-2">
            <div>
              <div className="text-sm font-bold text-red-700">Top 10 — Over Budget</div>
              <div className="text-[10px] text-red-600">FG Parts with the largest overruns (Budget − Actual &lt; 0)</div>
            </div>
            <span className="text-[10px] text-red-700 font-semibold bg-white border border-red-200 rounded-full px-2 py-0.5">FY 25-26</span>
          </div>
          <div className="divide-y divide-slate-100">
            {getTopFgParts(filteredData, 'loss').map((r, i) => (
              <div key={r.fg_part} className="px-4 py-2.5 flex items-center justify-between hover:bg-slate-50">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-5 text-[10px] font-bold text-slate-400 text-right shrink-0">#{i + 1}</span>
                  <span className={`w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-bold text-white shrink-0 ${['bg-blue-500', 'bg-green-500', 'bg-amber-500', 'bg-purple-500', 'bg-cyan-500'][i % 5]}`}>
                    {r.project?.charAt(0) || '?'}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-blue-600 truncate">{r.fg_part}</div>
                    <div className="text-[10px] text-slate-400 truncate">{r.project} · {r.rows} invoice{r.rows === 1 ? '' : 's'}</div>
                  </div>
                </div>
                <span className="text-sm font-bold text-red-600 whitespace-nowrap">{formatVar(r.variance)}</span>
              </div>
            ))}
            {getTopFgParts(filteredData, 'loss').length === 0 && (
              <div className="px-4 py-6 text-center text-xs text-slate-400">No FG Parts over budget for the current filter.</div>
            )}
          </div>
        </div>
      </div>

      {/* Margin Top 10 — Most Profitable & Loss-Making FG Parts (by Σ margin_actual) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Most Profitable */}
        <div className="bg-white border border-emerald-200 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-200 flex items-center justify-between gap-2">
            <div>
              <div className="text-sm font-bold text-emerald-700">Top 10 — Most Profitable</div>
              <div className="text-[10px] text-emerald-600">FG Parts with the largest Actual Margin (Σ PO Price − BOM Actual)</div>
            </div>
            <span className="text-[10px] text-emerald-700 font-semibold bg-white border border-emerald-200 rounded-full px-2 py-0.5">Margin</span>
          </div>
          <div className="divide-y divide-slate-100">
            {getTopMarginFgParts(filteredData.length ? filteredData : data, 'profit').map((r, i) => (
              <div key={r.fg_part} className="px-4 py-2.5 flex items-center justify-between hover:bg-slate-50">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-5 text-[10px] font-bold text-slate-400 text-right shrink-0">#{i + 1}</span>
                  <span className={`w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-bold text-white shrink-0 ${['bg-blue-500', 'bg-green-500', 'bg-amber-500', 'bg-purple-500', 'bg-cyan-500'][i % 5]}`}>
                    {r.project?.charAt(0) || '?'}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-blue-600 truncate">{r.fg_part}</div>
                    <div className="text-[10px] text-slate-400 truncate">{r.project} · margin {formatPercent(r.marginPct)}</div>
                  </div>
                </div>
                <span className="text-sm font-bold text-emerald-600 whitespace-nowrap">{format(r.margin)}</span>
              </div>
            ))}
            {getTopMarginFgParts(filteredData.length ? filteredData : data, 'profit').length === 0 && (
              <div className="px-4 py-6 text-center text-xs text-slate-400">No FG Parts to rank.</div>
            )}
          </div>
        </div>

        {/* Least Profitable / Loss-Making */}
        <div className="bg-white border border-rose-200 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 bg-rose-50 border-b border-rose-200 flex items-center justify-between gap-2">
            <div>
              <div className="text-sm font-bold text-rose-700">Top 10 — Loss-Making / Lowest Margin</div>
              <div className="text-[10px] text-rose-600">FG Parts with the smallest Actual Margin (or negative)</div>
            </div>
            <span className="text-[10px] text-rose-700 font-semibold bg-white border border-rose-200 rounded-full px-2 py-0.5">Margin</span>
          </div>
          <div className="divide-y divide-slate-100">
            {getTopMarginFgParts(filteredData.length ? filteredData : data, 'loss').map((r, i) => (
              <div key={r.fg_part} className="px-4 py-2.5 flex items-center justify-between hover:bg-slate-50">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-5 text-[10px] font-bold text-slate-400 text-right shrink-0">#{i + 1}</span>
                  <span className={`w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-bold text-white shrink-0 ${['bg-blue-500', 'bg-green-500', 'bg-amber-500', 'bg-purple-500', 'bg-cyan-500'][i % 5]}`}>
                    {r.project?.charAt(0) || '?'}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-blue-600 truncate">{r.fg_part}</div>
                    <div className="text-[10px] text-slate-400 truncate">{r.project} · margin {formatPercent(r.marginPct)}</div>
                  </div>
                </div>
                <span className={`text-sm font-bold whitespace-nowrap ${r.margin >= 0 ? 'text-amber-600' : 'text-rose-600'}`}>{format(r.margin)}</span>
              </div>
            ))}
            {getTopMarginFgParts(filteredData.length ? filteredData : data, 'loss').length === 0 && (
              <div className="px-4 py-6 text-center text-xs text-slate-400">No FG Parts to rank.</div>
            )}
          </div>
        </div>
      </div>

      {/* Master FG Parts Table — one row per FG Part with all key metrics */}
      <FgPartsTable rows={filteredData.length ? filteredData : data} currency={currency} fxRate={fxRate} />
    </div>
  );
};

export default DashboardPage;
