'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  BookOpen, Plus, Box, Package, Loader2, X 
} from 'lucide-react';
import toast from 'react-hot-toast';

/* =========================
   TYPES
========================= */
type NotebookItem = {
  id: string;
  name: string;
};

type NotebookStock = {
  id: string;
  item_id: string;
  quantity: number;
  item_name: string;
};

/* =========================
   COMPONENT
========================= */
export default function NotebookStockPage() {
  /* ---------- STATE ---------- */
  const [items, setItems] = useState<NotebookItem[]>([]);
  const [stock, setStock] = useState<NotebookStock[]>([]);
  const [form, setForm] = useState({ item_id: '', quantity: '' });
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  
  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);

  /* ---------- LOGIC: LOAD DATA ---------- */
  async function loadItems() {
    const { data } = await supabase.from('notebook_items').select('id, name').order('name');
    setItems(data ?? []);
  }

  async function loadStock() {
    setLoading(true);
    const { data: stockData } = await supabase.from('notebook_stock').select('id, item_id, quantity');
    const { data: items } = await supabase.from('notebook_items').select('id, name');

    const itemMap = new Map((items ?? []).map(i => [i.id, i.name]));

    const merged = (stockData ?? []).map(s => ({
      id: s.id,
      item_id: s.item_id,
      quantity: s.quantity,
      item_name: itemMap.get(s.item_id) ?? '-',
    }));

    setStock(merged);
    setLoading(false);
  }

  useEffect(() => { loadItems(); loadStock(); }, []);

  /* ---------- LOGIC: ADD STOCK ---------- */
  async function addStock() {
    const qty = Number(form.quantity);
    if (!form.item_id || qty <= 0) {
      toast.error('Please select an item and valid quantity');
      return;
    }

    setAdding(true);
    const existing = stock.find(s => s.item_id === form.item_id);

    if (existing) {
      await supabase.from('notebook_stock').update({ quantity: existing.quantity + qty }).eq('id', existing.id);
    } else {
      await supabase.from('notebook_stock').insert({ item_id: form.item_id, quantity: qty });
    }

    toast.success('Stock updated successfully');
    setForm({ item_id: '', quantity: '' });
    await loadStock();
    setAdding(false);
    setShowAddModal(false);
  }

  /* =========================
     UI RENDER
  ========================= */
  return (
    <div className="space-y-8 animate-fade-in-up pb-24 md:pb-10">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Notebook Stock</h1>
          <p className="text-zinc-400 text-sm mt-1">Manage inventory levels and restocking</p>
        </div>

        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold shadow-xl shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <div className="bg-white/20 p-1 rounded-lg">
            <Plus className="w-5 h-5" />
          </div>
          <span className="text-sm uppercase tracking-wide">Add New Stock</span>
        </button>
      </div>

      {/* --- STOCK TABLE --- */}
      <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden shadow-2xl min-h-[500px] flex flex-col">
        {/* Table Header Stats */}
        <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
           <h3 className="text-base font-bold text-white flex items-center gap-3">
             <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400"><Box className="w-5 h-5" /></div>
             Current Inventory
           </h3>
           <span className="text-sm bg-black/40 border border-white/10 px-4 py-1.5 rounded-lg text-zinc-300 font-mono font-medium">
             Total Items: {stock.length}
           </span>
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-20 space-y-4 text-zinc-500">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
            <p className="text-sm font-medium animate-pulse">Syncing stock levels...</p>
          </div>
        ) : stock.length === 0 ? (
          <div className="flex-1 p-20 text-center flex flex-col items-center justify-center text-zinc-500">
             <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6"><Box className="w-10 h-10 opacity-30" /></div>
             <p className="text-white text-lg font-medium">Inventory is empty</p>
             <p className="text-sm mt-2 max-w-xs mx-auto">Click the "Add New Stock" button above to start filling your inventory.</p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar flex-1">
            <table className="w-full text-left">
              <thead className="text-xs text-zinc-400 uppercase bg-black/20 border-b border-white/5">
                <tr>
                  <th className="px-8 py-5 font-bold tracking-wider">Notebook Name</th>
                  <th className="px-8 py-5 font-bold tracking-wider text-right">Available Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {stock.map((s) => (
                  <tr key={s.id} className="group hover:bg-white/5 transition-colors duration-200">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 group-hover:border-indigo-500/50 transition-colors shadow-lg">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <span className="text-white font-semibold text-base">{s.item_name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <span className={`inline-flex items-center px-4 py-1.5 rounded-lg text-sm font-bold border shadow-sm font-mono ${
                        s.quantity > 10 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : s.quantity > 0 
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        {s.quantity} units
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- ADD STOCK MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-zinc-900 border border-white/10 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-scale-up">
            
            {/* Modal Header */}
            <div className="bg-white/5 p-6 border-b border-white/5 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400"><Package className="w-5 h-5" /></div>
                <div>
                  <h2 className="text-lg font-bold text-white">Add Stock</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">Update inventory count</p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-500 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              
              {/* Item Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase ml-1">Select Notebook</label>
                <div className="relative group">
                  <BookOpen className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500 group-focus-within:text-white transition-colors" />
                  <select 
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white text-sm focus:border-emerald-500 outline-none appearance-none cursor-pointer font-medium"
                    value={form.item_id}
                    onChange={e => setForm({ ...form, item_id: e.target.value })}
                  >
                    <option value="" className="bg-zinc-900 text-zinc-500">Choose Item...</option>
                    {items.map(i => <option key={i.id} value={i.id} className="bg-zinc-900">{i.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Quantity Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase ml-1">Quantity to Add</label>
                <div className="relative group">
                  <Box className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500 group-focus-within:text-white transition-colors" />
                  <input 
                    type="number"
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white text-sm focus:border-emerald-500 outline-none font-medium"
                    placeholder="e.g. 50"
                    value={form.quantity}
                    onChange={e => setForm({ ...form, quantity: e.target.value })}
                  />
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button 
                  onClick={addStock} 
                  disabled={adding}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl font-bold text-sm uppercase tracking-wide shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  {adding ? <Loader2 className="w-5 h-5 animate-spin" /> : <Package className="w-5 h-5 group-hover:scale-110 transition-transform" />} 
                  {adding ? 'Updating...' : 'Confirm Update'}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}