import { useState, useEffect } from 'react';
import {
  PieChart, Pie, BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer, Legend
} from 'recharts';
import {
  ArrowLeft, Lightbulb, Target, TrendingUp, AlertTriangle,
  Users, Clock, Loader2, RefreshCw
} from 'lucide-react';
import { formatCurrency, formatShort } from '../../utils/helpers';
import { buildInsightDetail } from '../../services/insightsService';

const CHART_COLORS = [
  '#EF4444', '#F59E0B', '#FCD34D', '#3B82F6', '#06B6D4',
  '#8B5CF6', '#EC4899', '#10B981', '#F97316', '#6366F1'
];

const InsightDetailPage = ({
  insightId,
  angles,
  rows,
  currency,
  fxRate,
  onBack
}) => {
  const [drillData, setDrillData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDrillDownData();
  }, [insightId]);

  const loadDrillDownData = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await buildInsightDetail(insightId, angles, rows);
      setDrillData(result);
      setLoading(false);
    } catch (err) {
      console.error('Drill-down error:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Generating insights...</p>
          <p className="text-xs text-slate-400 mt-2">Computing analysis from data</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-red-900 mb-2">Error Loading Insight</h3>
        <p className="text-sm text-red-700 mb-4">{error}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={loadDrillDownData}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!drillData) return null;

  const angle = angles.find(a => a.angle_id === insightId);

  return (
    <div className="space-y-6 pb-8">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition font-medium"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Insights</span>
      </button>

      {/* AI Narrative */}
      <NarrativeCard narrative={drillData.narrative} query={angle?.suggested_query} />

      {/* Key Metrics Grid */}
      {drillData.key_metrics && drillData.key_metrics.length > 0 && (
        <MetricsGrid metrics={drillData.key_metrics} />
      )}

      {/* Charts */}
      <ChartsSection
        primaryChart={drillData.primary_chart}
        secondaryChart={drillData.secondary_chart}
        currency={currency}
        fxRate={fxRate}
      />

      {/* Recommendations */}
      {drillData.recommendations && drillData.recommendations.length > 0 && (
        <RecommendationsSection recommendations={drillData.recommendations} />
      )}

      {/* Data Table */}
      {angle && (
        <DataTableSection
          angle={angle}
          rows={rows}
          currency={currency}
          fxRate={fxRate}
        />
      )}
    </div>
  );
};

// Narrative Card Component
const NarrativeCard = ({ narrative, query }) => (
  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-6">
    <div className="flex items-start gap-4">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shrink-0">
        <Lightbulb className="w-6 h-6 text-white" />
      </div>
      <div className="flex-1">
        <h2 className="text-lg font-bold text-slate-800 mb-2">Analysis</h2>
        {query && (
          <div className="text-sm text-blue-700 font-medium mb-3 italic">
            "{query}"
          </div>
        )}
        <p className="text-slate-700 leading-relaxed">{narrative}</p>
      </div>
    </div>
  </div>
);

