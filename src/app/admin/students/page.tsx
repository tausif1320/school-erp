'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Search, Filter, Plus, Edit3, X, Check, 
  ChevronLeft, ChevronRight, Download, GraduationCap, 
  ChevronDown, User, Eye, Ban, FileText, Table as TableIcon, 
  Sparkles 
} from 'lucide-react';
import Link from 'next/link';
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
  class: string;
  section: string | null;
  academic_year: string;
  status: 'active' | 'inactive';
};

/* =========================
   AVATAR COMPONENT
========================= */
function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const gradients = [
    'from-pink-500 to-rose-600',
    'from-indigo-500 to-violet-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
    'from-cyan-500 to-blue-600',
  ];
  const bg = gradients[name.length % gradients.length];

  return (
    <div className={`w-9 h-9 min-w-[36px] rounded-full bg-gradient-to-br ${bg} p-[2px] shadow-sm`}>
      <div className="w-full h-full rounded-full bg-zinc-900/90 backdrop-blur-sm flex items-center justify-center border border-white/10">
        <span className="text-[10px] font-bold text-white tracking-wider">{initials}</span>
      </div>
    </div>
  );
}

/* =========================
   MAIN COMPONENT
========================= */
export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  // Load Data
  async function loadStudents() {
    setLoading(true);
    const { data, error } = await supabase
      .from('students')
      .select('id, admission_number, full_name, class, section, academic_year, status')
      .order('created_at', { ascending: false });

    if (error) toast.error('Failed to load students');
    else setStudents(data ?? []);
    setLoading(false);
  }

  useEffect(() => { loadStudents(); }, []);

  // Filter & Pagination
  const filteredStudents = students.filter(s => {
    const matchesSearch = s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || s.admission_number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = classFilter ? s.class === classFilter : true;
    const matchesStatus = statusFilter ? s.status === statusFilter : true;
    return matchesSearch && matchesClass && matchesStatus;
  });

  const totalPages = Math.ceil(filteredStudents.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + rowsPerPage);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, classFilter, statusFilter, rowsPerPage]);

  // Click Outside for Menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(event.target as Node)) setShowExportMenu(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Actions
  async function handleUpdateStudent() {
    if (!editingStudent) return;
    const { error } = await supabase.from('students').update({
        full_name: editingStudent.full_name,
        class: editingStudent.class,
        section: editingStudent.section,
        academic_year: editingStudent.academic_year,
      }).eq('id', editingStudent.id);
    if (error) { toast.error(error.message); return; }
    toast.success('Student updated');
    setEditingStudent(null);
    loadStudents();
  }

  async function toggleStudentStatus(student: Student) {
    const newStatus = student.status === 'active' ? 'inactive' : 'active';
    const { error } = await supabase.from('students').update({ status: newStatus }).eq('id', student.id);
    if (error) toast.error(error.message);
    else { toast.success(`Marked as ${newStatus}`); loadStudents(); }
  }

  // Exports
  const exportToPDF = () => {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [["Adm. No", "Name", "Class", "Section", "Year", "Status"]],
      body: filteredStudents.map(s => [s.admission_number, s.full_name, s.class, s.section || '-', s.academic_year, s.status]),
    });
    doc.save('students.pdf'); setShowExportMenu(false);
  };

  const exportToExcel = () => {
    const csv = ["Adm No,Name,Class,Section,Year,Status"].concat(filteredStudents.map(s => `${s.admission_number},"${s.full_name}",${s.class},${s.section || '-'},${s.academic_year},${s.status}`)).join('\n');
    saveAs(new Blob([csv], { type: 'text/csv' }), 'students.csv'); setShowExportMenu(false);
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in-up pb-20 md:pb-10 perspective-1000">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Database Active</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Student Directory</h1>
          <p className="text-zinc-400 text-sm mt-1">Centralized registry for student profiles.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Export */}
          <div className="relative w-full sm:w-auto z-20" ref={exportRef}>
            <button onClick={() => setShowExportMenu(!showExportMenu)} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 px-5 py-3 md:py-2.5 rounded-xl font-medium transition-all hover:border-white/20 active:scale-95">
              <Download className="w-4 h-4" /> <span>Export</span> <ChevronDown className={`w-3 h-3 ml-1 opacity-50 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
            </button>
            {showExportMenu && (
              <div className="absolute top-full right-0 mt-2 w-full md:w-48 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-scale-up ring-1 ring-white/5">
                <button onClick={exportToPDF} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-400 hover:text-white hover:bg-white/10 text-left transition-colors"><FileText className="w-4 h-4 text-rose-500" /> PDF</button>
                <div className="h-px bg-white/5"></div>
                <button onClick={exportToExcel} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-400 hover:text-white hover:bg-white/10 text-left transition-colors"><TableIcon className="w-4 h-4 text-emerald-500" /> Excel</button>
              </div>
            )}
          </div>
          {/* Add Button */}
          <Link href="/admin/students/add" className="w-full sm:w-auto">
            <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-black px-6 py-3 md:py-2.5 rounded-xl font-bold shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_25px_rgba(255,255,255,0.5)] transition-all hover:scale-[1.02] active:scale-95">
              <Plus className="w-4 h-4" /> <span>New Admission</span>
            </button>
          </Link>
        </div>
      </div>

      {/* FILTERS */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-zinc-900/40 backdrop-blur-xl border border-white/5 p-2 rounded-2xl relative z-10 shadow-lg">
        <div className="col-span-1 md:col-span-5 relative group">
          <Search className="absolute left-4 top-3.5 w-4 h-4 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
          <input placeholder="Search Name or ID..." className="w-full bg-black/40 border border-white/5 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:bg-black/60 focus:border-indigo-500/50 outline-none transition-all placeholder:text-zinc-600 font-medium" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <div className="col-span-1 md:col-span-3 relative group">
          <div className="absolute left-4 top-3.5"><Filter className="w-4 h-4 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" /></div>
          <input placeholder="Filter Class..." className="w-full bg-black/40 border border-white/5 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:bg-black/60 focus:border-indigo-500/50 outline-none transition-all placeholder:text-zinc-600 font-medium" value={classFilter} onChange={(e) => setClassFilter(e.target.value)} />
        </div>
        <div className="col-span-1 md:col-span-2 relative group">
           <select className="w-full bg-black/40 border border-white/5 rounded-xl py-3 pl-4 pr-4 text-sm text-zinc-300 focus:bg-black/60 focus:border-emerald-500/50 outline-none transition-all appearance-none cursor-pointer font-medium" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
             <option value="">All Status</option><option value="active">Active</option><option value="inactive">Inactive</option>
           </select>
           <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-zinc-600 pointer-events-none" />
        </div>
        <div className="col-span-1 md:col-span-2 relative group">
           <select className="w-full bg-black/40 border border-white/5 rounded-xl py-3 pl-4 pr-4 text-sm text-zinc-300 focus:bg-black/60 focus:border-white/20 outline-none transition-all appearance-none cursor-pointer font-medium" value={rowsPerPage} onChange={(e) => setRowsPerPage(Number(e.target.value))}>
             <option value={10}>10 Rows</option><option value={20}>20 Rows</option><option value={50}>50 Rows</option>
           </select>
           <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-zinc-600 pointer-events-none" />
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden shadow-2xl flex flex-col relative">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="bg-black/40 border-b border-white/5">
              <tr>
                <th className="px-6 py-5 text-[10px] font-bold uppercase text-zinc-500 tracking-widest w-[280px] pl-8">Student Name</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase text-zinc-500 tracking-widest w-[160px]">Admission ID</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase text-zinc-500 tracking-widest w-[140px]">Class</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase text-zinc-500 tracking-widest w-[120px]">Year</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase text-zinc-500 tracking-widest w-[120px]">Status</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase text-zinc-500 tracking-widest w-[140px] text-right pr-8">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                // PREMIUM SKELETON
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse border-b border-white/5 last:border-0">
                    <td className="px-6 py-4 pl-8">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-white/5"></div>
                        <div className="space-y-2">
                          <div className="h-3 bg-white/5 rounded" style={{ width: `${Math.floor(Math.random() * (120 - 80) + 80)}px` }}></div>
                          <div className="h-2 w-16 bg-white/5 rounded"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><div className="h-3 w-24 bg-white/5 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-3 w-12 bg-white/5 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-3 w-12 bg-white/5 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-5 w-16 bg-white/5 rounded-full"></div></td>
                    <td className="px-6 py-4 pr-8 text-right">
                      <div className="flex justify-end gap-2">
                        <div className="w-8 h-8 rounded-lg bg-white/5"></div>
                        <div className="w-8 h-8 rounded-lg bg-white/5"></div>
                        <div className="w-8 h-8 rounded-lg bg-white/5"></div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : paginatedStudents.map((s) => (
                <tr key={s.id} className="group hover:bg-white/[0.03] transition-colors relative">
                  <td className="px-6 py-4 pl-8">
                    <div className="flex items-center gap-3">
                      <Avatar name={s.full_name} />
                      <div>
                        <Link href={`/admin/students/${s.id}`} className="font-bold text-sm text-white group-hover:text-indigo-400 transition-colors">{s.full_name}</Link>
                        <div className="text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5">Student</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4"><span className="font-mono text-xs text-zinc-400 bg-white/5 px-2 py-1 rounded border border-white/5">{s.admission_number}</span></td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2"><span className="text-sm font-medium text-zinc-300">{s.class} <span className="text-zinc-600 mx-0.5">/</span> {s.section || 'A'}</span></div>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-500 font-mono">{s.academic_year}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${s.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${s.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                      {s.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 pr-8 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      <Link href={`/admin/students/${s.id}`}><button className="p-2 rounded-lg text-zinc-400 hover:text-indigo-400 hover:bg-white/5 transition-all"><Eye className="w-4 h-4" /></button></Link>
                      <button onClick={() => setEditingStudent(s)} className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-all"><Edit3 className="w-4 h-4" /></button>
                      <button onClick={() => toggleStudentStatus(s)} className={`p-2 rounded-lg transition-all ${s.status === 'active' ? 'text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10' : 'text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10'}`}>{s.status === 'active' ? <Ban className="w-4 h-4" /> : <Check className="w-4 h-4" />}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <PaginationFooter currentPage={currentPage} totalPages={totalPages} totalItems={filteredStudents.length} rowsPerPage={rowsPerPage} onPageChange={setCurrentPage} />
      </div>

      {/* Edit Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-900 border border-white/10 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-scale-up">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
              <div><h2 className="text-lg font-bold text-white">Edit Student</h2><p className="text-xs text-zinc-400 mt-1">Update record details</p></div>
              <button onClick={() => setEditingStudent(null)} className="text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <InputGroup label="Full Name" icon={<User className="w-4 h-4" />} value={editingStudent.full_name} onChange={(v) => setEditingStudent(prev => prev ? {...prev, full_name: v} : null)} />
              <div className="grid grid-cols-2 gap-4">
                 <InputGroup label="Class" icon={<GraduationCap className="w-4 h-4" />} value={editingStudent.class} onChange={(v) => setEditingStudent(prev => prev ? {...prev, class: v} : null)} />
                 <InputGroup label="Section" icon={<Filter className="w-4 h-4" />} value={editingStudent.section ?? ''} onChange={(v) => setEditingStudent(prev => prev ? {...prev, section: v} : null)} />
              </div>
              <InputGroup label="Academic Year" icon={<Sparkles className="w-4 h-4" />} value={editingStudent.academic_year} onChange={(v) => setEditingStudent(prev => prev ? {...prev, academic_year: v} : null)} />
              <div className="pt-4 flex gap-3">
                <button onClick={() => setEditingStudent(null)} className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-bold text-sm transition-colors">Cancel</button>
                <button onClick={handleUpdateStudent} className="flex-1 px-4 py-3 bg-white text-black hover:bg-zinc-200 rounded-xl font-bold text-sm transition-colors">Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}
      <style jsx global>{` .perspective-1000 { perspective: 1000px; } `}</style>
    </div>
  );
}

// Helper Components
function InputGroup({ label, icon, value, onChange }: { label: string, icon: React.ReactNode, value: string, onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">{label}</label>
      <div className="relative group">
        <div className="absolute left-3 top-3 text-zinc-500 group-focus-within:text-white transition-colors">{icon}</div>
        <input className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm focus:border-indigo-500 outline-none transition-all placeholder:text-zinc-700 font-medium" value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    </div>
  );
}

function PaginationFooter({ currentPage, totalPages, totalItems, rowsPerPage, onPageChange }: any) {
  return (
    <div className="p-4 border-t border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-md">
      <p className="text-xs text-zinc-500 font-medium">Showing <span className="text-white">{Math.min((currentPage - 1) * rowsPerPage + 1, totalItems)} - {Math.min(currentPage * rowsPerPage, totalItems)}</span> of <span className="text-white">{totalItems}</span></p>
      <div className="flex items-center gap-2">
        <button onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="p-2 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"><ChevronLeft className="w-4 h-4 text-zinc-300" /></button>
        <span className="text-xs font-mono text-zinc-400 px-2">Page {currentPage} of {totalPages || 1}</span>
        <button onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages || totalPages === 0} className="p-2 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"><ChevronRight className="w-4 h-4 text-zinc-300" /></button>
      </div>
    </div>
  );
}