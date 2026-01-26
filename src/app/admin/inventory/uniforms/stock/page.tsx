'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Shirt, Plus, Ruler, Box, Package, Loader2, X, IndianRupee, Tag, Layers, User 
} from 'lucide-react';
import toast from 'react-hot-toast';

/* =========================
   TYPES
========================= */
type UniformItem = {
  id: string;
  name: string;
  category: string;
  gender: string;
  price: number;
};

type UniformStock = {
  id: string;
  item_id: string;
  size: string | null;
  quantity: number;
  // Merged fields for UI
  item_name: string;
  category: string;
  gender: string;
  price: number;
};

/* =========================
   COMPONENT
========================= */
export default function UniformStockPage() {
  /* ---------- STATE ---------- */
  const [items, setItems] = useState<UniformItem[]>([]);
  const [stock, setStock] = useState<UniformStock[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  
  // Forms
  const [createForm, setCreateForm] = useState({ name: '', category: 'shirt', gender: 'male', price: '' });
  const [stockForm, setStockForm] = useState({ item_id: '', size: '', quantity: '' });
  const [submitting, setSubmitting] = useState(false);

  /* ---------- LOGIC: LOAD DATA ---------- */
  async function loadData() {
    setLoading(true);

    // 1. Fetch Items
    const { data: itemData, error: itemError } = await supabase
      .from('uniform_items')
      .select('*')
      .order('name');

    if (itemError) {
      toast.error('Failed to load items');
      setLoading(false);
      return;
    }
    setItems(itemData ?? []);

    // 2. Fetch Stock
    const { data: stockData, error: stockError } = await supabase
      .from('uniform_stock')
      .select('*')
      .order('item_id');

    if (stockError) {
      console.error(stockError);
    }

    // 3. Merge Data
    const itemMap = new Map(itemData?.map((i) => [i.id, i]));

    const merged: UniformStock[] = (stockData ?? []).map((s) => {
      const parent = itemMap.get(s.item_id);
      return {
        id: s.id,
        item_id: s.item_id,
        size: s.size,
        quantity: s.quantity,
        item_name: parent?.name ?? 'Unknown',
        category: parent?.category ?? '-',
        gender: parent?.gender ?? '-',
        price: parent?.price ?? 0,
      };
    });

    setStock(merged);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  /* ---------- LOGIC: CREATE NEW ITEM ---------- */
  async function handleCreateItem() {
    if (!createForm.name || !createForm.price) {
      toast.error('Name and Price are required');
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from('uniform_items').insert({
      name: createForm.name,
      category: createForm.category,
      gender: createForm.gender,
      price: Number(createForm.price),
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('New uniform type created');
      setCreateForm({ name: '', category: 'shirt', gender: 'male', price: '' });
      setShowCreateModal(false);
      loadData();
    }
    setSubmitting(false);
  }

  /* ---------- LOGIC: ADD/UPDATE STOCK ---------- */
  async function handleSaveStock() {
    if (!stockForm.item_id || !stockForm.quantity) {
      toast.error('Select item and quantity');
      return;
    }

    const qty = Number(stockForm.quantity);
    if (qty <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }

    setSubmitting(true);

    // Check if this specific size exists for this item
    const { data: existing } = await supabase
      .from('uniform_stock')
      .select('id, quantity')
      .eq('item_id', stockForm.item_id)
      .eq('size', stockForm.size || null) // Handle null/empty size
      .maybeSingle(); // Use maybeSingle to avoid error if 0 rows

    if (existing) {
      // Update existing row
      await supabase
        .from('uniform_stock')
        .update({ quantity: existing.quantity + qty })
        .eq('id', existing.id);
    } else {
      // Insert new stock row (New Size)
      await supabase.from('uniform_stock').insert({
        item_id: stockForm.item_id,
        size: stockForm.size || null,
        quantity: qty,
      });
    }

    toast.success('Stock updated successfully');
    setStockForm({ item_id: '', size: '', quantity: '' });
    setShowStockModal(false);
    loadData();
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
          <h1 className="text-3xl font-bold text-white tracking-tight">Uniform Inventory</h1>
          <p className="text-zinc-400 text-sm mt-1">Manage sizes, stock levels, and pricing</p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          {/* Create Item Button */}
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all"
          >
            <Plus className="w-5 h-5" />
            <span className="text-sm">New Type</span>
          </button>

          {/* Add Stock Button */}
          <button 
            onClick={() => setShowStockModal(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Box className="w-5 h-5" />
            <span className="text-sm">Add Stock</span>
          </button>
        </div>
      </div>

      {/* --- STOCK TABLE --- */}
      <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden shadow-2xl min-h-[500px] flex flex-col">
        <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
           <h3 className="text-base font-bold text-white flex items-center gap-3">
             <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400"><Layers className="w-5 h-5" /></div>
             Current Stock
           </h3>
           <span className="text-sm bg-black/40 border border-white/10 px-4 py-1.5 rounded-lg text-zinc-300 font-mono font-medium">
             Total Entries: {stock.length}
           </span>
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-20 space-y-4 text-zinc-500">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
            <p className="text-sm font-medium animate-pulse">Fetching inventory...</p>
          </div>
        ) : stock.length === 0 ? (
          <div className="flex-1 p-20 text-center flex flex-col items-center justify-center text-zinc-500">
             <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6"><Shirt className="w-10 h-10 opacity-30" /></div>
             <p className="text-white text-lg font-medium">Inventory is empty</p>
             <p className="text-sm mt-2 max-w-xs mx-auto">Use the buttons above to define new items or add stock.</p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar flex-1">
            <table className="w-full text-left border-collapse">
              <thead className="text-xs text-zinc-400 uppercase bg-black/20 border-b border-white/5">
                <tr>
                  <th className="px-6 py-5 font-bold tracking-wider">Uniform Details</th>
                  <th className="px-6 py-5 font-bold tracking-wider">Category</th>
                  <th className="px-6 py-5 font-bold tracking-wider">Size</th>
                  <th className="px-6 py-5 font-bold tracking-wider">Price</th>
                  <th className="px-6 py-5 font-bold tracking-wider">Quantity</th>
                  <th className="px-6 py-5 font-bold tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {stock.map((s) => (
                  <tr key={s.id} className="group hover:bg-white/5 transition-colors duration-200">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 group-hover:border-indigo-500/50 transition-colors shadow-lg">
                          <Shirt className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-white font-bold text-sm">{s.item_name}</p>
                          <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${s.gender === 'male' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : s.gender === 'female' ? 'bg-pink-500/10 text-pink-400 border-pink-500/20' : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'}`}>
                            {s.gender}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-zinc-400 text-sm capitalize">
                      {s.category}
                    </td>
                    <td className="px-6 py-5">
                      <span className="inline-flex items-center gap-1 text-white font-mono font-bold bg-white/5 px-3 py-1 rounded border border-white/10">
                        {s.size || <span className="text-zinc-600 text-xs italic">N/A</span>}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-mono font-medium">
                        ₹{s.price}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold border font-mono ${
                        s.quantity > 10 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : s.quantity > 0 
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        {s.quantity} units
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button 
                        onClick={() => {
                          setStockForm({ item_id: s.item_id, size: s.size || '', quantity: '' });
                          setShowStockModal(true);
                        }}
                        className="bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                      >
                        + Add
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- MODAL 1: CREATE NEW UNIFORM TYPE --- */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-zinc-900 border border-white/10 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-scale-up">
            <div className="bg-white/5 p-6 border-b border-white/5 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white flex items-center gap-2"><Shirt className="w-5 h-5 text-indigo-400"/> New Uniform Type</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-zinc-500 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-5">
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase ml-1">Item Name</label>
                <div className="relative"><Tag className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500" /><input className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white text-sm focus:border-indigo-500 outline-none" placeholder="e.g. Boys Shirt" value={createForm.name} onChange={e => setCreateForm({...createForm, name: e.target.value})} /></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase ml-1">Category</label>
                  <select className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 px-4 text-white text-sm focus:border-indigo-500 outline-none appearance-none" value={createForm.category} onChange={e => setCreateForm({...createForm, category: e.target.value})}>
                    <option value="shirt">Shirt</option><option value="pants">Pants</option><option value="skirt">Skirt</option><option value="belt">Belt</option><option value="shoes">Shoes</option><option value="socks">Socks</option><option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase ml-1">Gender</label>
                  <select className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 px-4 text-white text-sm focus:border-indigo-500 outline-none appearance-none" value={createForm.gender} onChange={e => setCreateForm({...createForm, gender: e.target.value})}>
                    <option value="male">Male</option><option value="female">Female</option><option value="unisex">Unisex</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase ml-1">Price per Unit</label>
                <div className="relative"><IndianRupee className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500" /><input type="number" className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white text-sm focus:border-indigo-500 outline-none" placeholder="0.00" value={createForm.price} onChange={e => setCreateForm({...createForm, price: e.target.value})} /></div>
              </div>

              <button onClick={handleCreateItem} disabled={submitting} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-xl font-bold shadow-lg mt-2 flex justify-center gap-2 items-center">
                {submitting ? <Loader2 className="w-5 h-5 animate-spin"/> : 'Create Item'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 2: ADD STOCK --- */}
      {showStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-zinc-900 border border-white/10 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-scale-up">
            <div className="bg-white/5 p-6 border-b border-white/5 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white flex items-center gap-2"><Package className="w-5 h-5 text-emerald-400"/> Add Stock</h2>
              <button onClick={() => setShowStockModal(false)} className="text-zinc-500 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-5">
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase ml-1">Select Item</label>
                <div className="relative group">
                  <Shirt className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500 group-focus-within:text-white transition-colors" />
                  <select className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white text-sm focus:border-emerald-500 outline-none appearance-none cursor-pointer" value={stockForm.item_id} onChange={e => setStockForm({ ...stockForm, item_id: e.target.value })}>
                    <option value="" className="bg-zinc-900 text-zinc-500">Choose Item...</option>
                    {items.map(i => <option key={i.id} value={i.id} className="bg-zinc-900">{i.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase ml-1">Size</label>
                  <div className="relative"><Ruler className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500" /><input className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white text-sm focus:border-emerald-500 outline-none" placeholder="Size" value={stockForm.size} onChange={e => setStockForm({...stockForm, size: e.target.value})} /></div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase ml-1">Quantity</label>
                  <div className="relative"><Box className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500" /><input type="number" className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white text-sm focus:border-emerald-500 outline-none" placeholder="0" value={stockForm.quantity} onChange={e => setStockForm({...stockForm, quantity: e.target.value})} /></div>
                </div>
              </div>

              <button onClick={handleSaveStock} disabled={submitting} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl font-bold shadow-lg flex justify-center gap-2 items-center">
                {submitting ? <Loader2 className="w-5 h-5 animate-spin"/> : 'Update Inventory'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}