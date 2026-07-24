import { useState, useMemo } from 'react';
import { Search, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { buildFgPartsTable, formatCurrency, formatPercent, formatVariance } from '../../utils/helpers';

const COLUMNS = [
  { key: 'fg_part',       label: 'FG Part No',  align: 'left',  type: 'text',     sticky: true },
  { key: 'projects',      label: 'Project(s)',  align: 'left',  type: 'list' },
  { key: 'customers',     label: 'Customer(s)', align: 'left',  type: 'list' },
  { key: 'qty',           label: 'Qty Sold',    align: 'right', type: 'num' },
  { key: 'bomActual',     label: 'BOM Actual',  align: 'right', type: 'money' },
  { key: 'bomBudget',     label: 'BOM Budget',  align: 'right', type: 'money' },
  { key: 'variance',      label: 'Variance',    align: 'right', type: 'var' },
  { key: 'variancePct',   label: 'Variance %',  align: 'right', type: 'pct' },
  { key: 'marginActual',  label: 'Margin',      align: 'right', type: 'money' },
  { key: 'marginPct',     label: 'Margin %',    align: 'right', type: 'pct' },
  { key: 'projBomActual', label: 'Proj. Actual', align: 'right', type: 'money' },
  { key: 'projBomBudget', label: 'Proj. Budget', align: 'right', type: 'money' },
];

const PAGE_SIZE = 25;

const FgPartsTable = ({ rows, currency, fxRate }) => {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('variance');
  const [sortDir, setSortDir] = useState('asc');  // asc: most negative variance first
  const [page, setPage] = useState(0);

  const all = useMemo(() => buildFgPartsTable(rows), [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return all;
    return all.filter((r) =>
      String(r.fg_part).toLowerCase().includes(q) ||
      r.projects.some((p) => String(p).toLowerCase().includes(q)) ||
      r.customers.some((c) => String(c).toLowerCase().includes(q))
    );
  }, [all, search]);

  const sorted = useMemo(() => {
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (Array.isArray(av) && Array.isArray(bv)) {
        return (String(av[0] || '').localeCompare(String(bv[0] || ''))) * dir;
      }
      if (typeof av === 'string' || typeof bv === 'string') {
        return String(av).localeCompare(String(bv)) * dir;
      }
      return ((Number(av) || 0) - (Number(bv) || 0)) * dir;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const visible = sorted.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
    setPage(0);
  };

  const renderCell = (col, r) => {
    const v = r[col.key];
    switch (col.type) {
      case 'money':
        return <span className="font-semibold text-slate-700">{formatCurrency(v, currency, fxRate)}</span>;
      case 'var':
        return <span className={`font-bold ${v >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatVariance(v, currency, fxRate)}</span>;
      case 'pct':
        return <span className={`font-bold ${v >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatPercent(v)}</span>;
      case 'num':
        return <span className="text-slate-700">{Number(v).toLocaleString('en-IN')}</span>;
      case 'list': {
        const list = Array.isArray(v) ? v : [];
        if (list.length === 0) return <span className="text-slate-400">—</span>;
        if (list.length === 1) return <span className="text-slate-700">{list[0]}</span>;
        return (
          <span className="text-slate-700" title={list.join(', ')}>
            {list[0]} <span className="text-[10px] text-slate-400">+{list.length - 1}</span>
          </span>
        );
      }
      default:
        return <span className="font-medium text-blue-600">{v}</span>;
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl border-t-[3px] border-t-slate-500 p-5">
      <div className="flex items-start justify-between mb-4 gap-3 flex-wrap">
        <div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Master FG Parts Table</div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {all.length.toLocaleString()} FG Parts · {sorted.length.toLocaleString()} after search · sortable columns
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg bg-white">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              placeholder="Search FG Part / Project / Customer"
              className="text-sm outline-none placeholder-slate-400 w-64"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto border border-slate-200 rounded-xl">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {COLUMNS.map((col) => {
                const active = sortKey === col.key;
                const Icon = active ? (sortDir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;
                return (
                  <th
                    key={col.key}
                    onClick={() => toggleSort(col.key)}
                    className={`px-3 py-2.5 font-semibold text-slate-600 uppercase text-[10px] tracking-wider whitespace-nowrap cursor-pointer hover:bg-slate-100 ${col.align === 'right' ? 'text-right' : 'text-left'} ${col.sticky ? 'sticky left-0 bg-slate-50 z-10' : ''}`}
                  >
                    <span className={`inline-flex items-center gap-1 ${col.align === 'right' ? 'flex-row-reverse' : ''}`}>
                      {col.label}
                      <Icon className={`w-3 h-3 ${active ? 'text-slate-700' : 'text-slate-400'}`} />
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr><td colSpan={COLUMNS.length} className="px-4 py-8 text-center text-xs text-slate-400">No FG Parts match the search / filters.</td></tr>
            ) : visible.map((r) => (
              <tr key={r.fg_part} className="border-b border-slate-100 hover:bg-slate-50">
                {COLUMNS.map((col) => (
                  <td
                    key={col.key}
                    className={`px-3 py-2 ${col.align === 'right' ? 'text-right whitespace-nowrap' : 'text-left'} ${col.sticky ? 'sticky left-0 bg-white z-[1]' : ''}`}
                  >
                    {renderCell(col, r)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {sorted.length > PAGE_SIZE && (
        <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
          <span>
            Showing <b className="text-slate-700">{safePage * PAGE_SIZE + 1}–{Math.min((safePage + 1) * PAGE_SIZE, sorted.length)}</b> of {sorted.length.toLocaleString()}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              className="px-3 py-1 border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              ← Prev
            </button>
            <span className="px-2 font-medium text-slate-700">{safePage + 1} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={safePage >= totalPages - 1}
              className="px-3 py-1 border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FgPartsTable;
