'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { 
  Users, UserCheck, Wallet, Package, ArrowUpRight, 
  ChevronLeft, ChevronRight, Calendar as CalIcon, TrendingUp
} from 'lucide-react';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  
  // Real Data States
  const [counts, setCounts] = useState({ student: 0, teacher: 0 });
  const [inventory, setInventory] = useState({ stock: 0, collected: 0 });
  const [feeGraph, setFeeGraph] = useState<any[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    async function loadData() {
      setLoading(true);

      // 1. Fetch Counts (Optimized)
      const { count: s } = await supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'active');
      const { count: t } = await supabase.from('teachers').select('*', { count: 'exact', head: true }).eq('status', 'active');

      // 2. Fetch Inventory Stats
      const [uStock, nStock, uIssues, nIssues] = await Promise.all([
        supabase.from('uniform_stock').select('quantity'),
        supabase.from('notebook_stock').select('quantity'),
        supabase.from('uniform_issues').select('paid_amount'),
        supabase.from('notebook_issues').select('paid_amount'),
      ]);
      
      const totalStock = (uStock.data?.reduce((a, b) => a + b.quantity, 0) || 0) + (nStock.data?.reduce((a, b) => a + b.quantity, 0) || 0);
      const totalRevenue = (uIssues.data?.reduce((a, b) => a + b.paid_amount, 0) || 0) + (nIssues.data?.reduce((a, b) => a + b.paid_amount, 0) || 0);

      // 3. Fetch Fee Graph
      const { data: fees } = await supabase.from('fee_records').select('fee_month, total_amount, paid_amount').order('fee_month', { ascending: false }).limit(6);
      const graph = fees?.map(f => ({ name: f.fee_month, collected: f.paid_amount, due: f.total_amount - f.paid_amount })).reverse() || [];

      setCounts({ student: s || 0, teacher: t || 0 });
      setInventory({ stock: totalStock, collected: totalRevenue });
      setFeeGraph(graph);
      setLoading(false);
    }
    loadData();
  }, []);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const startDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  if (loading) return (
    <div className="h-[80vh] flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
      <p className="text-zinc-500 text-sm font-medium animate-pulse">Syncing Dashboard...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in-up">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard Overview</h1>
          <p className="text-zinc-500 mt-1.5 text-sm">Real-time metrics and financial analytics.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 bg-zinc-900/50 border border-white/5 px-3 py-1.5 rounded-full">
           <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
           System Active
        </div>
      </div>

      {/* STATS BENTO GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <PremiumCard 
          label="Total Students" 
          value={counts.student.toLocaleString()} 
          trend="+4% this month"
          icon={<Users className="w-6 h-6 text-cyan-400" />} 
          color="cyan"
        />
        <PremiumCard 
          label="Active Teachers" 
          value={counts.teacher.toLocaleString()} 
          trend="Stable"
          icon={<UserCheck className="w-6 h-6 text-violet-400" />} 
          color="violet"
        />
        <PremiumCard 
          label="Inv. Revenue" 
          value={`₹${(inventory.collected / 1000).toFixed(1)}k`} 
          trend="+12% vs last mo"
          icon={<TrendingUp className="w-6 h-6 text-emerald-400" />} 
          color="emerald"
        />
        <PremiumCard 
          label="Stock Items" 
          value={inventory.stock.toLocaleString()} 
          trend="In good standing"
          icon={<Package className="w-6 h-6 text-amber-400" />} 
          color="amber"
        />
      </div>

      {/* CHART & CALENDAR ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* MAIN CHART CARD */}
        <div className="lg:col-span-2 bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 md:p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none group-hover:bg-indigo-500/15 transition-colors duration-700" />
          
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-8">
               <div>
                 <h3 className="text-lg font-semibold text-white">Fee Revenue Trend</h3>
                 <p className="text-zinc-500 text-xs mt-1">Income vs Outstanding Dues</p>
               </div>
               <button className="text-xs bg-white/5 hover:bg-white/10 text-zinc-400 px-3 py-1.5 rounded-lg border border-white/5 transition-colors">
                 Export Data
               </button>
            </div>

            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={feeGraph} barSize={24}>
                  <defs>
                    <linearGradient id="gCol" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" stopOpacity={0.8}/>
                      <stop offset="100%" stopColor="#34d399" stopOpacity={0.2}/>
                    </linearGradient>
                    <linearGradient id="gDue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f87171" stopOpacity={0.8}/>
                      <stop offset="100%" stopColor="#f87171" stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="name" stroke="#52525b" fontSize={11} axisLine={false} tickLine={false} dy={10} />
                  <YAxis stroke="#52525b" fontSize={11} axisLine={false} tickLine={false} tickFormatter={(value) => `₹${value/1000}k`} />
                  <Tooltip 
                    cursor={{fill: 'rgba(255,255,255,0.03)'}} 
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }} 
                    itemStyle={{ fontSize: '12px', fontWeight: 500 }}
                  />
                  <Bar dataKey="collected" fill="url(#gCol)" radius={[6, 6, 0, 0]} name="Collected" />
                  <Bar dataKey="due" fill="url(#gDue)" radius={[6, 6, 0, 0]} name="Due" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* CALENDAR WIDGET */}
        <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-white flex items-center gap-2.5">
              <CalIcon className="w-4 h-4 text-indigo-400" /> Calendar
            </h3>
            <div className="flex items-center gap-1 bg-zinc-950/50 rounded-lg p-0.5 border border-white/5">
               <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="p-1 hover:bg-white/10 rounded-md text-zinc-400 hover:text-white transition"><ChevronLeft className="w-4 h-4" /></button>
               <span className="text-xs font-medium text-white min-w-[70px] text-center">{currentDate.toLocaleString('default', { month: 'short', year: 'numeric' })}</span>
               <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="p-1 hover:bg-white/10 rounded-md text-zinc-400 hover:text-white transition"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-[10px] uppercase font-bold text-zinc-600 mb-3 tracking-wider">
            {['S','M','T','W','T','F','S'].map(d => <span key={d}>{d}</span>)}
          </div>
          
          <div className="grid grid-cols-7 gap-2 text-center text-sm flex-1 content-start">
            {Array.from({ length: startDay }).map((_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
               const day = i + 1;
               const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
               return (
                 <div 
                   key={day} 
                   className={`
                     aspect-square flex items-center justify-center rounded-lg text-xs font-medium cursor-pointer transition-all duration-200
                     ${isToday 
                       ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/40 scale-110' 
                       : 'text-zinc-400 hover:bg-white/5 hover:text-white hover:scale-105'}
                   `}
                 >
                   {day}
                 </div>
               );
            })}
          </div>
          
          {/* Quick Event Dot Legend */}
          <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-4 text-[10px] text-zinc-500">
             <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> Exam</div>
             <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Event</div>
          </div>
        </div>

      </div>
    </div>
  );
}

