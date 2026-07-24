import { ArrowLeft, BarChart3, PieChart as PieChartIcon, TrendingUp, Table as TableIcon } from 'lucide-react';
import {
  PieChart, Pie, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer, Legend
} from 'recharts';
import { formatCurrency, formatShort } from '../../utils/helpers';

const CHART_COLORS = [
  '#EF4444', '#F59E0B', '#FCD34D', '#3B82F6', '#06B6D4',
  '#8B5CF6', '#EC4899', '#10B981', '#F97316', '#6366F1'
];

const VisualizationPage = ({
  query,
  visualType,
  angle,
  currency,
  fxRate,
  onBack
}) => {
  if (!angle) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">No visualization data available</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
        >
          Go Back
        </button>
      </div>
    );
  }

  const renderChart = () => {
    const chartData = angle.chart_data;

    if (!chartData || !chartData.data || chartData.data.length === 0) {
      return (
        <div className="text-center py-12 text-slate-500">
          <p>No chart data available for this query</p>
        </div>
      );
    }

    switch (visualType || chartData.type) {
      case 'bar':
        return (
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey={chartData.x_axis_key || 'name'}
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
                <Legend />
                <Bar dataKey={chartData.y_axis_key || 'value'} radius={[4, 4, 0, 0]}>
                  {chartData.data.map((entry, i) => (
                    <Cell key={i} fill={entry.color || CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        );

      case 'pie':
        return (
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.data}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={140}
                  dataKey="value"
                  paddingAngle={3}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                >
                  {chartData.data.map((entry, i) => (
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
            </ResponsiveContainer>
          </div>
        );

      case 'line':
        return (
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey={chartData.x_axis_key || 'name'}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  tickFormatter={(v) => formatShort(v, currency)}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip formatter={(v) => formatCurrency(v, currency, fxRate)} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey={chartData.y_axis_key || 'value'}
                  stroke="#3B82F6"
                  strokeWidth={3}
                  dot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );

      case 'table':
      default:
        // Show data table
        const dataToShow = chartData.data.slice(0, 20);
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-300 bg-slate-50">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Name</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">Value</th>
                  {dataToShow[0]?.project && (
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Project</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {dataToShow.map((row, i) => (
                  <tr key={i} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="py-2 px-4">{row.name}</td>
                    <td className="py-2 px-4 text-right font-medium">
                      {formatCurrency(row.value, currency, fxRate)}
                    </td>
                    {row.project && (
                      <td className="py-2 px-4 text-slate-600">{row.project}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
    }
  };

  const getIcon = () => {
    switch (visualType || angle.chart_data?.type) {
      case 'bar': return BarChart3;
      case 'pie': return PieChartIcon;
      case 'line': return TrendingUp;
      case 'table': return TableIcon;
      default: return BarChart3;
    }
  };

  const Icon = getIcon();

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Chat</span>
        </button>
      </div>

      {/* Query Display */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0">
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-slate-800 mb-2">Visualization</h2>
            <p className="text-sm text-purple-700 italic">"{query}"</p>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      {angle.metrics && angle.metrics.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {angle.metrics.slice(0, 3).map((metric, i) => {
            const impactColors = {
              'critical': 'from-red-500 to-red-600',
              'high': 'from-orange-500 to-orange-600',
              'medium': 'from-blue-500 to-blue-600',
              'positive': 'from-green-500 to-green-600'
            };

            const bgColor = impactColors[metric.impact?.toLowerCase()] || 'from-slate-500 to-slate-600';

            return (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-5">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${bgColor} flex items-center justify-center mb-3`}>
                  <Icon className="w-5 h-5 text-white" />
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
      )}

      {/* Chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-bold text-slate-800 mb-1">
          {angle.chart_data?.title || 'Data Visualization'}
        </h3>
        {angle.chart_data?.description && (
          <p className="text-xs text-slate-500 mb-6">{angle.chart_data.description}</p>
        )}
        {renderChart()}
      </div>

      {/* Context */}
      {angle.context && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-800">
            <strong>Context:</strong> {angle.context}
          </p>
        </div>
      )}
    </div>
  );
};

export default VisualizationPage;
