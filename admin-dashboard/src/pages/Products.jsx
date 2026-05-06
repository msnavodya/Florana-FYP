import { Trash2 } from 'lucide-react';
import { DataTable } from '../components/DataTable';
import { api } from '../services/api';
import { useApi } from '../hooks/useApi';

export default function Products() {
  const { data, setData, loading, error } = useApi(api.getProducts, []);

  const remove = async (id) => {
    await api.deleteProduct(id);
    setData((rows) => rows.filter((row) => row.id !== id));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-950">Products</h2>
      <DataTable
        columns={[
          { key: 'name', header: 'Name' },
          { key: 'price', header: 'Price', render: (row) => `LKR ${Number(row.price || 0).toLocaleString()}` },
          { key: 'season', header: 'Season' },
          { key: 'actions', header: 'Actions', render: (row) => <button onClick={() => remove(row.id)} className="rounded-lg bg-red-50 p-2 text-red-700 hover:bg-red-100" aria-label={`Delete ${row.name}`}><Trash2 size={16} /></button> },
        ]}
        data={data}
        loading={loading}
        error={error}
      />
    </div>
  );
}