// --- SUB-COMPONENT: PREMIUM STAT CARD ---

function PremiumCard({ label, value, trend, icon, color }: any) {
  const styles: any = {
    cyan:   'border-cyan-500/10 hover:border-cyan-500/30 hover:shadow-[0_0_50px_-12px_rgba(34,211,238,0.2)]',
    violet: 'border-violet-500/10 hover:border-violet-500/30 hover:shadow-[0_0_50px_-12px_rgba(139,92,246,0.2)]',
    emerald:'border-emerald-500/10 hover:border-emerald-500/30 hover:shadow-[0_0_50px_-12px_rgba(16,185,129,0.2)]',
    amber:  'border-amber-500/10 hover:border-amber-500/30 hover:shadow-[0_0_50px_-12px_rgba(245,158,11,0.2)]',
  };

  return (
    <div className={`
      relative group bg-zinc-900/40 backdrop-blur-xl border p-6 rounded-3xl transition-all duration-500
      ${styles[color]} border-white/5
    `}>
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl bg-white/5 group-hover:bg-white/10 transition-colors ring-1 ring-white/5`}>
          {icon}
        </div>
        <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg border border-white/5">
           <ArrowUpRight className="w-3 h-3 text-zinc-400" />
        </div>
      </div>
      
      <div>
        <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-1">{label}</p>
        <h3 className="text-3xl font-bold text-white tracking-tight">{value}</h3>
        <p className="text-zinc-500 text-xs mt-2 font-medium">
          <span className="text-zinc-300">{trend}</span>
        </p>
      </div>
    </div>
  );
}