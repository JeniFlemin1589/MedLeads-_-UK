'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, Building2, Activity, Hospital, Filter, X, Globe, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import LeadCard from './LeadCard';
import EnrichmentModal from './EnrichmentModal';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

interface Lead {
    Name: string;
    ODS_Code: string;
    Status: string;
    Address?: string;
    City?: string;
    Postcode: string;
    Country: string;
    Role: string;
    Type: 'Pharmacy' | 'Clinic' | 'Hospital';
    Website?: string;
    PhoneNumber?: string;
    Email?: string;
    FullAddress?: string;
}

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

import { useAuth } from './AuthProvider';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useToast } from './ToastProvider';

// ... (Lead Interface)

export default function LeadTable() {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [activeTab, setActiveTab] = useState<'live' | 'saved'>('live');
    const [data, setData] = useState<Lead[]>([]);
    const [savedLeads, setSavedLeads] = useState<Lead[]>([]); // New state for saved leads content
    const [loading, setLoading] = useState(false);

    // Search States
    const [searchTerm, setSearchTerm] = useState('');
    const [cityTerm, setCityTerm] = useState('');
    const [londonOnly, setLondonOnly] = useState(false);
    const [regionTerm, setRegionTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<'Pharmacy' | 'Clinic' | 'Hospital'>('Pharmacy');
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

    // Modal State
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);

    const limit = 50;

    const fetchSavedLeads = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('leads')
                .select('ods_code')
                .eq('user_id', user.uid); // Firebase UID

            if (error) throw error;

            if (data) {
                setSavedIds(new Set(data.map((l: any) => l.ods_code)));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'saved') {
            fetchSavedLeads();
        }
    }, [activeTab, user]);

    const fetchLeads = useCallback(async (reset = false) => {
        setLoading(true);
        try {
            const currentOffset = reset ? 0 : offset;
            let apiRole = 'RO182';
            if (roleFilter === 'Clinic') apiRole = 'RO172';
            if (roleFilter === 'Hospital') apiRole = 'RO197';

            // Build URL with new params
            const params = new URLSearchParams({
                role: apiRole,
                limit: limit.toString(),
                offset: currentOffset.toString(),
                search: searchTerm,
                town: cityTerm,
                // postcode: regionTerm // Optional: could map region to postcode if needed
            });

            const url = `/api/leads?${params.toString()}`;

            const res = await fetch(url);
            const json = await res.json();

            if (json.leads) {
                setData(prev => reset ? json.leads : [...prev, ...json.leads]);
                setOffset(currentOffset + json.leads.length);
                setHasMore(json.leads.length === limit);
            }
        } catch (err) {
            console.error("Failed to fetch leads:", err);
        } finally {
            setLoading(false);
        }
    }, [roleFilter, searchTerm, cityTerm, offset]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setOffset(0);
            fetchLeads(true);
        }, 500);
        return () => clearTimeout(timer);
    }, [roleFilter, searchTerm, cityTerm]);

    const saveLead = async (lead: Lead) => {
        if (!user) {
            router.push('/login');
            return;
        }
        try {
            const { error } = await supabase.from('leads').insert({
                user_id: user.uid, // Firebase UID
                ods_code: lead.ODS_Code,
                name: lead.Name,
                status: lead.Status,
                city: lead.City,
                postcode: lead.Postcode,
                json_data: lead // Storing full object mostly for retrieval convenience
            });

            if (error) {
                if (error.code === '23505') { // Unique violation
                    toast("Lead already saved!", "info");
                    return;
                }
                throw error;
            }

            setSavedIds(prev => new Set(prev).add(lead.ODS_Code));
            toast(`Saved ${lead.Name}`, 'success');
        } catch (err) {
            console.error("Failed to save", err);
            toast("Failed to save lead", 'error');
        }
    };

    const openQuickView = async (lead: Lead) => {
        setSelectedLead(lead);
        setModalOpen(true);
        setModalLoading(true);

        // Enrich immediately
        try {
            const res = await fetch('/api/leads/enrich', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ odsCode: lead.ODS_Code })
            });
            const result = await res.json();

            if (result.enriched) {
                setSelectedLead(prev => prev ? ({
                    ...prev,
                    PhoneNumber: result.enriched.phoneNumber,
                    Email: result.enriched.email,
                    Website: result.enriched.website,
                    FullAddress: result.enriched.fullAddress
                }) : null);

                // Update local list too
                setData(prev => prev.map(l => l.ODS_Code === lead.ODS_Code ? {
                    ...l,
                    PhoneNumber: result.enriched.phoneNumber,
                    Website: result.enriched.website
                } : l));
            }
        } catch (err) {
            console.error("Enrichment failed", err);
        } finally {
            setModalLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Content Switch */}
            <div className="space-y-8">
                {/* Search Bar & Filters */}
                <div className="bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-2xl space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        {/* Main Search */}
                        <div className="md:col-span-5 relative group">
                            <div className="w-full h-14 bg-slate-800/50 border border-slate-700/50 rounded-2xl flex items-center px-4 focus-within:ring-2 focus-within:ring-emerald-500/50 focus-within:border-emerald-500/50 transition-all">
                                <Search className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors flex-shrink-0 mr-3" />
                                <input
                                    type="text"
                                    placeholder="Search Organisation Name..."
                                    className="w-full bg-transparent border-none text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-0 font-medium h-full"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* City Search */}
                        <div className="md:col-span-3 relative group">
                            <div className="w-full h-14 bg-slate-800/50 border border-slate-700/50 rounded-2xl flex items-center px-4 focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500/50 transition-all">
                                <MapPin className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors flex-shrink-0 mr-3" />
                                <input
                                    type="text"
                                    placeholder="City or Postcode (e.g. SW1)..."
                                    className="w-full bg-transparent border-none text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-0 font-medium h-full"
                                    value={cityTerm}
                                    onChange={(e) => {
                                        setCityTerm(e.target.value);
                                        setLondonOnly(e.target.value.toLowerCase().includes('london'));
                                    }}
                                />
                            </div>
                        </div>

                        <div className="md:col-span-4 flex flex-wrap gap-3 w-full md:w-auto items-center">

                            {/* Region Toggle */}
                            <div className="flex bg-slate-800/50 rounded-xl p-1 border border-slate-700/50">
                                <button
                                    onClick={() => { setLondonOnly(false); setCityTerm(''); }}
                                    className={cn(
                                        "px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 flex items-center gap-2",
                                        !londonOnly
                                            ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                                            : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                                    )}
                                >
                                    <Globe className="h-4 w-4" />
                                    UK Wide
                                </button>
                                <button
                                    onClick={() => { setLondonOnly(true); setCityTerm('London'); }}
                                    className={cn(
                                        "px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 flex items-center gap-2",
                                        londonOnly
                                            ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                                            : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                                    )}
                                >
                                    <MapPin className="h-4 w-4" />
                                    London
                                </button>
                            </div>

                            {/* Type Toggle */}
                            <div className="flex bg-slate-800/50 rounded-xl p-1 border border-slate-700/50">
                                <button
                                    onClick={() => setRoleFilter('Pharmacy')}
                                    className={cn(
                                        "flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2",
                                        roleFilter === 'Pharmacy'
                                            ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                                            : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                                    )}
                                >
                                    <Building2 className="h-4 w-4" />
                                    <span>Pharmacy</span>
                                </button>
                                <button
                                    onClick={() => setRoleFilter('Clinic')}
                                    className={cn(
                                        "flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2",
                                        roleFilter === 'Clinic'
                                            ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                                            : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                                    )}
                                >
                                    <Activity className="h-4 w-4" />
                                    <span>Clinic</span>
                                </button>
                                <button
                                    onClick={() => setRoleFilter('Hospital')}
                                    className={cn(
                                        "flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2",
                                        roleFilter === 'Hospital'
                                            ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20"
                                            : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                                    )}
                                >
                                    <Hospital className="h-4 w-4" />
                                    <span>Hospital</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                    <div className="px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                        {data.length} Results
                    </div>
                    <div className="px-4 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                        Region: {cityTerm || "UK Wide"}
                    </div>
                    {loading && (
                        <div className="px-4 py-2 bg-slate-800/50 text-slate-400 border border-slate-700 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                            <div className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full" />
                            Fetching...
                        </div>
                    )}
                </div>

                {/* Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {data.map((lead, idx) => (
                        <LeadCard
                            key={`${lead.ODS_Code}-${idx}`}
                            lead={lead}
                            onEnrich={openQuickView}
                            onSave={saveLead}
                            isSaved={savedIds.has(lead.ODS_Code)}
                            isEnriched={!!lead.PhoneNumber}
                        />
                    ))}
                </div>

                {/* Load More Trigger */}
                {hasMore && (
                    <div className="flex justify-center pt-8">
                        <button
                            onClick={() => fetchLeads()}
                            disabled={loading}
                            className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition-all shadow-lg active:scale-95 disabled:opacity-50"
                        >
                            {loading ? "Loading..." : "Load More Results"}
                        </button>
                    </div>
                )}
            </div>
            {/* Modals */}
            <EnrichmentModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                lead={selectedLead}
                loading={modalLoading}
                onSave={() => selectedLead && saveLead(selectedLead)}
                isSaved={selectedLead ? savedIds.has(selectedLead.ODS_Code) : false}
            />
        </div>
    );
}
