import { Filter, X } from 'lucide-react';
import { getUniqueValues } from '../../utils/helpers';

// Global filters bar. Same shape used by every page that shows sales rows.
// `pool` is the workbook.sales array we derive dropdown options from.
const FiltersBar = ({ filters, setFilters, clearFilters, pool = [] }) => {
  const set = (k, v) => setFilters({ ...filters, [k]: v });

  const locationOpts = getUniqueValues(pool, 'location').sort();
  const makeOpts     = getUniqueValues(pool, 'make').sort();
  const bodyOpts     = getUniqueValues(pool, 'bodyType').sort();
  const fuelOpts     = getUniqueValues(pool, 'fuelType').sort();
  const channelOpts  = getUniqueValues(pool, 'salesChannel').sort();

  const hasActive = Object.values(filters).some(Boolean);

  return (
    <div className="filter-section bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Filter className="w-4 h-4 text-slate-500" />
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filters</span>
        {hasActive && (
          <button
            onClick={clearFilters}
            className="ml-auto text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
          >
            <X className="w-3 h-3" /> Clear all
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
        <Field label="From">
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => set('dateFrom', e.target.value)}
            className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-400"
          />
        </Field>
        <Field label="To">
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => set('dateTo', e.target.value)}
            className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-400"
          />
        </Field>
        <Select label="Location"      value={filters.location}     opts={locationOpts} onChange={(v) => set('location', v)} />
        <Select label="Make"          value={filters.make}         opts={makeOpts}     onChange={(v) => set('make', v)} />
        <Select label="Body"          value={filters.bodyType}     opts={bodyOpts}     onChange={(v) => set('bodyType', v)} />
        <Select label="Fuel"          value={filters.fuelType}     opts={fuelOpts}     onChange={(v) => set('fuelType', v)} />
        <Select label="Channel"       value={filters.salesChannel} opts={channelOpts}  onChange={(v) => set('salesChannel', v)} />
      </div>
    </div>
  );
};

const Field = ({ label, children }) => (
  <div>
    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</label>
    {children}
  </div>
);

const Select = ({ label, value, opts, onChange }) => (
  <Field label={label}>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-400"
    >
      <option value="">All</option>
      {opts.map((o) => (<option key={o} value={o}>{o}</option>))}
    </select>
  </Field>
);

export default FiltersBar;
