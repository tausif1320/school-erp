'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
// 1. REMOVE Defs, LinearGradient, Stop from here
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { 
  Users, UserCheck, Wallet, Package, ArrowUpRight, Filter, Calendar
} from 'lucide-react';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [counts, setCounts] = useState({ student: 0, teacher: 0 });
  const [feeGraph, setFeeGraph] = useState<any[]>([]);
  const [graphFilter, setGraphFilter] = useState('6_months');

  useEffect(() => {
    loadData();
  }, [graphFilter]);

  async function loadData() {
    setLoading(true);
    
    // 1. Counts
    const { count: s } = await supabase.from('students').select('*', { count: 'exact', head: true });
    const { count: t } = await supabase.from('teachers').select('*', { count: 'exact', head: true });
    setCounts({ student: s ?? 0, teacher: t ?? 0 });

    // 2. Fees Graph
    const { data: fees } = await supabase
      .from('fee_records')
      .select('fee_month, total_amount, paid_amount')
      .order('fee_month', { ascending: false })
      .limit(graphFilter === '6_months' ? 6 : 12);
    
    if (fees) {
      const formatted = fees.map(f => ({
        name: f.fee_month,
        collected: f.paid_amount,
        due: f.total_amount - f.paid_amount
      })).reverse();
      setFeeGraph(formatted);
    }
    
    setLoading(false);
  }

  if (loading) return <div className="p-10 text-center text-zinc-500 animate-pulse">Syncing Dashboard...</div>;

  return (
    <div className="space-y-8 animate-fade-in-up">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
            Overview
          </h1>
          <p className="text-zinc-500 mt-1">Welcome to Project Aalu Command Center</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-4 py-2 backdrop-blur-md">
          <Calendar className="w-4 h-4 text-purple-400" />
          <span className="text-sm text-zinc-300">
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <GlassCard 
          label="Total Students" value={counts.student} 
          icon={<Users className="w-6 h-6 text-cyan-400" />} 
          color="cyan"
        />
        <GlassCard 
          label="Active Teachers" value={counts.teacher} 
          icon={<UserCheck className="w-6 h-6 text-purple-400" />} 
          color="purple"
        />
        <GlassCard 
          label="Fee Collected" value="₹8.4M" 
          icon={<Wallet className="w-6 h-6 text-emerald-400" />} 
          color="emerald"
        />
        <GlassCard 
          label="Inventory Stock" value="1,240" 
          icon={<Package className="w-6 h-6 text-orange-400" />} 
          color="orange"
        />
      </div>

      {/* CHART SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* BIG GRAPH */}
        <div className="lg:col-span-2 relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
          
          <div className="relative bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 h-full">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-lg font-semibold text-white">Revenue Analytics</h3>
                <p className="text-xs text-zinc-500">Income vs Pending Dues</p>
              </div>
            </div>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={feeGraph} barSize={12} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  
                  {/* 2. FIX: Use lowercase SVG tags directly here */}
                  <defs>
                    <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34d399" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorDue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f87171" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#f87171" stopOpacity={0}/>
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="name" stroke="#525252" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#525252" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                    contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px' }}
                    itemStyle={{ fontSize: '12px' }}
                  />
                  <Bar dataKey="collected" fill="url(#colorCollected)" radius={[4, 4, 0, 0]} animationDuration={1500} />
                  <Bar dataKey="due" fill="url(#colorDue)" radius={[4, 4, 0, 0]} animationDuration={1500} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* SIDE PANELS */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-purple-900/40 to-black border border-white/10 p-6 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl"></div>
            <h3 className="text-white font-bold text-lg mb-1">Fee Collection</h3>
            <p className="text-purple-200/60 text-xs mb-6">Quickly record a new payment</p>
            <button className="w-full bg-white text-black font-semibold py-3 rounded-xl hover:scale-105 transition transform flex items-center justify-center gap-2 text-sm">
               Record Transaction <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-[#0a0a0a]/60 backdrop-blur border border-white/10 p-5 rounded-2xl">
            <h4 className="text-sm font-semibold text-zinc-300 mb-4">Recent Alerts</h4>
            <div className="space-y-3">
              {[1,2,3].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg transition cursor-pointer">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <div className="flex-1">
                    <p className="text-xs text-zinc-300">Inventory Low: Notebooks</p>
                    <p className="text-[10px] text-zinc-600">2 mins ago</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function GlassCard({ label, value, icon, color }: any) {
  const glowColors: any = {
    cyan: 'group-hover:shadow-[0_0_40px_-10px_rgba(34,211,238,0.3)] border-cyan-500/20',
    purple: 'group-hover:shadow-[0_0_40px_-10px_rgba(168,85,247,0.3)] border-purple-500/20',
    emerald: 'group-hover:shadow-[0_0_40px_-10px_rgba(52,211,153,0.3)] border-emerald-500/20',
    orange: 'group-hover:shadow-[0_0_40px_-10px_rgba(251,146,60,0.3)] border-orange-500/20',
  };

  return (
    <div className={`
      group relative bg-[#0a0a0a]/60 backdrop-blur-xl border border-white/5 
      p-6 rounded-2xl transition-all duration-500 hover:-translate-y-1
      ${glowColors[color]}
    `}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest mb-2">{label}</p>
          <h3 className="text-3xl font-bold text-white tracking-tight">{typeof value === 'number' ? value.toLocaleString() : value}</h3>
        </div>
        <div className="p-3 rounded-xl bg-white/5 ring-1 ring-white/10 group-hover:bg-white/10 transition-colors">
          {icon}
        </div>
      </div>
    </div>
  );
}