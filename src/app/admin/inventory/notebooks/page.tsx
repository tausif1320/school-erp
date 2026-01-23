'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type NotebookItem = {
  id: string;
  name: string;
  subject: string | null;
  price: number;
};

export default function NotebookItemsPage() {
  const [items, setItems] = useState<NotebookItem[]>([]);
  const [form, setForm] = useState({
    name: '',
    subject: '',
    price: '',
  });

  async function loadItems() {
    const { data } = await supabase
      .from('notebook_items')
      .select('*')
      .order('name');
    setItems(data ?? []);
  }

  useEffect(() => {
    loadItems();
  }, []);

  async function addItem() {
    if (!form.name || !form.price) {
      alert('Name and price required');
      return;
    }

    await supabase.from('notebook_items').insert({
      name: form.name,
      subject: form.subject || null,
      price: Number(form.price),
    });

    setForm({ name: '', subject: '', price: '' });
    loadItems();
  }

  return (
    <div>
      <h1 className="text-2xl mb-4">Notebook Items</h1>

      <div className="bg-zinc-900 p-4 rounded-xl mb-6 flex gap-3 flex-wrap">
        <input
          placeholder="Notebook name (e.g. Classmate 200 pages)"
          className="p-2 bg-zinc-800 rounded"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
        />
        <input
          placeholder="Subject (optional)"
          className="p-2 bg-zinc-800 rounded"
          value={form.subject}
          onChange={e => setForm({ ...form, subject: e.target.value })}
        />
        <input
          type="number"
          placeholder="Price"
          className="p-2 bg-zinc-800 rounded"
          value={form.price}
          onChange={e => setForm({ ...form, price: e.target.value })}
        />
        <button onClick={addItem} className="px-4 bg-green-600 rounded">
          Add
        </button>
      </div>

      <table className="w-full bg-zinc-900 rounded-xl text-sm">
        <thead className="bg-zinc-800">
          <tr>
            <th className="p-3">Name</th>
            <th>Subject</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          {items.map(i => (
            <tr key={i.id} className="border-t border-zinc-800">
              <td className="p-3">{i.name}</td>
              <td>{i.subject ?? '-'}</td>
              <td>₹{i.price}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
