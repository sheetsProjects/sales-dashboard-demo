import PagePlaceholder from './PagePlaceholder';

const VisualizationPage = ({ onBack }) => (
  <div>
    <button onClick={onBack} className="mb-4 text-sm text-blue-600 hover:underline cursor-pointer">← Back</button>
    <PagePlaceholder
      title="Visualization — coming next"
      subtitle="Query-matched chart from an AI-computed angle."
    />
  </div>
);

export default VisualizationPage;
