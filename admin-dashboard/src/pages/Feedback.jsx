import { MessageSquare } from 'lucide-react';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { mock } from '../services/api';

export default function Feedback() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-950">Feedback</h1>
      <div className="grid gap-4 lg:grid-cols-3">
        {mock.feedback.map((item) => (
          <Card key={item.id}>
            <div className="mb-4 flex items-center justify-between">
              <div className="rounded-lg bg-forest-50 p-3 text-forest-700"><MessageSquare size={20} /></div>
              <StatusBadge value={item.sentiment} />
            </div>
            <p className="font-semibold text-slate-900">{item.user}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.message}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
