import { BellRing } from 'lucide-react';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';

const reminders = [
  { id: 1, plant: 'Monstera Deliciosa', user: 'Amal Fernando', task: 'Watering', due: 'Today', status: 'Pending' },
  { id: 2, plant: 'Peace Lily', user: 'Nimali Silva', task: 'Fertilizing', due: 'Tomorrow', status: 'Active' },
  { id: 3, plant: 'Snake Plant', user: 'Kavindu Jay', task: 'Sunlight rotation', due: 'May 6', status: 'Active' },
];

export default function CareReminders() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-950">Care Reminders</h1>
      <div className="grid gap-4 lg:grid-cols-3">
        {reminders.map((reminder) => (
          <Card key={reminder.id}>
            <div className="mb-4 flex items-center justify-between">
              <div className="rounded-lg bg-forest-50 p-3 text-forest-700"><BellRing size={20} /></div>
              <StatusBadge value={reminder.status} />
            </div>
            <p className="font-semibold text-slate-900">{reminder.plant}</p>
            <p className="mt-1 text-sm text-slate-500">{reminder.user}</p>
            <p className="mt-4 text-sm text-slate-700">{reminder.task} due {reminder.due}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
