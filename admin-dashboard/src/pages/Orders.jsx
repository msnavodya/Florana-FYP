import { DataTable } from '../components/DataTable';
import { StatusBadge } from '../components/StatusBadge';
import { mock } from '../services/api';

export default function Orders() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-950">Orders & Payments</h1>
      <DataTable
        columns={[
          { key: 'id', header: 'Order ID' },
          { key: 'user', header: 'User' },
          { key: 'amount', header: 'Amount', render: (row) => `LKR ${row.amount.toLocaleString()}` },
          { key: 'status', header: 'Status', render: (row) => <StatusBadge value={row.status} /> },
        ]}
        data={mock.orders}
      />
    </div>
  );
}
