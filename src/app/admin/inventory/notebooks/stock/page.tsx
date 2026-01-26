'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  BookOpen, Plus, Box, Package, Loader2, X, IndianRupee, Tag, Layers 
} from 'lucide-react';
import toast from 'react-hot-toast';

/* =========================
   TYPES
========================= */
type NotebookItem = {
  id: string;
  name: string;
  subject: string;
  price: number;
  stock_id?: string; // ID from notebook_stock table
  quantity: number;
};

/* =========================
   COMPONENT
========================= */
export default function NotebookStockPage() {
  /* ---------- STATE ---------- */
  const [inventory, setInventory] = useState<NotebookItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);

  // Forms
  const [createForm, setCreateForm] = useState({ name: '', subject: '', price: '' });
  const [stockForm, setStockForm] = useState({ item_id: '', stock_id: '', current_qty: 0, add_qty: '' });
  const [submitting, setSubmitting] = useState(false);

  /* ---------- LOGIC: LOAD DATA ---------- */
  async function loadInventory() {
    setLoading(true);
    
    // 1. Get all Items
    const { data: items, error: itemError } = await supabase
      .from('notebook_items')
      .select('*')
      .order('name');

    if (itemError) {
      toast.error('Failed to load items');
      setLoading(false);
      return;
    }

    // 2. Get Stock Levels
    const { data: stocks } = await supabase
      .from('notebook_stock')
      .select('*');

    // 3. Merge Data
    const stockMap = new Map((stocks ?? []).map(s => [s.item_id, s]));

    const merged: NotebookItem[] = (items ?? []).map(item => {
      const stockEntry = stockMap.get(item.id);
      return {
        id: item.id,
        name: item.name,
        subject: item.subject,
        price: item.price,
        stock_id: stockEntry?.id,
        quantity: stockEntry?.quantity ?? 0
      };
    });

    setInventory(merged);
    setLoading(false);
  }

  useEffect(() => { loadInventory(); }, []);

  /* ---------- LOGIC: CREATE NEW ITEM ---------- */
  async function handleCreateItem() {
    if (!createForm.name || !createForm.price) {
      toast.error('Name and Price are required');
      return;
    }

    setSubmitting(true);

    // 1. Create Item
    const { data: newItem, error } = await supabase
      .from('notebook_items')
      .insert({
        name: createForm.name,
        subject: createForm.subject,
        price: Number(createForm.price)
      })
      .select()
      .single();

    if (error) {
      toast.error(error.message);
      setSubmitting(false);
      return;
    }

    // 2. Initialize Stock Entry (0 quantity)
    if (newItem) {
      await supabase.from('notebook_stock').insert({
        item_id: newItem.id,
        quantity: 0
      });
    }

    toast.success('New notebook added');
    setCreateForm({ name: '', subject: '', price: '' });
    setShowCreateModal(false);
    loadInventory();
    setSubmitting(false);
  }

  /* ---------- LOGIC: ADD STOCK QUANTITY ---------- */
  async function handleAddStock() {
    const qtyToAdd = Number(stockForm.add_qty);
    if (qtyToAdd <= 0) {
      toast.error('Enter valid quantity');
      return;
    }

    setSubmitting(true);

    if (stockForm.stock_id) {
      // Update existing stock row
      await supabase
        .from('notebook_stock')
        .update({ quantity: stockForm.current_qty + qtyToAdd })
        .eq('id', stockForm.stock_id);
    } else {
      // Create stock row if missing (safety fallback)
      await supabase
        .from('notebook_stock')
        .insert({ item_id: stockForm.item_id, quantity: qtyToAdd });
    }

    toast.success('Stock updated');
    setStockForm({ item_id: '', stock_id: '', current_qty: 0, add_qty: '' });
    setShowStockModal(false);
    loadInventory();
    setSubmitting(false);
  }

  /* =========================
     UI RENDER
  ========================= */
  return (
    <div className="space-y-8 animate-fade-in-up pb-24 md:pb-10">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Notebook Inventory</h1>
          <p className="text-zinc-400 text-sm mt-1">Manage items, pricing, and stock levels</p>
        </div>

        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold shadow-xl shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <div className="bg-white/20 p-1 rounded-lg">
            <Plus className="w-5 h-5" />
          </div>
          <span className="text-sm uppercase tracking-wide">Create New Notebook</span>
        </button>
      </div>

      {/* --- INVENTORY TABLE --- */}
      <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden shadow-2xl min-h-[500px] flex flex-col">
        <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
           <h3 className="text-base font-bold text-white flex items-center gap-3">
             <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400"><Layers className="w-5 h-5" /></div>
             All Notebooks
           </h3>
           <span className="text-sm bg-black/40 border border-white/10 px-4 py-1.5 rounded-lg text-zinc-300 font-mono font-medium">
             Total Types: {inventory.length}
           </span>
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-20 space-y-4 text-zinc-500">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
            <p className="text-sm font-medium animate-pulse">Fetching inventory...</p>
          </div>
        ) : inventory.length === 0 ? (
          <div className="flex-1 p-20 text-center flex flex-col items-center justify-center text-zinc-500">
             <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6"><Box className="w-10 h-10 opacity-30" /></div>
             <p className="text-white text-lg font-medium">No notebooks defined</p>
             <p className="text-sm mt-2 max-w-xs mx-auto">Click "Create New Notebook" to add your first item.</p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar flex-1">
            <table className="w-full text-left border-collapse">
              <thead className="text-xs text-zinc-400 uppercase bg-black/20 border-b border-white/5">
                <tr>
                  <th className="px-6 py-5 font-bold tracking-wider">Notebook Details</th>
                  <th className="px-6 py-5 font-bold tracking-wider">Subject</th>
                  <th className="px-6 py-5 font-bold tracking-wider">Price</th>
                  <th className="px-6 py-5 font-bold tracking-wider">Current Stock</th>
                  <th className="px-6 py-5 font-bold tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {inventory.map((item) => (
                  <tr key={item.id} className="group hover:bg-white/5 transition-colors duration-200">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 group-hover:border-indigo-500/50 transition-colors shadow-lg">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <span className="text-white font-bold text-sm">{item.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-zinc-400 text-sm">
                      {item.subject || <span className="opacity-50">-</span>}
                    </td>
                    <td className="px-6 py-5">
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-mono font-medium bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                        ₹{item.price}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold border font-mono ${
                        item.quantity > 10 
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                          : item.quantity > 0 
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        {item.quantity} units
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button 
                        onClick={() => {
                          setStockForm({ 
                            item_id: item.id, 
                            stock_id: item.stock_id || '', 
                            current_qty: item.quantity, 
                            add_qty: '' 
                          });
                          setShowStockModal(true);
                        }}
                        className="bg-emerald-600/10 hover:bg-emerald-600 hover:text-white text-emerald-500 border border-emerald-500/20 hover:border-emerald-500 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all shadow-lg shadow-transparent hover:shadow-emerald-500/20"
                      >
                        + Add Stock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- MODAL 1: CREATE NEW ITEM --- */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-zinc-900 border border-white/10 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-scale-up">
            <div className="bg-white/5 p-6 border-b border-white/5 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white flex items-center gap-2"><BookOpen className="w-5 h-5 text-indigo-400"/> New Notebook Type</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-zinc-500 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase ml-1">Notebook Name</label>
                <div className="relative"><Tag className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500" /><input className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white text-sm focus:border-indigo-500 outline-none" placeholder="e.g. Classmate Long" value={createForm.name} onChange={e => setCreateForm({...createForm, name: e.target.value})} /></div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase ml-1">Subject (Optional)</label>
                <div className="relative"><BookOpen className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500" /><input className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white text-sm focus:border-indigo-500 outline-none" placeholder="e.g. English" value={createForm.subject} onChange={e => setCreateForm({...createForm, subject: e.target.value})} /></div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase ml-1">Price per Unit</label>
                <div className="relative"><IndianRupee className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500" /><input type="number" className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white text-sm focus:border-indigo-500 outline-none" placeholder="0.00" value={createForm.price} onChange={e => setCreateForm({...createForm, price: e.target.value})} /></div>
              </div>
              <button onClick={handleCreateItem} disabled={submitting} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-xl font-bold shadow-lg mt-2 flex justify-center gap-2 items-center">{submitting ? <Loader2 className="w-5 h-5 animate-spin"/> : 'Create Notebook'}</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 2: ADD STOCK TO ITEM --- */}
      {showStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-zinc-900 border border-white/10 w-full max-w-xs rounded-3xl shadow-2xl overflow-hidden animate-scale-up">
            <div className="bg-white/5 p-5 border-b border-white/5 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white flex items-center gap-2"><Package className="w-5 h-5 text-emerald-400"/> Add Quantity</h2>
              <button onClick={() => setShowStockModal(false)} className="text-zinc-500 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="text-center">
                <p className="text-zinc-500 text-xs uppercase font-bold mb-1">Current Stock</p>
                <p className="text-3xl font-mono text-white font-bold">{stockForm.current_qty}</p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase ml-1">Quantity to Add</label>
                <div className="relative"><Box className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500" /><input type="number" autoFocus className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white text-sm focus:border-emerald-500 outline-none font-bold text-lg" placeholder="0" value={stockForm.add_qty} onChange={e => setStockForm({...stockForm, add_qty: e.target.value})} /></div>
              </div>
              <button onClick={handleAddStock} disabled={submitting} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl font-bold shadow-lg flex justify-center gap-2 items-center">{submitting ? <Loader2 className="w-5 h-5 animate-spin"/> : 'Update Stock'}</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}