// Metrics Grid Component
const MetricsGrid = ({ metrics }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    {metrics.map((metric, i) => {
      const impactColors = {
        'critical': 'from-red-500 to-red-600',
        'high': 'from-orange-500 to-orange-600',
        'medium': 'from-blue-500 to-blue-600',
        'positive': 'from-green-500 to-green-600'
      };

      const bgColor = impactColors[metric.impact?.toLowerCase()] || 'from-slate-500 to-slate-600';

      return (
        <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg transition">
          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${bgColor} flex items-center justify-center mb-3`}>
            {metric.impact?.toLowerCase() === 'critical' && <AlertTriangle className="w-5 h-5 text-white" />}
            {metric.impact?.toLowerCase() === 'high' && <TrendingUp className="w-5 h-5 text-white" />}
            {metric.impact?.toLowerCase() === 'positive' && <Target className="w-5 h-5 text-white" />}
            {!['critical', 'high', 'positive'].includes(metric.impact?.toLowerCase()) && (
              <TrendingUp className="w-5 h-5 text-white" />
            )}
          </div>
          <div className="text-xs text-slate-500 font-medium mb-1">{metric.label}</div>
          <div className="text-2xl font-bold text-slate-800 mb-1">{metric.value}</div>
          {metric.sublabel && (
            <div className="text-xs text-slate-500">{metric.sublabel}</div>
          )}
        </div>
      );
    })}
  </div>
);

// Charts Section Component
const ChartsSection = ({ primaryChart, secondaryChart, currency, fxRate }) => {
  const renderChart = (chartSpec) => {
    if (!chartSpec || !chartSpec.data || chartSpec.data.length === 0) return null;

    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-bold text-slate-800 mb-1">{chartSpec.title}</h3>
        {chartSpec.description && (
          <p className="text-xs text-slate-500 mb-4">{chartSpec.description}</p>
        )}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {chartSpec.type === 'pie' && (
              <PieChart>
                <Pie
                  data={chartSpec.data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  paddingAngle={3}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                >
                  {chartSpec.data.map((entry, i) => (
                    <Cell key={i} fill={entry.color || CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name, props) => {
                    if (props.payload.amount !== undefined) {
                      return [formatCurrency(props.payload.amount, currency, fxRate), name];
                    }
                    return [value, name];
                  }}
                />
                <Legend />
              </PieChart>
            )}

            {chartSpec.type === 'bar' && (
              <BarChart data={chartSpec.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey={chartSpec.x_axis_key || 'name'}
                  tick={{ fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis
                  tickFormatter={(v) => formatShort(v, currency)}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  formatter={(v) => formatCurrency(v, currency, fxRate)}
                  contentStyle={{ fontSize: 12 }}
                />
                <Bar dataKey={chartSpec.y_axis_key || 'value'} radius={[4, 4, 0, 0]}>
                  {chartSpec.data.map((entry, i) => (
                    <Cell key={i} fill={entry.color || CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            )}

            {chartSpec.type === 'line' && (
              <LineChart data={chartSpec.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey={chartSpec.x_axis_key || 'name'}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  tickFormatter={(v) => formatShort(v, currency)}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip formatter={(v) => formatCurrency(v, currency, fxRate)} />
                <Line
                  type="monotone"
                  dataKey={chartSpec.y_axis_key || 'value'}
                  stroke="#3B82F6"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            )}

            {chartSpec.type === 'area' && (
              <AreaChart data={chartSpec.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey={chartSpec.x_axis_key || 'name'}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  tickFormatter={(v) => formatShort(v, currency)}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip formatter={(v) => formatCurrency(v, currency, fxRate)} />
                <Area
                  type="monotone"
                  dataKey={chartSpec.y_axis_key || 'value'}
                  fill="#3B82F6"
                  stroke="#2563EB"
                  fillOpacity={0.3}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <div className={`grid ${secondaryChart ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'} gap-6`}>
      {renderChart(primaryChart)}
      {secondaryChart && renderChart(secondaryChart)}
    </div>
  );
};

// Recommendations Section Component
const RecommendationsSection = ({ recommendations }) => {
  const priorityConfig = {
    'high': { color: 'red', icon: AlertTriangle, label: 'High Priority' },
    'medium': { color: 'orange', icon: TrendingUp, label: 'Medium Priority' },
    'low': { color: 'blue', icon: Target, label: 'Low Priority' }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
        <Target className="w-5 h-5 text-blue-600" />
        Recommendations
      </h3>
      <div className="space-y-4">
        {recommendations.map((rec, i) => {
          const config = priorityConfig[rec.priority?.toLowerCase()] || priorityConfig.medium;
          const Icon = config.icon;

          return (
            <div
              key={i}
              className="border border-slate-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition"
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg bg-${config.color}-100 flex items-center justify-center shrink-0`}>
                  <Icon className={`w-4 h-4 text-${config.color}-600`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-bold text-${config.color}-600 uppercase`}>
                      {config.label}
                    </span>
                  </div>
                  <h4 className="font-semibold text-slate-800 mb-1">{rec.action}</h4>
                  <p className="text-sm text-slate-600 mb-3">{rec.reason}</p>
                  <div className="flex flex-wrap gap-3 text-xs">
                    {rec.owner && (
                      <div className="flex items-center gap-1 text-slate-500">
                        <Users className="w-3 h-3" />
                        <span className="font-medium">{rec.owner}</span>
                      </div>
                    )}
                    {rec.timeline && (
                      <div className="flex items-center gap-1 text-slate-500">
                        <Clock className="w-3 h-3" />
                        <span>{rec.timeline}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Data Table Section Component
const DataTableSection = ({ angle, rows, currency, fxRate }) => {
  const relevantRows = rows
    .filter(r => angle.facts.part_numbers?.includes(r.part_no))
    .slice(0, 20); // Show top 20

  if (relevantRows.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="text-lg font-bold text-slate-800 mb-4">Detailed Data (Top 20 Parts)</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-2 px-3 font-semibold text-slate-600">Part No</th>
              <th className="text-left py-2 px-3 font-semibold text-slate-600">Project</th>
              <th className="text-right py-2 px-3 font-semibold text-slate-600">Total BOM</th>
              <th className="text-right py-2 px-3 font-semibold text-slate-600">FY25-26 Var</th>
              <th className="text-right py-2 px-3 font-semibold text-slate-600">FY26-27 Var</th>
            </tr>
          </thead>
          <tbody>
            {relevantRows.map((row, i) => (
              <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-2 px-3 font-mono">{row.part_no}</td>
                <td className="py-2 px-3">{row.project}</td>
                <td className="py-2 px-3 text-right font-medium">
                  {formatCurrency(row.total_bom, currency, fxRate)}
                </td>
                <td className={`py-2 px-3 text-right font-medium ${
                  row.avb_2526 > 0 ? 'text-red-600' : row.avb_2526 < 0 ? 'text-green-600' : 'text-slate-600'
                }`}>
                  {row.avb_2526 > 0 ? '+' : ''}{formatCurrency(row.avb_2526, currency, fxRate)}
                </td>
                <td className={`py-2 px-3 text-right font-medium ${
                  row.avb_2627 > 0 ? 'text-red-600' : row.avb_2627 < 0 ? 'text-green-600' : 'text-slate-600'
                }`}>
                  {row.avb_2627 > 0 ? '+' : ''}{formatCurrency(row.avb_2627, currency, fxRate)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InsightDetailPage;
