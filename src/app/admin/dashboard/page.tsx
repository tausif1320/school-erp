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
} from 'recharts';

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
    <div>
      <h1 className="text-2xl mb-6">Admin Dashboard</h1>

      {/* TOP STATS */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Students" value={studentCount} />
        <StatCard label="Total Teachers" value={teacherCount} />
        <StatCard label="Teachers Present (Month)" value={attendanceSummary.present} />
        <StatCard label="Teachers Absent (Month)" value={attendanceSummary.absent} />
      </div>

      {/* INVENTORY STATS */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Uniform Stock" value={uniformStock} />
        <StatCard label="Notebook Stock" value={notebookStock} />
        <StatCard label="Inventory Collected" value={`₹${inventoryCollected}`} />
        <StatCard label="Inventory Due" value={`₹${inventoryDue}`} />
      </div>

      {/* FEES SECTION */}
      <div className="mb-4">
        <h2 className="text-lg mb-2">Fees Overview</h2>

        <input
          type="month"
          className="p-2 bg-zinc-800 rounded mb-4"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        />

        <div className="grid grid-cols-3 gap-4">
          <FeeCard label="Total Fees" value={feeSummary.total} />
          <FeeCard label="Collected" value={feeSummary.collected} color="green" />
          <FeeCard label="Due" value={feeSummary.due} color="red" />
        </div>
      </div>

      {/* FEES GRAPH */}
      <div className="bg-zinc-900 p-4 rounded-xl mt-6">
        <h2 className="text-lg mb-4">Fees Collection Trend</h2>

        {feeGraphData.length > 0 && (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={feeGraphData}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="collected" fill="#22c55e" />
              <Bar dataKey="due" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

/* =========================
   UI HELPERS
========================= */

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-zinc-900 p-4 rounded-xl">
      <p className="text-zinc-400 text-sm">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function FeeCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color?: 'green' | 'red';
}) {
  return (
    <div className="bg-zinc-900 p-4 rounded-xl">
      <p className="text-zinc-400 text-sm">{label}</p>
      <p
        className={`text-2xl font-bold ${
          color === 'green'
            ? 'text-green-500'
            : color === 'red'
            ? 'text-red-500'
            : ''
        }`}
      >
        ₹{value}
      </p>
    </div>
  );
}
