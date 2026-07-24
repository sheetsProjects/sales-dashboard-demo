import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';

// Components
import { Sidebar, Header, DashboardPage, AnalysisPage, CategoryPage, InsightDetailPage, VisualizationPage, UploadModal, ContributionMarginPage, CriticalPartsPage, UserManagementPage } from './dashboard/index';

// Utils & Services
import { DEFAULT_FX_RATE, HEADER_ROWS } from '../utils/constants';
import { calculateKPIs } from '../utils/helpers';
import { parseGivenRow, withDerived, safeSetItem } from '../utils/parseRow';
import { generateInsights, matchQueryToAngle } from '../services/insightsService';

const CostDashboard = ({ onLogout }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Core State
  const [activePage, setActivePage] = useState('dashboard');
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [currency, setCurrency] = useState('INR');
  const [fxRate, setFxRate] = useState(DEFAULT_FX_RATE);
  const [editingFx, setEditingFx] = useState(false);
  const [filters, setFilters] = useState({
    project: '',
    fgPart: '',
    partNo: '',
    customer: '',
    month: '',
    dateFrom: '',
    dateTo: '',
  });

  // Upload State
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Sidebar Collapse State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Insight categorization state (computed deterministically from data)
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryData, setCategoryData] = useState({});
  const [insightsProcessing, setInsightsProcessing] = useState(false);
  const [insightsProgress, setInsightsProgress] = useState({ current: 0, total: 0 });

  // Angle and drill-down state
  const [angles, setAngles] = useState([]);
  const [drillInsightId, setDrillInsightId] = useState(null);

  // Visualization state
  const [visualizationConfig, setVisualizationConfig] = useState(null);

  // Load data from localStorage on mount
  useEffect(() => {
    // Free quota from older builds that persisted heavy derived/categoryData payloads.
    localStorage.removeItem('aiCategoryData');

    const savedData = localStorage.getItem('costData');
    const savedCategories = localStorage.getItem('aiCategories');
    const cacheId = localStorage.getItem('currentCacheId');

    if (savedData) {
      // localStorage holds GIVEN-only rows; rebuild derived fields on load.
      const givenRows = JSON.parse(savedData);
      const enriched = givenRows.map(withDerived);
      setData(enriched);
      setFilteredData(enriched);
    }

    if (savedCategories) {
      setCategories(JSON.parse(savedCategories));
    }

    if (cacheId) {
      const savedAngles = localStorage.getItem(`angles_v1_${cacheId}`);
      if (savedAngles) {
        setAngles(JSON.parse(savedAngles));
      }
    }
  }, []);

  // Apply filters
  useEffect(() => {
    let result = data;

    if (filters.project)  result = result.filter(r => r.project === filters.project);
    if (filters.fgPart)   result = result.filter(r => String(r.fg_part) === String(filters.fgPart));
    if (filters.partNo)   result = result.filter(r => r.part_no === filters.partNo);
    if (filters.customer) result = result.filter(r => r.customer === filters.customer);
    if (filters.month)    result = result.filter(r => r.month === filters.month);

    if (filters.dateFrom || filters.dateTo) {
      // Excel date serials → ms via (serial-25569)*86400000
      const fromMs = filters.dateFrom ? Date.UTC(...filters.dateFrom.split('-').map((v, i) => i === 1 ? +v - 1 : +v)) : null;
      const toMs   = filters.dateTo   ? Date.UTC(...filters.dateTo.split('-').map((v, i) => i === 1 ? +v - 1 : +v))   : null;
      result = result.filter(r => {
        const serial = Number(r.date);
        if (!Number.isFinite(serial)) return true;
        const rowMs = Math.round((serial - 25569) * 86400000);
        if (fromMs != null && rowMs < fromMs) return false;
        if (toMs   != null && rowMs > toMs)   return false;
        return true;
      });
    }

    setFilteredData(result);
  }, [data, filters]);

  // Handle file upload
  const handleFile = (file) => {
    if (!file) return;
    setUploading(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

        // Skip the 5 header rows of the Given Data Sheet (band labels + headers).
        // A data row is identified by a numeric serial in column A.
        const givenRows = rows
          .slice(HEADER_ROWS)
          .filter(r => r[0] !== '' && r[0] != null)
          .map(parseGivenRow);
        const parsed = givenRows.map(withDerived);

        setData(parsed);
        setFilteredData(parsed);
        // Persist only the compact GIVEN payload — derived fields are recomputed on load.
        safeSetItem('costData', JSON.stringify(givenRows));

        setUploading(false);
        setShowUploadModal(false);

        setInsightsProcessing(true);
        setInsightsProgress({ current: 0, total: 3 });

        const result = await generateInsights(parsed, setInsightsProgress);
        setCategories(result.categories);
        setCategoryData(result.categoryData);
        setAngles(result.angles);

        setInsightsProcessing(false);
        setActivePage('dashboard');
      } catch (err) {
        console.error('Upload error:', err);
        alert('Error processing file: ' + err.message);
        setUploading(false);
        setInsightsProcessing(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');
    if (onLogout) onLogout();
    navigate('/');
  };

  // Clear all data
  const clearAllData = () => {
    setData([]);
    setFilteredData([]);
    setCategories([]);
    setCategoryData({});
    setAngles([]);
    localStorage.removeItem('costData');
    localStorage.removeItem('aiCategories');
    localStorage.removeItem('aiCategoryData');
    const cacheId = localStorage.getItem('currentCacheId');
    if (cacheId) {
      localStorage.removeItem(`angles_v1_${cacheId}`);
      localStorage.removeItem(`insights_v1_${cacheId}`);
      localStorage.removeItem(`insights_v1_${cacheId}_time`);
      localStorage.removeItem('currentCacheId');
    }
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({ project: '', fgPart: '', partNo: '', customer: '', month: '', dateFrom: '', dateTo: '' });
  };

  // Download PDF Report using browser print
  const handleDownloadPDF = () => {
    const printStyles = document.createElement('style');
    printStyles.id = 'print-styles';
    printStyles.innerHTML = `
      @media print {
        @page {
          size: A4;
          margin: 15mm;
        }

        body * {
          visibility: hidden;
        }

        #pdf-content-area,
        #pdf-content-area * {
          visibility: visible;
        }

        #pdf-content-area {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          background: white;
          padding: 0;
          margin: 0;
        }

        .filter-section,
        [class*="filter"],
        button[class*="Clear"],
        .bg-slate-50.border.border-slate-200.rounded-xl.p-4.mb-4 {
          display: none !important;
        }

        ::-webkit-scrollbar {
          display: none;
        }

        table {
          width: 100% !important;
          max-width: 100% !important;
          page-break-inside: auto;
          font-size: 10px !important;
        }

        tr {
          page-break-inside: avoid;
          page-break-after: auto;
        }

        td, th {
          padding: 4px !important;
          font-size: 10px !important;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .grid {
          display: grid !important;
          grid-template-columns: repeat(2, 1fr) !important;
          gap: 10px !important;
          page-break-inside: avoid;
        }

        .rounded-xl,
        .rounded-lg {
          page-break-inside: avoid;
          margin-bottom: 10px;
        }

        #pdf-content-area > * {
          max-width: 100%;
        }

        * {
          overflow-wrap: break-word;
          word-wrap: break-word;
        }

        .p-6, .p-8 {
          padding: 10px !important;
        }

        .gap-6, .gap-8 {
          gap: 10px !important;
        }
      }
    `;
    document.head.appendChild(printStyles);

    const originalTitle = document.title;
    document.title = `Cost Report ${new Date().toISOString().split('T')[0]}`;

    window.print();

    setTimeout(() => {
      document.title = originalTitle;
      const styles = document.getElementById('print-styles');
      if (styles) {
        styles.remove();
      }
    }, 100);
  };

  // Handle insight click for drill-down
  const handleInsightClick = (insightId) => {
    setSelectedCategory(insightId);
    setDrillInsightId(insightId);
    setActivePage('drill-down');
  };

  // Handle visualization request
  const handleShowVisualization = (query, visualType) => {
    const config = matchQueryToAngle(query, visualType, angles);
    setVisualizationConfig(config);
    setActivePage('visualization');
  };

  // Calculate KPIs
  const kpi = calculateKPIs(filteredData.length ? filteredData : data);

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        categories={categories}
        insightsProcessing={insightsProcessing}
        insightsProgress={insightsProgress}
        dataLength={data.length}
        onInsightClick={handleInsightClick}
        angles={angles}
        rows={data}
        onShowVisualization={handleShowVisualization}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Header */}
        <Header
          activePage={activePage}
          selectedCategory={selectedCategory}
          categories={categories}
          currency={currency}
          setCurrency={setCurrency}
          fxRate={fxRate}
          setFxRate={setFxRate}
          editingFx={editingFx}
          setEditingFx={setEditingFx}
          dataLength={data.length}
          onUploadClick={() => setShowUploadModal(true)}
          onLogout={handleLogout}
          onDownloadPDF={handleDownloadPDF}
        />

        {/* Content Area */}
        <div id="pdf-content-area" className="flex-1 overflow-y-auto p-6 bg-white">
          {activePage === 'dashboard' && (
            <DashboardPage
              data={data}
              filteredData={filteredData}
              kpi={kpi}
              filters={filters}
              setFilters={setFilters}
              currency={currency}
              fxRate={fxRate}
              onUploadClick={() => setShowUploadModal(true)}
              clearFilters={clearFilters}
            />
          )}

          {activePage === 'analysis' && (
            <AnalysisPage
              data={data}
              kpi={kpi}
              currency={currency}
              fxRate={fxRate}
              onUploadClick={() => setShowUploadModal(true)}
            />
          )}

          {activePage === 'critical-parts' && (
            <CriticalPartsPage
              data={filteredData.length ? filteredData : data}
              currency={currency}
              fxRate={fxRate}
              onUploadClick={() => setShowUploadModal(true)}
            />
          )}

          {activePage === 'contribution-margin' && (
            <ContributionMarginPage
              data={filteredData.length ? filteredData : data}
              currency={currency}
              fxRate={fxRate}
              onUploadClick={() => setShowUploadModal(true)}
            />
          )}

          {activePage === 'users' && (
            <UserManagementPage />
          )}

          {activePage === 'category' && selectedCategory && categoryData[selectedCategory] && (
            <CategoryPage
              selectedCategory={selectedCategory}
              categories={categories}
              categoryData={categoryData}
              currency={currency}
              fxRate={fxRate}
            />
          )}

          {activePage === 'drill-down' && drillInsightId && angles.length > 0 && (
            <InsightDetailPage
              insightId={drillInsightId}
              angles={angles}
              rows={data}
              currency={currency}
              fxRate={fxRate}
              onBack={() => {
                setActivePage('dashboard');
                setDrillInsightId(null);
              }}
            />
          )}

          {activePage === 'visualization' && visualizationConfig && (
            <VisualizationPage
              query={visualizationConfig.query}
              visualType={visualizationConfig.visualType}
              angle={visualizationConfig.angle}
              currency={currency}
              fxRate={fxRate}
              onBack={() => {
                setActivePage('dashboard');
                setVisualizationConfig(null);
              }}
            />
          )}
        </div>
      </div>

      {/* Upload Modal */}
      <UploadModal
        show={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        uploading={uploading}
        dragActive={dragActive}
        setDragActive={setDragActive}
        fileInputRef={fileInputRef}
        onFileSelect={handleFile}
        dataLength={data.length}
        onClearData={clearAllData}
      />
    </div>
  );
};

export default CostDashboard;
