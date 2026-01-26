'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { 
  Users, UserCheck, Wallet, Package, ArrowUpRight, 
  ChevronLeft, ChevronRight, Calendar as CalIcon
} from 'lucide-react';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  
  // --- REAL DATA STATES ---
  const [counts, setCounts] = useState({ student: 0, teacher: 0 });
  const [inventory, setInventory] = useState({ stock: 0, collected: 0 });
  const [feeGraph, setFeeGraph] = useState<any[]>([]);
  
  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    loadRealData();
  }, []);

  async function loadRealData() {
    setLoading(true);
    
    // 1. Counts
    const { count: s } = await supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'active');
    const { count: t } = await supabase.from('teachers').select('*', { count: 'exact', head: true }).eq('status', 'active');
    
    // 2. Inventory Stats (Real Math)
    const [uStock, nStock, uIssues, nIssues] = await Promise.all([
      supabase.from('uniform_stock').select('quantity'),
      supabase.from('notebook_stock').select('quantity'),
      supabase.from('uniform_issues').select('paid_amount'),
      supabase.from('notebook_issues').select('paid_amount'),
    ]);
    
    const totalStock = (uStock.data?.reduce((s, r) => s + r.quantity, 0) || 0) + 
                       (nStock.data?.reduce((s, r) => s + r.quantity, 0) || 0);
                       
    const totalCollected = (uIssues.data?.reduce((s, r) => s + r.paid_amount, 0) || 0) + 
                           (nIssues.data?.reduce((s, r) => s + r.paid_amount, 0) || 0);

    setCounts({ student: s ?? 0, teacher: t ?? 0 });
    setInventory({ stock: totalStock, collected: totalCollected });

    // 3. Fee Graph (Real Data)
    const { data: fees } = await supabase
      .from('fee_records')
      .select('fee_month, total_amount, paid_amount')
      .order('fee_month', { ascending: false })
      .limit(6);
    
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

  // Helper for Calendar
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const startDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  if (loading) return <div className="p-10 text-center text-zinc-500 animate-pulse">Syncing Dashboard...</div>;

  return (
    <div className="space-y-8 animate-fade-in-up">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
            Overview
          </h1>
          <p className="text-zinc-500 mt-1">Real-time metrics from your database</p>
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
          label="Inventory Revenue" value={`₹${inventory.collected.toLocaleString()}`} 
          icon={<Wallet className="w-6 h-6 text-emerald-400" />} 
          color="emerald"
        />
        <GlassCard 
          label="Total Stock Items" value={inventory.stock} 
          icon={<Package className="w-6 h-6 text-orange-400" />} 
          color="orange"
        />
      </div>

      {/* CHART & CALENDAR GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* GRAPH (2/3 Width) */}
        <div className="lg:col-span-2 relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
          
          <div className="relative bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 h-full flex flex-col">
            <h3 className="text-lg font-semibold text-white mb-6">Fee Collection Trend</h3>

            <div className="flex-1 w-full min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={feeGraph} barSize={15} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                  />
                  <Bar dataKey="collected" fill="url(#colorCollected)" radius={[4, 4, 0, 0]} name="Collected" />
                  <Bar dataKey="due" fill="url(#colorDue)" radius={[4, 4, 0, 0]} name="Due" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* CALENDAR WIDGET (1/3 Width) */}
        <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <CalIcon className="w-4 h-4 text-purple-400" /> Calendar
            </h3>
            <div className="flex gap-2">
               <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="p-1 hover:bg-white/10 rounded"><ChevronLeft className="w-4 h-4 text-zinc-400" /></button>
               <span className="text-sm font-medium text-white min-w-[80px] text-center">
                 {currentDate.toLocaleString('default', { month: 'short', year: 'numeric' })}
               </span>
               <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="p-1 hover:bg-white/10 rounded"><ChevronRight className="w-4 h-4 text-zinc-400" /></button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
            {['S','M','T','W','T','F','S'].map(d => <span key={d} className="text-zinc-500 font-bold">{d}</span>)}
          </div>
          
          <div className="grid grid-cols-7 gap-1 text-center text-sm">
            {Array.from({ length: startDay }).map((_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
               const day = i + 1;
               const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
               return (
                 <div 
                   key={day} 
                   className={`
                     py-2 rounded-lg cursor-pointer transition
                     ${isToday ? 'bg-purple-600 text-white font-bold shadow-lg shadow-purple-500/30' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}
                   `}
                 >
                   {day}
                 </div>
               );
            })}
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
          <h3 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">{value}</h3>
        </div>
        <div className="p-3 rounded-xl bg-white/5 ring-1 ring-white/10 group-hover:bg-white/10 transition-colors">
          {icon}
        </div>
      </div>
    </div>
  );
}