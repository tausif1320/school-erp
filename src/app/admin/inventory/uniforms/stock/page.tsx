'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

/* =========================
   TYPES
========================= */

type UniformItem = {
  id: string;
  name: string;
};

type UniformStock = {
  id: string;
  item_id: string;
  size: string | null;
  quantity: number;
  item_name: string;
};

/* =========================
   COMPONENT
========================= */

export default function UniformStockPage() {
  const [items, setItems] = useState<UniformItem[]>([]);
  const [stock, setStock] = useState<UniformStock[]>([]);

  const [form, setForm] = useState({
    item_id: '',
    size: '',
    quantity: '',
  });

  /* =========================
     LOAD ITEMS
  ========================= */

  async function loadItems() {
    const { data, error } = await supabase
      .from('uniform_items')
      .select('id, name')
      .order('name');

    if (error) {
      console.error(error);
      setItems([]);
      return;
    }

    setItems(data ?? []);
  }

  /* =========================
     LOAD STOCK (NO JOINS)
  ========================= */

  async function loadStock() {
    // 1️⃣ Load stock
    const { data: stockData, error: stockError } = await supabase
      .from('uniform_stock')
      .select('id, item_id, size, quantity')
      .order('item_id');

    if (stockError || !stockData) {
      console.error(stockError);
      setStock([]);
      return;
    }

    // 2️⃣ Load items separately
    const { data: itemData, error: itemError } = await supabase
      .from('uniform_items')
      .select('id, name');

    if (itemError || !itemData) {
      console.error(itemError);
      setStock([]);
      return;
    }

    // 3️⃣ Build map
    const itemMap = new Map<string, string>();
    itemData.forEach((i) => itemMap.set(i.id, i.name));

    // 4️⃣ Merge
    const merged: UniformStock[] = stockData.map((s) => ({
      id: s.id,
      item_id: s.item_id,
      size: s.size,
      quantity: s.quantity,
      item_name: itemMap.get(s.item_id) ?? '-',
    }));

    setStock(merged);
  }

  useEffect(() => {
    loadItems();
    loadStock();
  }, []);

  /* =========================
     ADD / UPDATE STOCK
  ========================= */

  async function saveStock() {
    if (!form.item_id || !form.quantity) {
      alert('Select item and quantity');
      return;
    }

    const qty = Number(form.quantity);

    if (qty <= 0) {
      alert('Quantity must be greater than 0');
      return;
    }

    // Check existing stock
    const { data: existing } = await supabase
      .from('uniform_stock')
      .select('id, quantity')
      .eq('item_id', form.item_id)
      .eq('size', form.size || null)
      .single();

    if (existing) {
      // update quantity
      await supabase
        .from('uniform_stock')
        .update({ quantity: existing.quantity + qty })
        .eq('id', existing.id);
    } else {
      // insert new stock
      await supabase.from('uniform_stock').insert({
        item_id: form.item_id,
        size: form.size || null,
        quantity: qty,
      });
    }

    setForm({ item_id: '', size: '', quantity: '' });
    loadStock();
  }

  /* =========================
     UI
  ========================= */

  return (
    <div>
      <h1 className="text-2xl mb-4">Uniform Stock</h1>

      {/* ADD STOCK */}
      <div className="bg-zinc-900 p-4 rounded-xl mb-6 flex flex-wrap gap-3">
        <select
          className="p-2 bg-zinc-800 rounded"
          value={form.item_id}
          onChange={(e) => setForm({ ...form, item_id: e.target.value })}
        >
          <option value="">Select Item</option>
          {items.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name}
            </option>
          ))}
        </select>

        <input
          placeholder="Size (S / M / L / XL)"
          className="p-2 bg-zinc-800 rounded"
          value={form.size}
          onChange={(e) => setForm({ ...form, size: e.target.value })}
        />

        <input
          type="number"
          placeholder="Quantity to add"
          className="p-2 bg-zinc-800 rounded"
          value={form.quantity}
          onChange={(e) => setForm({ ...form, quantity: e.target.value })}
        />

        <button
          onClick={saveStock}
          className="px-4 py-2 bg-green-600 rounded"
        >
          Add Stock
        </button>
      </div>

      {/* STOCK TABLE */}
      <table className="w-full text-sm bg-zinc-900 rounded-xl">
        <thead className="bg-zinc-800">
          <tr>
            <th className="p-3 text-left">Item</th>
            <th className="text-left">Size</th>
            <th className="text-left">Quantity</th>
          </tr>
        </thead>
        <tbody>
          {stock.map((s) => (
            <tr key={s.id} className="border-t border-zinc-800">
              <td className="p-3">{s.item_name}</td>
              <td>{s.size ?? '-'}</td>
              <td>{s.quantity}</td>
            </tr>
          ))}

          {stock.length === 0 && (
            <tr>
              <td colSpan={3} className="p-6 text-center text-zinc-400">
                No stock available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
