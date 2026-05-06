import { Card } from './Card';

export function ChartCard({ title, subtitle, children }) {
  return (
    <Card>
      <div className="mb-4">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      <div className="h-72">{children}</div>
    </Card>
  );
}
