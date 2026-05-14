// Render the admin dashboard page for Feedback.
import { Loader2, MessageSquare, RefreshCcw, Star, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { DataTable } from '../components/DataTable';
import { api } from '../services/api';
import { useApi } from '../hooks/useApi';

const formatDate = (value) => {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

export default function Feedback() {
  const { data, setData, loading, error } = useApi(api.getFeedback, []);
  const [deletingId, setDeletingId] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const average =
    data.length > 0 ? data.reduce((sum, item) => sum + Number(item.rating || 0), 0) / data.length : 0;

  const refresh = async () => {
    setActionError('');
    setActionMessage('');
    setData(await api.getFeedback());
  };

  const remove = async (row) => {
    const preview = row.message.length > 80 ? `${row.message.slice(0, 80)}...` : row.message;
    if (!window.confirm(`Delete this feedback entry?\n\n"${preview}"`)) return;

    setDeletingId(row.id);
    setActionError('');
    setActionMessage('');

    try {
      const response = await api.deleteFeedback(row.id);
      setData((rows) => rows.filter((item) => item.id !== row.id));
      setActionMessage(response.message || 'Feedback deleted successfully.');
    } catch (err) {
      setActionError(err.message || 'Unable to delete feedback right now.');
    } finally {
      setDeletingId('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-white p-5 shadow-soft ring-1 ring-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[#8d56af]">Live feedback</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-950">Customer Feedback Details</h2>
            <p className="mt-2 text-sm text-slate-500">Messages submitted from the mobile app appear here in real time.</p>
          </div>
          <div className="flex items-center gap-3">
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
            <button
              type="button"
              onClick={refresh}
              className="inline-flex items-center gap-2 rounded-lg border border-[#ead8f1] px-3 py-2 text-sm font-semibold text-[#8d56af] hover:bg-[#fbf7fd]"
            >
              <RefreshCcw size={16} /> Refresh
            </button>
          </div>
        </div>
      </div>

      {actionMessage && <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{actionMessage}</p>}
      {actionError && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{actionError}</p>}

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
          {
            key: 'actions',
            header: 'Actions',
            render: (row) => {
              const isDeleting = deletingId === row.id;
              return (
                <button
                  type="button"
                  onClick={() => remove(row)}
                  disabled={isDeleting}
                  className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label={`Delete feedback submitted ${formatDate(row.createdAt)}`}
                >
                  {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  Delete
                </button>
              );
            },
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
