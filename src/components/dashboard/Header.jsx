import { Upload, LogOut, Download } from 'lucide-react';

const PAGE_META = {
  dashboard:   { title: 'Executive Dashboard',   subtitle: 'Revenue, profit and branch performance at a glance' },
  analysis:    { title: 'Sales Analysis',        subtitle: 'Trends, segments and vehicle breakdowns' },
  inventory:   { title: 'Inventory',             subtitle: 'Unsold cars across all lots with aging risk' },
  branches:    { title: 'Branches',              subtitle: 'Location performance vs. targets and expenses' },
  'sales-reps':{ title: 'Sales Reps',            subtitle: 'Leaderboard by revenue, units and satisfaction' },
  customers:   { title: 'Customers',             subtitle: 'Acquisition channels, LTV and demographics' },
  users:       { title: 'Admin Users',           subtitle: 'Manage dashboard users' },
  category:    { title: 'AI Insight',            subtitle: 'Deterministic analytical angle' },
  'drill-down':{ title: 'Insight Drill-Down',    subtitle: 'Underlying rows and supporting metrics' },
  visualization:{ title: 'Visualization',        subtitle: 'Chart matched to your query' },
};

const Header = ({
  activePage,
  selectedCategory,
  categories,
  dataLength,
  onUploadClick,
  onLogout,
  onDownloadPDF
}) => {
  const meta = PAGE_META[activePage] || { title: 'Dashboard', subtitle: '' };
  let title = meta.title;
  let subtitle = meta.subtitle;

  if (activePage === 'category' && selectedCategory) {
    const cat = categories.find(c => c.id === selectedCategory);
    if (cat) {
      title = cat.title || title;
      subtitle = cat.query || subtitle;
    }
  }

  return (
    <div className="bg-white border-b border-slate-200 px-7 py-3 flex-shrink-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">{title}</h1>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onUploadClick}
            className="px-4 py-2 bg-cyan-500 text-white rounded-lg font-semibold text-sm flex items-center gap-2 hover:bg-cyan-600 transition cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            Upload Data
          </button>

          <div className="flex items-center gap-3 ml-2 pl-3 border-l border-slate-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-white text-xs font-bold">
                AD
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-slate-800">{localStorage.getItem('userName') || 'Admin User'}</div>
                <div className="text-xs text-slate-500">{localStorage.getItem('userRole') || 'Sales Analyst'}</div>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {dataLength > 0 && (
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            {dataLength.toLocaleString()} sales records loaded
          </div>

          <button
            onClick={onDownloadPDF}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-semibold text-sm flex items-center gap-2 hover:from-orange-600 hover:to-red-600 transition cursor-pointer shadow-sm"
            title="Download Report as PDF"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      )}
    </div>
  );
};

export default Header;
