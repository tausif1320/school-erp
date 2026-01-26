'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  BookOpen, Plus, Box, Package, ArrowRight, Loader2, Search 
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

  /* ---------- LOGIC: LOAD DATA ---------- */
  async function loadItems() {
    const { data } = await supabase
      .from('notebook_items')
      .select('id, name')
      .order('name');
    setItems(data ?? []);
  }

  async function loadStock() {
    setLoading(true);
    const { data: stockData } = await supabase
      .from('notebook_stock')
      .select('id, item_id, quantity');

    const { data: items } = await supabase
      .from('notebook_items')
      .select('id, name');

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

  useEffect(() => {
    loadItems();
    loadStock();
  }, []);

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
      await supabase
        .from('notebook_stock')
        .update({ quantity: existing.quantity + qty })
        .eq('id', existing.id);
    } else {
      await supabase.from('notebook_stock').insert({
        item_id: form.item_id,
        quantity: qty,
      });
    }

    toast.success('Stock updated successfully');
    setForm({ item_id: '', quantity: '' });
    await loadStock();
    setAdding(false);
  }

  /* =========================
     UI RENDER
  ========================= */
  return (
    <div className="space-y-6 animate-fade-in-up pb-24 md:pb-10">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Notebook Stock</h1>
          <p className="text-zinc-500 text-sm mt-1">Manage inventory levels and restocking</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* --- LEFT: ADD STOCK FORM --- */}
        <div className="space-y-6">
          <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 p-5 rounded-2xl shadow-xl sticky top-24">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-white/5 text-emerald-400">
              <Plus className="w-5 h-5" />
              <h2 className="text-sm font-bold uppercase tracking-wider">Add New Stock</h2>
            </div>
            
            <div className="space-y-4">
              {/* Item Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase">Notebook Type</label>
                <div className="relative group">
                  <BookOpen className="absolute left-3 top-3 w-4 h-4 text-zinc-500 group-focus-within:text-white transition-colors" />
                  <select 
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-3 text-white text-sm focus:border-emerald-500 outline-none appearance-none cursor-pointer"
                    value={form.item_id}
                    onChange={e => setForm({ ...form, item_id: e.target.value })}
                  >
                    <option value="" className="bg-zinc-900 text-zinc-500">Select Notebook</option>
                    {items.map(i => <option key={i.id} value={i.id} className="bg-zinc-900">{i.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Quantity Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase">Quantity to Add</label>
                <div className="relative group">
                  <Box className="absolute left-3 top-3 w-4 h-4 text-zinc-500 group-focus-within:text-white transition-colors" />
                  <input 
                    type="number"
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-3 text-white text-sm focus:border-emerald-500 outline-none"
                    placeholder="e.g. 50"
                    value={form.quantity}
                    onChange={e => setForm({ ...form, quantity: e.target.value })}
                  />
                </div>
              </div>

              <button 
                onClick={addStock} 
                disabled={adding}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />} 
                Update Inventory
              </button>
            </div>
          </div>
        </div>

        {/* --- RIGHT: INVENTORY LIST --- */}
        <div className="lg:col-span-2 space-y-4">
          
          <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-xl min-h-[400px] flex flex-col">
            <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
               <h3 className="text-sm font-bold text-white flex items-center gap-2">
                 <Box className="w-4 h-4 text-indigo-400" /> Current Inventory
               </h3>
               <span className="text-xs bg-black/40 px-2 py-1 rounded text-zinc-400 font-mono">
                 {stock.length} Items
               </span>
            </div>

            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center p-20 space-y-4 text-zinc-500">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                <p className="text-sm">Syncing stock levels...</p>
              </div>
            ) : stock.length === 0 ? (
              <div className="flex-1 p-20 text-center flex flex-col items-center justify-center text-zinc-500">
                 <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4"><Box className="w-8 h-8 opacity-50" /></div>
                 <p className="text-white font-medium">Inventory is empty</p>
                 <p className="text-xs mt-1">Add items using the form on the left.</p>
              </div>
            ) : (
              <div className="overflow-x-auto custom-scrollbar flex-1">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-zinc-500 uppercase bg-black/20 border-b border-white/5">
                    <tr>
                      <th className="px-6 py-4 font-bold">Notebook Name</th>
                      <th className="px-6 py-4 font-bold text-right">Available Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {stock.map((s) => (
                      <tr key={s.id} className="group hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 group-hover:border-indigo-500/50 transition-colors">
                            <BookOpen className="w-4 h-4" />
                          </div>
                          {s.item_name}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`px-3 py-1 rounded-lg text-xs font-bold border font-mono ${
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
        </div>

      </div>
    </div>
  );
}