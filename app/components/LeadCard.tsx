'use client';

import React from 'react';
import { Phone, MapPin, Building2, Globe, MoreHorizontal, Save, Zap, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

interface Lead {
    Name: string;
    ODS_Code: string;
    Status: string;
    Address?: string;
    City?: string;
    Postcode: string;
    Country: string;
    Role: string;
    Type: string;
    Website?: string;
    PhoneNumber?: string;
    Email?: string;
    OverallRating?: string;
}

interface LeadCardProps {
    lead: Lead;
    onEnrich: (lead: Lead) => void;
    onSave: (lead: Lead) => void;
    isSaved: boolean;
    isEnriched: boolean;
}

export default function LeadCard({ lead, onEnrich, onSave, isSaved, isEnriched }: LeadCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative bg-white/5 backdrop-blur-xl border border-white/10 p-5 rounded-2xl hover:bg-white/10 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-1"
        >
            {/* Type Badge */}
            <div className={clsx(
                "absolute top-4 right-4 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                lead.Type === 'Pharmacy' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                    lead.Type === 'Hospital' ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                        lead.Type === 'Private Clinic' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                            "bg-purple-500/10 text-purple-400 border-purple-500/20"
            )}>
                {lead.Type}
            </div>

            <div className="mb-4 pr-16 h-14">
                <h3 className="text-lg font-bold text-slate-100 leading-tight line-clamp-2" title={lead.Name}>
                    {lead.Name}
                </h3>
                {lead.OverallRating && (
                    <span className={clsx(
                        "inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border",
                        lead.OverallRating === 'Outstanding' ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" :
                            lead.OverallRating === 'Good' ? "bg-blue-500/20 text-blue-300 border-blue-500/30" :
                                lead.OverallRating === 'Requires improvement' ? "bg-amber-500/20 text-amber-300 border-amber-500/30" :
                                    "bg-red-500/20 text-red-300 border-red-500/30"
                    )}>
                        CQC: {lead.OverallRating}
                    </span>
                )}
            </div>

            <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3 text-sm text-slate-400">
                    <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-slate-500" />
                    <span className="line-clamp-2">
                        {[lead.Address, lead.City, lead.Postcode].filter(Boolean).join(', ')}
                    </span>
                </div>

                {lead.PhoneNumber && (
                    <div className="flex items-center gap-3 text-sm text-emerald-400">
                        <Phone className="h-4 w-4 shrink-0" />
                        {lead.PhoneNumber}
                    </div>
                )}

                {lead.Website && (
                    <div className="flex items-center gap-3 text-sm text-blue-400">
                        <Globe className="h-4 w-4 shrink-0" />
                        <a href={lead.Website} target="_blank" rel="noopener noreferrer" className="hover:underline truncate">
                            Website
                        </a>
                    </div>
                )}
            </div>

            <div className="flex gap-2 mt-auto">
                <button
                    onClick={() => onEnrich(lead)}
                    className={clsx(
                        "flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all",
                        isEnriched
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-default"
                            : "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 active:scale-95"
                    )}
                >
                    {isEnriched ? <Check className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
                    {isEnriched ? "Enriched" : "Quick View"}
                </button>

                <button
                    onClick={() => onSave(lead)}
                    disabled={isSaved}
                    className={clsx(
                        "flex items-center justify-center p-2 rounded-xl border transition-all",
                        isSaved
                            ? "bg-white/5 border-white/10 text-slate-500 cursor-default"
                            : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white active:scale-95"
                    )}
                    title="Save Lead"
                >
                    {isSaved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                </button>
            </div>
        </motion.div>
    );
}
