// Render the admin dashboard page for Feedback.
import { MessageSquare, Star } from 'lucide-react';
import { DataTable } from '../components/DataTable';
import { api } from '../services/api';
import { useApi } from '../hooks/useApi';

const formatDate = (value) => {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

export default function Feedback() {
  const { data, loading, error } = useApi(api.getFeedback, []);
  const average =
    data.length > 0 ? data.reduce((sum, item) => sum + Number(item.rating || 0), 0) / data.length : 0;

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-white p-5 shadow-soft ring-1 ring-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[#8d56af]">Live feedback</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-950">Customer Feedback Details</h2>
            <p className="mt-2 text-sm text-slate-500">Messages submitted from the mobile app appear here in real time.</p>
          </div>
          <div className="flex gap-3">
            <div className="rounded-lg bg-[#f6eef9] px-4 py-3">
              <p className="text-xs font-semibold uppercase text-slate-500">Total</p>
              <p className="text-2xl font-bold text-slate-950">{data.length}</p>
            </div>
            <div className="rounded-lg bg-[#f6eef9] px-4 py-3">
              <p className="text-xs font-semibold uppercase text-slate-500">Average</p>
              <p className="flex items-center gap-1 text-2xl font-bold text-slate-950">
                {average.toFixed(1)} <Star size={18} className="fill-[#f2b84b] text-[#f2b84b]" />
              </p>
            </div>
          </div>
        </div>
      </div>

      <DataTable
        columns={[
          {
            key: 'rating',
            header: 'Rating',
            render: (row) => (
              <span className="inline-flex items-center gap-1 font-semibold text-slate-900">
                <Star size={15} className="fill-[#f2b84b] text-[#f2b84b]" /> {row.rating}/5
              </span>
            ),
          },
          { key: 'message', header: 'Message', render: (row) => <span className="whitespace-normal">{row.message}</span> },
          { key: 'createdAt', header: 'Submitted', render: (row) => formatDate(row.createdAt) },
          {
            key: 'source',
            header: 'Source',
            render: () => (
              <span className="inline-flex items-center gap-2 rounded-full bg-[#f6eef9] px-3 py-1 text-xs font-semibold text-[#8d56af]">
                <MessageSquare size={14} /> Mobile app
              </span>
            ),
          },
        ]}
        data={data}
        empty="No feedback messages submitted yet"
        error={error}
        loading={loading}
      />
    </div>
  );
}
