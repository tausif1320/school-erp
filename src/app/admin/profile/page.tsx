'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  User, Mail, Shield, Clock, LogOut, Key, Calendar, Fingerprint 
} from 'lucide-react';
import toast from 'react-hot-toast';

/* =========================
   COMPONENT
========================= */
export default function AdminProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sendingReset, setSendingReset] = useState(false);

  /* --- LOAD AUTH DATA --- */
  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
        return;
      }
      setUser(user);
      setLoading(false);
    }
    loadProfile();
  }, []);

  /* --- ACTION: LOGOUT --- */
  async function handleLogout() {
    await supabase.auth.signOut();
    toast.success('Logged out successfully');
    router.push('/');
  }

  /* --- ACTION: RESET PASSWORD --- */
  async function handlePasswordReset() {
    if (!user?.email) return;
    setSendingReset(true);
    
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });

    if (error) {
      toast.error('Failed to send reset email');
    } else {
      toast.success('Password reset email sent!');
    }
    setSendingReset(false);
  }

  /* =========================
     UI RENDER
  ========================= */
  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
      <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
      <p className="text-zinc-500 text-sm animate-pulse">Loading Profile...</p>
    </div>
  );

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up pb-20 md:pb-10">
      
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">My Profile</h1>
        <p className="text-zinc-500 text-sm mt-1">Manage your account settings and security</p>
      </div>

      {/* --- MAIN CARD --- */}
      <div className="relative bg-zinc-900/60 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden p-8">
        
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start gap-8">
          
          {/* Avatar Section */}
          <div className="flex flex-col items-center space-y-4">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 p-[2px] shadow-2xl">
              <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center">
                <span className="text-4xl font-bold text-white uppercase">
                  {user.email?.[0]}
                </span>
              </div>
            </div>
            <div className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-3 h-3" /> Administrator
            </div>
          </div>

          {/* Details Grid */}
          <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="space-y-1.5 p-4 rounded-2xl bg-black/20 border border-white/5 hover:border-white/10 transition-colors group">
              <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold uppercase tracking-wider">
                <Mail className="w-3.5 h-3.5 group-hover:text-indigo-400 transition-colors" /> Email Address
              </div>
              <p className="text-white font-medium truncate">{user.email}</p>
            </div>

            <div className="space-y-1.5 p-4 rounded-2xl bg-black/20 border border-white/5 hover:border-white/10 transition-colors group">
              <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold uppercase tracking-wider">
                <Fingerprint className="w-3.5 h-3.5 group-hover:text-indigo-400 transition-colors" /> User ID
              </div>
              <p className="text-zinc-400 font-mono text-sm truncate">{user.id}</p>
            </div>

            <div className="space-y-1.5 p-4 rounded-2xl bg-black/20 border border-white/5 hover:border-white/10 transition-colors group">
              <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5 group-hover:text-emerald-400 transition-colors" /> Last Sign In
              </div>
              <p className="text-white text-sm">
                {new Date(user.last_sign_in_at).toLocaleString('en-IN', { 
                  dateStyle: 'medium', timeStyle: 'short' 
                })}
              </p>
            </div>

            <div className="space-y-1.5 p-4 rounded-2xl bg-black/20 border border-white/5 hover:border-white/10 transition-colors group">
              <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold uppercase tracking-wider">
                <Calendar className="w-3.5 h-3.5 group-hover:text-purple-400 transition-colors" /> Account Created
              </div>
              <p className="text-white text-sm">
                {new Date(user.created_at).toLocaleDateString('en-IN', { 
                  dateStyle: 'long' 
                })}
              </p>
            </div>

          </div>
        </div>

        {/* Action Buttons */}
        <div className="relative z-10 flex flex-col sm:flex-row gap-4 mt-8 pt-8 border-t border-white/5">
          
          <button 
            onClick={handlePasswordReset} 
            disabled={sendingReset}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <Key className="w-4 h-4 text-zinc-400 group-hover:text-yellow-400 transition-colors" />
            {sendingReset ? 'Sending Email...' : 'Reset Password'}
          </button>

          <div className="flex-1"></div>

          <button 
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 font-medium transition-all group"
          >
            <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            Sign Out
          </button>
        </div>

      </div>
    </div>
  );
}