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
  const [counts, setCounts] = useState({ student: 0, teacher: 0 });
  const [inventory, setInventory] = useState({ stock: 0, collected: 0 });
  const [feeGraph, setFeeGraph] = useState<any[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    async function load() {
      setLoading(true);
      // 1. Counts
      const { count: s } = await supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'active');
      const { count: t } = await supabase.from('teachers').select('*', { count: 'exact', head: true }).eq('status', 'active');
      
      // 2. Inventory
      const [uStock, nStock, uIssues, nIssues] = await Promise.all([
        supabase.from('uniform_stock').select('quantity'),
        supabase.from('notebook_stock').select('quantity'),
        supabase.from('uniform_issues').select('paid_amount'),
        supabase.from('notebook_issues').select('paid_amount'),
      ]);
      const totalStock = (uStock.data?.reduce((a, b) => a + b.quantity, 0) || 0) + (nStock.data?.reduce((a, b) => a + b.quantity, 0) || 0);
      const totalCol = (uIssues.data?.reduce((a, b) => a + b.paid_amount, 0) || 0) + (nIssues.data?.reduce((a, b) => a + b.paid_amount, 0) || 0);

      // 3. Fees
      const { data: fees } = await supabase.from('fee_records').select('fee_month, total_amount, paid_amount').order('fee_month', { ascending: false }).limit(6);
      const graph = fees?.map(f => ({ name: f.fee_month, collected: f.paid_amount, due: f.total_amount - f.paid_amount })).reverse() || [];

      setCounts({ student: s || 0, teacher: t || 0 });
      setInventory({ stock: totalStock, collected: totalCol });
      setFeeGraph(graph);
      setLoading(false);
    }
    load();
  }, []);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const startDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  if (loading) return <div className="p-10 text-center text-zinc-500 animate-pulse">Loading dashboard...</div>;

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white">Overview</h1>
          <p className="text-zinc-500 mt-1">Metrics & Analytics</p>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <GlassCard label="Total Students" value={counts.student} icon={<Users className="w-6 h-6 text-cyan-400" />} color="cyan" />
        <GlassCard label="Active Teachers" value={counts.teacher} icon={<UserCheck className="w-6 h-6 text-purple-400" />} color="purple" />
        <GlassCard label="Inventory Rev." value={`₹${inventory.collected.toLocaleString()}`} icon={<Wallet className="w-6 h-6 text-emerald-400" />} color="emerald" />
        <GlassCard label="Stock Items" value={inventory.stock} icon={<Package className="w-6 h-6 text-orange-400" />} color="orange" />
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 relative group bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Fee Revenue</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={feeGraph} barSize={15}>
                <defs>
                  <linearGradient id="col" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#34d399" stopOpacity={0.8}/><stop offset="95%" stopColor="#34d399" stopOpacity={0}/></linearGradient>
                  <linearGradient id="due" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f87171" stopOpacity={0.8}/><stop offset="95%" stopColor="#f87171" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="name" stroke="#525252" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="#525252" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }} />
                <Bar dataKey="collected" fill="url(#col)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="due" fill="url(#due)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CALENDAR */}
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-white flex items-center gap-2"><CalIcon className="w-4 h-4 text-purple-400" /> Calendar</h3>
            <div className="flex gap-2">
               <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="p-1 hover:bg-white/10 rounded"><ChevronLeft className="w-4 h-4 text-zinc-400" /></button>
               <span className="text-sm font-medium text-white min-w-[80px] text-center">{currentDate.toLocaleString('default', { month: 'short', year: 'numeric' })}</span>
               <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="p-1 hover:bg-white/10 rounded"><ChevronRight className="w-4 h-4 text-zinc-400" /></button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">{['S','M','T','W','T','F','S'].map(d => <span key={d} className="text-zinc-500 font-bold">{d}</span>)}</div>
          <div className="grid grid-cols-7 gap-1 text-center text-sm">
            {Array.from({ length: startDay }).map((_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
               const d = i + 1;
               const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), d).toDateString();
               return <div key={d} className={`py-2 rounded-lg ${isToday ? 'bg-purple-600 text-white font-bold' : 'text-zinc-400 hover:bg-white/5'}`}>{d}</div>
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function GlassCard({ label, value, icon, color }: any) {
  const c = {
    cyan: 'border-cyan-500/20 group-hover:shadow-[0_0_30px_-10px_rgba(34,211,238,0.3)]',
    purple: 'border-purple-500/20 group-hover:shadow-[0_0_30px_-10px_rgba(168,85,247,0.3)]',
    emerald: 'border-emerald-500/20 group-hover:shadow-[0_0_30px_-10px_rgba(52,211,153,0.3)]',
    orange: 'border-orange-500/20 group-hover:shadow-[0_0_30px_-10px_rgba(251,146,60,0.3)]',
  }[color as string];
  return (
    <div className={`group relative bg-zinc-900/50 backdrop-blur-xl border border-white/5 p-6 rounded-2xl transition-all hover:-translate-y-1 ${c}`}>
      <div className="flex justify-between items-start">
        <div><p className="text-zinc-500 text-xs font-medium uppercase tracking-widest mb-2">{label}</p><h3 className="text-2xl font-bold text-white">{value}</h3></div>
        <div className="p-3 rounded-xl bg-white/5 group-hover:bg-white/10 transition-colors">{icon}</div>
      </div>
    </div>
  );
}