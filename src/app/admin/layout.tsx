export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-zinc-900 p-6">
        <p className="mb-4 font-semibold">Admin</p>
        <nav className="space-y-2 text-sm">
          <a href="/admin/dashboard">Dashboard</a>
          <a href="/admin/students">Students</a>
          <a href="/admin/profile">Profile</a>
        </nav>
      </aside>

      <main className="flex-1 p-8 bg-zinc-950">
        {children}
      </main>
    </div>
  );
}
