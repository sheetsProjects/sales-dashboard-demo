import { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, Cell, ScatterChart, Scatter, ZAxis,
} from 'recharts';
import { ArrowUpDown, ArrowUp, ArrowDown, Search } from 'lucide-react';

import DataEmptyState from './DataEmptyState';
import FiltersBar from './FiltersBar';
import Card from './Card';
import {
  filterSales, topMakes, topModels, salesByBody, salesByFuel, salesByCondition,
  fmtUSD, fmtUSDFull, fmtNum, fmtPct, getColorByRank,
} from '../../utils/helpers';

const PAGE_SIZE = 25;

const AnalysisPage = ({ workbook, filters, setFilters, clearFilters, onUploadClick }) => {
  const sales = workbook.sales;

  // All hooks must run every render — the empty-state early return goes AFTER them.
  const [sortKey, setSortKey] = useState('saleDate');
  const [sortDir, setSortDir] = useState('desc');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => filterSales(sales, filters), [sales, filters]);
  const makes    = useMemo(() => topMakes(filtered, 10), [filtered]);
  const models   = useMemo(() => topModels(filtered, 10), [filtered]);
  const byBody   = useMemo(() => salesByBody(filtered), [filtered]);
  const byFuel   = useMemo(() => salesByFuel(filtered), [filtered]);
  const byCond   = useMemo(() => salesByCondition(filtered), [filtered]);

  const tableRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = filtered;
    if (q) {
      rows = rows.filter((r) =>
        r.saleId.toLowerCase().includes(q) ||
        r.vin.toLowerCase().includes(q) ||
        r.make.toLowerCase().includes(q) ||
        r.model.toLowerCase().includes(q) ||
        r.salesRep.toLowerCase().includes(q) ||
        r.customerName.toLowerCase().includes(q),
      );
    }
    return [...rows].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (av === bv) return 0;
      const cmp = av > bv ? 1 : -1;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, query, sortKey, sortDir]);

  if (!sales.length) return <DataEmptyState title="No sales data yet" onUploadClick={onUploadClick} />;

  const toggleSort = (k) => {
    if (sortKey === k) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortKey(k); setSortDir('desc'); }
    setPage(0);
  };

  const pageCount = Math.max(1, Math.ceil(tableRows.length / PAGE_SIZE));
  const pageRows  = tableRows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="space-y-4">
      <FiltersBar filters={filters} setFilters={setFilters} clearFilters={clearFilters} pool={sales} />

      {/* Summary counts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryTile label="Units in view"        value={fmtNum(filtered.length)} />
        <SummaryTile label="Revenue in view"      value={fmtUSD(filtered.reduce((s, r) => s + r.salePrice, 0))} />
        <SummaryTile label="Distinct makes"       value={fmtNum(new Set(filtered.map(r => r.make)).size)} />
        <SummaryTile label="Distinct models"      value={fmtNum(new Set(filtered.map(r => `${r.make}|${r.model}`)).size)} />
      </div>

      {/* Top makes + models */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Top Makes" subtitle="By revenue">
          <ChartBox>
            <BarChart data={makes} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" tickFormatter={(v) => fmtUSD(v)} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="make" tick={{ fontSize: 11 }} width={90} />
              <Tooltip formatter={(v) => fmtUSDFull(v)} />
              <Bar dataKey="revenue" radius={[0, 6, 6, 0]}>
                {makes.map((_, i) => (<Cell key={i} fill={getColorByRank(i)} />))}
              </Bar>
            </BarChart>
          </ChartBox>
        </Card>

        <Card title="Top Models" subtitle="By revenue">
          <ChartBox>
            <BarChart data={models} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" tickFormatter={(v) => fmtUSD(v)} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={140} />
              <Tooltip formatter={(v) => fmtUSDFull(v)} />
              <Bar dataKey="revenue" radius={[0, 6, 6, 0]}>
                {models.map((_, i) => (<Cell key={i} fill={getColorByRank(i)} />))}
              </Bar>
            </BarChart>
          </ChartBox>
        </Card>
      </div>

      {/* Body / Fuel / Condition */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <DimensionCard title="By Body Type"  rows={byBody}  labelKey="bodyType" />
        <DimensionCard title="By Fuel Type"  rows={byFuel}  labelKey="fuelType" />
        <DimensionCard title="By Condition"  rows={byCond}  labelKey="condition" />
      </div>

      {/* Mileage vs Sale Price scatter */}
      <Card title="Mileage vs. Sale Price" subtitle="Every sale in the current filter">
        <div style={{ width: '100%', height: 320 }}>
          <ResponsiveContainer>
            <ScatterChart margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" dataKey="mileage" name="Mileage" tickFormatter={(v) => `${Math.round(v / 1000)}K`} tick={{ fontSize: 11 }} />
              <YAxis type="number" dataKey="salePrice" name="Sale price" tickFormatter={(v) => fmtUSD(v)} tick={{ fontSize: 11 }} width={60} />
              <ZAxis type="number" range={[20, 20]} />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                formatter={(v, name) => name === 'Mileage' ? `${fmtNum(v)} mi` : fmtUSDFull(v)}
              />
              <Scatter data={filtered} fill="#3b82f6" fillOpacity={0.55} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Transactions table */}
      <Card
        title="Transactions"
        subtitle={`${fmtNum(tableRows.length)} matching rows · page ${page + 1} of ${pageCount}`}
        right={
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(0); }}
              placeholder="Search VIN, make, rep, customer…"
              className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md w-64 focus:outline-none focus:border-blue-400"
            />
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-slate-500 border-b border-slate-100">
              <tr>
                <Th k="saleId"       label="Sale ID"    sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <Th k="saleDate"     label="Date"       sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <Th k="location"     label="Location"   sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <Th k="make"         label="Vehicle"    sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <Th k="mileage"      label="Mileage"    align="right" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <Th k="salePrice"    label="Sale $"     align="right" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <Th k="profit"       label="Profit"     align="right" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <Th k="marginPct"    label="Margin"     align="right" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <Th k="salesChannel" label="Channel"    sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <Th k="salesRep"     label="Rep"        sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              </tr>
            </thead>
            <tbody>
              {pageRows.map((r) => (
                <tr key={r._id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="py-2 px-2 font-mono text-xs text-slate-500">{r.saleId}</td>
                  <td className="py-2 px-2 text-slate-600">{r.saleDate}</td>
                  <td className="py-2 px-2">{r.location}</td>
                  <td className="py-2 px-2">{r.year} {r.make} {r.model}</td>
                  <td className="py-2 px-2 text-right text-slate-600">{fmtNum(r.mileage)}</td>
                  <td className="py-2 px-2 text-right font-semibold text-slate-800">{fmtUSDFull(r.salePrice)}</td>
                  <td className={`py-2 px-2 text-right font-semibold ${r.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{fmtUSDFull(r.profit)}</td>
                  <td className="py-2 px-2 text-right text-slate-600">{fmtPct(r.marginPct)}</td>
                  <td className="py-2 px-2 text-slate-600">{r.salesChannel}</td>
                  <td className="py-2 px-2 text-slate-600">{r.salesRep}</td>
                </tr>
              ))}
              {pageRows.length === 0 && (
                <tr><td colSpan={10} className="py-6 text-center text-sm text-slate-400">No rows match this filter.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {pageCount > 1 && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-3 py-1 text-xs font-semibold rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              ← Previous
            </button>
            <span className="text-xs text-slate-500">Page {page + 1} of {pageCount}</span>
            <button
              onClick={() => setPage(Math.min(pageCount - 1, page + 1))}
              disabled={page >= pageCount - 1}
              className="px-3 py-1 text-xs font-semibold rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        )}
      </Card>
    </div>
  );
};

const SummaryTile = ({ label, value }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-3">
    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{label}</div>
    <div className="text-xl font-bold text-slate-800 mt-1">{value}</div>
  </div>
);

const ChartBox = ({ children }) => (
  <div style={{ width: '100%', height: 300 }}>
    <ResponsiveContainer>{children}</ResponsiveContainer>
  </div>
);

const DimensionCard = ({ title, rows, labelKey }) => (
  <Card title={title} subtitle={`${rows.length} categories`}>
    <ChartBox>
      <BarChart data={rows} layout="vertical" margin={{ top: 5, right: 15, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis type="number" tickFormatter={(v) => fmtUSD(v)} tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey={labelKey} tick={{ fontSize: 11 }} width={90} />
        <Tooltip formatter={(v) => fmtUSDFull(v)} />
        <Legend />
        <Bar dataKey="revenue" name="Revenue" radius={[0, 6, 6, 0]}>
          {rows.map((_, i) => (<Cell key={i} fill={getColorByRank(i)} />))}
        </Bar>
      </BarChart>
    </ChartBox>
  </Card>
);

const Th = ({ k, label, align = 'left', sortKey, sortDir, onSort }) => {
  const active = sortKey === k;
  const Icon = active ? (sortDir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <th className={`text-${align} py-2 px-2 font-semibold`}>
      <button
        onClick={() => onSort(k)}
        className={`inline-flex items-center gap-1 hover:text-blue-600 cursor-pointer ${active ? 'text-blue-600' : ''}`}
      >
        {label}
        <Icon className="w-3 h-3" />
      </button>
    </th>
  );
};

export default AnalysisPage;
