import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { useAppContext } from '../store/AppContext';
import { parseDurationToSeconds, formatSecondsToDuration } from '../lib/utils';
import { Activity } from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#8b5cf6'];

export function SummaryDashboard() {
  const { batchQueue, format } = useAppContext();

  const activeQueue = batchQueue.length > 0;

  const statusData = useMemo(() => {
    const statusCounts = batchQueue.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.keys(statusCounts).map(key => ({
      name: key.toUpperCase(),
      value: statusCounts[key],
    }));
  }, [batchQueue]);

  const sizeData = useMemo(() => {
    return batchQueue.map(item => {
      const s = parseDurationToSeconds(item.duration);
      return {
        name: item.title.substring(0, 15) + (item.title.length > 15 ? '...' : ''),
        seconds: s
      };
    });
  }, [batchQueue]);

  if (!activeQueue) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 mx-auto max-w-4xl bg-white/5 border border-white/10 rounded-2xl p-6"
    >
      <div className="flex items-center gap-2 mb-6">
        <Activity className="w-5 h-5 text-indigo-400" />
        <h3 className="text-white/90 font-medium">Batch Summary Dashboard</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="h-48">
          <h4 className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-4 text-center">Status Distribution</h4>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 8, fontSize: 12, padding: 8 }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-white/30 text-sm">No data</div>
          )}
        </div>

        <div className="h-48">
          <h4 className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-4 text-center">Duration by Item (Target: {format})</h4>
          {sizeData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sizeData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={9} tickLine={false} axisLine={false} />
                <YAxis dataKey="seconds" stroke="rgba(255,255,255,0.3)" fontSize={9} tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 8, fontSize: 12, padding: 8 }}
                  formatter={(value: number) => [`${formatSecondsToDuration(value)}`, 'Duration']}
                />
                <Bar dataKey="seconds" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-white/30 text-sm">No data</div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
