'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from 'recharts';
import { 
  Users, UserCheck, UserX, Wallet, 
  Package, Shirt, BookOpen, TrendingUp, MoreHorizontal
} from 'lucide-react';

/* =========================
   ADMIN DASHBOARD
========================= */

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);

  // Stats State
  const [studentCount, setStudentCount] = useState(0);
  const [teacherCount, setTeacherCount] = useState(0);
  const [attendanceSummary, setAttendanceSummary] = useState({ present: 0, absent: 0 });

  // Inventory State
  const [uniformStock, setUniformStock] = useState(0);
  const [notebookStock, setNotebookStock] = useState(0);
  const [inventoryCollected, setInventoryCollected] = useState(0);
  const [inventoryDue, setInventoryDue] = useState(0);

  // Fees State
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // Default to current month
  const [feeSummary, setFeeSummary] = useState({ total: 0, collected: 0, due: 0 });
  const [feeGraphData, setFeeGraphData] = useState<{ month: string; collected: number; due: number }[]>([]);

  /* =========================
     DATA LOADING LOGIC
  ========================= */
  useEffect(() => {
    async function loadAllData() {
      setLoading(true);
      await Promise.all([
        loadCounts(),
        loadInventorySummary(),
        loadAttendanceSummary(),
        loadFeeGraph(),
        loadFeeSummary(), // Load initial month
      ]);
      setLoading(false);
    }
    loadAllData();
  }, []);

  useEffect(() => {
    loadFeeSummary();
  }, [month]);

  async function loadCounts() {
    const { count: students } = await supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'active');
    const { count: teachers } = await supabase.from('teachers').select('*', { count: 'exact', head: true }).eq('status', 'active');
    setStudentCount(students ?? 0);
    setTeacherCount(teachers ?? 0);
  }

  async function loadInventorySummary() {
    const [uniformStockRes, notebookStockRes, uniformIssuesRes, notebookIssuesRes] = await Promise.all([
      supabase.from('uniform_stock').select('quantity'),
      supabase.from('notebook_stock').select('quantity'),
      supabase.from('uniform_issues').select('total_amount, paid_amount'),
      supabase.from('notebook_issues').select('total_amount, paid_amount'),
    ]);

    const totalUniformStock = uniformStockRes.data?.reduce((s, r) => s + r.quantity, 0) ?? 0;
    const totalNotebookStock = notebookStockRes.data?.reduce((s, r) => s + r.quantity, 0) ?? 0;
    
    const allIssues = [...(uniformIssuesRes.data ?? []), ...(notebookIssuesRes.data ?? [])];
    const collected = allIssues.reduce((s, r) => s + r.paid_amount, 0);
    const issued = allIssues.reduce((s, r) => s + r.total_amount, 0);

    setUniformStock(totalUniformStock);
    setNotebookStock(totalNotebookStock);
    setInventoryCollected(collected);
    setInventoryDue(issued - collected);
  }

  async function loadFeeGraph() {
    const { data } = await supabase
      .from('fee_records')
      .select('fee_month, total_amount, paid_amount')
      .order('fee_month', { ascending: false })
      .limit(6);

    if (!data) return;

    const grouped: Record<string, { total: number; paid: number }> = {};
    data.forEach((f) => {
      if (!grouped[f.fee_month]) grouped[f.fee_month] = { total: 0, paid: 0 };
      grouped[f.fee_month].total += f.total_amount;
      grouped[f.fee_month].paid += f.paid_amount;
    });

    setFeeGraphData(Object.entries(grouped).map(([m, v]) => ({ month: m, collected: v.paid, due: v.total - v.paid })).reverse());
  }

  async function loadFeeSummary() {
    if (!month) return;
    const { data } = await supabase.from('fee_records').select('total_amount, paid_amount').eq('fee_month', month);
    if (!data) return;
    const total = data.reduce((s, f) => s + f.total_amount, 0);
    const collected = data.reduce((s, f) => s + f.paid_amount, 0);
    setFeeSummary({ total, collected, due: total - collected });
  }

  async function loadAttendanceSummary() {
    const now = new Date();
    const start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const { data } = await supabase.from('teacher_attendance').select('status').gte('date', start);
    if (!data) return;
    setAttendanceSummary({
      present: data.filter((a) => a.status === 'present').length,
      absent: data.filter((a) => a.status === 'absent').length,
    });
  }

  if (loading) return <div className="p-10 text-center text-slate-400">Loading Dashboard Data...</div>;

  return (
    <div className="space-y-8 animate-fade-in-up">
      
      {/* HEADER */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
          <p className="text-slate-400 text-sm mt-1">Real-time metrics for your school administration.</p>
        </div>
      </div>

      {/* --- SECTION 1: PEOPLE STATS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          label="Total Students" 
          value={studentCount} 
          icon={<Users className="w-6 h-6 text-blue-400" />} 
          bg="bg-blue-500/10" 
        />
        <StatsCard 
          label="Total Teachers" 
          value={teacherCount} 
          icon={<UserCheck className="w-6 h-6 text-purple-400" />} 
          bg="bg-purple-500/10" 
        />
        <StatsCard 
          label="Teachers Present" 
          value={attendanceSummary.present} 
          sub="This Month"
          icon={<UserCheck className="w-6 h-6 text-green-400" />} 
          bg="bg-green-500/10" 
        />
        <StatsCard 
          label="Teachers Absent" 
          value={attendanceSummary.absent} 
          sub="This Month"
          icon={<UserX className="w-6 h-6 text-red-400" />} 
          bg="bg-red-500/10" 
        />
      </div>

      {/* --- SECTION 2: INVENTORY & FINANCE OVERVIEW --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Inventory Card */}
        <div className="bg-[#1e293b] p-6 rounded-xl border border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-orange-400" /> Inventory Status
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <MiniStat label="Uniform Stock" value={uniformStock} icon={<Shirt className="w-4 h-4" />} />
             <MiniStat label="Notebook Stock" value={notebookStock} icon={<BookOpen className="w-4 h-4" />} />
             <MiniStat label="Rev. Collected" value={`₹${inventoryCollected}`} color="text-green-400" />
             <MiniStat label="Rev. Due" value={`₹${inventoryDue}`} color="text-red-400" />
          </div>
        </div>

        {/* Fees Graph (Wide) */}
        <div className="lg:col-span-2 bg-[#1e293b] p-6 rounded-xl border border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-teal-400" /> Fee Trends
            </h3>
            <select className="bg-slate-900 border border-slate-700 text-xs rounded px-2 py-1 text-slate-400">
               <option>Last 6 Months</option>
            </select>
          </div>
          
          <div className="h-[200px] w-full">
            {feeGraphData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={feeGraphData} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                    cursor={{ fill: 'transparent' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />
                  <Bar dataKey="collected" name="Collected" fill="#2dd4bf" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="due" name="Due" fill="#f87171" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">No Data Available</div>
            )}
          </div>
        </div>
      </div>

      {/* --- SECTION 3: MONTHLY FEE SNAPSHOT --- */}
      <div className="bg-[#1e293b] p-6 rounded-xl border border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400"><Wallet className="w-5 h-5" /></div>
             <div>
               <h3 className="font-semibold text-white">Monthly Fee Snapshot</h3>
               <p className="text-xs text-slate-400">Overview for selected month</p>
             </div>
          </div>
          
          <input
            type="month"
            className="bg-slate-900 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <FeeStatCard label="Total Expected" value={feeSummary.total} color="text-white" border="border-l-4 border-blue-500" />
           <FeeStatCard label="Collected" value={feeSummary.collected} color="text-green-400" border="border-l-4 border-green-500" />
           <FeeStatCard label="Outstanding Due" value={feeSummary.due} color="text-red-400" border="border-l-4 border-red-500" />
        </div>
      </div>

    </div>
  );
}

/* --- SUB COMPONENTS --- */

function StatsCard({ label, value, icon, bg, sub }: any) {
  return (
    <div className="bg-[#1e293b] p-5 rounded-xl border border-slate-800 hover:border-slate-700 transition shadow-sm group">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">{label}</p>
          <h3 className="text-2xl font-bold text-white mt-1 group-hover:scale-105 transition-transform origin-left">
             {typeof value === 'number' ? value.toLocaleString() : value}
          </h3>
          {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
        </div>
        <div className={`p-3 rounded-lg ${bg}`}>{icon}</div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, icon, color = "text-white" }: any) {
  return (
    <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
      <div className="flex items-center gap-2 mb-1 text-slate-400 text-xs">
        {icon}
        <span>{label}</span>
      </div>
      <p className={`font-bold text-lg ${color}`}>{value}</p>
    </div>
  );
}

function FeeStatCard({ label, value, color, border }: any) {
  return (
    <div className={`bg-slate-900/30 p-4 rounded-r-lg ${border} flex justify-between items-center`}>
      <span className="text-slate-400 font-medium">{label}</span>
      <span className={`text-xl font-bold font-mono ${color}`}>₹{value.toLocaleString()}</span>
    </div>
  );
}