'use client';

import React, { useState, useEffect } from 'react';
import { Download, Phone, Zap, Mail, Trash2, CheckCircle, Smartphone, MapPin, Lock } from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, deleteDoc, doc, getDocs, query, setDoc } from 'firebase/firestore';

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
    SavedAt?: string;
}

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

export default function SavedTable() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [data, setData] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(false);
    const [enriching, setEnriching] = useState<string[]>([]);

    const fetchSaved = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const q = query(collection(db, "users", user.uid, "leads"));
            const querySnapshot = await getDocs(q);
            const leads: Lead[] = [];
            querySnapshot.forEach((doc) => {
                leads.push(doc.data() as Lead);
            });
            setData(leads.reverse()); // Show newest first (client side sort might be needed if not using orderBy)
            // Ideally use orderBy("SavedAt", "desc") but requires index. Let's sort manually.
            leads.sort((a, b) => new Date(b.SavedAt || 0).getTime() - new Date(a.SavedAt || 0).getTime());
            setData(leads);
        } catch (err) {
            console.error("Failed to load saved leads", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchSaved();
    }, [user]);

    const handleRemove = async (odsCode: string) => {
        if (!user) return;
        try {
            await deleteDoc(doc(db, "users", user.uid, "leads", odsCode));
            setData(prev => prev.filter(l => l.ODS_Code !== odsCode));
        } catch (err) {
            console.error("Failed to delete", err);
        }
    };

    const enrichLead = async (lead: Lead) => {
        if (lead.PhoneNumber && lead.FullAddress) return; // Already enriched

        setEnriching(prev => [...prev, lead.ODS_Code]);
        try {
            const res = await fetch('/api/leads/enrich', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ odsCode: lead.ODS_Code })
            });
            const result = await res.json();

            if (result.enriched) {
                const updatedLead = {
                    ...lead,
                    Website: result.enriched.website,
                    PhoneNumber: result.enriched.phoneNumber,
                    Email: result.enriched.email,
                    FullAddress: result.enriched.fullAddress
                };

                // Save back to storage
                if (user) {
                    await setDoc(doc(db, "users", user.uid, "leads", lead.ODS_Code), updatedLead);
                }

                setData(prev => prev.map(l => l.ODS_Code === lead.ODS_Code ? updatedLead : l));
            }
        } catch (err) {
            console.error("Enrichment failed:", err);
        } finally {
            setEnriching(prev => prev.filter(code => code !== lead.ODS_Code));
        }
    };

    const enrichAll = async () => {
        const toEnrich = data.filter(l => !l.PhoneNumber);
        for (const lead of toEnrich) {
            await enrichLead(lead);
            // Small delay to be nice to the API
            await new Promise(r => setTimeout(r, 100));
        }
    };

    const handleExport = () => {
        if (data.length === 0) return;
        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(row => Object.values(row).map(v => `"${v}"`).join(',')).join('\n');
        const csv = `${headers}\n${rows}`;
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `my_saved_leads_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    if (loading && data.length === 0) return <div className="text-slate-400 p-8 text-center">Loading records...</div>;



    if (authLoading) return null; // Or a spinner

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 bg-white/5 rounded-3xl border border-white/10 mt-8">
                <div className="h-20 w-20 bg-slate-800 rounded-full flex items-center justify-center">
                    <Lock className="h-10 w-10 text-slate-400" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-200">Login Required</h2>
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
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10">
                <div>
                    <h2 className="text-xl font-bold text-slate-200">My Saved Records</h2>
                    <p className="text-sm text-slate-500">{data.length} leads saved</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={enrichAll}
                        disabled={data.every(l => l.PhoneNumber) || enriching.length > 0}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 rounded-lg hover:bg-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {enriching.length > 0 ? <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" /> : <Zap className="h-4 w-4" />}
                        Enrich All (Free)
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-900 rounded-lg font-semibold hover:bg-white transition-all"
                    >
                        <Download className="h-4 w-4" />
                        Export CSV
                    </button>
                </div>
            </div>

            <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden shadow-2xl min-h-[400px]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/10 text-slate-400 text-xs uppercase tracking-wider">
                                <th className="p-4 font-semibold">Organisation Name</th>
                                <th className="p-4 font-semibold">Details</th>
                                <th className="p-4 font-semibold">Status</th>
                                <th className="p-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {data.map((lead, idx) => (
                                <tr key={`${lead.ODS_Code}-${idx}`} className="group hover:bg-white/5 transition-colors duration-150">
                                    <td className="p-4 align-top">
                                        <div className="font-medium text-slate-200">{lead.Name}</div>
                                        <div className="text-xs text-slate-500 mt-1">{lead.City}, {lead.Postcode}</div>
                                        <div className="text-[10px] text-slate-600 mt-1 font-mono">{lead.ODS_Code}</div>
                                    </td>
                                    <td className="p-4 align-top">
                                        <div className="space-y-1">
                                            {lead.PhoneNumber ? (
                                                <div className="flex items-center gap-2 text-xs text-emerald-400">
                                                    <Phone className="h-3 w-3" /> {lead.PhoneNumber}
                                                </div>
                                            ) : (
                                                <div className="text-xs text-slate-600 italic">No phone</div>
                                            )}
                                            {lead.FullAddress && (
                                                <div className="flex items-start gap-2 text-xs text-slate-400">
                                                    <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
                                                    <span className="max-w-[200px]">{lead.FullAddress}</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 align-top">
                                        {lead.PhoneNumber ? (
                                            <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-full border border-emerald-500/20">
                                                <CheckCircle className="h-3 w-3" /> Enriched
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded-full border border-slate-700">
                                                Pending
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right align-top">
                                        <button
                                            onClick={() => handleRemove(lead.ODS_Code)}
                                            className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                                            title="Remove"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {data.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-slate-500 italic">
                                        No saved leads yet. Go to "Live Search" to find and save leads.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
