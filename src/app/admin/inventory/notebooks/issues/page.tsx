'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Search, Filter, Plus, Calendar, Download, FileText, Table as TableIcon, 
  ChevronDown, BookOpen, ShoppingCart, IndianRupee, Loader2, X, Check, 
  ChevronLeft, ChevronRight, User, GraduationCap, ChevronRight as ChevronRightIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveAs } from 'file-saver';

/* =========================
   TYPES
========================= */
type Student = {
  id: string;
  admission_number: string;
  full_name: string;
  class: string; // Added class for filtering
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
  /* ---------- Base Data ---------- */
  const [students, setStudents] = useState<Student[]>([]);
  const [items, setItems] = useState<NotebookItem[]>([]);
  const [stock, setStock] = useState<NotebookStock[]>([]);

  /* ---------- Form State ---------- */
  const [form, setForm] = useState({
    student_id: '',
    item_id: '',
    quantity: '',
    paid_amount: '',
  });
  const [selectedStudentName, setSelectedStudentName] = useState(''); // For display
  const [issuing, setIssuing] = useState(false);

  /* ---------- Filters ---------- */
  const [filterStatus, setFilterStatus] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  /* ---------- Issues Data & Pagination ---------- */
  const [rows, setRows] = useState<IssueRow[]>([]);
  const [allRows, setAllRows] = useState<IssueRow[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  /* ---------- Modals ---------- */
  const [paymentModal, setPaymentModal] = useState<{
    open: boolean; issueId: string; currentPaid: number; total: number;
  }>({ open: false, issueId: '', currentPaid: 0, total: 0 });

  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [studentClassFilter, setStudentClassFilter] = useState(''); // Filter students by class in modal

  const [addAmount, setAddAmount] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportRef = useRef<any>(null);

  /* =========================
     LOAD DATA
  ========================= */
  async function loadStudents() {
    // Added 'class' to select
    const { data } = await supabase.from('students').select('id, admission_number, full_name, class').order('full_name');
    setStudents(data ?? []);
  }

  async function loadItems() {
    const { data } = await supabase.from('notebook_items').select('id, name, price').order('name');
    setItems(data ?? []);
  }

  async function loadStock() {
    const { data } = await supabase.from('notebook_stock').select('id, item_id, quantity');
    setStock(data ?? []);
  }

  async function loadIssues() {
    setLoading(true);
    const { data: issues } = await supabase.from('notebook_issues').select('*').order('issued_at', { ascending: false });

    if (!issues) { setLoading(false); return; }

    const { data: students } = await supabase.from('students').select('id, admission_number, full_name');
    const { data: items } = await supabase.from('notebook_items').select('id, name');

    const studentMap = new Map((students ?? []).map(s => [s.id, `${s.admission_number} – ${s.full_name}`]));
    const itemMap = new Map((items ?? []).map(i => [i.id, i.name]));

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
    setLoading(false);
  }

  useEffect(() => {
    loadStudents(); loadItems(); loadStock(); loadIssues();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: any) {
      if (exportRef.current && !exportRef.current.contains(event.target)) setShowExportMenu(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* =========================
     FILTERS & PAGINATION
  ========================= */
  useEffect(() => {
    let filtered = [...allRows];
    // Removed Student Filter from here as requested
    if (filterStatus) filtered = filtered.filter(r => r.status === filterStatus);
    if (fromDate) filtered = filtered.filter(r => new Date(r.issued_at_raw) >= new Date(fromDate));
    if (toDate) filtered = filtered.filter(r => new Date(r.issued_at_raw) <= new Date(toDate));
    
    setRows(filtered);
    setCurrentPage(1); // Reset to page 1 on filter change
  }, [filterStatus, fromDate, toDate, allRows]);

  // Pagination Logic
  const totalPages = Math.ceil(rows.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedRows = rows.slice(startIndex, startIndex + rowsPerPage);

  /* =========================
     ACTIONS
  ========================= */
  async function issueNotebook() {
    const qty = Number(form.quantity);
    const paid = Number(form.paid_amount || 0);

    if (!form.student_id || !form.item_id || qty <= 0) {
      toast.error('Missing required fields');
      return;
    }

    const stockRow = stock.find(s => s.item_id === form.item_id);
    if (!stockRow || qty > stockRow.quantity) {
      toast.error('Not enough stock available');
      return;
    }

    const item = items.find(i => i.id === form.item_id);
    if (!item) return;

    const totalAmount = qty * item.price;
    if (paid < 0 || paid > totalAmount) {
      toast.error('Invalid paid amount');
      return;
    }

    setIssuing(true);
    await supabase.from('notebook_issues').insert({
      student_id: form.student_id,
      item_id: form.item_id,
      quantity: qty,
      price: item.price,
      total_amount: totalAmount,
      paid_amount: paid,
    });

    await supabase.from('notebook_stock').update({ quantity: stockRow.quantity - qty }).eq('id', stockRow.id);

    toast.success('Notebook issued successfully');
    setForm({ student_id: '', item_id: '', quantity: '', paid_amount: '' });
    setSelectedStudentName(''); // Reset display name
    loadStock(); loadIssues();
    setIssuing(false);
  }

  async function savePayment() {
    const add = Number(addAmount);
    const newPaid = paymentModal.currentPaid + add;

    if (add <= 0 || newPaid > paymentModal.total) {
      toast.error('Invalid amount');
      return;
    }

    await supabase.from('notebook_issues').update({ paid_amount: newPaid }).eq('id', paymentModal.issueId);
    toast.success('Payment recorded');
    setPaymentModal({ open: false, issueId: '', currentPaid: 0, total: 0 });
    setAddAmount('');
    loadIssues();
  }

  /* =========================
     EXPORT
  ========================= */
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text('Notebook Issues Report', 14, 15);
    autoTable(doc, {
      head: [['Date','Student','Item','Qty','Total','Paid','Due','Status']],
      body: rows.map(r => [r.issued_at, r.student, r.item, r.quantity, `Rs.${r.total}`, `Rs.${r.paid}`, `Rs.${r.due}`, r.status]),
      startY: 20, theme: 'grid'
    });
    doc.save('notebook_issues.pdf'); setShowExportMenu(false);
  };

  const exportCSV = () => {
    if (rows.length === 0) return;
    const csv = ['Date,Student,Item,Qty,Total,Paid,Due,Status'].concat(
      rows.map(r => [r.issued_at, `"${r.student}"`, r.item, r.quantity, r.total, r.paid, r.due, r.status].join(','))
    ).join('\n');
    saveAs(new Blob([csv], { type: 'text/csv' }), 'notebook_issues.csv'); setShowExportMenu(false);
  };

  /* =========================
     DERIVED & HELPERS
  ========================= */
  const selectedItem = items.find(i => i.id === form.item_id);
  const totalAmount = selectedItem && form.quantity ? Number(form.quantity) * selectedItem.price : 0;
  
  // Get unique classes for the student filter modal
  const uniqueClasses = Array.from(new Set(students.map(s => s.class))).sort();
  const filteredStudentsInModal = studentClassFilter 
    ? students.filter(s => s.class === studentClassFilter) 
    : [];

  /* =========================
     UI RENDER
  ========================= */
  return (
    <div className="space-y-6 animate-fade-in-up pb-24 md:pb-10">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Notebook Issue</h1>
          <p className="text-zinc-500 text-sm mt-1">Manage and track notebook distribution</p>
        </div>
        
        {/* Export Button */}
        <div className="relative w-full md:w-auto" ref={exportRef}>
          <button 
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-zinc-900 border border-white/10 hover:bg-white/5 text-zinc-300 px-4 py-2.5 rounded-xl font-medium transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
            <ChevronDown className="w-3 h-3 ml-1 opacity-50" />
          </button>
          {showExportMenu && (
            <div className="absolute top-full right-0 mt-2 w-full md:w-48 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-scale-up">
              <button onClick={exportToPDF} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-400 hover:text-white hover:bg-white/5 text-left"><FileText className="w-4 h-4 text-red-400" /> PDF</button>
              <div className="h-px bg-white/5"></div>
              <button onClick={exportCSV} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-400 hover:text-white hover:bg-white/5 text-left"><TableIcon className="w-4 h-4 text-green-400" /> Excel</button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* --- LEFT: ISSUE FORM --- */}
        <div className="space-y-6">
          <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 p-5 rounded-2xl shadow-xl sticky top-24">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-white/5 text-indigo-400">
              <ShoppingCart className="w-5 h-5" />
              <h2 className="text-sm font-bold uppercase tracking-wider">New Issue</h2>
            </div>
            
            <div className="space-y-4">
              
              {/* STUDENT SELECTOR (Advanced) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase">Student</label>
                <button 
                  onClick={() => setStudentModalOpen(true)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-3 text-sm text-left flex items-center justify-between hover:border-indigo-500/50 transition-all group"
                >
                  <span className={selectedStudentName ? "text-white" : "text-zinc-500"}>
                    {selectedStudentName || "Select Student..."}
                  </span>
                  <ChevronDown className="w-4 h-4 text-zinc-500 group-hover:text-white" />
                </button>
              </div>

              {/* NOTEBOOK SELECTOR (Custom) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase">Notebook</label>
                <div className="relative group">
                  <BookOpen className="absolute left-3 top-3 w-4 h-4 text-zinc-500 z-10" />
                  <select 
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-3 text-white text-sm focus:border-indigo-500 outline-none appearance-none cursor-pointer"
                    value={form.item_id} 
                    onChange={e => setForm({ ...form, item_id: e.target.value })}
                  >
                    <option value="" className="bg-zinc-900 text-zinc-500">Select Notebook</option>
                    {items.map(i => <option key={i.id} value={i.id} className="bg-zinc-900">{i.name} (₹{i.price})</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-zinc-600 pointer-events-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Quantity</label>
                  <input type="number" className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-3 text-white text-sm focus:border-indigo-500 outline-none" placeholder="0" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Paid Amount</label>
                  <input type="number" className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-3 text-white text-sm focus:border-indigo-500 outline-none" placeholder="0" value={form.paid_amount} onChange={e => setForm({ ...form, paid_amount: e.target.value })} />
                </div>
              </div>

              <div className="bg-white/5 p-3 rounded-xl flex justify-between items-center border border-white/5">
                <span className="text-sm text-zinc-400">Total Payable</span>
                <span className="text-lg font-bold text-white font-mono">₹{totalAmount}</span>
              </div>

              <button onClick={issueNotebook} disabled={issuing} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {issuing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Issue Notebook
              </button>
            </div>
          </div>
        </div>

        {/* --- RIGHT: RECORDS LIST --- */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row gap-3 bg-zinc-900/40 border border-white/5 p-3 rounded-xl items-end md:items-center">
            
            {/* From Date */}
            <div className="w-full md:flex-1 space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">From Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-500" />
                <input type="date" className="w-full bg-black/40 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-xs text-white outline-none focus:border-indigo-500 transition-all" value={fromDate} onChange={e => setFromDate(e.target.value)} />
              </div>
            </div>

            {/* To Date */}
            <div className="w-full md:flex-1 space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">To Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-500" />
                <input type="date" className="w-full bg-black/40 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-xs text-white outline-none focus:border-indigo-500 transition-all" value={toDate} onChange={e => setToDate(e.target.value)} />
              </div>
            </div>

            {/* Status Filter */}
            <div className="w-full md:flex-1 space-y-1">
               <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">Payment Status</label>
               <div className="relative">
                 <Filter className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-500" />
                 <select className="w-full bg-black/40 border border-white/10 rounded-lg py-2 pl-9 pr-8 text-xs text-white outline-none appearance-none cursor-pointer focus:border-indigo-500" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                   <option value="" className="bg-zinc-900">All Status</option><option value="paid" className="bg-zinc-900">Paid</option><option value="partial" className="bg-zinc-900">Partial</option><option value="unpaid" className="bg-zinc-900">Unpaid</option>
                 </select>
                 <ChevronDown className="absolute right-3 top-2.5 w-3.5 h-3.5 text-zinc-600 pointer-events-none" />
               </div>
            </div>

          </div>

          {/* Table */}
          <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-xl min-h-[400px] flex flex-col">
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center p-20 space-y-4 text-zinc-500"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /><p className="text-sm">Loading records...</p></div>
            ) : paginatedRows.length === 0 ? (
              <div className="flex-1 p-20 text-center flex flex-col items-center justify-center text-zinc-500">
                 <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4"><BookOpen className="w-8 h-8 opacity-50" /></div>
                 <p className="text-white font-medium">No records found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto custom-scrollbar flex-1">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-zinc-500 uppercase bg-white/5 border-b border-white/5">
                      <tr>
                        <th className="px-4 py-3 font-bold">Date</th>
                        <th className="px-4 py-3 font-bold">Student</th>
                        <th className="px-4 py-3 font-bold">Item</th>
                        <th className="px-4 py-3 font-bold">Qty</th>
                        <th className="px-4 py-3 font-bold">Total</th>
                        <th className="px-4 py-3 font-bold">Paid</th>
                        <th className="px-4 py-3 font-bold">Status</th>
                        <th className="px-4 py-3 font-bold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {paginatedRows.map((r) => (
                        <tr key={r.id} className="group hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3 text-zinc-400 text-xs font-mono">{r.issued_at}</td>
                          <td className="px-4 py-3 font-medium text-white max-w-[150px] truncate" title={r.student}>{r.student}</td>
                          <td className="px-4 py-3 text-zinc-300">{r.item}</td>
                          <td className="px-4 py-3 text-zinc-400">{r.quantity}</td>
                          <td className="px-4 py-3 text-white font-mono">₹{r.total}</td>
                          <td className="px-4 py-3 text-emerald-400 font-mono">₹{r.paid}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${r.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : r.status === 'partial' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                              {r.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {r.status !== 'paid' && (
                              <button 
                                onClick={() => setPaymentModal({ open: true, issueId: r.id, currentPaid: r.paid, total: r.total })}
                                className="text-xs bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 px-2 py-1 rounded transition-colors"
                              >
                                Pay
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="p-3 border-t border-white/5 flex items-center justify-between bg-black/20">
                  <p className="text-xs text-zinc-500">
                    Showing <span className="text-white font-medium">{startIndex + 1}-{Math.min(startIndex + rowsPerPage, rows.length)}</span> of <span className="text-white font-medium">{rows.length}</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronLeft className="w-4 h-4" /></button>
                    <span className="text-xs text-zinc-400">Page {currentPage} of {totalPages || 1}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronRight className="w-4 h-4" /></button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* --- STUDENT SELECTION MODAL --- */}
      {studentModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-900 border border-white/10 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-scale-up h-[500px] flex flex-col">
            <div className="bg-white/5 p-4 border-b border-white/5 flex justify-between items-center">
              <h2 className="text-sm font-bold text-white uppercase">Select Student</h2>
              <button onClick={() => { setStudentModalOpen(false); setStudentClassFilter(''); }} className="text-zinc-500 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            
            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Step 1: Filter by Class */}
              {!studentClassFilter ? (
                 <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
                    <p className="text-xs text-zinc-500 mb-3 font-bold uppercase">Filter by Class</p>
                    <div className="grid grid-cols-2 gap-2">
                      {uniqueClasses.map((cls) => (
                        <button 
                          key={cls} 
                          onClick={() => setStudentClassFilter(cls)}
                          className="bg-black/40 hover:bg-indigo-600 hover:text-white border border-white/10 rounded-xl p-3 text-center transition-all group"
                        >
                          <span className="text-sm font-bold text-zinc-300 group-hover:text-white">Class {cls}</span>
                        </button>
                      ))}
                    </div>
                 </div>
              ) : (
                /* Step 2: Select Student */
                <div className="flex flex-col h-full">
                  <div className="p-3 border-b border-white/5 flex items-center gap-2 bg-black/20">
                    <button onClick={() => setStudentClassFilter('')} className="p-1 hover:bg-white/10 rounded"><ChevronLeft className="w-4 h-4 text-zinc-400" /></button>
                    <span className="text-sm font-bold text-white">Class {studentClassFilter} Students</span>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                    {filteredStudentsInModal.length === 0 ? (
                      <p className="text-center text-zinc-500 text-sm py-10">No students found in this class.</p>
                    ) : (
                      filteredStudentsInModal.map((student) => (
                        <button 
                          key={student.id}
                          onClick={() => {
                            setForm({ ...form, student_id: student.id });
                            setSelectedStudentName(`${student.full_name} (${student.admission_number})`);
                            setStudentModalOpen(false);
                            setStudentClassFilter('');
                          }}
                          className="w-full text-left p-3 hover:bg-indigo-600/20 hover:border-indigo-500/30 border border-transparent rounded-xl flex items-center justify-between group transition-all"
                        >
                          <div>
                            <p className="text-sm font-bold text-zinc-300 group-hover:text-white">{student.full_name}</p>
                            <p className="text-xs text-zinc-500 group-hover:text-indigo-300">{student.admission_number}</p>
                          </div>
                          <ChevronRightIcon className="w-4 h-4 text-zinc-600 group-hover:text-white" />
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- PAYMENT MODAL --- */}
      {paymentModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-900 border border-white/10 w-full max-w-xs rounded-2xl shadow-2xl overflow-hidden animate-scale-up">
            <div className="bg-white/5 p-4 border-b border-white/5 flex justify-between items-center">
              <h2 className="text-sm font-bold text-white uppercase">Add Payment</h2>
              <button onClick={() => setPaymentModal({ open: false, issueId: '', currentPaid: 0, total: 0 })} className="text-zinc-500 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-black/20 p-3 rounded-xl border border-white/5 text-center">
                <span className="text-xs text-zinc-500 uppercase font-bold">Balance Due</span>
                <p className="text-xl font-mono text-red-400 font-bold mt-1">₹{paymentModal.total - paymentModal.currentPaid}</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase">Amount Received</label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                  <input type="number" autoFocus className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-white focus:border-indigo-500 outline-none" placeholder="0" value={addAmount} onChange={e => setAddAmount(e.target.value)} />
                </div>
              </div>
              <button onClick={savePayment} className="w-full bg-green-600 hover:bg-green-500 text-white py-2.5 rounded-xl font-bold shadow-lg transition-all">Record Payment</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}