'use client';

import React from 'react';
import { Search, Database, LogOut, LayoutDashboard, Zap, Activity } from 'lucide-react';
import clsx from 'clsx';
import { auth } from '@/lib/firebase';
import { useAuth } from './AuthProvider';

interface SidebarProps {
    activeTab: 'live' | 'saved' | 'insights';
    setActiveTab: (tab: 'live' | 'saved' | 'insights') => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
    const { user } = useAuth();

    return (
        <aside className="fixed left-0 top-0 h-screen w-20 lg:w-64 glass-panel border-r border-slate-200 z-50 flex flex-col transition-all duration-300">
            {/* Logo Section */}
            <div className="p-6 pb-12 flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20 shrink-0">
                    <Zap className="text-white h-6 w-6" />
                </div>
                <span className="hidden lg:block font-bold text-xl tracking-tight text-slate-900">
                    MedLeads
                </span>
            </div>

            {/* Nav Items */}
            <nav className="flex-1 px-4 space-y-2">
                <div className="hidden lg:block text-[10px] uppercase font-bold text-slate-400 tracking-widest px-2 mb-4">
                    Main Menu
                </div>
                
                <button
                    onClick={() => setActiveTab('live')}
                    className={clsx(
                        "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all group",
                        activeTab === 'live'
                            ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                            : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                    )}
                >
                    <Search className={clsx("h-5 w-5", activeTab === 'live' ? "text-white" : "group-hover:text-blue-600 transition-colors")} />
                    <span className="hidden lg:block font-semibold">Search Engine</span>
                </button>

                <button
                    onClick={() => setActiveTab('saved')}
                    className={clsx(
                        "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all group",
                        activeTab === 'saved'
                            ? "bg-sky-600 text-white shadow-md shadow-sky-600/20"
                            : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                    )}
                >
                    <Database className={clsx("h-5 w-5", activeTab === 'saved' ? "text-white" : "group-hover:text-sky-600 transition-colors")} />
                    <span className="hidden lg:block font-semibold">Saved Intelligence</span>
                </button>

                <div className="pt-8 mb-4">
                    <div className="hidden lg:block text-[10px] uppercase font-bold text-slate-400 tracking-widest px-2">
                        Analytics
                    </div>
                </div>

                <button
                    onClick={() => setActiveTab('insights')}
                    className={clsx(
                        "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all group",
                        activeTab === 'insights'
                            ? "bg-gradient-to-r from-blue-700 to-indigo-700 text-white shadow-md shadow-blue-600/20"
                            : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                    )}
                >
                    <LayoutDashboard className={clsx("h-5 w-5", activeTab === 'insights' ? "text-white" : "group-hover:text-blue-600 transition-colors")} />
                    <span className="hidden lg:block font-semibold">Insights (Pro)</span>
                </button>
            </nav>

            {/* Bottom Section */}
            <div className="p-4 border-t border-slate-200 space-y-4">
                {user && (
                    <div className="hidden lg:flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-100 mb-4">
                        <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold text-white">
                            {user.email?.charAt(0).toUpperCase()}
                        </div>
                        <div className="truncate">
                            <div className="text-[11px] text-slate-900 font-bold truncate">{user.email?.split('@')[0]}</div>
                            <div className="text-[9px] text-slate-500 truncate">Pro Account</div>
                        </div>
                    </div>
                )}
                
                <button
                    onClick={() => auth.signOut()}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                >
                    <LogOut className="h-5 w-5" />
                    <span className="hidden lg:block font-medium">Logout</span>
                </button>
            </div>
        </aside>
    );
}
