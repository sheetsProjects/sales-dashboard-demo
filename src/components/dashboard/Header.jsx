import { Upload, DollarSign, IndianRupee, Edit3, LogOut, Download } from 'lucide-react';

const Header = ({
  activePage,
  selectedCategory,
  categories,
  currency,
  setCurrency,
  fxRate,
  setFxRate,
  editingFx,
  setEditingFx,
  dataLength,
  onUploadClick,
  onLogout,
  onDownloadPDF
}) => {
  const getTitle = () => {
    if (activePage === 'dashboard') return 'Executive Dashboard';
    if (activePage === 'analysis') return 'Cost Analysis';
    if (activePage === 'category' && selectedCategory) {
      return categories.find(c => c.id === selectedCategory)?.title || 'Business Insight';
    }
    return 'Dashboard';
  };

  const getSubtitle = () => {
    if (activePage === 'dashboard') return 'Real-time cost tracking & analytics';
    if (activePage === 'analysis') return 'Charts & visual breakdown';
    if (activePage === 'category' && selectedCategory) {
      return categories.find(c => c.id === selectedCategory)?.query || 'Data-driven business intelligence';
    }
    return '';
  };

  return (
    <div className="bg-white border-b border-slate-200 px-7 py-3 flex-shrink-0">
      <div className="flex items-center justify-between">
        {/* Title */}
        <div>
          <h1 className="text-xl font-bold text-slate-800">{getTitle()}</h1>
          <p className="text-sm text-slate-500">{getSubtitle()}</p>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Upload Button */}
          <button
            onClick={onUploadClick}
            className="px-4 py-2 bg-cyan-500 text-white rounded-lg font-semibold text-sm flex items-center gap-2 hover:bg-cyan-600 transition cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            Upload Data
          </button>

          {/* FX Rate */}
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg text-sm">
            <span className="text-slate-500">1 USD =</span>
            {editingFx ? (
              <input
                type="number"
                value={fxRate}
                onChange={(e) => setFxRate(parseFloat(e.target.value) || 86.50)}
                onBlur={() => setEditingFx(false)}
                onKeyDown={(e) => e.key === 'Enter' && setEditingFx(false)}
                className="w-16 px-1 py-0.5 border rounded text-center font-bold text-green-600"
                autoFocus
              />
            ) : (
              <span className="font-bold text-green-600">{fxRate.toFixed(2)}</span>
            )}
            <button onClick={() => setEditingFx(true)} className="text-amber-500 hover:text-amber-600 cursor-pointer">
              <Edit3 className="w-4 h-4" />
            </button>
          </div>

          {/* Currency Toggle */}
          <div className="flex bg-slate-100 border border-slate-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setCurrency('INR')}
              className={`px-3 py-2 text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                currency === 'INR' ? 'bg-[#0d1b2e] text-white' : 'text-slate-500'
              }`}
            >
              <IndianRupee className="w-3 h-3" /> INR
            </button>
            <button
              onClick={() => setCurrency('USD')}
              className={`px-3 py-2 text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                currency === 'USD' ? 'bg-[#0d1b2e] text-white' : 'text-slate-500'
              }`}
            >
              <DollarSign className="w-3 h-3" /> USD
            </button>
          </div>

          {/* User & Sign Out */}
          <div className="flex items-center gap-3 ml-2 pl-3 border-l border-slate-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-white text-xs font-bold">
                AD
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-slate-800">{localStorage.getItem('userName') || 'Admin User'}</div>
                <div className="text-xs text-slate-500">{localStorage.getItem('userRole') || 'Cost Controller'}</div>
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

      {/* Data Status */}
      {dataLength > 0 && (
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            {dataLength} parts loaded - FY 2025-26
          </div>

          {/* Export PDF Button */}
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
