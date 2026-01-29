'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Users, UserCircle, Wallet, TrendingUp, Activity, 
  Plus, Calendar as CalendarIcon, CheckCircle2, 
  UserPlus, Clock, Package, AlertTriangle, ChevronLeft, ChevronRight,
  Shirt, Book, CreditCard
} from 'lucide-react';
import Link from 'next/link';

/* =========================
   3D TILT METRIC CARD (Mobile Tap Fix Added)
========================= */
function TiltMetric({ label, value, subLabel, icon, color }: any) {
  const ref = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setRotation({ x: y * -10, y: x * 10 });
  };

  const reset = () => setRotation({ x: 0, y: 0 });

  const colors: any = {
    indigo: { bg: 'from-indigo-500/10 to-violet-500/5', text: 'text-indigo-400', border: 'group-hover:border-indigo-500/30' },
    emerald: { bg: 'from-emerald-500/10 to-teal-500/5', text: 'text-emerald-400', border: 'group-hover:border-emerald-500/30' },
    rose: { bg: 'from-rose-500/10 to-red-500/5', text: 'text-rose-400', border: 'group-hover:border-rose-500/30' },
    amber: { bg: 'from-amber-500/10 to-orange-500/5', text: 'text-amber-400', border: 'group-hover:border-amber-500/30' },
    blue: { bg: 'from-blue-500/10 to-cyan-500/5', text: 'text-blue-400', border: 'group-hover:border-blue-500/30' },
    purple: { bg: 'from-purple-500/10 to-fuchsia-500/5', text: 'text-purple-400', border: 'group-hover:border-purple-500/30' },
    cyan: { bg: 'from-cyan-500/10 to-sky-500/5', text: 'text-cyan-400', border: 'group-hover:border-cyan-500/30' },
  };
  const theme = colors[color] || colors.indigo;

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={reset}
      style={{ transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`, transformStyle: 'preserve-3d' }}
      className={`
        group relative overflow-hidden rounded-2xl p-5
        bg-zinc-900/40 backdrop-blur-md border border-white/5
        transition-all duration-200 ease-out
        hover:shadow-2xl hover:shadow-black/50 ${theme.border}
        active:scale-[0.98] cursor-pointer touch-manipulation
      `}
    >
      {/* FIX ADDED: group-active:opacity-100 
         This ensures the gradient shows up immediately when tapped on mobile.
      */}
      <div className={`absolute inset-0 bg-gradient-to-br ${theme.bg} opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-300`} />
      
      <div className="relative z-10 transform translate-z-10">
        <div className="flex justify-between items-start mb-3">
          <div className={`p-2 rounded-xl bg-white/5 border border-white/5 ${theme.text}`}>
            {icon}
          </div>
          {subLabel && (
            <div className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-white/5 border border-white/5 text-zinc-400">
              <TrendingUp className="w-3 h-3" /> {subLabel}
            </div>
          )}
        </div>
        <p className="text-2xl font-bold text-white tracking-tight mb-1">{value}</p>
        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 truncate">{label}</p>
      </div>
    </div>
  );
}

/* =========================
   CALENDAR WIDGET
========================= */
function CalendarWidget() {
  const [date, setDate] = useState(new Date());
  
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const startDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const today = new Date().getDate();
  const isCurrentMonth = new Date().getMonth() === date.getMonth();

  const changeMonth = (offset: number) => {
    setDate(new Date(date.getFullYear(), date.getMonth() + offset, 1));
  };

  return (
    <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-3xl p-6 h-fit">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-white text-sm">{date.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
        <div className="flex gap-1">
          <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-white/10 rounded"><ChevronLeft className="w-4 h-4 text-zinc-400" /></button>
          <button onClick={() => changeMonth(1)} className="p-1 hover:bg-white/10 rounded"><ChevronRight className="w-4 h-4 text-zinc-400" /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-zinc-600 uppercase mb-2">
        {['S','M','T','W','T','F','S'].map(d => <span key={d}>{d}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: startDay }).map((_, i) => <div key={`e-${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const d = i + 1;
          const isToday = isCurrentMonth && d === today;
          return (
            <div key={d} className={`h-7 w-7 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${isToday ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/50' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}>
              {d}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* =========================
   MAIN DASHBOARD
========================= */
export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<any[]>([]); 
  const [recentAdmissions, setRecentAdmissions] = useState<any[]>([]);

  const getTodayIST = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

  useEffect(() => {
    async function fetchRealData() {
      try {
        const today = getTodayIST();

        const [
          studentsReq, 
          teachersReq, 
          attendanceReq,
          feeRecords,
          nbStock, uniStock, nbItems, uniItems
        ] = await Promise.all([
          supabase.from('students').select('*', { count: 'exact', head: true }),
          supabase.from('teachers').select('*', { count: 'exact', head: true }),
          supabase.from('view_teacher_attendance_ist').select('*', { count: 'exact', head: true }).eq('date', today).eq('status', 'present'),
          supabase.from('fee_records').select('paid_amount, status'),
          supabase.from('notebooks_stock').select('item_id, quantity, min_quantity'),
          supabase.from('uniforms_stock').select('item_id, quantity, min_quantity'),
          supabase.from('notebooks_items').select('id, price'),
          supabase.from('uniforms_items').select('id, price')
        ]);

        const studentCount = studentsReq.count || 0;
        const teacherCount = teachersReq.count || 0;
        const presentToday = attendanceReq.count || 0;

        let feesCollected = 0;
        let pendingCount = 0;
        let totalTransactions = 0;

        if (feeRecords.data) {
          totalTransactions = feeRecords.data.length;
          feeRecords.data.forEach((r: any) => {
            feesCollected += Number(r.paid_amount) || 0;
            if (r.status === 'unpaid') pendingCount++;
          });
        }

        let inventoryVal = 0;
        let lowStock = 0;
        let totalItems = 0;

        const processStock = (stockData: any[], itemData: any[]) => {
          if (!stockData || !itemData) return;
          stockData.forEach(stock => {
            const item = itemData.find((i: any) => i.id === stock.item_id);
            if (item) {
              inventoryVal += (stock.quantity || 0) * (item.price || 0);
            }
            totalItems += stock.quantity || 0;
            if ((stock.quantity || 0) <= (stock.min_quantity || 0)) lowStock++;
          });
        };

        processStock(nbStock.data || [], nbItems.data || []);
        processStock(uniStock.data || [], uniItems.data || []);

        const allPotentialCards = [
          {
            id: 'students', label: 'Total Students', value: studentCount, subLabel: 'Enrolled',
            icon: <UserCircle className="w-5 h-5" />, color: 'indigo'
          },
          {
            id: 'teachers', label: 'Total Faculty', value: teacherCount, subLabel: 'Staff',
            icon: <Users className="w-5 h-5" />, color: 'rose'
          },
          {
            id: 'attendance', label: 'Present Today', value: presentToday, subLabel: 'Teachers',
            icon: <CheckCircle2 className="w-5 h-5" />, color: 'emerald'
          },
          {
            id: 'fees', label: 'Fees Collected', value: `₹${feesCollected.toLocaleString('en-IN')}`, rawValue: feesCollected, subLabel: 'Revenue',
            icon: <Wallet className="w-5 h-5" />, color: 'amber'
          },
          {
            id: 'pending', label: 'Pending Fees', value: pendingCount, subLabel: 'Unpaid',
            icon: <Clock className="w-5 h-5" />, color: 'rose'
          },
          {
            id: 'inventory', label: 'Inventory Value', value: `₹${inventoryVal.toLocaleString('en-IN')}`, rawValue: inventoryVal, subLabel: 'Assets',
            icon: <Package className="w-5 h-5" />, color: 'blue'
          },
          {
            id: 'transactions', label: 'Transactions', value: totalTransactions, subLabel: 'Records',
            icon: <CreditCard className="w-5 h-5" />, color: 'cyan'
          },
          {
            id: 'lowstock', label: 'Low Stock Alerts', value: lowStock, subLabel: 'Action Req',
            icon: <AlertTriangle className="w-5 h-5" />, color: 'purple'
          },
          {
            id: 'items', label: 'Total Items', value: totalItems, subLabel: 'In Stock',
            icon: <Book className="w-5 h-5" />, color: 'indigo'
          }
        ];

        const criticalIds = ['students', 'teachers', 'attendance'];
        
        const filteredCards = allPotentialCards.filter(card => {
          if (criticalIds.includes(card.id)) return true;
          if (typeof card.value === 'string') {
             return (card.rawValue !== undefined && card.rawValue > 0); 
          }
          return card.value > 0;
        });

        setCards(filteredCards.slice(0, 6));

        const { data: latestStudents } = await supabase
          .from('students')
          .select('id, full_name, class, section, created_at')
          .order('created_at', { ascending: false })
          .limit(5);
        setRecentAdmissions(latestStudents || []);

      } catch (err) {
        console.error('Data fetch error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchRealData();
  }, []);

  // SKELETON LOADER
  if (loading) return (
    <div className="space-y-8 animate-fade-in-up pb-20 perspective-1000">
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
        <div className="space-y-2">
           <div className="h-4 w-32 bg-white/5 rounded-full animate-pulse"></div>
           <div className="h-8 w-64 bg-white/5 rounded-lg animate-pulse"></div>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 rounded-2xl bg-zinc-900/40 border border-white/5 p-5 animate-pulse flex flex-col justify-between">
             <div className="flex justify-between">
                <div className="w-10 h-10 rounded-xl bg-white/5"></div>
                <div className="w-16 h-5 rounded-lg bg-white/5"></div>
             </div>
             <div className="space-y-2">
                <div className="h-8 w-24 bg-white/5 rounded"></div>
                <div className="h-3 w-20 bg-white/5 rounded"></div>
             </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center"><div className="h-6 w-40 bg-white/5 rounded animate-pulse" /></div>
            <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-4 space-y-4 min-h-[300px]">
               {Array.from({ length: 4 }).map((_, i) => (
                 <div key={i} className="flex items-center justify-between p-2">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-white/5 animate-pulse" />
                       <div className="space-y-2"><div className="h-4 w-32 bg-white/5 rounded animate-pulse" /><div className="h-3 w-48 bg-white/5 rounded animate-pulse" /></div>
                    </div>
                    <div className="h-4 w-16 bg-white/5 rounded animate-pulse" />
                 </div>
               ))}
            </div>
         </div>
         <div className="space-y-6">
            <div className="h-72 bg-white/5 rounded-3xl animate-pulse" />
            <div className="space-y-4">
               <div className="h-6 w-32 bg-white/5 rounded animate-pulse" />
               <div className="grid grid-cols-2 gap-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse" />)}</div>
            </div>
         </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in-up pb-20 perspective-1000">
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Live System Status</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Admin Dashboard</h1>
          <p className="text-zinc-400 text-sm mt-1">Real-time overview of institution performance.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {cards.map((card) => (
          <TiltMetric key={card.id} label={card.label} value={card.value} subLabel={card.subLabel} color={card.color} icon={card.icon} />
        ))}
        {cards.length < 3 && <TiltMetric label="System Ready" value="Active" subLabel="Online" color="emerald" icon={<Activity className="w-5 h-5"/>} />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2"><Activity className="w-4 h-4 text-zinc-500" /> Recent Admissions</h2>
            <Link href="/admin/students" className="text-xs text-indigo-400 hover:text-indigo-300">View All</Link>
          </div>
          <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-3xl overflow-hidden p-1 min-h-[300px]">
            {recentAdmissions.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-full py-12 text-zinc-500"><p className="text-sm">No recent activity found.</p></div>
            ) : (
              recentAdmissions.map((student) => (
                <div key={student.id} className="group flex items-center justify-between p-4 hover:bg-white/5 rounded-2xl transition-colors cursor-default">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border border-white/5 bg-indigo-500/10 text-indigo-400`}><UserPlus className="w-5 h-5" /></div>
                    <div><p className="text-sm font-bold text-white">{student.full_name}</p><p className="text-xs text-zinc-500">Admitted to Class {student.class} - {student.section}</p></div>
                  </div>
                  <div className="text-right"><p className="text-xs font-bold font-mono text-emerald-400">New Student</p><p className="text-[10px] text-zinc-600">{new Date(student.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p></div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6 flex flex-col">
          <CalendarWidget />
          <div className="flex-1 flex flex-col">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4"><Clock className="w-4 h-4 text-zinc-500" /> Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3 h-full">
              <QuickActionBtn href="/admin/students/add" title="Add Student" icon={<UserPlus className="w-5 h-5" />} color="indigo" />
              <QuickActionBtn href="/admin/fees" title="Collect Fees" icon={<Wallet className="w-5 h-5" />} color="emerald" />
              <QuickActionBtn href="/admin/inventory/notebooks/issue" title="Notebooks" icon={<Book className="w-5 h-5" />} color="amber" />
              <QuickActionBtn href="/admin/inventory/uniforms/issue" title="Uniforms" icon={<Shirt className="w-5 h-5" />} color="rose" />
            </div>
          </div>
        </div>
      </div>
      <style jsx global>{` .perspective-1000 { perspective: 1000px; } .translate-z-10 { transform: translateZ(20px); } `}</style>
    </div>
  );
}

function QuickActionBtn({ href, title, icon, color }: any) {
  const colors: any = {
    indigo: 'bg-indigo-500/10 text-indigo-400 hover:border-indigo-500/50',
    emerald: 'bg-emerald-500/10 text-emerald-400 hover:border-emerald-500/50',
    amber: 'bg-amber-500/10 text-amber-400 hover:border-amber-500/50',
    rose: 'bg-rose-500/10 text-rose-400 hover:border-rose-500/50',
  };
  return (
    <Link href={href} className={`flex flex-col items-center justify-center gap-3 p-4 rounded-2xl bg-zinc-900 border border-white/5 transition-all duration-200 active:scale-95 hover:bg-zinc-800 ${colors[color]}`}>
      <div className="p-3 rounded-xl bg-black/20">{icon}</div>
      <span className="text-xs font-bold text-center text-zinc-300">{title}</span>
    </Link>
  );
}