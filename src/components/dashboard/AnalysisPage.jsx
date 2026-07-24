import { BarChart2 } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency, convertCurrency, getCurrencySymbol, getProjectData, getCostBreakdown } from '../../utils/helpers';

const AnalysisPage = ({ data, kpi, currency, fxRate, onUploadClick }) => {
  const format = (val) => formatCurrency(val, currency, fxRate);
  const cv = (val) => convertCurrency(val, currency, fxRate);
  const sym = () => getCurrencySymbol(currency);

  if (!data.length) {
    return (
      <div className="text-center py-20">
        <BarChart2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-slate-600 mb-2">No Data for Analysis</h3>
        <p className="text-slate-500 mb-6">Upload data to see charts and analysis</p>
        <button onClick={onUploadClick} className="px-6 py-3 bg-cyan-500 text-white rounded-xl font-semibold hover:bg-cyan-600 cursor-pointer">
          Upload Excel
        </button>
      </div>
    );
  }

  const projectData = getProjectData(data, currency, fxRate);
  const costBreakdown = getCostBreakdown(kpi, currency, fxRate);

  // Calculate projected gain/loss for next year
  const projectedGainParts = data.filter(r => r.avb_2627 < 0);
  const projectedLossParts = data.filter(r => r.avb_2627 > 0);
  const projectedGain = projectedGainParts.reduce((s, r) => s + Math.abs(r.avb_2627), 0);
  const projectedLoss = projectedLossParts.reduce((s, r) => s + r.avb_2627, 0);

  return (
    <div className="space-y-6">
      {/* Top Stats Row */}
      <div className="grid grid-cols-3 gap-6">
        {/* Cost Health - Main Donut */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h3 className="font-bold text-slate-800 mb-1">Cost Health - RM vs OS</h3>
          <p className="text-xs text-slate-500 mb-4">Raw Material & Outsourcing share of Total BOM</p>
          <div className="h-48 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={costBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {costBreakdown.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-extrabold text-slate-800">{format(kpi?.totalBOM || 0)}</div>
                <div className="text-xs text-slate-500">Total BOM</div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <div>
                <div className="text-xs text-slate-500">Raw Material</div>
                <div className="text-sm font-bold text-blue-600">{format(kpi?.totalRM || 0)}</div>
                <div className="text-[10px] text-slate-400">{kpi?.totalBOM ? ((kpi.totalRM / kpi.totalBOM) * 100).toFixed(1) : 0}% of BOM</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <div>
                <div className="text-xs text-slate-500">Outsourcing</div>
                <div className="text-sm font-bold text-amber-600">{format(kpi?.totalOS || 0)}</div>
                <div className="text-[10px] text-slate-400">{kpi?.totalBOM ? ((kpi.totalOS / kpi.totalBOM) * 100).toFixed(1) : 0}% of BOM</div>
              </div>
            </div>
          </div>
        </div>

        {/* FY 26-27 Projection */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h3 className="font-bold text-slate-800 mb-1">FY 26-27 - Next Year Budget Overview</h3>
          <p className="text-xs text-slate-500 mb-4">Projected variance for next fiscal year</p>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="text-xs text-red-600 font-semibold mb-1">PROJECTED LOSS</div>
              <div className="text-2xl font-extrabold text-red-600">{format(projectedLoss)}</div>
              <div className="text-[10px] text-red-500 mt-1">{projectedLossParts.length} parts over budget</div>
              <div className="text-[10px] text-slate-500">{kpi?.totalParts ? ((projectedLossParts.length / kpi.totalParts) * 100).toFixed(1) : 0}% of pool</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="text-xs text-green-600 font-semibold mb-1">PROJECTED GAIN</div>
              <div className="text-2xl font-extrabold text-green-600">{format(projectedGain)}</div>
              <div className="text-[10px] text-green-500 mt-1">{projectedGainParts.length} parts under budget</div>
              <div className="text-[10px] text-slate-500">{kpi?.totalParts ? ((projectedGainParts.length / kpi.totalParts) * 100).toFixed(1) : 0}% of pool</div>
            </div>
          </div>

          <div className="mb-2">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-green-600 font-semibold">Gain: 26%</span>
              <span className="text-red-600 font-semibold">Loss: 74%</span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden flex">
              <div className="bg-green-500" style={{ width: `${(projectedGainParts.length / data.length) * 100}%` }} />
              <div className="bg-red-500" style={{ width: `${(projectedLossParts.length / data.length) * 100}%` }} />
            </div>
          </div>
          <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-200">
            Net FY 26-27 AVB: <span className={`font-bold ${kpi?.avb2627 < 0 ? 'text-red-600' : 'text-green-600'}`}>{format(kpi?.avb2627 || 0)}</span>
          </div>
        </div>

        {/* Current Year Variance */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h3 className="font-bold text-slate-800 mb-1">FY 25-26 Variance</h3>
          <p className="text-xs text-slate-500 mb-4">Actual vs Budget - parts under budget vs over budget</p>

          <div className="h-48 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Under', value: data.filter(r => r.avb_2526 < 0).length, color: '#22C55E' },
                    { name: 'Over', value: data.filter(r => r.avb_2526 > 0).length, color: '#EF4444' }
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  <Cell fill="#22C55E" />
                  <Cell fill="#EF4444" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-xs text-slate-500">Net AVB</div>
                <div className={`text-2xl font-extrabold ${kpi?.avb2526 < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {format(Math.abs(kpi?.avb2526 || 0))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4">
            <div className="text-center">
              <div className="text-xs text-slate-500">Under Budget Parts</div>
              <div className="text-lg font-bold text-green-600">{data.filter(r => r.avb_2526 < 0).length}</div>
              <div className="text-[10px] text-slate-400">{((data.filter(r => r.avb_2526 < 0).length / data.length) * 100).toFixed(0)}% of total parts</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-slate-500">Over Budget Parts</div>
              <div className="text-lg font-bold text-red-600">{data.filter(r => r.avb_2526 > 0).length}</div>
              <div className="text-[10px] text-slate-400">{((data.filter(r => r.avb_2526 > 0).length / data.length) * 100).toFixed(0)}% of total parts</div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Breakdown Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Total BOM Cost */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h3 className="font-bold text-slate-800 mb-1">Total BOM Cost</h3>
          <p className="text-xs text-slate-500 mb-4">Actual BOM comparison vs Budgeted cost breakdown</p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-slate-500 font-semibold mb-2 text-center">ACTUAL</div>
              <div className="h-40 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'RM', value: kpi?.totalRM || 0, color: '#3B82F6' },
                        { name: 'OS', value: kpi?.totalOS || 0, color: '#F59E0B' }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      <Cell fill="#3B82F6" />
                      <Cell fill="#F59E0B" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-lg font-extrabold text-slate-800">{format(kpi?.totalBOM || 0)}</div>
                    <div className="text-[9px] text-slate-500">Total</div>
                  </div>
                </div>
              </div>
              <div className="space-y-1 mt-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">RM</span>
                  <span className="font-semibold">{format(kpi?.totalRM || 0)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">OS</span>
                  <span className="font-semibold">{format(kpi?.totalOS || 0)}</span>
                </div>
                <div className="flex justify-between text-xs border-t pt-1">
                  <span className="text-slate-500">RM%</span>
                  <span className="font-semibold">{kpi?.totalBOM ? ((kpi.totalRM / kpi.totalBOM) * 100).toFixed(1) : 0}%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">OS%</span>
                  <span className="font-semibold">{kpi?.totalBOM ? ((kpi.totalOS / kpi.totalBOM) * 100).toFixed(1) : 0}%</span>
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-500 font-semibold mb-2 text-center">BUDGET</div>
              <div className="h-40 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'RM', value: kpi?.budgetRM || 0, color: '#10B981' },
                        { name: 'OS', value: kpi?.budgetOS || 0, color: '#06B6D4' }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      <Cell fill="#10B981" />
                      <Cell fill="#06B6D4" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-lg font-extrabold text-slate-800">{format(kpi?.budgetBOM || 0)}</div>
                    <div className="text-[9px] text-slate-500">Total</div>
                  </div>
                </div>
              </div>
              <div className="space-y-1 mt-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">RM Budget</span>
                  <span className="font-semibold">{format(kpi?.budgetRM || 0)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">OS Budget</span>
                  <span className="font-semibold">{format(kpi?.budgetOS || 0)}</span>
                </div>
                <div className="flex justify-between text-xs border-t pt-1">
                  <span className="text-slate-500">RM Bdg%</span>
                  <span className="font-semibold">{kpi?.budgetBOM ? ((kpi.budgetRM / kpi.budgetBOM) * 100).toFixed(1) : 0}%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">OS Bdg%</span>
                  <span className="font-semibold">{kpi?.budgetBOM ? ((kpi.budgetOS / kpi.budgetBOM) * 100).toFixed(1) : 0}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="text-xs font-semibold text-slate-700 mb-1">Budget Utilization</div>
            <div className="h-2 bg-red-100 rounded-full overflow-hidden mb-1">
              <div
                className={`h-full ${kpi?.bomVariance > 0 ? 'bg-red-500' : 'bg-green-500'}`}
                style={{ width: `${Math.min(Math.abs((kpi?.totalBOM || 0) / (kpi?.budgetBOM || 1)) * 100, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Difference</span>
              <span className={`font-bold ${kpi?.bomVariance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {format(Math.abs(kpi?.bomVariance || 0))} ({kpi?.bomVariancePct.toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>

        {/* Raw Material Cost */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h3 className="font-bold text-slate-800 mb-1">Raw Material Cost</h3>
          <p className="text-xs text-slate-500 mb-4">Actual RM vs Budget RM - LBP vs MAP unit rate</p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-slate-500 font-semibold mb-2 text-center">ACTUAL</div>
              <div className="h-40 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { value: kpi?.totalRM || 0, color: '#8B5CF6' },
                        { value: Math.max((kpi?.budgetRM || 0) - (kpi?.totalRM || 0), 0), color: '#E5E7EB' }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      startAngle={90}
                      endAngle={-270}
                      paddingAngle={0}
                      dataKey="value"
                    >
                      <Cell fill="#8B5CF6" />
                      <Cell fill="#E5E7EB" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-lg font-extrabold text-purple-600">{format(kpi?.totalRM || 0)}</div>
                    <div className="text-[9px] text-slate-500">Actual RM</div>
                  </div>
                </div>
              </div>
              <div className="space-y-1 mt-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">LBP RM/Assy</span>
                  <span className="font-semibold">—</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">LBP RM%</span>
                  <span className="font-semibold">{kpi?.avgLbpPct.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">MAP RM/Assy</span>
                  <span className="font-semibold">—</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">MAP RM%</span>
                  <span className="font-semibold">{kpi?.avgMapPct.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-500 font-semibold mb-2 text-center">BUDGET</div>
              <div className="h-40 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { value: kpi?.budgetRM || 0, color: '#10B981' },
                        { value: 0, color: '#E5E7EB' }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      startAngle={90}
                      endAngle={-270}
                      paddingAngle={0}
                      dataKey="value"
                    >
                      <Cell fill="#10B981" />
                      <Cell fill="#E5E7EB" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-lg font-extrabold text-green-600">{format(kpi?.budgetRM || 0)}</div>
                    <div className="text-[9px] text-slate-500">Budget RM</div>
                  </div>
                </div>
              </div>
              <div className="space-y-1 mt-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Bdp RM/Assy</span>
                  <span className="font-semibold">—</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Total RM Budget</span>
                  <span className="font-semibold">{format(kpi?.budgetRM || 0)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">BOM/Assy</span>
                  <span className="font-semibold">—</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">BOM%</span>
                  <span className="font-semibold">{kpi?.avgBomPct.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="text-xs font-semibold text-slate-700 mb-1">RM Budget Utilization</div>
            <div className="h-2 bg-purple-100 rounded-full overflow-hidden mb-1">
              <div
                className={`h-full ${kpi?.rmVariance > 0 ? 'bg-red-500' : 'bg-purple-500'}`}
                style={{ width: `${Math.min(Math.abs((kpi?.totalRM || 0) / (kpi?.budgetRM || 1)) * 100, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Difference</span>
              <span className={`font-bold ${kpi?.rmVariance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {format(Math.abs(kpi?.rmVariance || 0))} ({kpi?.rmVariancePct.toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Project-wise & OS Cost */}
      <div className="grid grid-cols-2 gap-6">
        {/* Project-wise Costs */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h3 className="font-bold text-slate-800 mb-1">Project-wise BOM Cost</h3>
          <p className="text-xs text-slate-500 mb-4">Total BOM cost by project</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectData} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${sym()}${(v/100000).toFixed(0)}L`} />
                <Tooltip formatter={(v) => format(v * (currency === 'USD' ? fxRate : 1))} />
                <Bar dataKey="bom" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Outsourcing Cost */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h3 className="font-bold text-slate-800 mb-1">Outsourcing Cost</h3>
          <p className="text-xs text-slate-500 mb-4">Actual OS vs Budget OS - OS% of BOM</p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-slate-500 font-semibold mb-2 text-center">ACTUAL</div>
              <div className="h-40 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { value: kpi?.totalOS || 0, color: '#06B6D4' },
                        { value: Math.max((kpi?.budgetOS || 0) - (kpi?.totalOS || 0), 0), color: '#E5E7EB' }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      startAngle={90}
                      endAngle={-270}
                      dataKey="value"
                    >
                      <Cell fill="#06B6D4" />
                      <Cell fill="#E5E7EB" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-lg font-extrabold text-cyan-600">{format(kpi?.totalOS || 0)}</div>
                    <div className="text-[9px] text-slate-500">Actual OS</div>
                  </div>
                </div>
              </div>
              <div className="space-y-1 mt-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">OS/Unit (avg)</span>
                  <span className="font-semibold">{format((kpi?.totalOS || 0) / (kpi?.totalParts || 1))}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">OS%</span>
                  <span className="font-semibold">{kpi?.avgOsPct.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-500 font-semibold mb-2 text-center">BUDGET</div>
              <div className="h-40 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { value: kpi?.budgetOS || 0, color: '#10B981' }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      startAngle={90}
                      endAngle={-270}
                      dataKey="value"
                    >
                      <Cell fill="#10B981" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-lg font-extrabold text-green-600">{format(kpi?.budgetOS || 0)}</div>
                    <div className="text-[9px] text-slate-500">Budget OS</div>
                  </div>
                </div>
              </div>
              <div className="space-y-1 mt-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">OS Budget Total</span>
                  <span className="font-semibold">{format(kpi?.budgetOS || 0)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">OS Budget%</span>
                  <span className="font-semibold">{kpi?.budgetBOM ? ((kpi.budgetOS / kpi.budgetBOM) * 100).toFixed(1) : 0}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="text-xs font-semibold text-slate-700 mb-1">OS Budget Utilization</div>
            <div className="h-2 bg-cyan-100 rounded-full overflow-hidden mb-1">
              <div
                className={`h-full ${kpi?.osVariance > 0 ? 'bg-red-500' : 'bg-cyan-500'}`}
                style={{ width: `${Math.min(Math.abs((kpi?.totalOS || 0) / (kpi?.budgetOS || 1)) * 100, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Difference</span>
              <span className={`font-bold ${kpi?.osVariance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {format(Math.abs(kpi?.osVariance || 0))} ({kpi?.osVariancePct.toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* % Metrics - Bottom Row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'LBP RM%', sublabel: 'Low Buy Price', value: kpi?.avgLbpPct || 0, color: '#3B82F6', footer: 'LBP RM/Assy', footerVal: '₹36037' },
          { label: 'MAP RM%', sublabel: 'Moving Average Price', value: kpi?.avgMapPct || 0, color: '#8B5CF6', footer: 'MAP RM/Assy', footerVal: '₹38098' },
          { label: 'OS%', sublabel: 'Outsourcing', value: kpi?.avgOsPct || 0, color: '#0891B2', footer: 'Total OS', footerVal: format(kpi?.totalOS || 0) },
          { label: 'BOM%', sublabel: 'Bill of Materials', value: kpi?.avgBomPct || 0, color: '#EF4444', footer: 'Total BOM', footerVal: format(kpi?.totalBOM || 0) },
        ].map((metric, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 text-center" style={{ borderTop: `3px solid ${metric.color}` }}>
            <div className="text-xs font-bold text-slate-500 uppercase mb-1">{metric.label}</div>
            <div className="text-[10px] text-slate-400 mb-3">{metric.sublabel}</div>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { value: metric.value },
                      { value: 100 - metric.value }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={50}
                    startAngle={90}
                    endAngle={-270}
                    dataKey="value"
                  >
                    <Cell fill={metric.color} />
                    <Cell fill="#E2E8F0" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="text-2xl font-extrabold mt-2" style={{ color: metric.color }}>
              {metric.value.toFixed(1)}%
            </div>
            <div className="mt-3 pt-3 border-t border-slate-200">
              <div className="text-[10px] text-slate-500">{metric.footer}</div>
              <div className="text-xs font-semibold text-slate-700">{metric.footerVal}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnalysisPage;
