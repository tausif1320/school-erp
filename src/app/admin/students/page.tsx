'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Search, Filter, Plus, Edit3, X, Check, Loader2, 
  ChevronLeft, ChevronRight, Download, GraduationCap, 
  ChevronDown, User, Eye, Ban, FileText, Table as TableIcon, 
  MoreHorizontal, ShieldCheck, Sparkles 
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
   AVATAR GENERATOR (Premium Visuals)
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
  // Deterministic color based on name length
  const bg = gradients[name.length % gradients.length];

  return (
    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${bg} p-[2px] shadow-lg`}>
      <div className="w-full h-full rounded-full bg-zinc-900/40 backdrop-blur-sm flex items-center justify-center border border-white/20">
        <span className="text-xs font-bold text-white tracking-wider">{initials}</span>
      </div>
    </div>
  );
}

/* =========================
   MAIN COMPONENT
========================= */
export default function StudentsPage() {
  /* --- DATA STATE --- */
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  /* --- UI/FILTER STATE --- */
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Edit Modal
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportRef = useRef<any>(null);

  /* =========================
     LOGIC: LOAD DATA
  ========================= */
  async function loadStudents() {
    setLoading(true);
    const { data, error } = await supabase
      .from('students')
      .select('id, admission_number, full_name, class, section, academic_year, status')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load students');
    } else {
      setStudents(data ?? []);
    }
    setLoading(false);
  }

  useEffect(() => { loadStudents(); }, []);

  // Close menus on click outside
  useEffect(() => {
    function handleClickOutside(event: any) {
      if (exportRef.current && !exportRef.current.contains(event.target)) setShowExportMenu(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* =========================
     LOGIC: FILTER & PAGINATION
  ========================= */
  const filteredStudents = students.filter(s => {
    const matchesSearch = 
      s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.admission_number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = classFilter ? s.class === classFilter : true;
    const matchesStatus = statusFilter ? s.status === statusFilter : true;
    return matchesSearch && matchesClass && matchesStatus;
  });

  const totalPages = Math.ceil(filteredStudents.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + rowsPerPage);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, classFilter, statusFilter, rowsPerPage]);

  /* =========================
     LOGIC: ACTIONS
  ========================= */
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
    if (error) { toast.error(error.message); return; }
    toast.success(`Student marked as ${newStatus}`);
    loadStudents();
  }

  /* =========================
     LOGIC: EXPORT
  ========================= */
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text(`Student List`, 14, 15);
    autoTable(doc, {
      head: [["Adm. No", "Name", "Class", "Section", "Year", "Status"]],
      body: filteredStudents.map(s => [s.admission_number, s.full_name, s.class, s.section || '-', s.academic_year, s.status]),
      startY: 20, theme: 'grid'
    });
    doc.save('students.pdf'); setShowExportMenu(false);
  };

  const exportToExcel = () => {
    const csv = ["Adm No,Name,Class,Section,Year,Status"].concat(filteredStudents.map(s => `${s.admission_number},"${s.full_name}",${s.class},${s.section || '-'},${s.academic_year},${s.status}`)).join('\n');
    saveAs(new Blob([csv], { type: 'text/csv' }), 'students.csv'); setShowExportMenu(false);
  };

  /* =========================
     UI RENDER
  ========================= */
  return (
    <div className="space-y-8 animate-fade-in-up pb-20 md:pb-10 perspective-1000">
      
      {/* --- HEADER SECTION --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Database Active</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Student Directory</h1>
          <p className="text-zinc-400 text-sm mt-1">Centralized registry for student profiles and admissions.</p>
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          
          {/* Export Dropdown */}
          <div className="relative flex-1 md:flex-none z-20" ref={exportRef}>
            <button 
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="w-full md:w-auto flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 px-5 py-2.5 rounded-xl font-medium transition-all hover:border-white/20 active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
              <ChevronDown className={`w-3 h-3 ml-1 opacity-50 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
            </button>
            {showExportMenu && (
              <div className="absolute top-full right-0 mt-2 w-full md:w-48 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-scale-up ring-1 ring-white/5">
                <button onClick={exportToPDF} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-400 hover:text-white hover:bg-white/10 text-left transition-colors"><FileText className="w-4 h-4 text-rose-500" /> PDF Document</button>
                <div className="h-px bg-white/5"></div>
                <button onClick={exportToExcel} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-400 hover:text-white hover:bg-white/10 text-left transition-colors"><TableIcon className="w-4 h-4 text-emerald-500" /> Excel Spreadsheet</button>
              </div>
            )}
          </div>

          {/* Add Student Button */}
          <Link href="/admin/students/add" className="flex-1 md:flex-none">
            <button className="w-full group relative flex items-center justify-center gap-2 bg-white text-black px-6 py-2.5 rounded-xl font-bold shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_25px_rgba(255,255,255,0.5)] transition-all hover:scale-[1.02] active:scale-95">
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
              <span>New Admission</span>
            </button>
          </Link>
        </div>
      </div>

      {/* --- FILTER COMMAND BAR --- */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-zinc-900/40 backdrop-blur-xl border border-white/5 p-2 rounded-2xl relative z-10 shadow-lg">
        
        {/* Search */}
        <div className="col-span-1 md:col-span-5 relative group">
          <Search className="absolute left-4 top-3.5 w-4 h-4 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
          <input 
            placeholder="Search by Name or Admission ID..." 
            className="w-full bg-black/40 border border-white/5 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:bg-black/60 focus:border-indigo-500/50 outline-none transition-all placeholder:text-zinc-600 font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Class Filter */}
        <div className="col-span-1 md:col-span-3 relative group">
          <div className="absolute left-4 top-3.5"><Filter className="w-4 h-4 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" /></div>
          <input 
            placeholder="Filter Class..." 
            className="w-full bg-black/40 border border-white/5 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:bg-black/60 focus:border-indigo-500/50 outline-none transition-all placeholder:text-zinc-600 font-medium"
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
          />
        </div>

        {/* Status Dropdown */}
        <div className="col-span-1 md:col-span-2 relative group">
           <div className="absolute left-4 top-3.5"><ShieldCheck className="w-4 h-4 text-zinc-500 group-focus-within:text-emerald-400 transition-colors" /></div>
           <select 
             className="w-full bg-black/40 border border-white/5 rounded-xl py-3 pl-11 pr-4 text-sm text-zinc-300 focus:bg-black/60 focus:border-emerald-500/50 outline-none transition-all appearance-none cursor-pointer font-medium"
             value={statusFilter}
             onChange={(e) => setStatusFilter(e.target.value)}
           >
             <option value="" className="bg-zinc-900 text-zinc-500">All Status</option>
             <option value="active" className="bg-zinc-900 text-emerald-400">Active Only</option>
             <option value="inactive" className="bg-zinc-900 text-rose-400">Inactive Only</option>
           </select>
           <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-zinc-600 pointer-events-none" />
        </div>

        {/* Rows Dropdown */}
        <div className="col-span-1 md:col-span-2 relative group">
           <div className="absolute left-4 top-3.5"><TableIcon className="w-4 h-4 text-zinc-500 group-focus-within:text-zinc-300 transition-colors" /></div>
           <select 
             className="w-full bg-black/40 border border-white/5 rounded-xl py-3 pl-11 pr-4 text-sm text-zinc-300 focus:bg-black/60 focus:border-white/20 outline-none transition-all appearance-none cursor-pointer font-medium"
             value={rowsPerPage}
             onChange={(e) => setRowsPerPage(Number(e.target.value))}
           >
             <option value={10} className="bg-zinc-900">10 Rows</option>
             <option value={20} className="bg-zinc-900">20 Rows</option>
             <option value={50} className="bg-zinc-900">50 Rows</option>
           </select>
           <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-zinc-600 pointer-events-none" />
        </div>
      </div>

      {/* --- DATA GRID (Floating Rows) --- */}
      <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden shadow-2xl min-h-[500px] flex flex-col relative">
        
        {/* Table Header */}
        <div className="overflow-x-auto custom-scrollbar flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-black/40 border-b border-white/5 sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="px-6 py-5 text-[10px] font-bold uppercase text-zinc-500 tracking-widest pl-8">Student Profile</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase text-zinc-500 tracking-widest">Admission ID</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase text-zinc-500 tracking-widest">Academic</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase text-zinc-500 tracking-widest">Year</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase text-zinc-500 tracking-widest">Status</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase text-zinc-500 tracking-widest text-right pr-8">Actions</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-white/5">
              {loading ? (
                // Skeleton Loader
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-8 py-4 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-white/5"></div>
                      <div className="space-y-2"><div className="h-3 w-32 bg-white/5 rounded"></div><div className="h-2 w-20 bg-white/5 rounded"></div></div>
                    </td>
                    <td className="px-6 py-4"><div className="h-3 w-20 bg-white/5 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-3 w-16 bg-white/5 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-3 w-12 bg-white/5 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-6 w-16 bg-white/5 rounded-full"></div></td>
                    <td className="px-6 py-4"></td>
                  </tr>
                ))
              ) : paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-24 text-center text-zinc-500">
                     <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                       <Search className="w-8 h-8 opacity-40" />
                     </div>
                     <p className="text-lg font-medium text-white">No records found</p>
                     <p className="text-sm mt-1">Try adjusting your filters or search query.</p>
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((s) => (
                  <tr 
                    key={s.id} 
                    className="group transition-all duration-300 hover:bg-white/[0.03] hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)] relative"
                  >
                    {/* Hover Indicator Bar */}
                    <td className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></td>

                    <td className="px-6 py-4 pl-8">
                      <div className="flex items-center gap-4">
                        <Avatar name={s.full_name} />
                        <div>
                          <Link href={`/admin/students/${s.id}`} className="font-bold text-sm text-white group-hover:text-indigo-400 transition-colors">
                            {s.full_name}
                          </Link>
                          <div className="flex items-center gap-1.5 mt-0.5 text-xs text-zinc-500 group-hover:text-zinc-400">
                             <User className="w-3 h-3" />
                             <span>Student</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs text-zinc-400 bg-white/5 px-2 py-1 rounded border border-white/5 group-hover:border-white/20 transition-colors">
                        {s.admission_number}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded bg-indigo-500/10 text-indigo-400">
                           <GraduationCap className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-sm font-medium text-zinc-300">{s.class} <span className="text-zinc-500 mx-1">•</span> {s.section || 'A'}</span>
                      </div>
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
                        <Link href={`/admin/students/${s.id}`}>
                           <button className="p-2 rounded-lg text-zinc-400 hover:text-indigo-400 hover:bg-white/5 transition-all tooltip" title="View Profile">
                             <Eye className="w-4 h-4" />
                           </button>
                        </Link>
                        <button onClick={() => setEditingStudent(s)} className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-all" title="Edit">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => toggleStudentStatus(s)} className={`p-2 rounded-lg transition-all ${s.status === 'active' ? 'text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10' : 'text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10'}`} title={s.status === 'active' ? 'Deactivate' : 'Activate'}>
                          {s.status === 'active' ? <Ban className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <div className="p-4 border-t border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-md">
          <p className="text-xs text-zinc-500 font-medium">
            Showing <span className="text-white">{Math.min((currentPage - 1) * rowsPerPage + 1, filteredStudents.length)} - {Math.min(currentPage * rowsPerPage, filteredStudents.length)}</span> of <span className="text-white">{filteredStudents.length}</span> students
          </p>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
              disabled={currentPage === 1} 
              className="p-2 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              <ChevronLeft className="w-4 h-4 text-zinc-300" />
            </button>
            <span className="text-xs font-mono text-zinc-400 px-2">Page {currentPage} of {totalPages || 1}</span>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
              disabled={currentPage === totalPages || totalPages === 0} 
              className="p-2 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              <ChevronRight className="w-4 h-4 text-zinc-300" />
            </button>
          </div>
        </div>
      </div>

      {/* --- PREMIUM EDIT MODAL --- */}
      {editingStudent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="bg-[#0A0A0A] border border-white/10 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-scale-up relative">
            
            {/* Modal Glow */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

            <div className="p-6 md:p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Edit Profile</h2>
                  <p className="text-sm text-zinc-400 mt-1">Modify student academic details.</p>
                </div>
                <button onClick={() => setEditingStudent(null)} className="p-2 rounded-full hover:bg-white/10 text-zinc-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
              </div>

              <div className="space-y-5">
                <InputGroup label="Full Name" icon={<User className="w-4 h-4" />} value={editingStudent.full_name} onChange={(val) => setEditingStudent(prev => prev ? {...prev, full_name: val} : null)} />
                <div className="grid grid-cols-2 gap-5">
                   <InputGroup label="Class" icon={<GraduationCap className="w-4 h-4" />} value={editingStudent.class} onChange={(val) => setEditingStudent(prev => prev ? {...prev, class: val} : null)} />
                   <InputGroup label="Section" icon={<Filter className="w-4 h-4" />} value={editingStudent.section ?? ''} onChange={(val) => setEditingStudent(prev => prev ? {...prev, section: val} : null)} />
                </div>
                <InputGroup label="Academic Year" icon={<Sparkles className="w-4 h-4" />} value={editingStudent.academic_year} onChange={(val) => setEditingStudent(prev => prev ? {...prev, academic_year: val} : null)} />
              </div>

              <div className="pt-8 flex gap-3">
                <button onClick={() => setEditingStudent(null)} className="flex-1 px-4 py-3 bg-zinc-900 border border-white/10 hover:bg-white/5 text-zinc-300 rounded-xl font-bold text-sm transition-all">Cancel</button>
                <button onClick={handleUpdateStudent} className="flex-1 px-4 py-3 bg-white text-black hover:bg-zinc-200 rounded-xl font-bold text-sm shadow-[0_0_15px_rgba(255,255,255,0.2)] transition-all transform active:scale-95">Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <style jsx global>{`
        .perspective-1000 { perspective: 1000px; }
      `}</style>
    </div>
  );
}

// PREMIUM INPUT GROUP
function InputGroup({ label, icon, value, onChange, placeholder }: { label: string; icon: React.ReactNode; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">{label}</label>
      <div className="relative group">
        <div className="absolute left-4 top-3.5 text-zinc-500 group-focus-within:text-white transition-colors">{icon}</div>
        <input 
          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white text-sm font-medium focus:bg-white/10 focus:border-indigo-500/50 outline-none transition-all placeholder:text-zinc-600 focus:shadow-[0_0_0_4px_rgba(99,102,241,0.1)]" 
          value={value} 
          onChange={(e) => onChange(e.target.value)} 
          placeholder={placeholder} 
        />
      </div>
    </div>
  );
}