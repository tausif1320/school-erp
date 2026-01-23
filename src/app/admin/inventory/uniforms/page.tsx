'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type UniformItem = {
  id: string;
  name: string;
  category: string;
  gender: string;
  price: number;
};

export default function UniformItemsPage() {
  const [items, setItems] = useState<UniformItem[]>([]);
  const [form, setForm] = useState({
    name: '',
    category: '',
    gender: '',
    price: '',
  });

  async function loadItems() {
    const { data } = await supabase.from('uniform_items').select('*');
    setItems(data ?? []);
  }

  useEffect(() => {
    loadItems();
  }, []);

  async function addItem() {
    if (!form.name || !form.price) return;

    await supabase.from('uniform_items').insert({
      name: form.name,
      category: form.category,
      gender: form.gender,
      price: Number(form.price),
    });

    setForm({ name: '', category: '', gender: '', price: '' });
    loadItems();
  }

  return (
    <div>
      <h1 className="text-2xl mb-4">Uniform Items</h1>

      <div className="flex gap-2 mb-4">
        <input placeholder="Name" className="input"
          value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})}/>
        <input placeholder="Category" className="input"
          value={form.category} onChange={(e)=>setForm({...form,category:e.target.value})}/>
        <input placeholder="Gender" className="input"
          value={form.gender} onChange={(e)=>setForm({...form,gender:e.target.value})}/>
        <input placeholder="Price" type="number" className="input"
          value={form.price} onChange={(e)=>setForm({...form,price:e.target.value})}/>
        <button onClick={addItem} className="btn-green">Add</button>
      </div>

      <table className="w-full text-sm bg-zinc-900 rounded-xl">
        <thead className="bg-zinc-800">
          <tr>
            <th className="p-3">Name</th>
            <th>Category</th>
            <th>Gender</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          {items.map(i=>(
            <tr key={i.id} className="border-t border-zinc-800">
              <td className="p-3">{i.name}</td>
              <td>{i.category}</td>
              <td>{i.gender}</td>
              <td>₹{i.price}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
