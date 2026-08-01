// KPI tile — 6 or 8 of these sit across the top of every page.
// value is the big number, hint is a small subtitle underneath.
// tone drives the icon chip colour.
const TONES = {
  blue:   { bg: 'bg-blue-50',    ring: 'ring-blue-100',    fg: 'text-blue-600' },
  green:  { bg: 'bg-emerald-50', ring: 'ring-emerald-100', fg: 'text-emerald-600' },
  amber:  { bg: 'bg-amber-50',   ring: 'ring-amber-100',   fg: 'text-amber-600' },
  red:    { bg: 'bg-rose-50',    ring: 'ring-rose-100',    fg: 'text-rose-600' },
  purple: { bg: 'bg-violet-50',  ring: 'ring-violet-100',  fg: 'text-violet-600' },
  slate:  { bg: 'bg-slate-100',  ring: 'ring-slate-200',   fg: 'text-slate-600' },
  cyan:   { bg: 'bg-cyan-50',    ring: 'ring-cyan-100',    fg: 'text-cyan-600' },
};

const KpiTile = ({ label, value, hint, tone = 'blue', icon: Icon, trend }) => {
  const t = TONES[tone] || TONES.blue;
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{label}</div>
          <div className="text-2xl font-extrabold text-slate-800 mt-1 truncate">{value}</div>
          {hint && <div className="text-xs text-slate-500 mt-1">{hint}</div>}
        </div>
        {Icon && (
          <div className={`w-10 h-10 rounded-xl ${t.bg} ring-1 ${t.ring} flex items-center justify-center shrink-0`}>
            <Icon className={`w-5 h-5 ${t.fg}`} />
          </div>
        )}
      </div>
      {trend != null && (
        <div className={`mt-2 text-xs font-semibold ${trend >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
          {trend >= 0 ? '▲' : '▼'} {Math.abs(trend).toFixed(1)}% vs. target
        </div>
      )}
    </div>
  );
};

export default KpiTile;
