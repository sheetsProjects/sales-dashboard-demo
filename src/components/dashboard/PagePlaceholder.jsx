import { Construction } from 'lucide-react';

// Temporary shell used while individual pages are being rewritten during the
// AutoGlobe pivot. Replaced page-by-page in Phases 3–5.
const PagePlaceholder = ({ title, subtitle }) => (
  <div className="flex flex-col items-center justify-center h-full text-center py-24">
    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mb-4">
      <Construction className="w-8 h-8 text-slate-400" />
    </div>
    <h2 className="text-xl font-bold text-slate-700">{title}</h2>
    {subtitle && <p className="text-sm text-slate-500 mt-2 max-w-md">{subtitle}</p>}
  </div>
);

export default PagePlaceholder;
