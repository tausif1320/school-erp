'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Users, UserCircle, Wallet, ArrowUpRight, 
  ArrowDownRight, Bell, Calendar, MoreHorizontal 
} from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    teachers: 0,
    students: 0,
    revenue: 0,
    attendance: 0,
  });

  useEffect(() => {
    async function loadStats() {
      // 1. Counts
      const { count: tCount } = await supabase.from('teachers').select('*', { count: 'exact', head: true });
      const { count: sCount } = await supabase.from('students').select('*', { count: 'exact', head: true });
      
      // 2. Mock Revenue (Replace with real query later)
      const revenue = 1245000; 

      setStats({
        teachers: tCount || 0,
        students: sCount || 0,
        revenue,
        attendance: 87, // Mock % for demo
      });
    }
    loadStats();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in-up pb-20">
      
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Executive Overview</h1>
          <p className="text-zinc-500 text-sm mt-1">School performance metrics for {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>
        </div>
        <div className="flex gap-3">
          <button className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors">
            <Bell className="w-5 h-5" />
          </button>
          <button className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors">
            <Calendar className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          label="Total Revenue" 
          value={`₹${(stats.revenue / 100000).toFixed(2)}L`} 
          trend="+12.5%" 
          trendUp={true}
          icon={<Wallet className="w-5 h-5" />} 
        />
        <MetricCard 
          label="Active Students" 
          value={stats.students} 
          trend="+4.2%" 
          trendUp={true}
          icon={<UserCircle className="w-5 h-5" />} 
        />
        <MetricCard 
          label="Faculty Staff" 
          value={stats.teachers} 
          trend="0.0%" 
          trendUp={true}
          icon={<Users className="w-5 h-5" />} 
        />
        <MetricCard 
          label="Avg. Attendance" 
          value={`${stats.attendance}%`} 
          trend="-1.2%" 
          trendUp={false}
          icon={<Calendar className="w-5 h-5" />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* RECENT ACTIVITY LIST (Clean & Minimal) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Recent Activity</h2>
            <button className="text-xs font-medium text-indigo-400 hover:text-indigo-300">View All</button>
          </div>
          
          <div className="bg-zinc-900/40 border border-white/5 rounded-2xl overflow-hidden">
            <ActivityItem 
              title="Fees Collected" 
              desc="Received ₹45,000 from Class 10-A" 
              time="2h ago" 
              amount="+₹45k" 
              type="success"
            />
            <ActivityItem 
              title="New Admission" 
              desc="Rahul Kumar added to Class 9" 
              time="4h ago" 
              amount="" 
              type="neutral"
            />
            <ActivityItem 
              title="Inventory Alert" 
              desc="Notebooks stock running low (15 units)" 
              time="6h ago" 
              amount="Alert" 
              type="warning"
            />
            <ActivityItem 
              title="Teacher Added" 
              desc="Sarah Smith joined Math Dept" 
              time="1d ago" 
              amount="" 
              type="neutral"
            />
          </div>
        </div>

        {/* QUICK ACTIONS (Compact) */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-white">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-3">
            <QuickAction href="/admin/students/add" label="Register Student" desc="Add new admission record" />
            <QuickAction href="/admin/fees" label="Collect Fees" desc="Record a fee payment" />
            <QuickAction href="/admin/inventory/notebooks/issue" label="Issue Inventory" desc="Assign items to students" />
            <QuickAction href="/admin/teachers/add" label="Add Faculty" desc="Onboard new staff" />
          </div>
        </div>

      </div>
    </div>
  );
}

/* =========================
   SUB-COMPONENTS
========================= */

function MetricCard({ label, value, trend, trendUp, icon }: any) {
  return (
    <div className="bg-zinc-900/40 border border-white/5 p-6 rounded-2xl hover:bg-zinc-900/60 transition-colors group">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2.5 rounded-xl bg-zinc-800/50 text-zinc-400 group-hover:text-white group-hover:bg-zinc-800 transition-all">
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${trendUp ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'}`}>
          {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {trend}
        </div>
      </div>
      <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
      <p className="text-sm text-zinc-500 font-medium mt-1">{label}</p>
    </div>
  );
}

function ActivityItem({ title, desc, time, amount, type }: any) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
      <div className="flex items-center gap-4">
        <div className={`w-2 h-2 rounded-full ${type === 'success' ? 'bg-emerald-500' : type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`} />
        <div>
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="text-xs text-zinc-500">{desc}</p>
        </div>
      </div>
      <div className="text-right">
        {amount && <p className={`text-sm font-bold font-mono ${type === 'success' ? 'text-emerald-400' : 'text-amber-400'}`}>{amount}</p>}
        <p className="text-xs text-zinc-600">{time}</p>
      </div>
    </div>
  );
}

function QuickAction({ href, label, desc }: any) {
  return (
    <Link href={href} className="flex items-center justify-between p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-indigo-500/30 hover:bg-zinc-800 transition-all group">
      <div>
        <p className="text-sm font-bold text-zinc-200 group-hover:text-indigo-400 transition-colors">{label}</p>
        <p className="text-xs text-zinc-500">{desc}</p>
      </div>
      <ArrowUpRight className="w-4 h-4 text-zinc-600 group-hover:text-indigo-400 transition-colors" />
    </Link>
  );
}