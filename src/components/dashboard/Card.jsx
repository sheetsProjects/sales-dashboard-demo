// Chart / table card wrapper. Standard header + body layout used across pages.
const Card = ({ title, subtitle, right, children, className = '' }) => (
  <div className={`bg-white border border-slate-200 rounded-xl shadow-sm ${className}`}>
    {(title || right) && (
      <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between gap-3">
        <div>
          {title && <h3 className="text-sm font-bold text-slate-800">{title}</h3>}
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {right && <div>{right}</div>}
      </div>
    )}
    <div className="p-4">{children}</div>
  </div>
);

export default Card;
