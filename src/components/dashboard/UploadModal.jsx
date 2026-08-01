import { useEffect } from 'react';
import { Upload, X, Loader2, BarChart3 } from 'lucide-react';

const UploadModal = ({
  show,
  onClose,
  uploading,
  dragActive,
  setDragActive,
  fileInputRef,
  onFileSelect,
  dataLength,
  onClearData
}) => {
  useEffect(() => {
    if (!show) return;
    const onKey = (e) => { if (e.key === 'Escape' && !uploading) onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [show, uploading, onClose]);

  if (!show) return null;

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={() => { if (!uploading) onClose(); }}
    >
      <div
        className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-800">Upload AutoGlobe Data</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg cursor-pointer">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={() => setDragActive(false)}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
            dragActive ? 'border-cyan-500 bg-cyan-50' : 'border-slate-300 bg-slate-50 hover:border-cyan-400 hover:bg-cyan-50/50'
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="w-10 h-10 text-cyan-500 animate-spin mb-4" />
              <p className="font-semibold text-slate-700">Processing workbook...</p>
            </div>
          ) : (
            <>
              <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="font-bold text-slate-700 text-lg">Drop your Excel workbook here</p>
              <p className="text-slate-500 text-sm mt-2">Supports .xlsx .xls | Max 20MB</p>
              <p className="text-slate-400 text-xs mt-1">AutoGlobe Motors 8-sheet workbook</p>
            </>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="mt-4 p-4 bg-slate-50 rounded-xl">
          <h4 className="text-sm font-semibold text-slate-700 mb-2">Expected sheets:</h4>
          <p className="text-xs text-slate-500 leading-5">
            <b>Overview · Sales · Inventory · Locations · Employees · Targets · Expenses · Customers</b>
          </p>
          <p className="text-[10px] text-slate-400 mt-2">Column headers are read from row 1 of each sheet — no fixed positions required.</p>
        </div>

        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
          <BarChart3 className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-700">Automated Analysis</p>
            <p className="text-xs text-blue-600 mt-1">
              After upload, the workbook is computed into business angles and ranked into top AI insights — fully local, no external calls.
            </p>
          </div>
        </div>

        {dataLength > 0 && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between">
            <div>
              <p className="font-bold text-green-700">Data loaded</p>
              <p className="text-sm text-green-600">{dataLength.toLocaleString()} sales records in memory</p>
            </div>
            <button
              onClick={onClearData}
              className="px-4 py-2 bg-red-100 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-200 cursor-pointer"
            >
              Clear Data
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadModal;
