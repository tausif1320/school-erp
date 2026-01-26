'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Search, Filter, Plus, Edit3, Trash2, X, Check, Loader2, 
  ChevronLeft, ChevronRight, Download, MoreHorizontal, GraduationCap, 
  FileText, Table as TableIcon, ChevronDown, User, Eye, Ban
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
   COMPONENT
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
    <div className="space-y-6 animate-fade-in-up pb-20 md:pb-10">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Student Directory</h1>
          <p className="text-zinc-500 text-sm mt-1">Manage admissions and student profiles</p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          {/* Export Button */}
          <div className="relative flex-1 md:flex-none" ref={exportRef}>
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
                <button onClick={exportToPDF} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-400 hover:text-white hover:bg-white/5 text-left transition-colors"><FileText className="w-4 h-4 text-red-400" /> PDF</button>
                <div className="h-px bg-white/5"></div>
                <button onClick={exportToExcel} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-400 hover:text-white hover:bg-white/5 text-left transition-colors"><TableIcon className="w-4 h-4 text-green-400" /> Excel</button>
              </div>
            )}
          </div>

          {/* Add Button - NOW A LINK */}
          <Link href="/admin/students/add" className="flex-1 md:flex-none">
            <button className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-indigo-500/20 transition-all">
              <Plus className="w-4 h-4" />
              <span className="whitespace-nowrap">Add Student</span>
            </button>
          </Link>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-zinc-900/40 backdrop-blur-xl border border-white/5 p-4 rounded-2xl relative z-10">
        
        <div className="relative group col-span-1 md:col-span-2 lg:col-span-1">
          <Search className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500 group-focus-within:text-white transition-colors" />
          <input 
            placeholder="Search Name or ID..." 
            className="w-full bg-black/20 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm text-zinc-300 focus:bg-black/40 focus:border-indigo-500/50 outline-none transition-all placeholder:text-zinc-600"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="relative group">
          <div className="absolute left-3 top-3.5"><Filter className="w-4 h-4 text-zinc-500" /></div>
          <input 
            placeholder="Filter Class..." 
            className="w-full bg-black/20 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm text-zinc-300 focus:bg-black/40 focus:border-indigo-500/50 outline-none transition-all placeholder:text-zinc-600"
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
          />
        </div>

        <div className="relative group">
           <div className="absolute left-3 top-3.5"><Check className="w-4 h-4 text-zinc-500" /></div>
           <select 
             className="w-full bg-black/20 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm text-zinc-300 focus:bg-black/40 focus:border-indigo-500/50 outline-none transition-all appearance-none cursor-pointer"
             value={statusFilter}
             onChange={(e) => setStatusFilter(e.target.value)}
           >
             <option value="" className="bg-zinc-900">All Status</option>
             <option value="active" className="bg-zinc-900">Active Only</option>
             <option value="inactive" className="bg-zinc-900">Inactive Only</option>
           </select>
           <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-zinc-600 pointer-events-none" />
        </div>

        <div className="relative group">
           <div className="absolute left-3 top-3.5"><MoreHorizontal className="w-4 h-4 text-zinc-500" /></div>
           <select 
             className="w-full bg-black/20 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm text-zinc-300 focus:bg-black/40 focus:border-indigo-500/50 outline-none transition-all appearance-none cursor-pointer"
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

      {/* TABLE */}
      <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-xl min-h-[400px] flex flex-col">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-20 space-y-4 text-zinc-500">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            <p className="text-sm font-medium">Loading records...</p>
          </div>
        ) : paginatedStudents.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-20 text-center text-zinc-500">
             <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4"><GraduationCap className="w-8 h-8 opacity-50" /></div>
             <p className="text-lg font-medium text-white">No students found</p>
             <p className="text-sm mt-1">Try adjusting your filters.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto custom-scrollbar flex-1">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-zinc-500 uppercase bg-black/20 border-b border-white/5">
                  <tr>
                    <th className="px-6 py-4 font-bold text-zinc-400">Adm. No</th>
                    <th className="px-6 py-4 font-bold text-zinc-400">Student Name</th>
                    <th className="px-6 py-4 font-bold text-zinc-400">Class</th>
                    <th className="px-6 py-4 font-bold text-zinc-400">Section</th>
                    <th className="px-6 py-4 font-bold text-zinc-400">Year</th>
                    <th className="px-6 py-4 font-bold text-zinc-400">Status</th>
                    <th className="px-6 py-4 font-bold text-zinc-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {paginatedStudents.map((s) => (
                    <tr key={s.id} className="group hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-zinc-400 font-mono text-xs font-medium">{s.admission_number}</td>
                      <td className="px-6 py-4">
                        <Link href={`/admin/students/${s.id}`} className="font-semibold text-white hover:text-indigo-400 hover:underline transition-colors">
                          {s.full_name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-zinc-300"><span className="bg-white/5 px-2 py-1 rounded border border-white/5">{s.class}</span></td>
                      <td className="px-6 py-4 text-zinc-400">{s.section ?? '-'}</td>
                      <td className="px-6 py-4 text-zinc-400">{s.academic_year}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${s.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                          {s.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                           <Link href={`/admin/students/${s.id}`}>
                             <button className="p-2 text-zinc-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all" title="View Profile">
                               <Eye className="w-4 h-4" />
                             </button>
                           </Link>
                          <button onClick={() => setEditingStudent(s)} className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-all" title="Edit">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button onClick={() => toggleStudentStatus(s)} className={`p-2 rounded-lg transition-all ${s.status === 'active' ? 'text-red-400 hover:bg-red-500/10' : 'text-emerald-400 hover:bg-emerald-500/10'}`} title={s.status === 'active' ? 'Deactivate' : 'Activate'}>
                            {s.status === 'active' ? <Ban className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-white/5 flex items-center justify-between bg-black/20">
              <p className="text-xs text-zinc-500">
                Showing <span className="text-white font-medium">{startIndex + 1}-{Math.min(startIndex + rowsPerPage, filteredStudents.length)}</span> of <span className="text-white font-medium">{filteredStudents.length}</span>
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

      {/* --- EDIT MODAL (Kept here for quick edits) --- */}
      {editingStudent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-900 border border-white/10 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-scale-up">
            <div className="bg-white/5 p-6 border-b border-white/5 flex justify-between items-center">
              <div><h2 className="text-lg font-bold text-white">Edit Student</h2><p className="text-xs text-zinc-400 mt-1">Update profile information</p></div>
              <button onClick={() => setEditingStudent(null)} className="text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <InputGroup label="Full Name" icon={<User className="w-4 h-4" />} value={editingStudent.full_name} onChange={(val) => setEditingStudent(prev => prev ? {...prev, full_name: val} : null)} />
              <div className="grid grid-cols-2 gap-4">
                 <InputGroup label="Class" icon={<GraduationCap className="w-4 h-4" />} value={editingStudent.class} onChange={(val) => setEditingStudent(prev => prev ? {...prev, class: val} : null)} />
                 <InputGroup label="Section" icon={<Filter className="w-4 h-4" />} value={editingStudent.section ?? ''} onChange={(val) => setEditingStudent(prev => prev ? {...prev, section: val} : null)} />
              </div>
              <InputGroup label="Academic Year" icon={<Check className="w-4 h-4" />} value={editingStudent.academic_year} onChange={(val) => setEditingStudent(prev => prev ? {...prev, academic_year: val} : null)} />
              <div className="pt-2 flex gap-3">
                <button onClick={() => setEditingStudent(null)} className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-xl font-medium transition-colors">Cancel</button>
                <button onClick={handleUpdateStudent} className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium shadow-lg transition-colors">Update Profile</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// UI Helpers
function InputGroup({ label, icon, value, onChange, placeholder }: { label: string; icon: React.ReactNode; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs text-zinc-400 font-semibold ml-1 uppercase">{label}</label>
      <div className="relative group">
        <div className="absolute left-3 top-3 text-zinc-500 group-focus-within:text-white transition-colors">{icon}</div>
        <input className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white focus:border-indigo-500 outline-none transition-all placeholder:text-zinc-700 font-medium" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      </div>
    </div>
  );
}