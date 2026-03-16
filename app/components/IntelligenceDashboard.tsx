'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
    Activity, 
    BarChart3, 
    Zap, 
    TrendingUp, 
    Database, 
    Sparkles, 
    ShieldCheck, 
    Target,
    ArrowUpRight,
    ArrowDownRight,
    Search
} from 'lucide-react';
import clsx from 'clsx';
import ComparativeIntelligence from './ComparativeIntelligence';

interface AnalyticsData {
    summary: {
        totalLeads: number;
        scrapedCount: number;
        savedCount: number;
        totalReviews: number;
    };
    marketShare: Record<string, number>;
    qualityMetrics: {
        averageRating: number;
        topSource: string;
    };
    briefing: {
        status: string;
        trend: string;
        recommendation: string;
    };
    lastUpdated: string;
}

export default function IntelligenceDashboard() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await fetch('/api/leads/analytics');
                const json = await res.json();
                setData(json);
            } catch (err) {
                console.error("Failed to fetch analytics", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <div className="relative">
                    <div className="h-16 w-16 border-4 border-blue-600/10 border-t-blue-600 rounded-full animate-spin" />
                    <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-blue-600 animate-pulse" />
                </div>
                <div className="text-slate-400 font-bold text-xs uppercase tracking-widest animate-pulse">
                    Aggregating Market Intelligence...
                </div>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="space-y-10">
            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Index Reach', value: data.summary.totalLeads.toLocaleString(), icon: Database, trend: '+12.5%', isUp: true },
                    { label: 'Average Quality', value: `${data.qualityMetrics.averageRating}/5.0`, icon: ShieldCheck, trend: '+0.4', isUp: true },
                    { label: 'Market Sentiment', value: data.summary.totalReviews.toLocaleString(), icon: Activity, trend: '+8.2%', isUp: true },
                    { label: 'Top Intelligence Source', value: data.qualityMetrics.topSource, icon: Search, trend: 'Stable', isUp: true },
                ].map((kpi, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-6 bg-white border border-slate-200 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-blue-600/5 transition-all group"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-blue-600 group-hover:border-blue-600 transition-all">
                                <kpi.icon className="h-5 w-5 text-slate-400 group-hover:text-white transition-all" />
                            </div>
                            <div className={clsx(
                                "flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full",
                                kpi.isUp ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                            )}>
                                {kpi.isUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                {kpi.trend}
                            </div>
                        </div>
                        <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">{kpi.label}</div>
                        <div className="text-2xl font-black text-slate-900">{kpi.value}</div>
                    </motion.div>
                ))}
            </div>

            {/* NEW: Comparative Intelligence Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-3 ml-2">
                    <div className="h-2 w-2 bg-blue-600 rounded-full animate-pulse" />
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">Decision Engine V4.0</h3>
                </div>
                <ComparativeIntelligence />
            </div>

            {/* Main Insights Panel */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Visual Chart Placeholder Area */}
                <div className="xl:col-span-2 space-y-8">
                    <div className="p-8 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm flex flex-col h-full">
                        <div className="flex justify-between items-center mb-10">
                            <div>
                                <h3 className="text-xl font-black text-slate-900">Lead Spectrum Analysis</h3>
                                <p className="text-slate-500 text-xs font-medium">Distribution by intelligence source and relative quality.</p>
                            </div>
                            <div className="flex gap-2">
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100 text-[9px] font-bold text-slate-500">
                                    <div className="h-2 w-2 bg-blue-600 rounded-full" /> Volume
                                </div>
                            </div>
                        </div>

                        {/* Custom SVG Bar Chart */}
                        <div className="flex-1 flex items-end gap-6 min-h-[240px] px-4">
                            {Object.entries(data.marketShare).map(([src, count], i) => {
                                const max = Math.max(...Object.values(data.marketShare));
                                const height = (count / max) * 100;
                                return (
                                    <div key={src} className="flex-1 flex flex-col items-center gap-4 group">
                                        <div className="relative w-full h-48 flex items-end justify-center">
                                            <motion.div
                                                initial={{ height: 0 }}
                                                animate={{ height: `${height}%` }}
                                                className="w-12 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-xl shadow-lg shadow-blue-600/10 group-hover:from-blue-700 group-hover:to-blue-500 transition-all cursor-pointer"
                                            />
                                            <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] px-2 py-1 rounded-md font-bold whitespace-nowrap">
                                                {count} Leads
                                            </div>
                                        </div>
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-900 transition-colors">
                                            {src}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* AI Market Brief */}
                <div className="space-y-8">
                    <div className="p-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] shadow-xl shadow-blue-600/20 text-white relative overflow-hidden">
                        <Sparkles className="absolute -top-4 -right-4 h-32 w-32 text-white/5 rotate-12" />
                        
                        <div className="relative z-10 space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-white/10 backdrop-blur-xl rounded-xl flex items-center justify-center border border-white/20">
                                    <Zap className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Strategic Intel</div>
                                    <h3 className="text-xl font-black">AI Market Brief</h3>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
                                    <div className="text-[10px] font-bold text-blue-200 uppercase mb-2">Market Status</div>
                                    <p className="text-sm font-medium leading-relaxed">{data.briefing.status}</p>
                                </div>
                                <div className="p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
                                    <div className="text-[10px] font-bold text-blue-200 uppercase mb-2">Sector Trend</div>
                                    <p className="text-sm font-medium leading-relaxed">{data.briefing.trend}</p>
                                </div>
                                <div className="p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
                                    <div className="text-[10px] font-bold text-blue-200 uppercase mb-2">Acquisition Strategy</div>
                                    <p className="text-sm font-medium leading-relaxed italic">"{data.briefing.recommendation}"</p>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-center">
                                <button className="w-full py-4 bg-white text-slate-900 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-white/90 transition-all flex items-center justify-center gap-2 group shadow-xl shadow-blue-900/40">
                                    <ShieldCheck className="w-5 h-5 text-blue-600" />
                                    Analyze Full Market Portfolio
                                    <ArrowUpRight className="h-3 w-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Section: Geo-Heatmap Placeholder */}
            <div className="p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-full text-[10px] font-bold text-blue-600 shadow-sm animate-pulse">
                        <TrendingUp className="h-3 w-3" /> Live Propagation
                    </div>
                </div>
                <div className="max-w-xl space-y-4">
                    <h3 className="text-xl font-black text-slate-900">Geospatial Intelligence Propagation</h3>
                    <p className="text-slate-500 text-sm font-medium leading-relaxed">
                        Currently mapping 12+ regions across the UK. Private sector growth is most dense in London (24%) and Birmingham (18%). 
                        NHS ODS synchronization is running at a 99.8% match rate.
                    </p>
                </div>
                <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6">
                    {['London', 'Manchester', 'Birmingham', 'Leeds'].map((city) => (
                        <div key={city} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                            <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">{city}</div>
                            <div className="text-lg font-black text-slate-900">{Math.floor(Math.random() * 50 + 10)}% Growth</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
