import { DataTable } from '../components/DataTable';
import { api } from '../services/api';
import { useApi } from '../hooks/useApi';

export default function Users() {
  const { data, loading, error } = useApi(api.getUsers, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-950">Users</h2>
      <DataTable
        columns={[
          { key: 'email', header: 'Email' },
          { key: 'role', header: 'Role' },
        ]}
        data={data}
        loading={loading}
        error={error}
      />
    </div>
  );
}
