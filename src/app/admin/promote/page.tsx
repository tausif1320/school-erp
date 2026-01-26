'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { 
  ArrowRight, Calendar, CheckSquare, GraduationCap, Loader2, 
  Search, Users, ChevronDown, Download, FileText, Table as TableIcon, 
  AlertCircle, ArrowUpRight, Ban
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveAs } from 'file-saver';

/* --- TYPES --- */
type Student = {
  id: string;
  admission_number: string;
  full_name: string;
  class: string;
  section: string | null;
};

export default function PromoteStudentsPage() {
  /* =========================
     PROMOTION CONFIG (Logic Intact)
  ========================= */
  const [fromYear, setFromYear] = useState('');
  const [toYear, setToYear] = useState('');
  const [fromClass, setFromClass] = useState('');
  const [toClass, setToClass] = useState('');
  const [promotionDate, setPromotionDate] = useState('');

  /* =========================
     STUDENTS STATE
  ========================= */
  const [students, setStudents] = useState<Student[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // New UI States
  const [globalSearch, setGlobalSearch] = useState('');
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportRef = useRef<any>(null);

  /* =========================
     LOGIC: LOAD STUDENTS
  ========================= */
  async function loadStudents() {
    if (!fromYear || !fromClass) {
      setStudents([]);
      setFilteredStudents([]);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('students')
      .select('id, admission_number, full_name, class, section')
      .eq('academic_year', fromYear)
      .eq('class', fromClass)
      .eq('status', 'active')
      .order('full_name');

    if (error) {
      toast.error('Failed to load students');
    } else {
      setStudents(data ?? []);
      setFilteredStudents(data ?? []);
      setSelected([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadStudents();
  }, [fromYear, fromClass]);

  /* =========================
     LOGIC: SEARCH & FILTER
  ========================= */
  useEffect(() => {
    if (!globalSearch) {
      setFilteredStudents(students);
    } else {
      const lower = globalSearch.toLowerCase();
      setFilteredStudents(students.filter(s => 
        s.full_name.toLowerCase().includes(lower) || 
        s.admission_number.toLowerCase().includes(lower)
      ));
    }
  }, [globalSearch, students]);

  // Click Outside Export Menu
  useEffect(() => {
    function handleClickOutside(event: any) {
      if (exportRef.current && !exportRef.current.contains(event.target)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* =========================
     LOGIC: SELECTION
  ========================= */
  function toggleSelect(id: string) {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  }

  function toggleSelectAll() {
    if (selected.length === filteredStudents.length) {
      setSelected([]);
    } else {
      setSelected(filteredStudents.map(s => s.id));
    }
  }

  /* =========================
     LOGIC: PROMOTE
  ========================= */
  async function promoteStudents(holdSameClass = false) {
    if (!fromYear || !toYear || !fromClass || !promotionDate || selected.length === 0) {
      toast.error('Please select students and fill all configuration fields');
      return;
    }

    setActionLoading(true);

    const updates = selected.map((studentId) => ({
      student_id: studentId,
      from_class: fromClass,
      to_class: holdSameClass ? fromClass : toClass,
      from_year: fromYear,
      to_year: toYear,
      promoted_at: promotionDate,
    }));

    // 1️⃣ Insert promotion history
    const { error: historyError } = await supabase.from('promotion_history').insert(updates);

    if (historyError) {
      toast.error('Failed to save promotion history');
      setActionLoading(false);
      return;
    }

    // 2️⃣ Update students
    const { error: updateError } = await supabase.from('students').update({
      class: holdSameClass ? fromClass : toClass,
      academic_year: toYear,
    }).in('id', selected);

    if (updateError) {
      toast.error('Failed to update students');
      setActionLoading(false);
      return;
    }

    toast.success(holdSameClass ? 'Students held successfully' : 'Students promoted successfully');
    setSelected([]);
    loadStudents();
    setActionLoading(false);
  }

  /* =========================
     LOGIC: EXPORT
  ========================= */
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text(`Promotion List: Class ${fromClass} (${fromYear})`, 14, 15);
    
    const tableColumn = ["Adm. No", "Student Name", "Current Class", "Section"];
    const tableRows = filteredStudents.map(s => [
      s.admission_number, s.full_name, s.class, s.section || '-'
    ]);

    autoTable(doc, {
      head: [tableColumn], body: tableRows, startY: 20, theme: 'grid', styles: { fontSize: 9 }, headStyles: { fillColor: [79, 70, 229] }
    });

    doc.save(`promotion_list_${fromClass}.pdf`);
    setShowExportMenu(false);
    toast.success("PDF Downloaded");
  };

  const exportToExcel = () => {
    const csvRows = [];
    csvRows.push(["Admission No", "Student Name", "Current Class", "Section"].join(','));

    for (const row of filteredStudents) {
      csvRows.push([row.admission_number, `"${row.full_name}"`, row.class, row.section || '-'].join(','));
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    saveAs(blob, `promotion_list_${fromClass}.csv`);
    setShowExportMenu(false);
    toast.success("Excel Downloaded");
  };

  /* =========================
     UI RENDER
  ========================= */
  return (
    <div className="space-y-6 animate-fade-in-up pb-20 md:pb-10">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Promote Students</h1>
          <p className="text-zinc-500 text-sm mt-1">Manage academic year transitions</p>
        </div>

        {/* Action Group */}
        <div className="flex gap-3">
           {/* Export Dropdown */}
           <div className="relative" ref={exportRef}>
            <button 
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="h-full flex items-center gap-2 bg-zinc-900 border border-white/10 hover:bg-white/5 text-zinc-300 px-4 py-2.5 rounded-xl font-medium transition-all"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">List</span>
              <ChevronDown className="w-3 h-3 ml-1 opacity-50" />
            </button>
            {showExportMenu && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-scale-up">
                <button onClick={exportToPDF} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-400 hover:text-white hover:bg-white/5 text-left transition-colors"><FileText className="w-4 h-4 text-red-400" /> PDF</button>
                <div className="h-px bg-white/5"></div>
                <button onClick={exportToExcel} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-400 hover:text-white hover:bg-white/5 text-left transition-colors"><TableIcon className="w-4 h-4 text-green-400" /> Excel</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- CONFIGURATION PANEL (Glassmorphism) --- */}
      <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 p-6 rounded-2xl relative z-10">
        <div className="flex items-center gap-2 mb-4 text-indigo-400">
           <GraduationCap className="w-5 h-5" />
           <span className="text-sm font-semibold uppercase tracking-wider">Promotion Settings</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-500 font-medium ml-1">Current Year</label>
            <input 
              placeholder="e.g. 2025-2026" 
              className="w-full bg-black/20 border border-white/5 rounded-xl py-2.5 px-4 text-sm text-zinc-300 focus:bg-black/40 focus:border-indigo-500/50 outline-none transition-all placeholder:text-zinc-600"
              value={fromYear} onChange={(e) => setFromYear(e.target.value)} 
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-zinc-500 font-medium ml-1">Current Class</label>
            <input 
              placeholder="e.g. 9" 
              className="w-full bg-black/20 border border-white/5 rounded-xl py-2.5 px-4 text-sm text-zinc-300 focus:bg-black/40 focus:border-indigo-500/50 outline-none transition-all placeholder:text-zinc-600"
              value={fromClass} onChange={(e) => setFromClass(e.target.value)} 
            />
          </div>

          <div className="flex items-center justify-center pt-6 text-zinc-600">
             <ArrowRight className="w-5 h-5" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-zinc-500 font-medium ml-1">Target Year</label>
            <input 
              placeholder="e.g. 2026-2027" 
              className="w-full bg-black/20 border border-white/5 rounded-xl py-2.5 px-4 text-sm text-zinc-300 focus:bg-black/40 focus:border-emerald-500/50 outline-none transition-all placeholder:text-zinc-600"
              value={toYear} onChange={(e) => setToYear(e.target.value)} 
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-zinc-500 font-medium ml-1">Target Class</label>
            <input 
              placeholder="e.g. 10" 
              className="w-full bg-black/20 border border-white/5 rounded-xl py-2.5 px-4 text-sm text-zinc-300 focus:bg-black/40 focus:border-emerald-500/50 outline-none transition-all placeholder:text-zinc-600"
              value={toClass} onChange={(e) => setToClass(e.target.value)} 
            />
          </div>

          <div className="lg:col-span-5 md:col-span-2 pt-2 border-t border-white/5 mt-2 flex flex-col md:flex-row gap-4 items-center justify-between">
             <div className="w-full md:w-auto flex items-center gap-3">
               <Calendar className="w-4 h-4 text-zinc-500" />
               <input 
                 type="date" 
                 className="bg-zinc-950 border border-white/10 rounded-lg py-2 px-3 text-sm text-zinc-300 outline-none focus:border-indigo-500 transition-all"
                 value={promotionDate} onChange={(e) => setPromotionDate(e.target.value)} 
               />
               <span className="text-xs text-zinc-500">Effective Date</span>
             </div>
             
             {/* Search Filter */}
             <div className="relative w-full md:w-64 group">
               <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500 group-focus-within:text-white transition-colors" />
               <input 
                 placeholder="Search student..." 
                 className="w-full bg-black/20 border border-white/5 rounded-lg py-2 pl-9 pr-4 text-sm text-zinc-300 focus:bg-black/40 focus:border-indigo-500/50 outline-none"
                 value={globalSearch}
                 onChange={(e) => setGlobalSearch(e.target.value)}
               />
             </div>
          </div>

        </div>
      </div>

      {/* --- TABLE SECTION --- */}
      <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-xl min-h-[400px]">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center text-zinc-500 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            <p className="text-sm font-medium">Fetching students...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-20 text-center flex flex-col items-center text-zinc-500">
             <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4"><Users className="w-8 h-8 opacity-50" /></div>
             <p className="text-lg font-medium text-white">No students found</p>
             <p className="text-sm mt-1">Check your year/class inputs or search query.</p>
          </div>
        ) : (
          <>
            {/* Table Header with Actions */}
            <div className="p-4 border-b border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/5">
               <div className="text-sm text-zinc-400">
                  Selected: <span className="text-white font-bold">{selected.length}</span> students
               </div>
               
               <div className="flex gap-2 w-full sm:w-auto">
                 <button
                   onClick={() => promoteStudents(true)}
                   disabled={actionLoading || selected.length === 0}
                   className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                   Hold / Repeat
                 </button>
                 <button
                   onClick={() => promoteStudents(false)}
                   disabled={actionLoading || selected.length === 0}
                   className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-lg text-sm font-medium shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUpRight className="w-4 h-4" />}
                   Promote Selection
                 </button>
               </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-zinc-500 uppercase bg-black/20 border-b border-white/5">
                  <tr>
                    <th className="p-4 w-10">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-indigo-600 focus:ring-offset-zinc-900"
                        onChange={toggleSelectAll}
                        checked={selected.length === filteredStudents.length && filteredStudents.length > 0}
                      />
                    </th>
                    <th className="px-6 py-4 font-semibold tracking-wider">Adm. No</th>
                    <th className="px-6 py-4 font-semibold tracking-wider">Student Name</th>
                    <th className="px-6 py-4 font-semibold tracking-wider">Current Class</th>
                    <th className="px-6 py-4 font-semibold tracking-wider">Section</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredStudents.map((s) => (
                    <tr 
                      key={s.id} 
                      className={`
                        group transition-colors
                        ${selected.includes(s.id) ? 'bg-indigo-900/10 hover:bg-indigo-900/20' : 'hover:bg-white/5'}
                      `}
                      onClick={() => toggleSelect(s.id)} // Row click selects
                    >
                      <td className="p-4">
                        <input 
                          type="checkbox" 
                          checked={selected.includes(s.id)}
                          onChange={() => toggleSelect(s.id)}
                          className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-indigo-600 focus:ring-offset-zinc-900 cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4 text-zinc-400 font-mono text-xs">{s.admission_number}</td>
                      <td className="px-6 py-4 font-medium text-white">{s.full_name}</td>
                      <td className="px-6 py-4 text-zinc-300"><span className="bg-white/5 px-2 py-1 rounded border border-white/5">{s.class}</span></td>
                      <td className="px-6 py-4 text-zinc-400">{s.section ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

    </div>
  );
}