'use client';

import { useState } from 'react';
import LeadTable from '@/components/LeadTable';
import SavedTable from '@/components/SavedTable';
import Sidebar from '@/components/Sidebar';
import IntelligenceDashboard from '@/components/IntelligenceDashboard';
import { LayoutDashboard, Zap, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'live' | 'saved' | 'insights'>('live');

  return (
    <div className="flex min-h-screen">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 ml-20 lg:ml-64 p-4 md:p-12 transition-all">
        <div className="max-w-7xl mx-auto space-y-12">
          
          {/* Header Section */}
          <header className="relative py-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div className="space-y-4">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-[0.2em]"
                >
                  <Sparkles className="h-3 w-3" />
                  Strategic Revenue Engine v3.0
                </motion.div>
                
                <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-none text-slate-900">
                  {activeTab === 'insights' ? 'Intelligence' : 'Intelligent'} <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500">
                    {activeTab === 'insights' ? 'Market Overview' : 'Lead Acquisition'}
                  </span>
                </h1>
                
                <p className="text-slate-600 max-w-2xl text-lg font-medium leading-relaxed">
                  Real-time synchronization with NHS ODS & CQC databases. 
                  Identify, score, and acquire high-value healthcare leads with AI-driven propensity modeling.
                </p>
              </div>

              {/* Quick Stats Placeholder */}
              <div className="hidden xl:flex gap-4">
                <div className="p-4 glass-card rounded-2xl border border-blue-100 min-w-[160px] shadow-sm">
                  <div className="text-slate-500 text-[10px] font-bold uppercase mb-1">Global Health Reach</div>
                  <div className="text-2xl font-black text-slate-900">124K+</div>
                  <div className="text-[10px] text-blue-600 flex items-center gap-1 mt-1 font-bold">
                    <Activity className="h-3 w-3" />
                    Live ODS Sync
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Dynamic Content Section */}
          <div className="relative min-h-[600px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                {activeTab === 'live' ? <LeadTable /> : 
                 activeTab === 'saved' ? <SavedTable /> : 
                 <IntelligenceDashboard />}
              </motion.div>
            </AnimatePresence>
          </div>

          <footer className="pt-24 pb-12 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-400 text-[11px] font-medium uppercase tracking-widest">
            <div>&copy; {new Date().getFullYear()} MEDLEADS INTELLIGENCE SYSTEMS</div>
            <div className="flex gap-8">
              <span className="hover:text-blue-600 cursor-pointer transition-colors">Internal Privacy Protocol</span>
              <span className="hover:text-blue-600 cursor-pointer transition-colors">ODS Connectivity: Operational</span>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}

// Re-using icon for footer text
import { Activity } from 'lucide-react';

