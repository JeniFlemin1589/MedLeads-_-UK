'use client';

import React from 'react';
import { X, Phone, MapPin, Globe, Building, Clock, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Lead {
    Name: string;
    ODS_Code: string;
    Address?: string;
    City?: string;
    Postcode: string;
    Type: string;
    PhoneNumber?: string;
    Email?: string;
    Website?: string;
    FullAddress?: string;
    LastUpdated?: string;
}

interface EnrichmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    lead: Lead | null;
    loading: boolean;
    onSave: () => void;
    isSaved: boolean;
}

export default function EnrichmentModal({ isOpen, onClose, lead, loading, onSave, isSaved }: EnrichmentModalProps) {
    if (!isOpen || !lead) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 border-b border-white/5">
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                        <div className="pr-8">
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 mb-2 border border-emerald-500/20">
                                {lead.Type}
                            </span>
                            <h2 className="text-2xl font-bold text-white leading-tight">{lead.Name}</h2>
                            <p className="text-slate-400 text-sm mt-1 flex items-center gap-2">
                                <Building className="h-3 w-3" /> {lead.ODS_Code}
                            </p>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-4">
                                <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
                                <p>Fetching detailed records from NHS...</p>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                                        <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                                            <Phone className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="text-xs text-slate-500 uppercase font-semibold">Phone Number</div>
                                            <div className="text-slate-200 font-medium text-lg">
                                                {lead.PhoneNumber || <span className="text-slate-600 italic">Not available</span>}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                                            <MapPin className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="text-xs text-slate-500 uppercase font-semibold">Address</div>
                                            <div className="text-slate-200">
                                                {lead.FullAddress || `${lead.Address}, ${lead.City}, ${lead.Postcode}`}
                                            </div>
                                        </div>
                                    </div>

                                    {lead.Website && (
                                        <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                                            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                                                <Globe className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <div className="text-xs text-slate-500 uppercase font-semibold">Website</div>
                                                <a href={lead.Website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                                                    {lead.Website}
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-white/5 bg-white/5 flex gap-3">
                        <button
                            onClick={onSave}
                            disabled={isSaved || loading}
                            className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSaved ? "Saved to Records" : "Save Lead"}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
