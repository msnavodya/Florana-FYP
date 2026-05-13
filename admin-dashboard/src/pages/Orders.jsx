// Render the admin dashboard page for Orders.
import { CreditCard, RefreshCcw, Trash2 } from 'lucide-react';
import { DataTable } from '../components/DataTable';
import { StatusBadge } from '../components/StatusBadge';
import { api } from '../services/api';
import { useApi } from '../hooks/useApi';

const formatDate = (value) => {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

export default function Orders() {
  const { data, setData, loading, error } = useApi(api.getPayments, []);
  const revenue = data.reduce(
    (sum, row) => (['succeeded', 'cod_confirmed'].includes(row.status) ? sum + Number(row.amount || 0) : sum),
    0,
  );

  const refresh = async () => {
    setData(await api.getPayments());
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this payment record?')) return;
    await api.deletePayment(id);
    setData((rows) => rows.filter((row) => row.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-white p-5 shadow-soft ring-1 ring-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[#8d56af]">Live payments</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-950">Payment Details</h2>
            <p className="mt-2 text-sm text-slate-500">Card and cash-on-delivery confirmations saved by the backend.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-[#f6eef9] px-4 py-3">
              <p className="text-xs font-semibold uppercase text-slate-500">Confirmed revenue</p>
              <p className="text-2xl font-bold text-slate-950">LKR {revenue.toLocaleString()}</p>
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

      <DataTable
        columns={[
          { key: 'id', header: 'Order ID' },
          { key: 'customer', header: 'Customer' },
          { key: 'phone', header: 'Phone' },
          { key: 'address', header: 'Delivery Address', render: (row) => <span className="whitespace-normal">{row.address || 'Not recorded'}</span> },
          { key: 'items_summary', header: 'Items Detail', render: (row) => <span className="whitespace-normal">{row.items_summary || 'No items saved'}</span> },
          { key: 'method', header: 'Method', render: (row) => row.method.toUpperCase() },
          { key: 'item_count', header: 'Items' },
          { key: 'amount', header: 'Amount', render: (row) => `${row.currency} ${Number(row.amount || 0).toLocaleString()}` },
          { key: 'status', header: 'Status', render: (row) => <StatusBadge value={row.status} /> },
          { key: 'payment_intent_id', header: 'Payment Ref', render: (row) => row.payment_intent_id || 'Manual/COD' },
          { key: 'created_at', header: 'Created', render: (row) => formatDate(row.created_at) },
          {
            key: 'source',
            header: 'Source',
            render: () => (
              <span className="inline-flex items-center gap-2 rounded-full bg-[#f6eef9] px-3 py-1 text-xs font-semibold text-[#8d56af]">
                <CreditCard size={14} /> Backend
              </span>
            ),
          },
          {
            key: 'actions',
            header: 'Actions',
            render: (row) => (
              <button
                type="button"
                onClick={() => remove(row.id)}
                className="rounded-lg bg-red-50 p-2 text-red-700 hover:bg-red-100"
                aria-label={`Delete payment ${row.id}`}
              >
                <Trash2 size={16} />
              </button>
            ),
          },
        ]}
        data={data}
        empty="No payment records saved yet"
        error={error}
        loading={loading}
      />
    </div>
  );
}
