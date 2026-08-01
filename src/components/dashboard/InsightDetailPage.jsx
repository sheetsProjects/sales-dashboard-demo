import PagePlaceholder from './PagePlaceholder';

const InsightDetailPage = ({ onBack }) => (
  <div>
    <button onClick={onBack} className="mb-4 text-sm text-blue-600 hover:underline cursor-pointer">← Back</button>
    <PagePlaceholder
      title="Insight Drill-Down — coming next"
      subtitle="Underlying rows, supporting metrics and recommendations."
    />
  </div>
);

export default InsightDetailPage;
