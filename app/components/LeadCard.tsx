'use client';

import React from 'react';
import { Phone, MapPin, Building2, Globe, MoreHorizontal, Save, Zap, Check, Tag, Star, Mail, Clock, Activity, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}


import { Lead } from '@/types';

interface LeadCardProps {
    lead: Lead;
    onEnrich: (lead: Lead) => void;
    onSave: (lead: Lead) => void;
    isSaved: boolean;
    isEnriched: boolean;
}

export default function LeadCard({ lead, onEnrich, onSave, isSaved, isEnriched }: LeadCardProps) {
    const isScraped = lead.Type === 'Scraped Lead';
    const sourceColor = lead.Source === 'doctify' ? 'purple' : lead.Source === 'goprivate' ? 'green' : null;

    return (
        <motion.div
            whileHover={{ y: -5 }}
            className={cn(
                "group relative p-6 rounded-[2rem] flex flex-col h-full overflow-hidden transition-all duration-500",
                "bg-white border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]",
                "hover:border-blue-500/30 hover:shadow-[0_20px_40px_-12px_rgba(37,99,235,0.12)] hover:bg-gradient-to-br hover:from-white hover:to-blue-50/30",
                lead.LeadScore && lead.LeadScore >= 80 ? "ring-1 ring-blue-500/10" : ""
            )}
        >
            {/* Top Bar: Lead Score & Save */}
            <div className="flex justify-between items-start mb-6">
                {lead.LeadScore !== undefined ? (
                    <div className={clsx(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-wider",
                        lead.LeadScore >= 80 ? "bg-blue-50 text-blue-600 border-blue-100" :
                        lead.LeadScore >= 50 ? "bg-slate-50 text-slate-600 border-slate-100" :
                        "bg-slate-50 text-slate-400 border-slate-100"
                    )}>
                        <Zap className={cn("h-3 w-3", lead.LeadScore >= 80 ? "fill-current animate-pulse" : "text-slate-400")} />
                        Propensity: {lead.LeadScore}
                    </div>
                ) : <div />}

                <button
                    onClick={(e) => { e.stopPropagation(); onSave(lead); }}
                    disabled={isSaved}
                    className={clsx(
                        "p-2 rounded-xl border transition-all",
                        isSaved
                            ? "bg-blue-50 border-blue-100 text-blue-600"
                            : "bg-slate-50 border-slate-100 text-slate-400 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-100"
                    )}
                >
                    {isSaved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                </button>
            </div>

            {/* Identity Section */}
            <div className="space-y-3 mb-6">
                <div className="flex flex-wrap gap-2">
                    <span className={clsx(
                        "px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border",
                        lead.Type === 'Hospital' ? "bg-rose-50 text-rose-600 border-rose-100" :
                        lead.Type === 'Pharmacy' ? "bg-blue-50 text-blue-600 border-blue-100" :
                        "bg-slate-50 text-slate-500 border-slate-100"
                    )}>
                        {lead.Type}
                    </span>
                    {lead.OverallRating && (
                        <span className="px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100">
                            CQC: {lead.OverallRating}
                        </span>
                    )}
                </div>
                
                <h3 className="text-xl font-bold text-slate-900 leading-tight line-clamp-2 min-h-[3rem]" title={lead.Name}>
                    {lead.Name}
                </h3>
            </div>

            {/* Intelligence Meta */}
            <div className="space-y-3 flex-1">
                {/* Location */}
                <div className="flex items-start gap-3 text-[11px] font-medium text-slate-500">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="truncate">
                        {lead.City || 'Unknown Region'} • {lead.Postcode}
                    </span>
                </div>

                {/* Star Ratings if Scraped */}
                {lead.Rating && (
                    <div className="flex items-center gap-1.5 p-2.5 bg-slate-50 rounded-xl border border-slate-100 w-fit">
                        <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map(i => (
                                <Star key={i} className={cn("h-3 w-3", i <= Math.round(lead.Rating!) ? 'text-amber-500 fill-amber-500' : 'text-slate-200')} />
                            ))}
                        </div>
                        <span className="text-[11px] font-bold text-amber-600">{lead.Rating.toFixed(1)}</span>
                        {lead.ReviewCount && <span className="text-[10px] text-slate-400">({lead.ReviewCount})</span>}
                    </div>
                )}

                {/* Services Tags */}
                <div className="flex flex-wrap gap-1.5">
                    {(lead.Specialties || lead.ServiceTypes || []).slice(0, 3).map((tag, i) => (
                        <span key={i} className="px-2 py-1 bg-slate-50 border border-slate-100 rounded-md text-[10px] font-semibold text-slate-500 whitespace-nowrap">
                            {tag.length > 20 ? tag.slice(0, 20) + '...' : tag}
                        </span>
                    ))}
                </div>
            </div>

            {/* Action Bar */}
            <div className="mt-8">
                <button
                    onClick={() => onEnrich(lead)}
                    className={clsx(
                        "w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all",
                        isEnriched
                            ? "bg-slate-50 text-slate-400 border border-slate-200 cursor-default"
                            : "bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 hover:shadow-blue-700/30 active:scale-95"
                    )}
                >
                    {isEnriched ? <Activity className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
                    {isEnriched ? "Full Insight Active" : "Reveal Intelligence"}
                </button>
            </div>
        </motion.div>
    );
}

