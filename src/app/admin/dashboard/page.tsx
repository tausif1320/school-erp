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
import { LayoutDashboard, Users, GraduationCap, Shirt, Book, DollarSign, TrendingUp, Calendar } from 'lucide-react';

/* =========================
   ADMIN DASHBOARD
========================= */

export default function AdminDashboard() {
    const [studentCount, setStudentCount] = useState(0);
    const [teacherCount, setTeacherCount] = useState(0);

    /* -------- inventory -------- */
    const [uniformStock, setUniformStock] = useState(0);
    const [notebookStock, setNotebookStock] = useState(0);
    const [inventoryCollected, setInventoryCollected] = useState(0);
    const [inventoryDue, setInventoryDue] = useState(0);

    /* -------- fees -------- */
    const [month, setMonth] = useState('');
    const [feeSummary, setFeeSummary] = useState({
        total: 0,
        collected: 0,
        due: 0,
    });

    const [feeGraphData, setFeeGraphData] = useState<
        { month: string; collected: number; due: number }[]
    >([]);

    /* -------- attendance -------- */
    const [attendanceSummary, setAttendanceSummary] = useState({
        present: 0,
        absent: 0,
    });

    /* =========================
       LOAD COUNTS
    ========================= */
    async function loadCounts() {
        const { count: students } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active');

        const { count: teachers } = await supabase
            .from('teachers')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active');

        setStudentCount(students ?? 0);
        setTeacherCount(teachers ?? 0);
    }

    /* =========================
       LOAD INVENTORY SUMMARY
    ========================= */
    async function loadInventorySummary() {
        const [
            uniformStockRes,
            notebookStockRes,
            uniformIssuesRes,
            notebookIssuesRes,
        ] = await Promise.all([
            supabase.from('uniform_stock').select('quantity'),
            supabase.from('notebook_stock').select('quantity'),
            supabase.from('uniform_issues').select('total_amount, paid_amount'),
            supabase.from('notebook_issues').select('total_amount, paid_amount'),
        ]);

        const totalUniformStock =
            uniformStockRes.data?.reduce((s, r) => s + r.quantity, 0) ?? 0;

        const totalNotebookStock =
            notebookStockRes.data?.reduce((s, r) => s + r.quantity, 0) ?? 0;

        const allIssues = [
            ...(uniformIssuesRes.data ?? []),
            ...(notebookIssuesRes.data ?? []),
        ];

        const collected = allIssues.reduce(
            (s, r) => s + r.paid_amount,
            0
        );

        const issued = allIssues.reduce(
            (s, r) => s + r.total_amount,
            0
        );

        setUniformStock(totalUniformStock);
        setNotebookStock(totalNotebookStock);
        setInventoryCollected(collected);
        setInventoryDue(issued - collected);
    }

    /* =========================
       LOAD FEES GRAPH
    ========================= */
    async function loadFeeGraph() {
        const { data } = await supabase
            .from('fee_records')
            .select('fee_month, total_amount, paid_amount')
            .order('fee_month', { ascending: false })
            .limit(6);

        if (!data) return;

        const grouped: Record<string, { total: number; paid: number }> = {};

        data.forEach((f) => {
            if (!grouped[f.fee_month]) {
                grouped[f.fee_month] = { total: 0, paid: 0 };
            }
            grouped[f.fee_month].total += f.total_amount;
            grouped[f.fee_month].paid += f.paid_amount;
        });

        const chartData = Object.entries(grouped)
            .map(([month, v]) => ({
                month,
                collected: v.paid,
                due: v.total - v.paid,
            }))
            .reverse();

        setFeeGraphData(chartData);
    }

    /* =========================
       LOAD FEES SUMMARY
    ========================= */
    async function loadFeeSummary() {
        if (!month) return;

        const { data } = await supabase
            .from('fee_records')
            .select('total_amount, paid_amount')
            .eq('fee_month', month);

        if (!data) return;

        const total = data.reduce((s, f) => s + f.total_amount, 0);
        const collected = data.reduce((s, f) => s + f.paid_amount, 0);

        setFeeSummary({
            total,
            collected,
            due: total - collected,
        });
    }

    /* =========================
       LOAD ATTENDANCE
    ========================= */
    async function loadAttendanceSummary() {
        const now = new Date();
        const year = now.getFullYear();
        const monthIndex = now.getMonth() + 1;
        const start = `${year}-${String(monthIndex).padStart(2, '0')}-01`;

        const { data } = await supabase
            .from('teacher_attendance')
            .select('status')
            .gte('date', start);

        if (!data) return;

        setAttendanceSummary({
            present: data.filter((a) => a.status === 'present').length,
            absent: data.filter((a) => a.status === 'absent').length,
        });
    }

    /* =========================
       EFFECTS
    ========================= */
    useEffect(() => {
        loadCounts();
        loadAttendanceSummary();
        loadFeeGraph();
        loadInventorySummary();
    }, []);

    useEffect(() => {
        loadFeeSummary();
    }, [month]);

    /* =========================
       UI
    ========================= */
    return (
        <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
            <div className="demo-header" style={{ marginBottom: '2rem' }}>
                <h1 className="text-gradient">Admin Dashboard</h1>
                <div className="flex gap-2">
                    <span className="badge badge-blue">Admin Access</span>
                    <span className="badge badge-success">Live</span>
                </div>
            </div>

            {/* TOP STATS */}
            <div className="grid grid-4 mb-8">
                <StatCard
                    label="Total Students"
                    value={studentCount}
                    icon={<GraduationCap size={24} className="icon-blue" />}
                />
                <StatCard
                    label="Total Teachers"
                    value={teacherCount}
                    icon={<Users size={24} className="icon-cyan" />}
                />
                <StatCard
                    label="Teachers Present"
                    subLabel="(Month)"
                    value={attendanceSummary.present}
                    icon={<LayoutDashboard size={24} className="icon-violet" />}
                />
                <StatCard
                    label="Teachers Absent"
                    subLabel="(Month)"
                    value={attendanceSummary.absent}
                    icon={<Users size={24} className="icon-blue" />} // Using a blue icon, ideally maybe red/warning
                    isWarning={attendanceSummary.absent > 5}
                />
            </div>

            {/* INVENTORY STATS */}
            <h2 className="mb-6" style={{ fontSize: 'var(--text-2xl)' }}>Inventory Overview</h2>
            <div className="grid grid-4 mb-8">
                <StatCard
                    label="Uniform Stock"
                    value={uniformStock}
                    icon={<Shirt size={24} className="icon-cyan" />}
                />
                <StatCard
                    label="Notebook Stock"
                    value={notebookStock}
                    icon={<Book size={24} className="icon-violet" />}
                />
                <StatCard
                    label="Inventory Collected"
                    value={`₹${inventoryCollected}`}
                    icon={<DollarSign size={24} className="icon-blue" />}
                />
                <StatCard
                    label="Inventory Due"
                    value={`₹${inventoryDue}`}
                    icon={<DollarSign size={24} className="icon-blue" />}
                    isWarning={inventoryDue > 0}
                />
            </div>

            {/* FEES SECTION */}
            <h2 className="mb-6" style={{ fontSize: 'var(--text-2xl)' }}>Fees Overview</h2>
            <div className="grid grid-2 mb-8" style={{ alignItems: 'start' }}>

                {/* Fee Controls & Summary */}
                <div className="flex flex-col gap-6">
                    <div className="card card-elevated">
                        <div className="input-group mb-6">
                            <label className="input-label">Select Month</label>
                            <div className="flex items-center gap-4">
                                <Calendar className="text-zinc-500" size={20} />
                                <input
                                    type="month"
                                    className="input"
                                    value={month}
                                    onChange={(e) => setMonth(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-3 gap-4">
                            <FeeCard label="Total Fees" value={feeSummary.total} />
                            <FeeCard label="Collected" value={feeSummary.collected} type="success" />
                            <FeeCard label="Due" value={feeSummary.due} type="error" />
                        </div>
                    </div>

                    <div className="card card-glow flex items-center justify-between">
                        <div>
                            <p className="text-zinc-400 text-sm mb-1">Total Fee Collection Efficiency</p>
                            <h3 className="text-xl font-bold text-white">
                                {feeSummary.total > 0 ? ((feeSummary.collected / feeSummary.total) * 100).toFixed(1) : 0}%
                            </h3>
                        </div>
                        <div className="icon icon-lg icon-green">
                            <TrendingUp size={32} color="#10b981" />
                        </div>
                    </div>

                </div>

                {/* FEES GRAPH */}
                <div className="chart-container" style={{ minHeight: '400px' }}>
                    <h4 className="mb-4">Collection Trend</h4>
                    {feeGraphData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={feeGraphData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                <XAxis
                                    dataKey="month"
                                    stroke="#8b949e"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#8b949e"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `₹${value / 1000}k`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#161b22',
                                        borderColor: '#30363d',
                                        borderRadius: '0.5rem',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.4)'
                                    }}
                                    itemStyle={{ color: '#f0f6fc' }}
                                    labelStyle={{ color: '#8b949e', marginBottom: '0.5rem' }}
                                />
                                <Legend iconType="circle" />
                                <Bar
                                    dataKey="collected"
                                    name="Collected"
                                    fill="#10b981" // Success Green
                                    radius={[4, 4, 0, 0]}
                                />
                                <Bar
                                    dataKey="due"
                                    name="Due"
                                    fill="#ef4444" // Error Red
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-full text-zinc-500">
                            No data available for graph
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}

/* =========================
   UI HELPERS
========================= */

interface StatCardProps {
    label: string;
    value: number | string;
    icon?: React.ReactNode;
    subLabel?: string;
    isWarning?: boolean;
}

function StatCard({ label, value, icon, subLabel, isWarning }: StatCardProps) {
    return (
        <div className={`stat-card ${isWarning ? 'border-red-500/30' : ''}`}>
            <div className="flex justify-between items-start mb-2">
                <div className="stat-label">{label} {subLabel && <span style={{ opacity: 0.6 }}>{subLabel}</span>}</div>
                {icon && <div className="opacity-80 hover:opacity-100 transition-opacity transform hover:scale-110 duration-200">{icon}</div>}
            </div>
            <div className="stat-value">{value}</div>
        </div>
    );
}

interface FeeCardProps {
    label: string;
    value: number;
    type?: 'success' | 'error' | 'neutral';
}

function FeeCard({ label, value, type = 'neutral' }: FeeCardProps) {
    let valueColor = 'white'; // Default
    if (type === 'success') valueColor = '#10b981';
    if (type === 'error') valueColor = '#ef4444';

    return (
        <div className="card" style={{ padding: '1rem' }}>
            <p className="stat-label mb-1" style={{ fontSize: '0.75rem' }}>{label}</p>
            <p className="text-xl font-bold" style={{ color: valueColor }}>
                ₹{value.toLocaleString()}
            </p>
        </div>
    );
}
