'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, MapPin, Building2, Activity, Hospital, Filter, X, Globe, Lock, Stethoscope, Database, Zap, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LeadCard from './LeadCard';
import EnrichmentModal from './EnrichmentModal';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

import { Lead } from '@/types';

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
    const [dataType, setDataType] = useState<'NHS' | 'Private' | 'Scraped'>('NHS');
    const [serviceFilter, setServiceFilter] = useState('all');
    const [scrapedSource, setScrapedSource] = useState('all');
    const [scrapedCategory, setScrapedCategory] = useState('all');
    const [scrapedPageType, setScrapedPageType] = useState('all');
    const [offset, setOffset] = useState(0);
    const offsetRef = useRef(0);
    const [hasMore, setHasMore] = useState(true);
    const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

    // Modal State
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [placesData, setPlacesData] = useState<any>(null);
    const [placesLoading, setPlacesLoading] = useState(false);

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
            const currentOffset = reset ? 0 : offsetRef.current;

            let url = '';
            const pageLimit = dataType === 'Scraped' ? 20 : limit;

            if (dataType === 'Scraped') {
                const params = new URLSearchParams({
                    limit: pageLimit.toString(),
                    offset: currentOffset.toString(),
                    source: scrapedSource,
                    category: scrapedCategory,
                    pageType: scrapedPageType,
                    search: searchTerm,
                });
                url = `/api/leads/scraped?${params.toString()}`;
            } else if (dataType === 'Private') {
                const params = new URLSearchParams({
                    limit: pageLimit.toString(),
                    offset: currentOffset.toString(),
                    service: serviceFilter,
                });
                url = `/api/leads/private?${params.toString()}`;
            } else {
                let apiRole = 'RO182';
                if (roleFilter === 'Clinic') apiRole = 'RO172';
                if (roleFilter === 'Hospital') apiRole = 'RO197';

                const params = new URLSearchParams({
                    role: apiRole,
                    limit: pageLimit.toString(),
                    offset: currentOffset.toString(),
                    search: searchTerm,
                    town: cityTerm,
                });
                url = `/api/leads?${params.toString()}`;
            }

            const res = await fetch(url);
            const json = await res.json();

            if (json.leads) {
                setData(prev => reset ? json.leads : [...prev, ...json.leads]);
                const newOffset = currentOffset + json.leads.length;
                setOffset(newOffset);
                offsetRef.current = newOffset;
                setHasMore(json.hasMore !== undefined ? json.hasMore : (json.leads.length > 0 && json.leads.length === pageLimit));
            }
        } catch (err) {
            console.error("Failed to fetch leads:", err);
        } finally {
            setLoading(false);
        }
    }, [roleFilter, searchTerm, cityTerm, dataType, serviceFilter, scrapedSource, scrapedCategory, scrapedPageType]);

    // Debounce search — reset pagination when filters change
    useEffect(() => {
        const timer = setTimeout(() => {
            setOffset(0);
            offsetRef.current = 0;
            fetchLeads(true);
        }, 500);
        return () => clearTimeout(timer);
    }, [fetchLeads]);

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

    const fetchPlacesAnalysis = async (lead: Lead) => {
        setPlacesLoading(true);
        try {
            const res = await fetch('/api/leads/enrich/places', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: lead.Name,
                    postcode: lead.Postcode,
                    address: lead.Address
                })
            });
            const result = await res.json();
            if (result.places) {
                setPlacesData(result.places);
            }
        } catch (err) {
            console.error("Google Places analysis failed", err);
        } finally {
            setPlacesLoading(false);
        }
    };

    const openQuickView = async (lead: Lead) => {
        setSelectedLead(lead);
        setModalOpen(true);
        setPlacesData(null); // Reset places data

        // Always fetch Google Places in background for analysis
        fetchPlacesAnalysis(lead);

        // Private leads already have all CQC data — no enrichment needed
        if (dataType === 'Private') {
            setModalLoading(false);
            return;
        }

        // NHS leads need enrichment from NHS ODS API
        setModalLoading(true);
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
        <div className="space-y-10">
            {/* Control Center */}
            <div className="space-y-6">
                {/* Primary Search & Source Picker */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-center">
                    {/* Source Switcher - High End Segment Control */}
                    <div className="xl:col-span-4">
                        <div className="p-1.5 bg-slate-100 rounded-2xl border border-slate-200 flex gap-1">
                            {[
                                { id: 'NHS', label: 'NHS ODS', icon: Activity, color: 'text-blue-600', activeBg: 'bg-blue-600' },
                                { id: 'Private', label: 'CQC Private', icon: Lock, color: 'text-amber-600', activeBg: 'bg-amber-600' },
                                { id: 'Scraped', label: 'Scraped Web', icon: Database, color: 'text-purple-600', activeBg: 'bg-purple-600' }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setDataType(tab.id as any)}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all",
                                        dataType === tab.id
                                            ? `${tab.activeBg} text-white shadow-md`
                                            : "text-slate-500 hover:text-slate-900 hover:bg-white"
                                    )}
                                >
                                    <tab.icon className={cn("h-3.5 w-3.5", dataType === tab.id ? "text-white" : tab.color)} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Main Search Bar */}
                    <div className="xl:col-span-8">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                            </div>
                            <input
                                type="text"
                                placeholder={dataType === 'Scraped' ? "Query doctor or practice..." : "Search official organisation name..."}
                                className="w-full h-14 bg-white border border-slate-200 rounded-2xl pl-12 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium shadow-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {loading && (
                                <div className="absolute inset-y-0 right-5 flex items-center">
                                    <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Secondary Filters */}
                <div className="flex flex-wrap items-center gap-4 py-2 border-t border-slate-100 pt-6">
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mr-2">
                        <Filter className="h-3 w-3" /> Targeted parameters
                    </div>

                    {/* Geography Picker */}
                    <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200">
                        <button
                            onClick={() => { setLondonOnly(false); setCityTerm(''); }}
                            className={cn(
                                "px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all",
                                !londonOnly ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            UK Wide
                        </button>
                        <button
                            onClick={() => { setLondonOnly(true); setCityTerm('London'); }}
                            className={cn(
                                "px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all",
                                londonOnly ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            London
                        </button>
                    </div>

                    {/* Specific Data-Type Filters */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={dataType}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex flex-wrap gap-3"
                        >
                            {dataType === 'NHS' && (
                                <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200">
                                    {['Pharmacy', 'Clinic', 'Hospital'].map((role) => (
                                        <button
                                            key={role}
                                            onClick={() => setRoleFilter(role as any)}
                                            className={cn(
                                                "px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all",
                                                roleFilter === role ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
                                            )}
                                        >
                                            {role}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {dataType === 'Private' && (
                                <select
                                    value={serviceFilter}
                                    onChange={(e) => { setServiceFilter(e.target.value); setOffset(0); }}
                                    className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-[11px] font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
                                >
                                    <option value="all">All Registered Services</option>
                                    <option value="gp">GP / Doctors</option>
                                    <option value="dental">Dental</option>
                                    <option value="pharmacy">Pharmacy</option>
                                    <option value="mental-health">Mental Health</option>
                                </select>
                            )}

                            {dataType === 'Scraped' && (
                                <div className="flex gap-3">
                                    <select
                                        value={scrapedSource}
                                        onChange={(e) => { setScrapedSource(e.target.value); setOffset(0); }}
                                        className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-[11px] font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
                                    >
                                        <option value="all">All Sources</option>
                                        <option value="doctify">Doctify</option>
                                        <option value="goprivate">GoPrivate</option>
                                        <option value="newmedica">Newmedica</option>
                                    </select>
                                    <select
                                        value={scrapedPageType}
                                        onChange={(e) => { setScrapedPageType(e.target.value); setOffset(0); }}
                                        className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-[11px] font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
                                    >
                                        <option value="all">All Content Types</option>
                                        <option value="specialist">Specialists</option>
                                        <option value="practice">Clinics/Practices</option>
                                    </select>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {/* Reset Button */}
                    {(searchTerm || cityTerm || serviceFilter !== 'all' || scrapedSource !== 'all') && (
                        <button 
                            onClick={() => {
                                setSearchTerm('');
                                setCityTerm('');
                                setServiceFilter('all');
                                setScrapedSource('all');
                                setLondonOnly(false);
                            }}
                            className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-2 rounded-xl text-[10px] font-bold uppercase transition-all border border-red-100"
                        >
                            Reset All
                        </button>
                    )}
                </div>
            </div>

            {/* Stats Row */}
            <div className="flex items-center justify-between">
                <div className="flex gap-4">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Total Retrieved: <span className="text-slate-900 ml-1">{data.length} Leads</span>
                    </div>
                </div>
                <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                    <div className="h-1 w-1 bg-blue-600 rounded-full" />
                    Live Database Feed
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
                {data.map((lead, idx) => (
                    <motion.div
                        key={`${lead.ODS_Code}-${idx}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: (idx % 12) * 0.05 }}
                    >
                        <LeadCard
                            lead={lead}
                            onEnrich={openQuickView}
                            onSave={saveLead}
                            isSaved={savedIds.has(lead.ODS_Code)}
                            isEnriched={!!lead.PhoneNumber}
                        />
                    </motion.div>
                ))}
            </div>

            {/* Load More Trigger */}
            {hasMore && (
                <div className="flex justify-center pt-12 pb-20">
                    <button
                        onClick={() => fetchLeads()}
                        disabled={loading}
                        className="px-12 py-4 bg-white hover:bg-slate-50 text-slate-600 rounded-2xl font-bold text-sm tracking-wide transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-3 border border-slate-200"
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                                Analyzing More Records...
                            </>
                        ) : (
                            <>
                                Load Additional Data
                                <Zap className="h-4 w-4 text-blue-600" />
                            </>
                        )}
                    </button>
                </div>
            )}
            {/* Modals */}
            <EnrichmentModal
                isOpen={modalOpen}
                onClose={() => { setModalOpen(false); setPlacesData(null); }}
                lead={selectedLead}
                loading={modalLoading}
                onSave={() => selectedLead && saveLead(selectedLead)}
                isSaved={selectedLead ? savedIds.has(selectedLead.ODS_Code) : false}
                placesData={placesData}
                placesLoading={placesLoading}
            />
        </div>
    );
}


