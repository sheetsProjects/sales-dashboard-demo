import { useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  DollarSign, TrendingUp, Percent, Target, Clock, Star,
  Car, Store,
} from 'lucide-react';

import DataEmptyState from './DataEmptyState';
import FiltersBar from './FiltersBar';
import KpiTile from './KpiTile';
import Card from './Card';
import {
  filterSales, revenueByMonth, revenueByLocation, topMakes, channelMix,
  fmtUSD, fmtUSDFull, fmtNum, fmtPct, formatMonthKey, getColorByRank,
} from '../../utils/helpers';

const DashboardPage = ({ workbook, filters, setFilters, clearFilters, kpi, onUploadClick }) => {
  const sales = workbook.sales;

  // All hooks must run every render — the empty-state early return goes AFTER them.
  const filtered = useMemo(() => filterSales(sales, filters), [sales, filters]);
  const trend    = useMemo(() => revenueByMonth(filtered), [filtered]);
  const byBranch = useMemo(() => revenueByLocation(filtered), [filtered]);
  const makes    = useMemo(() => topMakes(filtered, 8), [filtered]);
  const channels = useMemo(() => channelMix(filtered), [filtered]);
  const topDeals = useMemo(
    () => [...filtered].sort((a, b) => b.profit - a.profit).slice(0, 10),
    [filtered],
  );

  if (!sales.length) {
    return <DataEmptyState title="No sales data yet" onUploadClick={onUploadClick} />;
  }

  return (
    <div className="space-y-4">
      <FiltersBar filters={filters} setFilters={setFilters} clearFilters={clearFilters} pool={sales} />

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiTile label="Total Revenue" value={fmtUSD(kpi?.totalRevenue)}   hint={fmtUSDFull(kpi?.totalRevenue)} tone="blue"   icon={DollarSign} />
        <KpiTile label="Total Profit"  value={fmtUSD(kpi?.totalProfit)}    hint={`Margin ${fmtPct(kpi?.avgMarginPct)}`} tone="green"  icon={TrendingUp} />
        <KpiTile label="Units Sold"    value={fmtNum(kpi?.unitsSold)}      hint={`Avg deal ${fmtUSD(kpi?.avgDealSize)}`} tone="cyan"   icon={Car} />
        <KpiTile
          label="Revenue vs Target"
          value={fmtPct(kpi?.revenueVsTargetPct)}
          hint={`${fmtUSD(kpi?.totalRevenue)} of ${fmtUSD(kpi?.revenueTarget)}`}
          tone={(kpi?.revenueVsTargetPct || 0) >= 100 ? 'green' : 'amber'}
          icon={Target}
        />
        <KpiTile label="Avg Days in Stock" value={(kpi?.avgDaysInInventory || 0).toFixed(0) + 'd'} hint="From acquisition to sale" tone="purple" icon={Clock} />
        <KpiTile label="Avg CSAT"      value={(kpi?.avgCSAT || 0).toFixed(2) + ' / 5'} hint={`${fmtNum(kpi?.unitsSold)} responses`} tone={((kpi?.avgCSAT || 0) >= 4 ? 'green' : 'amber')} icon={Star} />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title="Revenue & Profit Trend" subtitle="Monthly" className="lg:col-span-2">
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={trend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tickFormatter={formatMonthKey} tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => fmtUSD(v)} tick={{ fontSize: 11 }} width={60} />
                <Tooltip
                  formatter={(v, name) => [name === 'units' ? fmtNum(v) : fmtUSDFull(v), name]}
                  labelFormatter={(l) => formatMonthKey(l)}
                />
                <Legend />
                <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#3b82f6" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="profit"  name="Profit"  stroke="#22c55e" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Revenue by Branch" subtitle={`${byBranch.length} location${byBranch.length === 1 ? '' : 's'}`}>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={byBranch} layout="vertical" margin={{ top: 5, right: 15, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tickFormatter={(v) => fmtUSD(v)} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="location" tick={{ fontSize: 11 }} width={80} />
                <Tooltip formatter={(v) => fmtUSDFull(v)} />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 6, 6, 0]}>
                  {byBranch.map((_, i) => (<Cell key={i} fill={getColorByRank(i)} />))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title="Top Makes by Revenue" className="lg:col-span-2">
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={makes} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="make" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => fmtUSD(v)} tick={{ fontSize: 11 }} width={60} />
                <Tooltip
                  formatter={(v, name) => name === 'units' ? fmtNum(v) : fmtUSDFull(v)}
                />
                <Legend />
                <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                <Bar dataKey="profit"  name="Profit"  fill="#22c55e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Sales Channel Mix">
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={channels}
                  dataKey="units"
                  nameKey="channel"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={2}
                  label={(e) => `${e.channel} ${((e.share || 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                  fontSize={11}
                >
                  {channels.map((_, i) => (<Cell key={i} fill={getColorByRank(i)} />))}
                </Pie>
                <Tooltip formatter={(v, _, entry) => [`${fmtNum(v)} units · ${fmtUSDFull(entry.payload.revenue)}`, entry.payload.channel]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Top deals table */}
      <Card title="Top 10 Deals by Profit" subtitle="Highest-margin sales in the current filter" right={<Store className="w-4 h-4 text-slate-400" />}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-slate-500 border-b border-slate-100">
              <tr>
                <th className="text-left py-2 px-2 font-semibold">Sale ID</th>
                <th className="text-left py-2 px-2 font-semibold">Date</th>
                <th className="text-left py-2 px-2 font-semibold">Location</th>
                <th className="text-left py-2 px-2 font-semibold">Vehicle</th>
                <th className="text-right py-2 px-2 font-semibold">Sale $</th>
                <th className="text-right py-2 px-2 font-semibold">Profit</th>
                <th className="text-right py-2 px-2 font-semibold">Margin</th>
                <th className="text-left py-2 px-2 font-semibold">Rep</th>
              </tr>
            </thead>
            <tbody>
              {topDeals.map((r) => (
                <tr key={r._id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="py-2 px-2 font-mono text-xs text-slate-500">{r.saleId}</td>
                  <td className="py-2 px-2 text-slate-600">{r.saleDate}</td>
                  <td className="py-2 px-2">{r.location}</td>
                  <td className="py-2 px-2">{r.year} {r.make} {r.model}</td>
                  <td className="py-2 px-2 text-right font-semibold text-slate-800">{fmtUSDFull(r.salePrice)}</td>
                  <td className="py-2 px-2 text-right font-semibold text-emerald-600">{fmtUSDFull(r.profit)}</td>
                  <td className="py-2 px-2 text-right text-slate-600">{fmtPct(r.marginPct)}</td>
                  <td className="py-2 px-2 text-slate-600">{r.salesRep}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default DashboardPage;
