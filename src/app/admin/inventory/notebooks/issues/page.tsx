'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { exportTableToPDF } from '@/lib/exportPdf';

/* =========================
   TYPES
========================= */

type Student = {
  id: string;
  admission_number: string;
  full_name: string;
};

type NotebookItem = {
  id: string;
  name: string;
  price: number;
};

type NotebookStock = {
  id: string;
  item_id: string;
  quantity: number;
};

type IssueRow = {
  id: string;
  student_id: string;
  student: string;
  item: string;
  quantity: number;
  total: number;
  paid: number;
  due: number;
  status: string;
  issued_at: string;
  issued_at_raw: string;
};

/* =========================
   COMPONENT
========================= */

export default function IssueNotebookPage() {
  /* ---------- base data ---------- */
  const [students, setStudents] = useState<Student[]>([]);
  const [items, setItems] = useState<NotebookItem[]>([]);
  const [stock, setStock] = useState<NotebookStock[]>([]);

  /* ---------- issue form ---------- */
  const [form, setForm] = useState({
    student_id: '',
    item_id: '',
    quantity: '',
    paid_amount: '',
  });

  /* ---------- filters ---------- */
  const [filterStudent, setFilterStudent] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  /* ---------- issues ---------- */
  const [rows, setRows] = useState<IssueRow[]>([]);
  const [allRows, setAllRows] = useState<IssueRow[]>([]);

  /* ---------- payment modal ---------- */
  const [paymentModal, setPaymentModal] = useState<{
    open: boolean;
    issueId: string;
    currentPaid: number;
    total: number;
  }>({ open: false, issueId: '', currentPaid: 0, total: 0 });

  const [addAmount, setAddAmount] = useState('');

  /* =========================
     LOAD DATA
  ========================= */

  async function loadStudents() {
    const { data } = await supabase
      .from('students')
      .select('id, admission_number, full_name')
      .order('full_name');
    setStudents(data ?? []);
  }

  async function loadItems() {
    const { data } = await supabase
      .from('notebook_items')
      .select('id, name, price')
      .order('name');
    setItems(data ?? []);
  }

  async function loadStock() {
    const { data } = await supabase
      .from('notebook_stock')
      .select('id, item_id, quantity');
    setStock(data ?? []);
  }

  async function loadIssues() {
    const { data: issues } = await supabase
      .from('notebook_issues')
      .select('*')
      .order('issued_at', { ascending: false });

    if (!issues) return;

    const { data: students } = await supabase
      .from('students')
      .select('id, admission_number, full_name');

    const { data: items } = await supabase
      .from('notebook_items')
      .select('id, name');

    const studentMap = new Map(
      (students ?? []).map(
        s => [s.id, `${s.admission_number} – ${s.full_name}`]
      )
    );

    const itemMap = new Map(
      (items ?? []).map(i => [i.id, i.name])
    );

    const mapped: IssueRow[] = issues.map(i => ({
      id: i.id,
      student_id: i.student_id,
      student: studentMap.get(i.student_id) ?? '-',
      item: itemMap.get(i.item_id) ?? '-',
      quantity: i.quantity,
      total: i.total_amount,
      paid: i.paid_amount,
      due: i.total_amount - i.paid_amount,
      status: i.status,
      issued_at: new Date(i.issued_at).toLocaleDateString(),
      issued_at_raw: i.issued_at,
    }));

    setAllRows(mapped);
    setRows(mapped);
  }

  useEffect(() => {
    loadStudents();
    loadItems();
    loadStock();
    loadIssues();
  }, []);

  /* =========================
     FILTERS
  ========================= */

  useEffect(() => {
    let filtered = [...allRows];

    if (filterStudent) {
      filtered = filtered.filter(r => r.student_id === filterStudent);
    }
    if (filterStatus) {
      filtered = filtered.filter(r => r.status === filterStatus);
    }
    if (fromDate) {
      filtered = filtered.filter(
        r => new Date(r.issued_at_raw) >= new Date(fromDate)
      );
    }
    if (toDate) {
      filtered = filtered.filter(
        r => new Date(r.issued_at_raw) <= new Date(toDate)
      );
    }

    setRows(filtered);
  }, [filterStudent, filterStatus, fromDate, toDate, allRows]);

  /* =========================
     ISSUE NOTEBOOK
  ========================= */

  async function issueNotebook() {
    const qty = Number(form.quantity);
    const paid = Number(form.paid_amount || 0);

    if (!form.student_id || !form.item_id || qty <= 0) {
      alert('Missing required fields');
      return;
    }

    const stockRow = stock.find(s => s.item_id === form.item_id);

    if (!stockRow || qty > stockRow.quantity) {
      alert('Not enough stock');
      return;
    }

    const item = items.find(i => i.id === form.item_id);
    if (!item) return;

    const totalAmount = qty * item.price;

    if (paid < 0 || paid > totalAmount) {
      alert('Invalid paid amount');
      return;
    }

    await supabase.from('notebook_issues').insert({
      student_id: form.student_id,
      item_id: form.item_id,
      quantity: qty,
      price: item.price,
      total_amount: totalAmount,
      paid_amount: paid,
    });

    await supabase
      .from('notebook_stock')
      .update({ quantity: stockRow.quantity - qty })
      .eq('id', stockRow.id);

    setForm({
      student_id: '',
      item_id: '',
      quantity: '',
      paid_amount: '',
    });

    loadStock();
    loadIssues();
  }

  /* =========================
     ADD PAYMENT
  ========================= */

  async function savePayment() {
    const add = Number(addAmount);
    const newPaid = paymentModal.currentPaid + add;

    if (add <= 0 || newPaid > paymentModal.total) {
      alert('Invalid amount');
      return;
    }

    await supabase
      .from('notebook_issues')
      .update({ paid_amount: newPaid })
      .eq('id', paymentModal.issueId);

    setPaymentModal({ open: false, issueId: '', currentPaid: 0, total: 0 });
    setAddAmount('');
    loadIssues();
  }

  /* =========================
     EXPORT CSV
  ========================= */

  function exportCSV() {
    if (rows.length === 0) return;

    const headers = [
      'Date','Student','Item','Qty','Total','Paid','Due','Status'
    ];

    const csv = [
      headers.join(','),
      ...rows.map(r =>
        [
          r.issued_at,
          `"${r.student}"`,
          r.item,
          r.quantity,
          r.total,
          r.paid,
          r.due,
          r.status,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'notebook_issues.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  /* =========================
     DERIVED
  ========================= */

  const selectedItem = items.find(i => i.id === form.item_id);
  const totalAmount =
    selectedItem && form.quantity
      ? Number(form.quantity) * selectedItem.price
      : 0;

  /* =========================
     UI
  ========================= */

  return (
    <div>
      <h1 className="text-2xl mb-4">Notebook Issue</h1>

      {/* ISSUE FORM */}
      <div className="bg-zinc-900 p-4 rounded-xl mb-6 flex flex-wrap gap-3">
        <select className="p-2 bg-zinc-800 rounded"
          value={form.student_id}
          onChange={e => setForm({ ...form, student_id: e.target.value })}>
          <option value="">Student</option>
          {students.map(s => (
            <option key={s.id} value={s.id}>
              {s.admission_number} – {s.full_name}
            </option>
          ))}
        </select>

        <select className="p-2 bg-zinc-800 rounded"
          value={form.item_id}
          onChange={e => setForm({ ...form, item_id: e.target.value })}>
          <option value="">Notebook</option>
          {items.map(i => (
            <option key={i.id} value={i.id}>{i.name}</option>
          ))}
        </select>

        <input className="p-2 bg-zinc-800 rounded"
          type="number"
          placeholder="Qty"
          value={form.quantity}
          onChange={e => setForm({ ...form, quantity: e.target.value })} />

        <input className="p-2 bg-zinc-800 rounded"
          type="number"
          placeholder="Paid"
          value={form.paid_amount}
          onChange={e => setForm({ ...form, paid_amount: e.target.value })} />

        <div className="p-2 bg-zinc-800 rounded">
          Total ₹{totalAmount}
        </div>

        <button onClick={issueNotebook}
          className="px-4 bg-green-600 rounded">
          Issue
        </button>
      </div>

      {/* FILTERS + EXPORT */}
      <div className="bg-zinc-900 p-4 rounded-xl mb-4 flex gap-3 flex-wrap">
        <select className="p-2 bg-zinc-800 rounded"
          value={filterStudent}
          onChange={e => setFilterStudent(e.target.value)}>
          <option value="">All Students</option>
          {students.map(s => (
            <option key={s.id} value={s.id}>
              {s.admission_number} – {s.full_name}
            </option>
          ))}
        </select>

        <select className="p-2 bg-zinc-800 rounded"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="paid">Paid</option>
          <option value="partial">Partial</option>
          <option value="unpaid">Unpaid</option>
        </select>

        <input type="date"
          className="p-2 bg-zinc-800 rounded"
          value={fromDate}
          onChange={e => setFromDate(e.target.value)} />

        <input type="date"
          className="p-2 bg-zinc-800 rounded"
          value={toDate}
          onChange={e => setToDate(e.target.value)} />

        <button
  onClick={() =>
    exportTableToPDF(
      'Uniform Issues',
      ['Date','Student','Item','Qty','Total','Paid','Due','Status'],
      rows.map(r => [
        r.issued_at,
        r.student,
        r.item,
        r.quantity,
        r.total,
        r.paid,
        r.due,
        r.status,
      ])
    )
  }
  className="px-4 bg-purple-600 rounded"
>
  Export PDF
</button>
        <button onClick={exportCSV}
          className="px-4 bg-blue-600 rounded">
          Export CSV
        </button>
      </div>

      {/* TABLE */}
      <table className="w-full bg-zinc-900 text-sm rounded-xl">
        <thead className="bg-zinc-800">
          <tr>
            <th className="p-3">Date</th>
            <th>Student</th>
            <th>Notebook</th>
            <th>Qty</th>
            <th>Total</th>
            <th>Paid</th>
            <th>Due</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id} className="border-t border-zinc-800">
              <td className="p-3">{r.issued_at}</td>
              <td>{r.student}</td>
              <td>{r.item}</td>
              <td>{r.quantity}</td>
              <td>₹{r.total}</td>
              <td>₹{r.paid}</td>
              <td>₹{r.due}</td>
              <td>{r.status.toUpperCase()}</td>
              <td>
                {r.status !== 'paid' && (
                  <button
                    onClick={() =>
                      setPaymentModal({
                        open: true,
                        issueId: r.id,
                        currentPaid: r.paid,
                        total: r.total,
                      })
                    }
                    className="px-2 py-1 bg-yellow-600 rounded text-xs"
                  >
                    Add Payment
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* PAYMENT MODAL */}
      {paymentModal.open && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
          <div className="bg-zinc-900 p-6 rounded-xl w-80">
            <h2 className="text-lg mb-4">Add Payment</h2>

            <p className="text-sm mb-2">
              Paid: ₹{paymentModal.currentPaid} / ₹{paymentModal.total}
            </p>

            <input
              type="number"
              placeholder="Add amount"
              className="p-2 bg-zinc-800 rounded w-full mb-4"
              value={addAmount}
              onChange={e => setAddAmount(e.target.value)}
            />

            <div className="flex gap-3">
              <button
                onClick={savePayment}
                className="flex-1 bg-green-600 py-2 rounded"
              >
                Save
              </button>
              

              <button
                onClick={() =>
                  setPaymentModal({ open: false, issueId: '', currentPaid: 0, total: 0 })
                }
                className="flex-1 bg-zinc-700 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
