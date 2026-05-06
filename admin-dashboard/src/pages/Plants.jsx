import { Trash2 } from 'lucide-react';
import { DataTable } from '../components/DataTable';
import { api } from '../services/api';
import { useApi } from '../hooks/useApi';

export default function Plants() {
  const { data, setData, loading, error } = useApi(api.getPlants, []);

  const remove = async (id) => {
    await api.deletePlant(id);
    setData((rows) => rows.filter((row) => row.id !== id));
  };

  return (
    <DataTable
      columns={[
        { key: 'name', header: 'Name' },
        { key: 'location', header: 'Location' },
        { key: 'user', header: 'User' },
        {
          key: 'actions',
          header: 'Actions',
          render: (row) => (
            <button
              type="button"
              onClick={() => remove(row.id)}
              className="rounded-lg bg-red-50 p-2 text-red-700 hover:bg-red-100"
              aria-label={`Delete ${row.name}`}
            >
              <Trash2 size={16} />
            </button>
          ),
        },
      ]}
      data={data}
      loading={loading}
      error={error}
    />
  );
}
