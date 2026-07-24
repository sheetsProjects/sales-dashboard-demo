import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency, formatVariance, convertCurrency } from '../../utils/helpers';

const CategoryPage = ({ selectedCategory, categories, categoryData, currency, fxRate }) => {
  const category = categories.find(c => c.id === selectedCategory);
  const catData = categoryData[selectedCategory];

  if (!category || !catData) return null;

  const format = (val) => formatCurrency(val, currency, fxRate);
  const formatVar = (val) => formatVariance(val, currency, fxRate);
  const cv = (val) => convertCurrency(val, currency, fxRate);

  const impactColors = {
    'Critical': 'bg-red-100 text-red-700 border-red-300',
    'High': 'bg-orange-100 text-orange-700 border-orange-300',
    'Positive': 'bg-green-100 text-green-700 border-green-300',
    'Medium': 'bg-blue-100 text-blue-700 border-blue-300'
  };

  return (
    <div className="space-y-6">
      {/* Insight Header */}
      <div className="bg-gradient-to-br from-white to-blue-50 border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-2xl font-bold text-slate-800">{category.title}</h2>
              {category.impact && (
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${impactColors[category.impact] || 'bg-slate-100 text-slate-700'}`}>
                  {category.impact} Impact
                </span>
              )}
            </div>
            {category.query && (
              <div className="bg-white/80 border border-blue-200 rounded-lg p-3 mb-3">
                <div className="text-xs font-semibold text-blue-600 mb-1">Management Query</div>
                <div className="text-sm text-slate-700 italic">"{category.query}"</div>
              </div>
            )}
            {category.actionable && (
              <div className="flex items-start gap-2 text-sm text-slate-600">
                <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span><strong>Recommendation:</strong> {category.actionable}</span>
              </div>
            )}
          </div>
          <div className="text-right ml-6">
            <div className="text-3xl font-extrabold text-blue-600">{catData.summary.totalParts}</div>
            <div className="text-sm text-slate-500">Parts Affected</div>
            {category.metric && (
              <div className="mt-2 text-lg font-bold text-slate-700">{category.metric}</div>
            )}
          </div>
        </div>
      </div>

      {/* Category KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 border-t-[3px] border-t-amber-500">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Total BOM</div>
          <div className="text-xl font-extrabold text-amber-500">{format(catData.summary.totalBOM)}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 border-t-[3px] border-t-blue-500">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Raw Material</div>
          <div className="text-xl font-extrabold text-blue-500">{format(catData.summary.totalRM)}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 border-t-[3px] border-t-purple-500">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Outsourcing</div>
          <div className="text-xl font-extrabold text-purple-500">{format(catData.summary.totalOS)}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 border-t-[3px] border-t-green-500">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Avg Variance</div>
          <div className={`text-xl font-extrabold ${catData.summary.avgVariance < 0 ? 'text-red-500' : 'text-green-500'}`}>
            {formatVar(catData.summary.avgVariance)}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        {/* Cost Breakdown */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h3 className="font-bold text-slate-800 mb-4">Cost Breakdown</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={catData.breakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {catData.breakdown.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => format(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {catData.breakdown.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span>{item.name}: {format(item.value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Parts */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h3 className="font-bold text-slate-800 mb-4">Top Parts by BOM Cost</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={catData.topParts.slice(0, 5).map(r => ({
                  name: r.part_no?.slice(0, 10) || 'N/A',
                  value: cv(r.total_bom || 0)
                }))}
                layout="vertical"
                barSize={20}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(v) => format(v * (currency === 'USD' ? fxRate : 1))} />
                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => format(v * (currency === 'USD' ? fxRate : 1))} />
                <Bar dataKey="value" fill={category.color || '#3B82F6'} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Parts Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h3 className="font-bold text-slate-800">Parts Analyzed in this Insight</h3>
        </div>
        <div className="overflow-x-auto max-h-80">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Part No</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Project</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">BOM Cost</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">RM Cost</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">OS Cost</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Variance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {catData.rows.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-blue-600">{r.part_no}</td>
                  <td className="px-4 py-3">{r.project}</td>
                  <td className="px-4 py-3 text-right font-medium">{format(r.total_bom)}</td>
                  <td className="px-4 py-3 text-right">{format(r.total_rm)}</td>
                  <td className="px-4 py-3 text-right">{format(r.total_os)}</td>
                  <td className={`px-4 py-3 text-right font-bold ${r.avb_2526 < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatVar(r.avb_2526)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CategoryPage;
