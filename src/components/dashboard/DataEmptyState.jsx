import { Upload } from 'lucide-react';

const DataEmptyState = ({ title, onUploadClick }) => {
  return (
    <div className="text-center py-20">
      <Upload className="w-16 h-16 text-slate-300 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-slate-600 mb-2">{title || 'No Data Loaded'}</h3>
      <p className="text-slate-500 mb-6">Upload an Excel file to populate the dashboard.</p>
      <button
        onClick={onUploadClick}
        className="px-6 py-3 bg-cyan-500 text-white rounded-xl font-semibold hover:bg-cyan-600 transition cursor-pointer inline-flex items-center gap-2"
      >
        <Upload className="w-4 h-4" /> Upload Excel File
      </button>
    </div>
  );
};

export default DataEmptyState;
