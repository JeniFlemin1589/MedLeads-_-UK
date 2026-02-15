'use client';

import React from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { LogOut, User as UserIcon, Shield, Mail } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function ProfilePage() {
    const { user } = useAuth();
    const router = useRouter();

    if (!user) {
        if (typeof window !== 'undefined') router.push('/login');
        return null;
    }

    const handleLogout = async () => {
        await signOut(auth);
        router.push('/login');
    };

    return (
        <div className="min-h-screen p-8 bg-slate-950 text-white">
            <div className="max-w-2xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">User Profile</h1>
                    <button
                        onClick={() => router.push('/')}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        Back to Dashboard
                    </button>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
                    <div className="flex items-center gap-6 mb-8">
                        <div className="h-20 w-20 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center text-3xl font-bold">
                            {user.photoURL ? (
                                <img src={user.photoURL} alt={user.displayName || 'User'} className="h-full w-full rounded-full object-cover" />
                            ) : (
                                user.email?.[0].toUpperCase()
                            )}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">{user.displayName || 'LeadGen User'}</h2>
                            <p className="text-slate-400 flex items-center gap-2">
                                <Mail className="h-4 w-4" /> {user.email}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-slate-900/50 border border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3 text-slate-300">
                                <Shield className="h-5 w-5 text-emerald-400" />
                                <span>Account Status</span>
                            </div>
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">
                                ACTIVE
                            </span>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-900/50 border border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3 text-slate-300">
                                <UserIcon className="h-5 w-5 text-blue-400" />
                                <span>User ID</span>
                            </div>
                            <span className="font-mono text-xs text-slate-500">
                                {user.uid}
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="w-full mt-8 py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                        <LogOut className="h-5 w-5" />
                        Sign Out
                    </button>
                </div>
            </div>
        </div>
    );
}
