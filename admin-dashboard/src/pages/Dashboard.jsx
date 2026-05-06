import { CreditCard, Leaf, MessageSquare, Users as UsersIcon } from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card } from '../components/Card';
import { ChartCard } from '../components/ChartCard';
import { api } from '../services/api';
import { buySellActivity, diseaseDetectedUsage, usageHistory } from '../services/mockData';
import { useApi } from '../hooks/useApi';

export default function Dashboard() {
  const summary = useApi(api.getSummary, []);
  const plants = useApi(api.getPlants, []);
  const users = useApi(api.getUsers, []);
  const payments = useApi(api.getPayments, []);
  const feedback = useApi(api.getFeedback, []);
  const loading = summary.loading || plants.loading || users.loading || payments.loading || feedback.loading;
  const error = summary.error || plants.error || users.error || payments.error || feedback.error;
  const counts = summary.data?.counts || {};

  const cards = [
    { title: 'Total Plants', value: counts.plants ?? plants.data.length, icon: Leaf },
    { title: 'Total Users', value: counts.users ?? users.data.length, icon: UsersIcon },
    { title: 'Feedback', value: counts.feedback ?? feedback.data.length, icon: MessageSquare },
    { title: 'Payments', value: counts.payments ?? payments.data.length, icon: CreditCard },
  ];

  return (
    <div className="space-y-5">
      {loading && <p className="rounded-lg bg-white px-4 py-3 text-sm text-slate-500 ring-1 ring-slate-200">Loading dashboard data...</p>}
      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => <Card key={card.title} {...card} />)}
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <ChartCard title="Usage History" subtitle="Weekly app activity across logins, scans, and care plans">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={usageHistory} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="usageGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#aa73c4" stopOpacity={0.46} />
                  <stop offset="100%" stopColor="#8d56af" stopOpacity={0.06} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#eee7f4" vertical={false} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="logins" stroke="#8d56af" fill="url(#usageGradient)" strokeWidth={3} />
              <Line type="monotone" dataKey="scans" stroke="#aa73c4" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="carePlans" name="care plans" stroke="#d8b4e7" strokeWidth={3} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Disease Detected Usage" subtitle="Disease scanner outcomes by detected condition">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={diseaseDetectedUsage} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid stroke="#eee7f4" vertical={false} />
              <XAxis dataKey="disease" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip />
              <Bar dataKey="detected" fill="#aa73c4" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Buy And Sell Activity" subtitle="Monthly marketplace buy and sell usage">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={buySellActivity} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid stroke="#eee7f4" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="buy" stroke="#aa73c4" strokeWidth={3} />
              <Line type="monotone" dataKey="sell" stroke="#8d56af" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
