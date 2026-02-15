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

// ... (Lead Interface)

export default function LeadTable() {
    const { user } = useAuth();
    const router = useRouter();

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
            const res = await fetch('/api/leads/saved');
            const json = await res.json();
            if (json.leads) {
                setSavedLeads(json.leads);
                // Also update the set for quick lookup
                setSavedIds(new Set(json.leads.map((l: any) => l.ODS_Code)));
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
        try {
            await fetch('/api/leads/saved', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lead })
            });
            setSavedIds(prev => new Set(prev).add(lead.ODS_Code));
        } catch (err) {
            console.error("Failed to save", err);
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
            {/* Tabs */}
            <div className="flex justify-center">
                <div className="flex bg-slate-900/50 p-1 rounded-2xl border border-white/10">
                    <button
                        onClick={() => setActiveTab('live')}
                        className={cn(
                            "px-6 py-3 rounded-xl text-sm font-bold transition-all relative z-10",
                            activeTab === 'live' ? "text-white" : "text-slate-400 hover:text-white"
                        )}
                    >
                        Live Search
                        {activeTab === 'live' && (
                            <motion.div layoutId="activeTab" className="absolute inset-0 bg-emerald-600 rounded-xl -z-10 shadow-lg shadow-emerald-600/20" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('saved')}
                        className={cn(
                            "px-6 py-3 rounded-xl text-sm font-bold transition-all relative z-10 flex items-center gap-2",
                            activeTab === 'saved' ? "text-white" : "text-slate-400 hover:text-white"
                        )}
                    >
                        Saved Records
                        {activeTab === 'saved' && (
                            <motion.div layoutId="activeTab" className="absolute inset-0 bg-blue-600 rounded-xl -z-10 shadow-lg shadow-blue-600/20" />
                        )}
                    </button>
                </div>
            </div>

            {/* Content Switch */}
            {activeTab === 'live' ? (
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
            ) : (
                // SAVED RECORDS VIEW
                <div className="space-y-8">
                    {!user ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 bg-white/5 rounded-3xl border border-white/10">
                            <div className="h-20 w-20 bg-slate-800 rounded-full flex items-center justify-center">
                                <Lock className="h-10 w-10 text-slate-400" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">Login Required</h2>
                                <p className="text-slate-400 max-w-md mx-auto mt-2">
                                    Please sign in to access your saved leads and perform bulk actions.
                                </p>
                            </div>
                            <button
                                onClick={() => router.push('/login')}
                                className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                            >
                                Sign In / Create Account
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold text-white">Your Saved Leads</h2>
                                <button
                                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-sm hover:bg-slate-700 transition"
                                    onClick={fetchSavedLeads}
                                >
                                    Refresh
                                </button>
                            </div>

                            {savedLeads.length === 0 ? (
                                <div className="text-center py-20 text-slate-500">
                                    No saved leads yet. Go to Live Search to add some!
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {savedLeads.map((lead, idx) => (
                                        <LeadCard
                                            key={`saved-${lead.ODS_Code}-${idx}`}
                                            lead={lead}
                                            onEnrich={openQuickView}
                                            onSave={() => { }}
                                            isSaved={true}
                                            isEnriched={!!lead.PhoneNumber}
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

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
