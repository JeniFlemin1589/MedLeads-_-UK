'use client';

import { useState } from 'react';
import LeadTable from '@/components/LeadTable';
import SavedTable from '@/components/SavedTable';
import { Search, Database, LogOut } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '@/components/AuthProvider';
import { auth } from '@/lib/firebase';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'live' | 'saved'>('live');
  const { user } = useAuth();

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 text-slate-200 p-4 md:p-8 font-sans selection:bg-emerald-500/30">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="space-y-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4">
                Beta v2.0
              </div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                Med Leads GenX
              </h1>
              <p className="text-slate-400 max-w-2xl text-lg mt-2">
                NHS & Private Clinic Intelligence — Powered by ODS & CQC Data.
              </p>
            </div>

            {/* Tabs & Auth */}
            <div className="flex items-center gap-4">
              <div className="flex p-1 bg-slate-800/50 rounded-xl border border-slate-700">
                <button
                  onClick={() => setActiveTab('live')}
                  className={clsx(
                    "flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all",
                    activeTab === 'live'
                      ? "bg-emerald-500 text-white shadow-lg"
                      : "text-slate-400 hover:text-white"
                  )}
                >
                  <Search className="h-4 w-4" />
                  Live Search
                </button>
                <button
                  onClick={() => setActiveTab('saved')}
                  className={clsx(
                    "flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all",
                    activeTab === 'saved'
                      ? "bg-purple-500 text-white shadow-lg"
                      : "text-slate-400 hover:text-white"
                  )}
                >
                  <Database className="h-4 w-4" />
                  Saved Records
                </button>
              </div>

              {/* Auth Button */}
              {user && (
                <button
                  onClick={() => auth.signOut()}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 transition-all text-sm font-bold"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              )}
            </div>
          </div>
        </header>

        <div className="transition-all duration-300">
          {activeTab === 'live' ? <LeadTable /> : <SavedTable />}
        </div>

        <footer className="pt-12 pb-6 text-center text-slate-600 text-sm">
          <p>&copy; {new Date().getFullYear()} LeadGen Pro. Data provided by NHS ODS.</p>
        </footer>
      </div>
    </main>
  );
}
