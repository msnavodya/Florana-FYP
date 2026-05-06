import { LogOut, UserCircle } from 'lucide-react';
import { Card } from '../components/Card';

export default function Settings() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-950">Settings</h1>
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-forest-50 p-4 text-forest-700"><UserCircle size={34} /></div>
            <div>
              <p className="text-lg font-semibold text-slate-900">Florana Admin</p>
              <p className="text-sm text-slate-500">admin@florana.lk</p>
            </div>
          </div>
          <button className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"><LogOut size={16} /> Logout</button>
        </div>
      </Card>
    </div>
  );
}
