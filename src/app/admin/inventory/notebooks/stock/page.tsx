'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

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

export default function NotebookStockPage() {
  const [items, setItems] = useState<NotebookItem[]>([]);
  const [stock, setStock] = useState<NotebookStock[]>([]);
  const [form, setForm] = useState({ item_id: '', quantity: '' });

  async function loadItems() {
    const { data } = await supabase
      .from('notebook_items')
      .select('id, name')
      .order('name');
    setItems(data ?? []);
  }

  async function loadStock() {
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
  }

  useEffect(() => {
    loadItems();
    loadStock();
  }, []);

  async function addStock() {
    const qty = Number(form.quantity);
    if (!form.item_id || qty <= 0) {
      alert('Invalid input');
      return;
    }

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

    setForm({ item_id: '', quantity: '' });
    loadStock();
  }

  return (
    <div>
      <h1 className="text-2xl mb-4">Notebook Stock</h1>

      <div className="bg-zinc-900 p-4 rounded-xl mb-6 flex gap-3">
        <select
          className="p-2 bg-zinc-800 rounded"
          value={form.item_id}
          onChange={e => setForm({ ...form, item_id: e.target.value })}
        >
          <option value="">Select Notebook</option>
          {items.map(i => (
            <option key={i.id} value={i.id}>{i.name}</option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Quantity"
          className="p-2 bg-zinc-800 rounded"
          value={form.quantity}
          onChange={e => setForm({ ...form, quantity: e.target.value })}
        />

        <button onClick={addStock} className="px-4 bg-green-600 rounded">
          Add Stock
        </button>
      </div>

      <table className="w-full bg-zinc-900 rounded-xl text-sm">
        <thead className="bg-zinc-800">
          <tr>
            <th className="p-3">Notebook</th>
            <th>Quantity</th>
          </tr>
        </thead>
        <tbody>
          {stock.map(s => (
            <tr key={s.id} className="border-t border-zinc-800">
              <td className="p-3">{s.item_name}</td>
              <td>{s.quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
