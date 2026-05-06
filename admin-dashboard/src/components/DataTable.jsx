import { Loader2 } from 'lucide-react';

export function DataTable({ columns, data, loading, error, empty = 'No records found' }) {
  return (
    <div className="overflow-hidden rounded-lg bg-white shadow-soft ring-1 ring-slate-200">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-5 py-3 font-semibold">{column.header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading && (
              <tr>
                <td className="px-5 py-8 text-center text-slate-500" colSpan={columns.length}>
                  <span className="inline-flex items-center gap-2"><Loader2 className="animate-spin" size={16} /> Loading data</span>
                </td>
              </tr>
            )}
            {!loading && error && (
              <tr><td className="px-5 py-8 text-center text-red-600" colSpan={columns.length}>{error}</td></tr>
            )}
            {!loading && !error && data.length === 0 && (
              <tr><td className="px-5 py-8 text-center text-slate-500" colSpan={columns.length}>{empty}</td></tr>
            )}
            {!loading && !error && data.map((row) => (
              <tr key={row.id || row.email || row.name} className="hover:bg-forest-50/40">
                {columns.map((column) => (
                  <td key={column.key} className="whitespace-nowrap px-5 py-4 text-slate-700">
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
