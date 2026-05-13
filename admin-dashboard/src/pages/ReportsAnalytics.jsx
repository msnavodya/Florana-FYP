// Render the admin dashboard page for Reports Analytics.
import { Area, AreaChart, Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartCard } from '../components/ChartCard';
import { mock } from '../services/api';

export default function ReportsAnalytics() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-950">Reports & Analytics</h1>
      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Sales Trends" subtitle="Monthly shop revenue">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mock.salesTrend}>
              <XAxis dataKey="month" /><YAxis /><Tooltip />
              <Area dataKey="sales" stroke="#9b63bb" fill="#ead8f1" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Plant Growth Trends" subtitle="Community plant growth velocity">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mock.growthSeries}>
              <XAxis dataKey="week" /><YAxis /><Tooltip />
              <Line dataKey="Monstera" stroke="#9b63bb" strokeWidth={3} />
              <Line dataKey="Lily" stroke="#e0a82e" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <div className="xl:col-span-2">
          <ChartCard title="Prediction Usage" subtitle="Monthly AI prediction requests">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mock.salesTrend}>
                <XAxis dataKey="month" /><YAxis /><Tooltip />
                <Bar dataKey="predictions" fill="#aa73c4" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
