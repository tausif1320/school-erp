'use client';

import Link from 'next/link';

export default function InventoryPage() {
  return (
    <div>
      <h1 className="text-2xl mb-6">Inventory</h1>

      <div className="grid grid-cols-3 gap-6">
        <InventoryCard
          title="Uniforms"
          desc="Manage uniform items, stock, and issues"
          href="/admin/inventory/uniforms"
        />
        <InventoryCard
          title="Notebooks"
          desc="Manage notebook items, stock, and issues"
          href="/admin/inventory/notebooks"
        />
        <InventoryCard
          title="Issue Records"
          desc="View issued items & payments"
          href="/admin/inventory/issues"
        />
      </div>
    </div>
  );
}

function InventoryCard({
  title,
  desc,
  href,
}: {
  title: string;
  desc: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <div className="bg-zinc-900 p-6 rounded-xl hover:bg-zinc-800 cursor-pointer">
        <h2 className="text-lg mb-2">{title}</h2>
        <p className="text-zinc-400 text-sm">{desc}</p>
      </div>
    </Link>
  );
}
