import { LayoutDashboard, TrendingUp, Sparkles, Loader2, ChevronRight, ChevronLeft, AlertTriangle, PercentCircle, Users } from 'lucide-react';

const Sidebar = ({
  activePage,
  setActivePage,
  selectedCategory,
  setSelectedCategory,
  categories,
  insightsProcessing,
  insightsProgress,
  dataLength,
  onInsightClick,
  collapsed,
  onToggleCollapse
}) => {
  const mainMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analysis', label: 'Cost Analysis', icon: TrendingUp },
    { id: 'critical-parts', label: 'Critical Parts', icon: AlertTriangle },
    { id: 'contribution-margin', label: 'Contribution Margin', icon: PercentCircle },
    { id: 'users', label: 'Users', icon: Users },
  ];

  return (
    <div className={`${collapsed ? 'w-[80px]' : 'w-[280px]'} ${collapsed ? 'min-w-[64px]' : 'min-w-[280px]'} bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col border-r border-slate-200 shadow-lg transition-all duration-300 relative`}>
      {/* Brand */}
      <div className="border-b border-slate-200 bg-white relative">
        {collapsed ? (
          <div className="p-3 flex items-center justify-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-md">
              <span className="text-white text-lg font-extrabold tracking-tight">CI</span>
            </div>
          </div>
        ) : (
          <div className="px-4 py-5 flex items-center justify-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-md shrink-0">
              <span className="text-white text-base font-extrabold tracking-tight">CI</span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-base font-extrabold text-slate-800 tracking-tight">Cost Insights</span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Dashboard</span>
            </div>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className={`absolute top-1/2 -translate-y-1/2 ${collapsed ? '-right-3.5' : '-right-3.5'} w-7 h-7 rounded-full border-2 border-slate-300 bg-white hover:bg-slate-50 hover:border-slate-400 flex items-center justify-center transition-all shadow-sm hover:shadow group z-10`}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-900" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-slate-600 group-hover:text-slate-900" />
          )}
        </button>
      </div>

      {/* Main Navigation */}
      <nav className={`${collapsed ? 'px-2' : 'px-4'} pt-3 pb-2 space-y-1`}>
        {!collapsed && (
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">Main Menu</div>
        )}
        {mainMenuItems.map(item => (
          <button
            key={item.id}
            onClick={() => { setActivePage(item.id); setSelectedCategory(null); }}
            title={collapsed ? item.label : ''}
            className={`w-full flex items-center ${collapsed ? 'justify-center' : 'gap-3'} ${collapsed ? 'px-2' : 'px-4'} py-3 rounded-xl text-sm font-medium transition-all relative group cursor-pointer ${
              activePage === item.id && !selectedCategory
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30'
                : 'text-slate-600 hover:bg-white hover:shadow-md'
            }`}
          >
            <div className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all ${
              activePage === item.id && !selectedCategory
                ? 'bg-white/20'
                : 'bg-slate-100 group-hover:bg-blue-50'
            }`}>
              <item.icon className={`w-5 h-5 ${
                activePage === item.id && !selectedCategory
                  ? 'text-white'
                  : 'text-slate-500 group-hover:text-blue-600'
              }`} />
            </div>
            {!collapsed && (
              <>
                <span className="flex-1 text-left">{item.label}</span>
                {activePage === item.id && !selectedCategory && (
                  <ChevronRight className="w-4 h-4" />
                )}
              </>
            )}
          </button>
        ))}
      </nav>

      {/* Divider */}
      {!collapsed && (
        <div className="px-6 py-2">
          <div className="border-t border-slate-200" />
        </div>
      )}

      {/* Business Insights Section */}
      {!collapsed && (
        <div className="flex-1 p-4 overflow-y-auto">
          {insightsProcessing ? (
            <div className="p-4 bg-white rounded-xl border border-blue-200 shadow-sm">
              <div className="flex items-center gap-2 text-blue-600 mb-3">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-xs font-semibold">Analyzing data...</span>
              </div>
              <div className="space-y-2">
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-300"
                    style={{ width: `${(insightsProgress.current / Math.max(insightsProgress.total, 1)) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Generating insights...</span>
                  <span className="font-semibold">{insightsProgress.current}/{insightsProgress.total}</span>
                </div>
              </div>
            </div>
          ) : categories.length > 0 ? (
            <>
              <div className="flex items-center gap-2 px-3 mb-4">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Business Insights</span>
              </div>
              <div className="space-y-1 px-3">
                {categories.map((insight, index) => {
                  const isActive = selectedCategory === insight.id;
                  return (
                    <div key={insight.id} className="mb-3">
                      <button
                        onClick={() => {
                          if (onInsightClick) {
                            onInsightClick(insight.id);
                          } else {
                            setSelectedCategory(insight.id);
                            setActivePage('category');
                          }
                        }}
                        className={`w-full text-left transition-colors cursor-pointer ${
                          isActive
                            ? 'text-blue-600 font-semibold'
                            : 'text-slate-600 hover:text-blue-600'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-blue-500 font-bold shrink-0">{index + 1}.</span>
                          <div className="flex-1">
                            <div className="text-xs leading-relaxed hover:underline">
                              {insight.title}
                            </div>
                            {insight.query && (
                              <div className="text-[10px] text-slate-400 mt-1 italic">
                                "{insight.query}"
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          ) : dataLength > 0 ? (
            <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 text-center">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-3 shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <p className="text-xs font-semibold text-slate-700 mb-1">Insights Ready</p>
              <p className="text-[10px] text-slate-500">Re-upload data to refresh business insights</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default Sidebar;
