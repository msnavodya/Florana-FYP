const styles = {
  Active: 'bg-emerald-50 text-emerald-700',
  Approved: 'bg-emerald-50 text-emerald-700',
  Healthy: 'bg-emerald-50 text-emerald-700',
  Paid: 'bg-emerald-50 text-emerald-700',
  Low: 'bg-emerald-50 text-emerald-700',
  Pending: 'bg-amber-50 text-amber-700',
  Medium: 'bg-amber-50 text-amber-700',
  'Needs Care': 'bg-amber-50 text-amber-700',
  Rejected: 'bg-red-50 text-red-700',
  Blocked: 'bg-red-50 text-red-700',
  Refunded: 'bg-red-50 text-red-700',
  High: 'bg-red-50 text-red-700',
};

export function StatusBadge({ value }) {
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${styles[value] || 'bg-slate-100 text-slate-700'}`}>{value}</span>;
}
