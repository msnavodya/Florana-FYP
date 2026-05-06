import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import { ChartCard } from '../components/ChartCard';
import { mock } from '../services/api';

export default function GrowthTracking() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-950">Growth Tracking</h1>
      <ChartCard title="Growth Charts Per Plant" subtitle="Measured plant height by week">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={mock.growthSeries}>
            <XAxis dataKey="week" /><YAxis /><Tooltip /><Legend />
            <Line dataKey="Monstera" stroke="#9b63bb" strokeWidth={3} />
            <Line dataKey="Lily" stroke="#e0a82e" strokeWidth={3} />
            <Line dataKey="SnakePlant" name="Snake Plant" stroke="#d45d4c" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
