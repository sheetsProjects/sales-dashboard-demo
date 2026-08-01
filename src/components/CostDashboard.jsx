import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Sidebar, Header, DashboardPage, AnalysisPage, InventoryPage, BranchesPage,
  SalesRepsPage, CustomersPage, CategoryPage, InsightDetailPage, VisualizationPage,
  UploadModal, UserManagementPage
} from './dashboard/index';

import { STORAGE_KEYS } from '../utils/constants';
import { calculateKPIs } from '../utils/helpers';
import { parseWorkbook, safeSetItem, migrateStorage } from '../utils/parseWorkbook';
import { generateInsights, matchQueryToAngle } from '../services/insightsService';

const EMPTY_WORKBOOK = {
  sales: [], inventory: [], locations: [],
  employees: [], targets: [], expenses: [], customers: [],
};

const DEFAULT_FILTERS = {
  dateFrom: '', dateTo: '', location: '',
  make: '', bodyType: '', fuelType: '', salesChannel: '',
};

const SalesDashboard = ({ onLogout }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [activePage, setActivePage] = useState('dashboard');
  const [workbook, setWorkbook] = useState(EMPTY_WORKBOOK);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryData, setCategoryData] = useState({});
  const [insightsProcessing, setInsightsProcessing] = useState(false);
  const [insightsProgress, setInsightsProgress] = useState({ current: 0, total: 0 });

  const [angles, setAngles] = useState([]);
  const [drillInsightId, setDrillInsightId] = useState(null);
  const [visualizationConfig, setVisualizationConfig] = useState(null);

  // Hydrate from localStorage. First runs the one-time BOM→AutoGlobe migration.
  useEffect(() => {
    migrateStorage();

    const rawWb = localStorage.getItem(STORAGE_KEYS.workbook);
    if (rawWb) {
      try {
        const parsed = JSON.parse(rawWb);
        // Ensure every expected key exists — old cache shape safety.
        setWorkbook({ ...EMPTY_WORKBOOK, ...parsed });
      } catch {
        localStorage.removeItem(STORAGE_KEYS.workbook);
      }
    }

    const rawCats = localStorage.getItem(STORAGE_KEYS.categories);
    if (rawCats) {
      try { setCategories(JSON.parse(rawCats)); } catch { /* ignore */ }
    }

    const cacheId = localStorage.getItem(STORAGE_KEYS.cacheId);
    if (cacheId) {
      const rawAngles = localStorage.getItem(`${STORAGE_KEYS.anglesPrefix}${cacheId}`);
      if (rawAngles) {
        try { setAngles(JSON.parse(rawAngles)); } catch { /* ignore */ }
      }
    }
  }, []);

  const handleFile = (file) => {
    if (!file) return;
    setUploading(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const wb = parseWorkbook(e.target.result);
        setWorkbook(wb);
        safeSetItem(STORAGE_KEYS.workbook, JSON.stringify(wb));

        setUploading(false);
        setShowUploadModal(false);

        setInsightsProcessing(true);
        setInsightsProgress({ current: 0, total: 3 });

        const result = await generateInsights(wb, setInsightsProgress);
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

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');
    if (onLogout) onLogout();
    navigate('/');
  };

  const clearAllData = () => {
    setWorkbook(EMPTY_WORKBOOK);
    setCategories([]);
    setCategoryData({});
    setAngles([]);
    localStorage.removeItem(STORAGE_KEYS.workbook);
    localStorage.removeItem(STORAGE_KEYS.categories);
    const cacheId = localStorage.getItem(STORAGE_KEYS.cacheId);
    if (cacheId) {
      localStorage.removeItem(`${STORAGE_KEYS.anglesPrefix}${cacheId}`);
      localStorage.removeItem(STORAGE_KEYS.cacheId);
    }
  };

  const clearFilters = () => setFilters(DEFAULT_FILTERS);

  // Browser-print PDF (kept from previous shell, tightened for the new layout).
  const handleDownloadPDF = () => {
    const styles = document.createElement('style');
    styles.id = 'print-styles';
    styles.innerHTML = `
      @media print {
        @page { size: A4; margin: 15mm; }
        body * { visibility: hidden; }
        #pdf-content-area, #pdf-content-area * { visibility: visible; }
        #pdf-content-area { position: absolute; left: 0; top: 0; width: 100%; background: white; padding: 0; margin: 0; }
        .filter-section, [class*="filter"] { display: none !important; }
        ::-webkit-scrollbar { display: none; }
        table { width: 100% !important; font-size: 10px !important; page-break-inside: auto; }
        tr { page-break-inside: avoid; }
        td, th { padding: 4px !important; font-size: 10px !important; }
        .grid { display: grid !important; grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; page-break-inside: avoid; }
        .rounded-xl, .rounded-lg { page-break-inside: avoid; margin-bottom: 10px; }
        * { overflow-wrap: break-word; }
        .p-6, .p-8 { padding: 10px !important; }
        .gap-6, .gap-8 { gap: 10px !important; }
      }
    `;
    document.head.appendChild(styles);
    const originalTitle = document.title;
    document.title = `AutoGlobe Sales Report ${new Date().toISOString().split('T')[0]}`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
      styles.remove();
    }, 100);
  };

  const handleInsightClick = (insightId) => {
    setSelectedCategory(insightId);
    setDrillInsightId(insightId);
    setActivePage('drill-down');
  };

  const handleShowVisualization = (query, visualType) => {
    const config = matchQueryToAngle(query, visualType, angles);
    setVisualizationConfig(config);
    setActivePage('visualization');
  };

  const kpi = calculateKPIs(workbook, filters);
  const salesCount = workbook.sales.length;

  const pageProps = { workbook, filters, setFilters, clearFilters, kpi, onUploadClick: () => setShowUploadModal(true) };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        categories={categories}
        insightsProcessing={insightsProcessing}
        insightsProgress={insightsProgress}
        dataLength={salesCount}
        onInsightClick={handleInsightClick}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className="flex-1 overflow-hidden flex flex-col">
        <Header
          activePage={activePage}
          selectedCategory={selectedCategory}
          categories={categories}
          dataLength={salesCount}
          onUploadClick={() => setShowUploadModal(true)}
          onLogout={handleLogout}
          onDownloadPDF={handleDownloadPDF}
        />

        <div id="pdf-content-area" className="flex-1 overflow-y-auto p-6 bg-white">
          {activePage === 'dashboard'  && <DashboardPage  {...pageProps} />}
          {activePage === 'analysis'   && <AnalysisPage   {...pageProps} />}
          {activePage === 'inventory'  && <InventoryPage  {...pageProps} />}
          {activePage === 'branches'   && <BranchesPage   {...pageProps} />}
          {activePage === 'sales-reps' && <SalesRepsPage  {...pageProps} />}
          {activePage === 'customers'  && <CustomersPage  {...pageProps} />}
          {activePage === 'users'      && <UserManagementPage />}

          {activePage === 'category' && selectedCategory && categoryData[selectedCategory] && (
            <CategoryPage
              selectedCategory={selectedCategory}
              categories={categories}
              categoryData={categoryData}
            />
          )}

          {activePage === 'drill-down' && drillInsightId && angles.length > 0 && (
            <InsightDetailPage
              insightId={drillInsightId}
              angles={angles}
              workbook={workbook}
              onBack={() => { setActivePage('dashboard'); setDrillInsightId(null); }}
            />
          )}

          {activePage === 'visualization' && visualizationConfig && (
            <VisualizationPage
              query={visualizationConfig.query}
              visualType={visualizationConfig.visualType}
              angle={visualizationConfig.angle}
              workbook={workbook}
              onBack={() => { setActivePage('dashboard'); setVisualizationConfig(null); }}
            />
          )}
        </div>
      </div>

      <UploadModal
        show={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        uploading={uploading}
        dragActive={dragActive}
        setDragActive={setDragActive}
        fileInputRef={fileInputRef}
        onFileSelect={handleFile}
        dataLength={salesCount}
        onClearData={clearAllData}
      />
    </div>
  );
};

export default SalesDashboard;
