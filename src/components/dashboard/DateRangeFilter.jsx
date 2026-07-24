import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { DateRange } from 'react-date-range';
import { format } from 'date-fns';
import { Calendar, X } from 'lucide-react';

import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

const POPOVER_WIDTH = 340;

const DateRangeFilter = ({ from, to, onChange }) => {
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState('left'); 
  const ref = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceRight = window.innerWidth - rect.left;
    setAnchor(spaceRight < POPOVER_WIDTH + 16 ? 'right' : 'left');
  }, [open]);

  const startDate = from ? new Date(from + 'T00:00:00') : new Date();
  const endDate   = to   ? new Date(to + 'T00:00:00')   : new Date();
  const hasRange = Boolean(from || to);

  const sameDay = from && to && from === to;
  const display = !hasRange
    ? 'Date range'
    : sameDay
      ? `${format(startDate, 'dd MMM yyyy')} (pick end date)`
      : `${from ? format(startDate, 'dd MMM yyyy') : '…'} → ${to ? format(endDate, 'dd MMM yyyy') : '…'}`;

  const ranges = [{
    startDate,
    endDate,
    key: 'selection',
  }];

  return (
    <div ref={ref} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`flex items-center justify-between gap-2 px-3 py-2 bg-white border rounded-lg text-sm transition cursor-pointer min-w-[18rem] ${open ? 'border-cyan-500' : 'border-slate-200 hover:border-slate-300'}`}
      >
        <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
        <span className={`truncate flex-1 text-left ${hasRange ? 'text-slate-800 font-medium' : 'text-slate-500'}`}>
          {display}
        </span>
        {hasRange && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); onChange({ from: '', to: '' }); }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onChange({ from: '', to: '' }); }}}
            className="p-0.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
            title="Clear"
          >
            <X className="w-3.5 h-3.5" />
          </span>
        )}
      </button>

      {open && (
        <div className={`absolute z-30 mt-1 w-max ${anchor === 'right' ? 'right-0' : 'left-0'} bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden`}>
          <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 text-[11px] text-slate-500">
            <span className="font-semibold text-slate-700">Step 1:</span> click start date · <span className="font-semibold text-slate-700">Step 2:</span> click end date
          </div>
          <div className="rdr-wrap p-1">
            <DateRange
              ranges={ranges}
              onChange={(item) => {
                const r = item.selection;
                onChange({
                  from: r.startDate ? format(r.startDate, 'yyyy-MM-dd') : '',
                  to:   r.endDate   ? format(r.endDate,   'yyyy-MM-dd') : '',
                });
              }}
              moveRangeOnFirstSelection={false}
              editableDateInputs
              rangeColors={['#06b6d4']}
              showMonthAndYearPickers
              showDateDisplay={false}
              months={1}
              direction="horizontal"
            />
          </div>
          <div className="flex justify-between items-center px-4 py-2 border-t border-slate-100 bg-slate-50 text-xs">
            <button
              onClick={() => onChange({ from: '', to: '' })}
              className="text-slate-500 hover:text-slate-700 font-medium cursor-pointer"
            >
              Clear
            </button>
            <button
              onClick={() => setOpen(false)}
              className="px-3 py-1 bg-cyan-500 text-white rounded-md hover:bg-cyan-600 font-semibold cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangeFilter;
