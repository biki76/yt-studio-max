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
      className="mb-8 mx-auto max-w-[1600px] bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-md"
    >
      <div className="flex items-center gap-2 mb-8 border-b border-white/5 pb-4">
        <div className="p-2 bg-indigo-500/10 rounded-lg">
          <Activity className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h3 className="text-white/90 font-semibold tracking-tight">Analytics Dashboard</h3>
          <p className="text-xs text-white/40 mt-0.5 font-medium">Batch processing overview</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="h-56 bg-black/20 rounded-xl p-4 border border-white/5">
          <h4 className="text-white/60 text-[11px] font-bold uppercase tracking-widest mb-4">Status Distribution</h4>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height="80%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', fontSize: '13px', padding: '12px 16px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}
                  itemStyle={{ color: '#fff', fontWeight: 500 }}
                  cursor={{fill: 'transparent'}}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-white/30 text-sm">No data</div>
          )}
        </div>

        <div className="h-56 bg-black/20 rounded-xl p-4 border border-white/5">
          <h4 className="flex items-center justify-between text-white/60 text-[11px] font-bold uppercase tracking-widest mb-4">
            <span>Video Duration</span>
            <span className="bg-white/10 text-white/80 px-2 py-0.5 rounded text-[10px]">{format} Target</span>
          </h4>
          {sizeData.length > 0 ? (
            <ResponsiveContainer width="100%" height="80%">
              <BarChart data={sizeData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <XAxis dataKey="name" stroke="none" tick={{fill: 'rgba(255,255,255,0.4)', fontSize: 10}} tickLine={false} axisLine={false} dy={10} />
                <YAxis dataKey="seconds" stroke="none" tick={{fill: 'rgba(255,255,255,0.4)', fontSize: 10}} tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', fontSize: '13px', padding: '12px 16px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}
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
