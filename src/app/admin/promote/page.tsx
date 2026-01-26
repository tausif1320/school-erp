'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { 
  ArrowRight, Calendar, GraduationCap, Loader2, 
  Search, Users, ChevronDown, Download, FileText, Table as TableIcon, 
  ArrowUpRight, Ban, ChevronLeft, ChevronRight
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
  /* --- CONFIG STATE --- */
  const [fromYear, setFromYear] = useState('');
  const [toYear, setToYear] = useState('');
  const [fromClass, setFromClass] = useState('');
  const [toClass, setToClass] = useState('');
  
  // Custom Date Picker
  const [promotionDate, setPromotionDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState(new Date());

  /* --- DATA STATE --- */
  const [students, setStudents] = useState<Student[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  /* --- UI STATE --- */
  const [globalSearch, setGlobalSearch] = useState('');
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  const exportRef = useRef<any>(null);
  const datePickerRef = useRef<any>(null);

  /* =========================
     LOGIC: LOAD DATA
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
     LOGIC: FILTER & UI HELPERS
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

  useEffect(() => {
    function handleClickOutside(event: any) {
      if (exportRef.current && !exportRef.current.contains(event.target)) setShowExportMenu(false);
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) setShowDatePicker(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function toggleSelect(id: string) {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  function toggleSelectAll() {
    if (selected.length === filteredStudents.length) setSelected([]);
    else setSelected(filteredStudents.map(s => s.id));
  }

  /* =========================
     LOGIC: DATE PICKER
  ========================= */
  const handleDateSelect = (day: number) => {
    const newDate = new Date(pickerDate.getFullYear(), pickerDate.getMonth(), day);
    const yyyy = newDate.getFullYear();
    const mm = String(newDate.getMonth() + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    setPromotionDate(`${yyyy}-${mm}-${dd}`);
    setShowDatePicker(false);
  };
  const changeMonth = (offset: number) => setPickerDate(new Date(pickerDate.getFullYear(), pickerDate.getMonth() + offset, 1));
  const daysInMonth = new Date(pickerDate.getFullYear(), pickerDate.getMonth() + 1, 0).getDate();
  const startDay = new Date(pickerDate.getFullYear(), pickerDate.getMonth(), 1).getDay();

  /* =========================
     LOGIC: PROMOTE
  ========================= */
  async function promoteStudents(holdSameClass = false) {
    if (!fromYear || !toYear || !fromClass || !promotionDate || selected.length === 0) {
      toast.error('Please select students and fill all fields');
      return;
    }
    setActionLoading(true);

    const updates = selected.map((studentId) => ({
      student_id: studentId, from_class: fromClass, to_class: holdSameClass ? fromClass : toClass,
      from_year: fromYear, to_year: toYear, promoted_at: promotionDate,
    }));

    const { error: hErr } = await supabase.from('promotion_history').insert(updates);
    if (hErr) { toast.error('History save failed'); setActionLoading(false); return; }

    const { error: uErr } = await supabase.from('students').update({
      class: holdSameClass ? fromClass : toClass, academic_year: toYear,
    }).in('id', selected);

    if (uErr) { toast.error('Update failed'); setActionLoading(false); return; }

    toast.success(holdSameClass ? 'Students held' : 'Students promoted');
    setSelected([]);
    loadStudents();
    setActionLoading(false);
  }

  /* =========================
     LOGIC: EXPORT
  ========================= */
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text(`Promotion List: Class ${fromClass} -> ${toClass}`, 14, 15);
    autoTable(doc, {
      head: [["Adm. No", "Name", "Current Class"]],
      body: filteredStudents.map(s => [s.admission_number, s.full_name, s.class]),
      startY: 20, theme: 'grid'
    });
    doc.save('promotion_list.pdf'); setShowExportMenu(false);
  };

  const exportToExcel = () => {
    const csv = ["Adm No,Name,Class"].concat(filteredStudents.map(s => `${s.admission_number},"${s.full_name}",${s.class}`)).join('\n');
    saveAs(new Blob([csv], { type: 'text/csv' }), 'promotion_list.csv'); setShowExportMenu(false);
  };

  /* =========================
     UI RENDER
  ========================= */
  return (
    <div className="space-y-6 animate-fade-in-up pb-20 md:pb-10">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Promote Students</h1>
          <p className="text-zinc-500 text-sm mt-1">Manage academic year transitions</p>
        </div>

        {/* Action Group (Fixed Mobile Width) */}
        <div className="flex gap-3 w-full md:w-auto">
           <div className="relative w-full md:w-auto" ref={exportRef}>
            <button 
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="w-full md:w-auto flex items-center justify-center gap-2 bg-zinc-900 border border-white/10 hover:bg-white/5 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
              <ChevronDown className="w-3 h-3 ml-1 opacity-70" />
            </button>
            {showExportMenu && (
              <div className="absolute top-full right-0 mt-2 w-full md:w-48 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-scale-up">
                <button onClick={exportToPDF} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/5 text-left"><FileText className="w-4 h-4 text-red-400" /> PDF</button>
                <div className="h-px bg-white/5"></div>
                <button onClick={exportToExcel} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/5 text-left"><TableIcon className="w-4 h-4 text-green-400" /> Excel</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CONFIG PANEL */}
      <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 p-6 rounded-2xl relative z-10 shadow-xl">
        <div className="flex items-center gap-2 mb-4 text-indigo-400">
           <GraduationCap className="w-5 h-5" />
           <span className="text-sm font-bold uppercase tracking-wider">Promotion Settings</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400 font-semibold ml-1 uppercase">Current Year</label>
            <input placeholder="e.g. 2025-2026" className="w-full bg-black/20 border border-white/5 rounded-xl py-2.5 px-4 text-sm text-white focus:bg-black/40 focus:border-indigo-500/50 outline-none transition-all placeholder:text-zinc-600 font-medium" value={fromYear} onChange={(e) => setFromYear(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400 font-semibold ml-1 uppercase">Current Class</label>
            <input placeholder="e.g. 9" className="w-full bg-black/20 border border-white/5 rounded-xl py-2.5 px-4 text-sm text-white focus:bg-black/40 focus:border-indigo-500/50 outline-none transition-all placeholder:text-zinc-600 font-medium" value={fromClass} onChange={(e) => setFromClass(e.target.value)} />
          </div>
          <div className="flex items-center justify-center pt-6 text-zinc-500"><ArrowRight className="w-5 h-5" /></div>
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400 font-semibold ml-1 uppercase">Target Year</label>
            <input placeholder="e.g. 2026-2027" className="w-full bg-black/20 border border-white/5 rounded-xl py-2.5 px-4 text-sm text-white focus:bg-black/40 focus:border-emerald-500/50 outline-none transition-all placeholder:text-zinc-600 font-medium" value={toYear} onChange={(e) => setToYear(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400 font-semibold ml-1 uppercase">Target Class</label>
            <input placeholder="e.g. 10" className="w-full bg-black/20 border border-white/5 rounded-xl py-2.5 px-4 text-sm text-white focus:bg-black/40 focus:border-emerald-500/50 outline-none transition-all placeholder:text-zinc-600 font-medium" value={toClass} onChange={(e) => setToClass(e.target.value)} />
          </div>

          <div className="lg:col-span-5 md:col-span-2 pt-4 border-t border-white/5 mt-2 flex flex-col md:flex-row gap-4 items-end justify-between">
             <div className="w-full md:w-auto space-y-1.5 relative" ref={datePickerRef}>
               <label className="text-xs text-zinc-400 font-semibold ml-1 uppercase">Effective Date</label>
               <button onClick={() => setShowDatePicker(!showDatePicker)} className="w-full md:w-64 flex items-center justify-between bg-black/20 border border-white/5 hover:bg-white/5 text-white rounded-xl px-4 py-2.5 text-sm transition-all outline-none focus:border-indigo-500/50 font-medium">
                 <div className="flex items-center gap-3"><Calendar className="w-4 h-4 text-zinc-500" /><span>{promotionDate || 'Select Date'}</span></div><ChevronDown className="w-4 h-4 text-zinc-600" />
               </button>
               {showDatePicker && (
                 <div className="absolute top-full left-0 mt-2 w-72 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl z-[100] p-4 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
                   <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
                     <button type="button" onClick={() => changeMonth(-1)} className="p-1 hover:bg-white/10 rounded text-zinc-400 hover:text-white"><ChevronLeft className="w-4 h-4" /></button>
                     <span className="font-bold text-white text-sm">{pickerDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                     <button type="button" onClick={() => changeMonth(1)} className="p-1 hover:bg-white/10 rounded text-zinc-400 hover:text-white"><ChevronRight className="w-4 h-4" /></button>
                   </div>
                   <div className="grid grid-cols-7 gap-1 text-center mb-2">{['S','M','T','W','T','F','S'].map(d => <span key={d} className="text-[10px] text-zinc-500 font-bold">{d}</span>)}</div>
                   <div className="grid grid-cols-7 gap-1">{Array.from({ length: startDay }).map((_, i) => <div key={`e-${i}`} />)}{Array.from({ length: daysInMonth }).map((_, i) => <button key={i} type="button" onClick={() => handleDateSelect(i + 1)} className="p-1.5 text-xs rounded hover:bg-indigo-600 hover:text-white text-zinc-300">{i + 1}</button>)}</div>
                 </div>
               )}
             </div>
             
             <div className="relative w-full md:w-64 group space-y-1.5">
               <label className="text-xs text-zinc-400 font-semibold ml-1 uppercase">Search Student</label>
               <div className="relative">
                 <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500 group-focus-within:text-white transition-colors" />
                 <input placeholder="Name or ID..." className="w-full bg-black/20 border border-white/5 rounded-xl py-2.5 pl-9 pr-4 text-sm text-white focus:bg-black/40 focus:border-indigo-500/50 outline-none font-medium placeholder:text-zinc-600" value={globalSearch} onChange={(e) => setGlobalSearch(e.target.value)} />
               </div>
             </div>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-xl min-h-[400px]">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center text-zinc-500 space-y-4"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /><p className="text-sm font-medium">Fetching students...</p></div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-20 text-center flex flex-col items-center text-zinc-500"><div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4"><Users className="w-8 h-8 opacity-50" /></div><p className="text-lg font-medium text-white">No students found</p><p className="text-sm mt-1">Check settings or search query.</p></div>
        ) : (
          <>
            <div className="p-4 border-b border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/5">
               <div className="text-sm text-zinc-400 font-medium">Selected: <span className="text-white font-bold">{selected.length}</span> students</div>
               <div className="flex gap-2 w-full sm:w-auto">
                 <button onClick={() => promoteStudents(true)} disabled={actionLoading || selected.length === 0} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg">
                   {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />} Hold / Repeat
                 </button>
                 <button onClick={() => promoteStudents(false)} disabled={actionLoading || selected.length === 0} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                   {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUpRight className="w-4 h-4" />} Promote Selection
                 </button>
               </div>
            </div>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-zinc-500 uppercase bg-black/20 border-b border-white/5">
                  <tr>
                    <th className="p-4 w-10"><input type="checkbox" className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-indigo-600 cursor-pointer" onChange={toggleSelectAll} checked={selected.length === filteredStudents.length && filteredStudents.length > 0} /></th>
                    <th className="px-6 py-4 font-bold text-zinc-400">Adm. No</th><th className="px-6 py-4 font-bold text-zinc-400">Student Name</th><th className="px-6 py-4 font-bold text-zinc-400">Current Class</th><th className="px-6 py-4 font-bold text-zinc-400">Section</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredStudents.map((s) => (
                    <tr key={s.id} className={`group transition-colors cursor-pointer ${selected.includes(s.id) ? 'bg-indigo-900/20 hover:bg-indigo-900/30' : 'hover:bg-white/5'}`} onClick={() => toggleSelect(s.id)}>
                      <td className="p-4"><input type="checkbox" checked={selected.includes(s.id)} onChange={() => toggleSelect(s.id)} onClick={(e) => e.stopPropagation()} className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-indigo-600 cursor-pointer" /></td>
                      <td className="px-6 py-4 text-zinc-400 font-mono text-xs font-medium">{s.admission_number}</td><td className="px-6 py-4 font-semibold text-white">{s.full_name}</td><td className="px-6 py-4 text-zinc-300"><span className="bg-white/5 px-2 py-1 rounded border border-white/5 font-medium">{s.class}</span></td><td className="px-6 py-4 text-zinc-400 font-medium">{s.section ?? '-'}</td>
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