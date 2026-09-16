import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { TrendingUp, Activity } from 'lucide-react';
import { motion } from 'motion/react';

const priceData = [
  { month: 'Jan', onion: 22, tomato: 15, potato: 12, wheat: 30 },
  { month: 'Feb', onion: 24, tomato: 14, potato: 13, wheat: 31 },
  { month: 'Mar', onion: 28, tomato: 18, potato: 13, wheat: 32 },
  { month: 'Apr', onion: 35, tomato: 25, potato: 15, wheat: 33 },
  { month: 'May', onion: 30, tomato: 35, potato: 18, wheat: 34 },
  { month: 'Jun', onion: 25, tomato: 30, potato: 20, wheat: 33 },
];

const demandData = [
  { category: 'Vegetables', demand: 8500, supply: 6000 },
  { category: 'Fruits', demand: 4200, supply: 4800 },
  { category: 'Grains', demand: 12000, supply: 10500 },
  { category: 'Spices', demand: 1500, supply: 900 },
];

export const CropsAnalytics: React.FC = () => {
  return (
    <div className="space-y-6 mt-8 mb-4">
      <div className="flex items-center gap-2">
        <Activity className="w-5 h-5 text-emerald-700" />
        <h2 className="text-lg font-black text-stone-900">Live Crop Market Analytics</h2>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Price Trend Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-stone-900">6-Month Price Trends (₹/kg)</h3>
              <p className="text-[11px] text-stone-500">Average farmgate prices across top commodities</p>
            </div>
            <TrendingUp className="w-4 h-4 text-stone-400" />
          </div>
          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={priceData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#78716c' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#78716c' }} dx={-10} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e7e5e4', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="onion" name="Onion" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="tomato" name="Tomato" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="potato" name="Potato" stroke="#eab308" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="wheat" name="Wheat" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Demand vs Supply Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-stone-900">Regional Demand vs. Supply (kg)</h3>
              <p className="text-[11px] text-stone-500">Real-time gap analysis for procurement planning</p>
            </div>
          </div>
          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={demandData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }} barGap={6}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" vertical={false} />
                <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{ fill: '#78716c' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#78716c' }} dx={-10} />
                <Tooltip 
                  cursor={{ fill: '#f5f5f4', opacity: 0.4 }}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e7e5e4', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="demand" name="Market Demand" fill="#047857" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="supply" name="Available Supply" fill="#a8a29e" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
