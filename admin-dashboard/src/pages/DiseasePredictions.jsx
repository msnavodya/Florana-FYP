// Render the admin dashboard page for Disease Predictions.
import { DataTable } from '../components/DataTable';
import { StatusBadge } from '../components/StatusBadge';
import { mock } from '../services/api';

export default function DiseasePredictions() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-950">Disease Predictions</h1>
      <DataTable
        columns={[
          { key: 'image', header: 'Uploaded Image', render: (row) => <img src={row.image} alt={row.result} className="h-14 w-14 rounded-lg object-cover" /> },
          { key: 'result', header: 'Prediction Result' },
          { key: 'risk', header: 'Risk Level', render: (row) => <StatusBadge value={row.risk} /> },
          { key: 'timestamp', header: 'Timestamp' },
        ]}
        data={mock.predictions}
      />
    </div>
  );
}
