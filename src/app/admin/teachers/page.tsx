'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  Search, Download, FileText, Table as TableIcon, ChevronDown, 
  Loader2, Eye, Ban, Check, Trash2, User, BookOpen, Phone, Calendar,
  MoreHorizontal, ChevronLeft, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveAs } from 'file-saver';

/* =========================
   TYPES
========================= */
type Teacher = {
  id: string;
  full_name: string;
  subject: string;
  phone: string;
  join_date: string;
  status: string;
};

/* =========================
   COMPONENT
========================= */
export default function TeacherListPage() {
  /* --- STATE --- */
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  
  const exportRef = useRef<any>(null);

  /* --- LOGIC: DATA LOADING --- */
  async function loadTeachers() {
    setLoading(true);
    const { data, error } = await supabase
      .from('teachers')
      .select('id, full_name, subject, phone, join_date, status')
      .order('full_name');

    if (error) {
      toast.error('Failed to load teachers');
    } else {
      setTeachers(data ?? []);
    }
    setLoading(false);
  }

  /* --- LOGIC: ACTIONS --- */
  async function toggleStatus(id: string, status: string) {
    const newStatus = status === 'active' ? 'inactive' : 'active';
    const { error } = await supabase
      .from('teachers')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      toast.error('Status update failed');
    } else {
      toast.success(`Teacher marked as ${newStatus}`);
      loadTeachers();
    }
  }

  async function deleteTeacher(id: string) {
    if (!confirm('Are you sure you want to delete this teacher? This cannot be undone.')) return;
    
    const { error } = await supabase.from('teachers').delete().eq('id', id);
    if (error) {
      toast.error('Delete failed');
    } else {
      toast.success('Teacher deleted');
      loadTeachers();
    }
  }

  useEffect(() => {
    loadTeachers();
  }, []);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(event: any) {
      if (exportRef.current && !exportRef.current.contains(event.target)) setShowExportMenu(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* --- LOGIC: FILTER & PAGINATION --- */
  const filteredTeachers = teachers.filter(t => 
    t.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.subject && t.subject.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredTeachers.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedTeachers = filteredTeachers.slice(startIndex, startIndex + rowsPerPage);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, rowsPerPage]);

  /* --- LOGIC: EXPORT --- */
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text(`Teachers Directory`, 14, 15);
    autoTable(doc, {
      head: [["Name", "Subject", "Phone", "Join Date", "Status"]],
      body: filteredTeachers.map(t => [t.full_name, t.subject, t.phone, t.join_date, t.status]),
      startY: 20, theme: 'grid'
    });
    doc.save('teachers_list.pdf'); setShowExportMenu(false);
  };

  const exportToExcel = () => {
    const csv = ["Name,Subject,Phone,Join Date,Status"].concat(filteredTeachers.map(t => `"${t.full_name}",${t.subject},${t.phone},${t.join_date},${t.status}`)).join('\n');
    saveAs(new Blob([csv], { type: 'text/csv' }), 'teachers_list.csv'); setShowExportMenu(false);
  };

  /* =========================
     UI RENDER
  ========================= */
  return (
    <div className="space-y-6 animate-fade-in-up pb-20 md:pb-10">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Teachers Directory</h1>
          <p className="text-zinc-500 text-sm mt-1">Manage faculty and staff records</p>
        </div>

        {/* Action Group (Mobile Fixed) */}
        <div className="flex gap-3 w-full md:w-auto">
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
                <button onClick={exportToPDF} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-400 hover:text-white hover:bg-white/5 text-left transition-colors"><FileText className="w-4 h-4 text-red-400" /> PDF</button>
                <div className="h-px bg-white/5"></div>
                <button onClick={exportToExcel} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-400 hover:text-white hover:bg-white/5 text-left transition-colors"><TableIcon className="w-4 h-4 text-green-400" /> Excel</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-900/40 backdrop-blur-xl border border-white/5 p-4 rounded-2xl relative z-10">
        {/* Search */}
        <div className="relative group">
          <Search className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500 group-focus-within:text-white transition-colors" />
          <input 
            placeholder="Search Name or Subject..." 
            className="w-full bg-black/20 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm text-zinc-300 focus:bg-black/40 focus:border-indigo-500/50 outline-none transition-all placeholder:text-zinc-600"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {/* Rows Per Page */}
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
        ) : paginatedTeachers.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-20 text-center text-zinc-500">
             <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4"><User className="w-8 h-8 opacity-50" /></div>
             <p className="text-lg font-medium text-white">No teachers found</p>
             <p className="text-sm mt-1">Try adjusting your search.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto custom-scrollbar flex-1">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-zinc-500 uppercase bg-black/20 border-b border-white/5">
                  <tr>
                    <th className="px-6 py-4 font-bold text-zinc-400">#</th>
                    <th className="px-6 py-4 font-bold text-zinc-400">Teacher Name</th>
                    <th className="px-6 py-4 font-bold text-zinc-400">Subject</th>
                    <th className="px-6 py-4 font-bold text-zinc-400">Phone</th>
                    <th className="px-6 py-4 font-bold text-zinc-400">Join Date</th>
                    <th className="px-6 py-4 font-bold text-zinc-400">Status</th>
                    <th className="px-6 py-4 font-bold text-zinc-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {paginatedTeachers.map((t, i) => (
                    <tr key={t.id} className="group hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-zinc-500 font-mono text-xs">{startIndex + i + 1}</td>
                      <td className="px-6 py-4">
                        <Link href={`/admin/teachers/${t.id}`} className="font-semibold text-white hover:text-indigo-400 hover:underline transition-colors flex items-center gap-2">
                           <User className="w-3.5 h-3.5 text-zinc-500" />
                           {t.full_name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-zinc-300">
                        <span className="flex items-center gap-2"><BookOpen className="w-3 h-3 text-zinc-500" /> {t.subject}</span>
                      </td>
                      <td className="px-6 py-4 text-zinc-400">
                        <span className="flex items-center gap-2"><Phone className="w-3 h-3 text-zinc-500" /> {t.phone}</span>
                      </td>
                      <td className="px-6 py-4 text-zinc-400">
                        <span className="flex items-center gap-2"><Calendar className="w-3 h-3 text-zinc-500" /> {t.join_date}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${t.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                          {t.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/admin/teachers/${t.id}`}>
                             <button className="p-2 text-zinc-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all" title="View Profile">
                               <Eye className="w-4 h-4" />
                             </button>
                           </Link>
                          <button 
                            onClick={() => toggleStatus(t.id, t.status)} 
                            className={`p-2 rounded-lg transition-all ${t.status === 'active' ? 'text-amber-400 hover:bg-amber-500/10' : 'text-emerald-400 hover:bg-emerald-500/10'}`} 
                            title={t.status === 'active' ? 'Deactivate' : 'Activate'}
                          >
                            {t.status === 'active' ? <Ban className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                          </button>
                          <button 
                            onClick={() => deleteTeacher(t.id)} 
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all" 
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-white/5 flex items-center justify-between bg-black/20">
              <p className="text-xs text-zinc-500">
                Showing <span className="text-white font-medium">{startIndex + 1}-{Math.min(startIndex + rowsPerPage, filteredTeachers.length)}</span> of <span className="text-white font-medium">{filteredTeachers.length}</span>
              </p>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-zinc-400">Page {currentPage} of {totalPages || 1}</span>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

    </div>
  );
}