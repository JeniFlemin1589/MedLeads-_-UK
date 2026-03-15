'use client';

import React, { useState } from 'react';
import { X, Phone, MapPin, Globe, Building, Star, Users, Shield, Calendar, FileText, Activity, Award, Clock, ExternalLink, MessageCircle, Search, Mail, Heart, Pill, Languages, Image as ImageIcon, BadgeCheck, Facebook, Twitter, Instagram, Linkedin, Youtube, Briefcase, Stethoscope, CheckCircle, GraduationCap, DollarSign, MapPinned, Brain, Sparkles, HelpCircle, User, Home, Hospital, Clipboard, Share2, Zap, ShieldCheck, CreditCard, MessageSquare, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import DoctorProfilePanel from './DoctorProfilePanel';

import { Lead } from '@/types';



interface PlacesData {
    placeId: string;
    name: string;
    formattedAddress: string;
    phone?: string;
    website?: string;
    googleMapsUrl?: string;
    rating?: number;
    totalReviews?: number;
    businessStatus?: string;
    openNow?: boolean;
    weekdayHours?: string[];
    reviews?: { author: string; rating: number; text: string; time: string; profilePhoto?: string }[];
    photoUrl?: string;
    types?: string[];
}

interface EnrichmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    lead: Lead | null;
    loading: boolean;
    onSave: () => void;
    isSaved: boolean;
    placesData?: PlacesData | null;
    placesLoading?: boolean;
}

function RatingBadge({ rating }: { rating: string }) {
    const colors: Record<string, string> = {
        'Outstanding': 'bg-emerald-50 text-emerald-700 border-emerald-200',
        'Good': 'bg-blue-50 text-blue-700 border-blue-200',
        'Requires improvement': 'bg-amber-50 text-amber-700 border-amber-200',
        'Inadequate': 'bg-red-50 text-red-700 border-red-200',
    };
    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${colors[rating] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
            {rating}
        </span>
    );
}

function GoogleStars({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} className={`h-4 w-4 ${i <= Math.round(rating) ? 'text-amber-500 fill-amber-500' : 'text-slate-200'}`} />
            ))}
            <span className="text-sm font-bold text-slate-900 ml-1">{rating.toFixed(1)}</span>
        </div>
    );
}

function PillList({ items, color = 'blue' }: { items: string[]; color?: string }) {
    const colorMap: Record<string, string> = {
        blue: 'bg-blue-50 text-blue-700 border-blue-100',
        sky: 'bg-sky-50 text-sky-700 border-sky-100',
        rose: 'bg-rose-50 text-rose-700 border-rose-100',
        amber: 'bg-amber-50 text-amber-700 border-amber-100',
        indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
        emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    };
    return (
        <div className="flex flex-wrap gap-1">
            {items.map((item, i) => (
                <span key={i} className={`px-2 py-0.5 ${colorMap[color] || colorMap.indigo} border rounded-full text-[10px] font-medium`}>{item}</span>
            ))}
        </div>
    );
}

function SectionHeader({ icon, label, color = 'text-slate-400' }: { icon: React.ReactNode; label: string; color?: string }) {
    return (
        <div className="flex items-center gap-2 mb-3">
            <span className={color}>{icon}</span>
            <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">{label}</span>
        </div>
    );
}

export default function EnrichmentModal({ isOpen, onClose, lead, loading, onSave, isSaved, placesData, placesLoading }: EnrichmentModalProps) {
    const [selectedDoctorUrl, setSelectedDoctorUrl] = useState<string | null>(null);
    const [selectedDoctorName, setSelectedDoctorName] = useState<string>('');
    const [nhsData, setNhsData] = useState<any>(null);
    const [nhsLoading, setNhsLoading] = useState(false);

    React.useEffect(() => {
        if (isOpen && lead?.ODS_Code && (lead.Type === 'Pharmacy' || lead.Type === 'Clinic' || lead.Type === 'Hospital')) {
            setNhsLoading(true);
            fetch(`/api/leads/nhs/detail?odsCode=${lead.ODS_Code}`)
                .then(res => res.json())
                .then(data => {
                    setNhsData(data);
                    setNhsLoading(false);
                })
                .catch(err => {
                    console.error("Error fetching NHS detail:", err);
                    setNhsLoading(false);
                });
        } else {
            setNhsData(null);
        }
    }, [isOpen, lead?.ODS_Code, lead?.Type]);

    if (!isOpen || !lead) return null;

    const isScraped = lead.Type === 'Scraped Lead';

    return (
        <AnimatePresence>

            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 backdrop-blur-sm bg-slate-900/10">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-[2.5rem] shadow-[0_32px_128px_-12px_rgba(0,0,0,0.15)] border border-slate-200 flex flex-col overflow-hidden"
                >
                    {/* Header Area */}
                    <div className="relative p-8 pb-6 border-b border-slate-100 bg-gradient-to-br from-blue-50 via-white to-transparent">
                        <button
                            onClick={onClose}
                            className="absolute top-8 right-8 p-3 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 rounded-2xl transition-all border border-slate-200 z-[110] group"
                        >
                            <X className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
                        </button>

                        <div className="relative z-10 space-y-4">
                            <div className="flex items-center gap-3 flex-wrap">
                                <div className={clsx(
                                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                    isScraped ? "bg-purple-50 text-purple-600 border-purple-100" : "bg-blue-50 text-blue-600 border-blue-100"
                                )}>
                                    {isScraped ? (lead.Source === 'doctify' ? 'Doctify Intel' : 'Web Intelligence') : 'Official NHS/CQC Record'}
                                </div>
                                
                                {lead.LeadScore !== undefined && (
                                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600 text-white border border-blue-700 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-600/20">
                                        <Zap className="h-3 w-3 fill-current" />
                                        Intel Score: {lead.LeadScore}
                                    </div>
                                )}

                                {lead.OverallRating && (
                                    <div className={clsx(
                                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                        lead.OverallRating === 'Outstanding' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-500 border-slate-100"
                                    )}>
                                        CQC: {lead.OverallRating}
                                    </div>
                                )}
                            </div>

                            <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none pr-12">
                                {lead.Name}
                            </h2>

                            <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                                <div className="flex items-center gap-1.5">
                                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                    {lead.City || lead.Region || 'United Kingdom'}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Building className="h-3.5 w-3.5 text-slate-400" />
                                    ID: {lead.ODS_Code || lead.ProviderId || 'UNIDENTIFIED'}
                                </div>
                                {lead.Rating && (
                                    <div className="flex items-center gap-1 text-amber-600">
                                        <Star className="h-3.5 w-3.5 fill-current" />
                                        {lead.Rating.toFixed(1)}
                                        <span className="text-slate-400 ml-0.5">({lead.ReviewCount || 0})</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>


                    {/* Scrollable Content */}
                    <div className="p-8 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-24 text-slate-400 space-y-6">
                                <div className="relative">
                                    <div className="h-12 w-12 border-4 border-blue-100 rounded-full animate-ping absolute inset-0" />
                                    <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                </div>
                                <p className="text-sm font-bold tracking-widest uppercase text-slate-400">Decrypting Intelligence...</p>
                            </div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-8"
                            >
                                {/* Core Data Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {/* Phone Card */}
                                    <div className="group p-6 rounded-3xl bg-slate-50 border border-slate-200 hover:border-emerald-500/30 transition-all hover:bg-white hover:shadow-lg hover:shadow-emerald-500/5">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2.5 bg-emerald-100 rounded-2xl text-emerald-600 group-hover:scale-110 transition-transform">
                                                <Phone className="h-5 w-5" />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Secure Line</span>
                                        </div>
                                        <div className="space-y-2">
                                            {lead!.PhoneNumber ? (
                                                lead!.PhoneNumber.split(/[,;]/).map((p, idx) => (
                                                    <a key={idx} href={`tel:${p.trim()}`} className="flex items-center justify-between group/link">
                                                        <span className="text-slate-900 font-bold tracking-tight">{p.trim()}</span>
                                                        <span className="text-[10px] text-emerald-600 opacity-0 group-hover/link:opacity-100 transition-opacity font-black lowercase">connect →</span>
                                                    </a>
                                                ))
                                            ) : <span className="text-slate-400 font-bold italic text-sm">Signal Lost</span>}
                                        </div>
                                    </div>

                                    {/* Digital Identity Card */}
                                    <div className="group p-6 rounded-3xl bg-slate-50 border border-slate-200 hover:border-blue-500/30 transition-all hover:bg-white hover:shadow-lg hover:shadow-blue-500/5">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2.5 bg-blue-100 rounded-2xl text-blue-600 group-hover:scale-110 transition-transform">
                                                <Globe className="h-5 w-5" />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Digital Hub</span>
                                        </div>
                                        <div className="space-y-2">
                                            {lead!.Website ? (
                                                lead!.Website.split(/[,;]/).map((w, idx) => (
                                                    <a key={idx} href={w.trim().startsWith('http') ? w.trim() : `https://${w.trim()}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between group/link overflow-hidden">
                                                        <span className="text-blue-600 font-bold tracking-tight truncate mr-2">
                                                            {w.trim().replace(/^https?:\/\//, '').replace(/\/$/, '')}
                                                        </span>
                                                        <ExternalLink className="h-3 w-3 text-blue-600 opacity-0 group-hover/link:opacity-100 transition-opacity shrink-0" />
                                                    </a>
                                                ))
                                            ) : <span className="text-slate-400 font-bold italic text-sm">Offline</span>}
                                        </div>
                                    </div>

                                    {lead!.Email && (
                                        <div className="group p-6 rounded-3xl bg-slate-50 border border-slate-200 hover:border-amber-500/30 transition-all hover:bg-white hover:shadow-lg hover:shadow-amber-500/5">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="p-2.5 bg-amber-100 rounded-2xl text-amber-600 group-hover:scale-110 transition-transform">
                                                    <Mail className="h-5 w-5" />
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Direct Comms</span>
                                            </div>
                                            <a href={`mailto:${lead!.Email}`} className="block text-slate-900 font-bold tracking-tight hover:text-amber-600 transition-colors truncate">
                                                {lead!.Email}
                                            </a>
                                        </div>
                                    )}
                                </div>

                                {/* Geographic Intelligence */}
                                <div className="group p-6 rounded-3xl bg-slate-50 border border-slate-200 hover:border-blue-500/20 transition-all hover:bg-white hover:shadow-lg hover:shadow-blue-500/5">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2.5 bg-blue-100 rounded-2xl text-blue-600">
                                            <MapPinned className="h-5 w-5" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Geospatial Intelligence</span>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <div className="text-xl font-bold text-slate-900 tracking-tight leading-relaxed">
                                                {lead!.FullAddress || [lead!.Address, lead!.City, lead!.Postcode].filter(Boolean).join(', ')}
                                            </div>
                                            {(lead!.LocalAuthority || lead!.Region) && (
                                                <div className="flex items-center gap-2 mt-3">
                                                    <div className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-600 uppercase tracking-tighter">
                                                        {lead!.LocalAuthority}
                                                    </div>
                                                    <div className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-600 uppercase tracking-tighter">
                                                        {lead!.Region}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        {lead!.AreaServed && (
                                            <div className="flex items-center gap-2 p-3 rounded-2xl bg-blue-50 border border-blue-100">
                                                <Search className="h-4 w-4 text-blue-600 shrink-0" />
                                                <span className="text-xs text-blue-700 font-medium">Primary Catchment: {lead!.AreaServed}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>


                                {/* About Section */}
                                {(lead!.Description || lead!.AboutText) && (
                                    <div className="group p-6 rounded-3xl bg-slate-50 border border-slate-200 hover:border-blue-500/20 transition-all hover:bg-white hover:shadow-lg hover:shadow-blue-500/5">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2.5 bg-blue-100 rounded-2xl text-blue-600">
                                                <FileText className="h-5 w-5" />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Institutional intelligence</span>
                                        </div>
                                        <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">
                                            {lead!.AboutText || lead!.Description}
                                        </p>
                                        {(lead!.FoundationDate || lead!.NumberOfEmployees || lead!.PriceRange) && (
                                            <div className="flex flex-wrap gap-4 mt-6 pt-6 border-t border-slate-200">
                                                {lead!.FoundationDate && (
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] text-slate-500 uppercase font-black tracking-tighter mb-1">Established</span>
                                                        <span className="text-xs text-slate-900 font-bold">{lead!.FoundationDate}</span>
                                                    </div>
                                                )}
                                                {lead!.NumberOfEmployees && (
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] text-slate-500 uppercase font-black tracking-tighter mb-1">Workforce</span>
                                                        <span className="text-xs text-slate-900 font-bold">{lead!.NumberOfEmployees} Members</span>
                                                    </div>
                                                )}
                                                {lead!.PriceRange && (
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] text-slate-500 uppercase font-black tracking-tighter mb-1">Tier</span>
                                                        <span className="text-xs text-emerald-600 font-bold">{lead!.PriceRange}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Opening Hours */}
                                {lead!.OpeningHours && (
                                    <div className="group p-6 rounded-3xl bg-slate-50 border border-slate-200 hover:border-amber-500/20 transition-all hover:bg-white hover:shadow-lg hover:shadow-amber-500/5">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="p-2.5 bg-amber-100 rounded-2xl text-amber-600">
                                                <Clock className="h-5 w-5" />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Operational Window</span>
                                        </div>
                                        {typeof lead!.OpeningHours === 'string' ? (
                                            <div className="text-sm text-slate-700 prose prose-slate max-w-none prose-td:p-1 prose-td:border-b prose-td:border-slate-100" dangerouslySetInnerHTML={{ __html: lead!.OpeningHours }} />
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {(lead!.OpeningHours as any[]).map((oh, i) => (
                                                    <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-100 group/hour hover:bg-slate-50 transition-colors">
                                                        <span className="text-xs font-bold text-slate-500">{oh.day}</span>
                                                        <span className="text-xs text-slate-900 font-mono tracking-tighter">{oh.opens} — {oh.closes}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Specialists / Stakeholders */}
                                {lead!.Contacts && lead!.Contacts.length > 0 && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 ml-2">
                                            <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
                                                <Stethoscope className="h-4 w-4" />
                                            </div>
                                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">
                                                {isScraped ? `Intelligence Asset Registry (${lead!.Contacts.length})` : 'Key Stakeholders'}
                                            </h3>
                                        </div>
                                        <div className="grid grid-cols-1 gap-3">
                                            {lead!.Contacts.map((c, i) => (
                                                <div key={i} className="group/card p-4 rounded-3xl bg-slate-50 border border-slate-200 hover:border-blue-500/30 transition-all hover:bg-white hover:shadow-lg hover:shadow-blue-500/5">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex gap-4">
                                                            {c.imageUrl && (
                                                                <img src={c.imageUrl} alt={c.name} className="h-14 w-14 rounded-2xl object-cover border border-slate-200 shadow-sm" />
                                                            )}
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                                                    {c.title && <span className="text-[10px] text-blue-600 font-black uppercase tracking-tighter">{c.title}</span>}
                                                                    <span className="text-lg font-black text-slate-900 tracking-tight">{c.name}</span>
                                                                </div>
                                                                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest line-clamp-1">
                                                                    {c.roles?.join(' • ')}
                                                                </div>
                                                                {c.qualifications && (
                                                                    <div className="text-[10px] text-emerald-600 font-medium mt-1 uppercase tracking-tighter leading-none">{c.qualifications}</div>
                                                                )}
                                                                <div className="flex gap-2 mt-3">
                                                                    {c.profileUrl && (
                                                                        <button
                                                                            onClick={() => { setSelectedDoctorUrl(c.profileUrl!); setSelectedDoctorName(c.name); }}
                                                                            className="px-3 py-1.5 bg-blue-600 font-black text-[10px] text-white rounded-full hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95 uppercase tracking-widest"
                                                                        >
                                                                            Intelligence Drill-down
                                                                        </button>
                                                                    )}
                                                                    {c.gmcNumber && (
                                                                        <div className="px-2 py-1.5 bg-slate-100 border border-slate-200 rounded-full text-[10px] text-slate-500 font-mono tracking-tighter uppercase line-clamp-1">GMC: {c.gmcNumber}</div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {c.rating && c.rating > 0 && (
                                                            <div className="text-right shrink-0 p-3 rounded-2xl bg-amber-50 border border-amber-100">
                                                                <div className="flex items-center justify-end gap-1 mb-1">
                                                                    <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                                                                    <span className="text-lg font-black text-amber-600 leading-none">{c.rating.toFixed(1)}</span>
                                                                </div>
                                                                <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">{c.reviewCount || 0} reviews</div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {c.subSpecialties && c.subSpecialties.length > 0 && (
                                                        <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-slate-100">
                                                            {c.subSpecialties.map((s, j) => (
                                                                <span key={j} className="px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-tighter">{s}</span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Specialist Exclusive Sections */}
                                {(lead!.SpecialistBio || lead!.AiReviewSummary || lead!.YearsOfExperience) && (
                                    <div className="group p-6 rounded-3xl bg-slate-50 border border-slate-200 hover:border-blue-500/20 transition-all hover:bg-white hover:shadow-lg hover:shadow-blue-500/5">
                                        {lead!.SpecialistBio && (
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-1.5 bg-blue-100 rounded-lg text-blue-600">
                                                        <FileText className="h-3.5 w-3.5" />
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Professional Dossier</span>
                                                </div>
                                                <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line line-clamp-6">{lead!.SpecialistBio}</p>
                                            </div>
                                        )}
                                        {lead!.AiReviewSummary && (
                                            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 relative overflow-hidden group/ai mt-6">
                                                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover/ai:scale-125 transition-transform">
                                                    <Sparkles className="h-10 w-10 text-blue-600" />
                                                </div>
                                                <div className="relative z-10">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <Sparkles className="h-4 w-4 text-blue-600" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-700">Sentiment Engine Summary</span>
                                                    </div>
                                                    <p className="text-slate-800 text-sm leading-relaxed font-medium italic">{"\u201C"}{lead!.AiReviewSummary}{"\u201D"}</p>
                                                </div>
                                            </div>
                                        )}
                                        {lead!.YearsOfExperience && (
                                            <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50 border border-emerald-100 mt-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600">
                                                        <Calendar className="h-4 w-4" />
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-600">Clinical Tenure</span>
                                                </div>
                                                <span className="text-xl font-black text-emerald-600">{lead!.YearsOfExperience}+ Years</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Specialist Financials */}
                                {lead!.SpecialistFees && (
                                    <div className="group p-6 rounded-3xl bg-white/[0.03] border border-white/5">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="p-2.5 bg-emerald-500/10 rounded-2xl text-emerald-400">
                                                <DollarSign className="h-5 w-5" />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Commercial Intel</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            {lead!.SpecialistFees.newPatient && (
                                                <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 text-center group/fee hover:bg-white/[0.06] transition-all">
                                                    <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">New Referral</div>
                                                    <div className="text-2xl font-black text-emerald-400">{lead!.SpecialistFees.newPatient}</div>
                                                </div>
                                            )}
                                            {lead!.SpecialistFees.followUp && (
                                                <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 text-center group/fee hover:bg-white/[0.06] transition-all">
                                                    <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Follow-up</div>
                                                    <div className="text-2xl font-black text-blue-400">{lead!.SpecialistFees.followUp}</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Specialist Credentials */}
                                {((lead!.SpecialistEducation && lead!.SpecialistEducation.length > 0) || (lead!.SpecialistSkills && lead!.SpecialistSkills.length > 0)) && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {lead!.SpecialistEducation && lead!.SpecialistEducation.length > 0 && (
                                            <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/5">
                                                <div className="flex items-center gap-2 mb-6">
                                                    <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
                                                        <GraduationCap className="h-4 w-4" />
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Academic Background</span>
                                                </div>
                                                <div className="space-y-4">
                                                    {lead!.SpecialistEducation.map((edu, i) => (
                                                        <div key={i} className="relative pl-4 border-l-2 border-indigo-500/20 py-1">
                                                            <div className="text-sm text-white font-black tracking-tight leading-none">{edu.degree}</div>
                                                            {edu.institution && <div className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-tighter">{edu.institution}</div>}
                                                            {edu.year && <div className="text-[10px] text-slate-600 mt-0.5 font-mono">{edu.year}</div>}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {lead!.SpecialistSkills && lead!.SpecialistSkills.length > 0 && (
                                            <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/5">
                                                <div className="flex items-center gap-2 mb-6">
                                                    <div className="p-2 bg-cyan-500/10 rounded-xl text-cyan-400">
                                                        <Award className="h-4 w-4" />
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Clinical Competencies</span>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {lead!.SpecialistSkills.map((s, i) => (
                                                        <div key={i} className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2 group/skill hover:bg-cyan-500/10 hover:border-cyan-500/20 transition-all">
                                                            <span className="text-[10px] font-bold text-slate-300 group-hover/skill:text-cyan-300">{s.skill}</span>
                                                            {s.endorsementCount > 0 && <span className="text-[9px] font-black text-cyan-600">+{s.endorsementCount}</span>}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Specialist Locations */}
                                {lead!.SpecialistLocations && lead!.SpecialistLocations.length > 0 && (
                                    <div className="group p-6 rounded-3xl bg-slate-50 border border-slate-200">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="p-2.5 bg-rose-100 rounded-2xl text-rose-600">
                                                <MapPin className="h-5 w-5" />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Service Coverage</span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {lead!.SpecialistLocations.map((loc, i) => (
                                                <div key={i} className="p-4 rounded-2xl bg-white border border-slate-200 flex items-start justify-between gap-3 group/loc hover:bg-slate-50 transition-all">
                                                    <div className="min-w-0">
                                                        {loc.url ? (
                                                            <a href={loc.url} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-900 font-black hover:text-rose-600 transition-colors flex items-center gap-1.5 uppercase tracking-tighter">
                                                                {loc.name} <ExternalLink className="h-3 w-3 opacity-30" />
                                                            </a>
                                                        ) : (
                                                            <span className="text-xs text-slate-900 font-black uppercase tracking-tighter">{loc.name}</span>
                                                        )}
                                                        {loc.address && <div className="text-[10px] text-slate-500 truncate mt-1 font-medium">{loc.address}</div>}
                                                    </div>
                                                    {loc.rating && (
                                                        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 shrink-0 border border-amber-100">
                                                            <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                                                            <span className="text-[10px] font-black text-amber-600">{loc.rating.toFixed(1)}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Hospital Core Data */}
                                {lead!.AreasOfExpertise && lead!.AreasOfExpertise.length > 0 && (
                                    <div className="group p-6 rounded-3xl bg-white/[0.03] border border-white/5">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="p-2.5 bg-amber-500/10 rounded-2xl text-amber-400">
                                                <Award className="h-5 w-5" />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Service Lines & Excellence</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mb-6">
                                            {lead!.AreasOfExpertise.map((area, i) => (
                                                <div key={i} className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2 hover:bg-amber-500/10 hover:border-amber-500/20 transition-all">
                                                    <span className="text-[10px] font-bold text-slate-300">{area.name}</span>
                                                    {area.count > 0 && <span className="text-[9px] font-black text-amber-600">{area.count}</span>}
                                                </div>
                                            ))}
                                        </div>
                                        {(lead!.TotalSpecialists || lead!.Followers) && (
                                            <div className="flex gap-6 p-4 rounded-2xl bg-white/5 border border-white/5">
                                                {lead!.TotalSpecialists && (
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] text-slate-600 uppercase font-black tracking-widest mb-1">Scale</span>
                                                        <span className="text-xs text-slate-300 font-bold">{lead!.TotalSpecialists} Specialists</span>
                                                    </div>
                                                )}
                                                {lead!.Followers && (
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] text-slate-600 uppercase font-black tracking-widest mb-1">Reputation</span>
                                                        <span className="text-xs text-slate-300 font-bold">{lead!.Followers} Followers</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Hospital Amenities */}
                                {lead!.HospitalFacilities && (
                                    <div className="group p-6 rounded-3xl bg-white/[0.03] border border-white/5 space-y-6">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2.5 bg-teal-500/10 rounded-2xl text-teal-400">
                                                <Building className="h-5 w-5" />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Facility Infrastructure</span>
                                        </div>
                                        {lead!.HospitalFacilities.parking && (
                                            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5">
                                                <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-4">Patient Logistics (Parking)</div>
                                                <div className="flex flex-wrap gap-3">
                                                    <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${lead!.HospitalFacilities.parking.available ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                                        {lead!.HospitalFacilities.parking.available ? '✅ Available' : '❌ Restricted'}
                                                    </span>
                                                    {lead!.HospitalFacilities.parking.onSite && <span className="px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl text-[10px] font-black uppercase">On-Site</span>}
                                                    {lead!.HospitalFacilities.parking.disabled && <span className="px-3 py-1.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl text-[10px] font-black uppercase">♿ Access</span>}
                                                    {lead!.HospitalFacilities.parking.paid && <span className="px-3 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl text-[10px] font-black uppercase">Premium Charge</span>}
                                                </div>
                                            </div>
                                        )}
                                        {lead!.HospitalFacilities.healthcareServices && lead!.HospitalFacilities.healthcareServices.length > 0 && (
                                            <div className="space-y-3">
                                                <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Clinical Services</div>
                                                <div className="flex flex-wrap gap-2">
                                                    {lead!.HospitalFacilities.healthcareServices.map((s, idx) => (
                                                        <span key={idx} className="px-3 py-1.5 bg-white/5 border border-white/5 rounded-xl text-[10px] font-bold text-slate-400">{s}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Services & Clinical Depth */}
                                {((lead!.Services && lead!.Services.length > 0) || (lead!.Treatments && lead!.Treatments.length > 0) || (lead!.ConditionsTreated && lead!.ConditionsTreated.length > 0)) && (
                                    <div className="group p-6 rounded-3xl bg-white/[0.03] border border-white/5 space-y-8">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-rose-500/10 rounded-2xl text-rose-400">
                                                <Activity className="h-5 w-5" />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Clinical Scope</span>
                                        </div>
                                        
                                        {lead!.Services && lead!.Services.length > 0 && (
                                            <div className="space-y-3">
                                                <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest pl-1">Primary Services</div>
                                                <div className="flex flex-wrap gap-2">
                                                    {lead!.Services.map((s, idx) => (
                                                        <span key={idx} className="px-3 py-1.5 bg-white/5 border border-white/5 rounded-xl text-[10px] font-bold text-slate-400 hover:text-rose-400 hover:border-rose-400/20 transition-colors">{s}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {lead!.Treatments && lead!.Treatments.length > 0 && (
                                            <div className="space-y-3">
                                                <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest pl-1">Specialized Treatments</div>
                                                <div className="flex flex-wrap gap-2">
                                                    {lead!.Treatments.map((t, idx) => (
                                                        <span key={idx} className="px-3 py-1.5 bg-rose-500/5 border border-rose-500/10 rounded-xl text-[10px] font-bold text-rose-300">{t}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {lead!.ConditionsTreated && lead!.ConditionsTreated.length > 0 && (
                                            <div className="space-y-3">
                                                <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest pl-1">Treatable Conditions</div>
                                                <div className="flex flex-wrap gap-2">
                                                    {lead!.ConditionsTreated.map((c, idx) => (
                                                        <span key={idx} className="px-3 py-1.5 bg-amber-500/5 border border-amber-500/10 rounded-xl text-[10px] font-bold text-amber-300">{c}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Regulatory Intel (CQC) */}
                                {lead!.DetailedRatings && lead!.DetailedRatings.length > 0 && (
                                    <div className="group p-6 rounded-3xl bg-blue-50/50 border border-blue-100">
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2.5 bg-amber-100 rounded-2xl text-amber-600">
                                                    <ShieldCheck className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">CQC Inspection Report</span>
                                                    <span className="text-[9px] font-bold text-slate-400">{lead!.RatingDate || 'Recent Audit'}</span>
                                                </div>
                                            </div>
                                            <div className="px-3 py-1 bg-amber-50 border border-amber-100 rounded-full text-[10px] font-black text-amber-600 uppercase tracking-widest">
                                                Official Status
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {lead!.DetailedRatings.map((r, i) => (
                                                <div key={i} className="flex flex-col p-4 rounded-2xl bg-white border border-slate-200 group/rating hover:border-blue-500/30 transition-all">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{r.category}</span>
                                                    <div className="flex items-center gap-2">
                                                        <div className={clsx(
                                                            "h-2 w-2 rounded-full",
                                                            r.rating?.toLowerCase() === 'outstanding' ? 'bg-emerald-500' :
                                                            r.rating?.toLowerCase() === 'good' ? 'bg-blue-500' :
                                                            'bg-amber-500'
                                                        )} />
                                                        <span className={clsx(
                                                            "text-sm font-black uppercase tracking-tighter",
                                                            r.rating?.toLowerCase() === 'outstanding' ? 'text-emerald-700' :
                                                            r.rating?.toLowerCase() === 'good' ? 'text-blue-700' :
                                                            'text-amber-700'
                                                        )}>
                                                            {r.rating}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
 drum

                                {/* Financial Ecosystem */}
                                {((lead!.Insurance && lead!.Insurance.length > 0) || (lead!.PaymentMethods && lead!.PaymentMethods.length > 0)) && (
                                    <div className="group p-6 rounded-3xl bg-white/[0.03] border border-white/5">
                                        <div className="flex items-center gap-3 mb-8">
                                            <div className="p-2.5 bg-emerald-500/10 rounded-2xl text-emerald-400">
                                                <CreditCard className="h-5 w-5" />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Payment & Insurance Intel</span>
                                        </div>
                                        
                                        <div className="space-y-6">
                                            {lead!.Insurance && lead!.Insurance.length > 0 && (
                                                <div>
                                                    <div className="text-[10px] text-slate-600 uppercase font-black tracking-widest mb-3">Recognized Carriers</div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {lead!.Insurance.map((ins, idx) => (
                                                            <span key={idx} className="px-3 py-1.5 bg-indigo-500/5 border border-indigo-500/10 rounded-xl text-[10px] font-bold text-indigo-300">{ins}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {lead!.PaymentMethods && lead!.PaymentMethods.length > 0 && (
                                                <div>
                                                    <div className="text-[10px] text-slate-600 uppercase font-black tracking-widest mb-3">Direct Settlement Options</div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {lead!.PaymentMethods.map((pm, idx) => (
                                                            <span key={idx} className="px-3 py-1.5 bg-white/5 border border-white/5 rounded-xl text-[10px] font-bold text-slate-400">{pm}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Market Reputation (Reviews) */}
                                {lead!.Reviews && lead!.Reviews.length > 0 && (
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3 ml-2">
                                            <div className="p-2 bg-amber-100 rounded-xl text-amber-600">
                                                <MessageSquare className="h-4 w-4" />
                                            </div>
                                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">Patient Sentiment Analysis</h3>
                                        </div>
                                        <div className="space-y-4">
                                            {lead!.Reviews.map((rev, idx) => (
                                                <div key={idx} className="p-6 rounded-3xl bg-slate-50 border border-slate-200 hover:bg-white hover:shadow-lg hover:shadow-slate-500/5 transition-all">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-600 font-black text-xs">
                                                                {rev.author?.[0] || 'A'}
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-black text-slate-900">{rev.author}</div>
                                                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{rev.date}</div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-0.5 px-2 py-1 bg-amber-50 border border-amber-100 rounded-lg">
                                                            <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                                                            <span className="text-xs font-black text-amber-600">{rev.rating}</span>
                                                        </div>
                                                    </div>
                                                    <p className="text-slate-600 text-sm leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all">
                                                        {rev.text}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Market Reputation (Restored & Improved) */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 ml-2">
                                        <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
                                            <ExternalLink className="h-4 w-4" />
                                        </div>
                                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">External Intelligence Links</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <a
                                            href={`https://www.trustpilot.com/search?query=${encodeURIComponent(lead!.Name)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-4 p-5 bg-[#00b67a]/5 hover:bg-[#00b67a]/10 border border-[#00b67a]/20 rounded-2xl transition-all group"
                                        >
                                            <div className="p-3 bg-[#00b67a]/10 rounded-xl group-hover:scale-110 transition-transform">
                                                <Star className="h-5 w-5 text-[#00b67a] fill-[#00b67a]" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-black text-[#00b67a]">Trustpilot Review Hub</div>
                                                <div className="text-[10px] text-slate-400 font-bold uppercase">Verify Patient Sentiment →</div>
                                            </div>
                                        </a>

                                        <a
                                            href={`https://www.google.com/maps/search/${encodeURIComponent(lead!.Name + ' ' + (lead!.Postcode || ''))}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-4 p-5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-2xl transition-all group"
                                        >
                                            <div className="p-3 bg-blue-100 rounded-xl group-hover:scale-110 transition-transform" >
                                                <MapPin className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-black text-blue-600">Google Maps Intelligence</div>
                                                <div className="text-[10px] text-slate-400 font-bold uppercase">Locate & Verify Facility →</div>
                                            </div>
                                        </a>
                                    </div>
                                </div>

                                {/* Intelligence Origin */}
                                <div className="flex flex-col items-center gap-4 pt-12 pb-4">
                                    <div className="h-px w-24 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                    <div className="flex flex-wrap justify-center items-center gap-6">
                                        {lead!.SourceUrl && (
                                            <a href={lead!.SourceUrl} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 p-4 rounded-2xl bg-slate-800/40 border border-white/5 hover:border-purple-500/30 transition-all">
                                                <div className="p-2 bg-purple-500/10 rounded-xl">
                                                    <Globe className="h-4 w-4 text-purple-400" />
                                                </div>
                                                <div>
                                                    <div className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Source Intel</div>
                                                    <div className="text-[10px] text-slate-500 font-bold">View Origin Page →</div>
                                                </div>
                                            </a>
                                        )}
                                        {lead!.ProviderId && (
                                            <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-800/40 border border-white/5">
                                                <div className="p-2 bg-indigo-500/10 rounded-xl">
                                                    <Cpu className="h-4 w-4 text-indigo-400" />
                                                </div>
                                                <div>
                                                    <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Provider ID</div>
                                                    <div className="text-[10px] font-mono text-slate-500">{lead!.ProviderId}</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] mt-6 px-6 py-2 bg-white/5 rounded-full border border-white/5">
                                        {lead!.IcbName ? `${lead!.IcbName} • Intelligence Nexus` : 'MedLeads Strategic Intelligence'}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Doctor Profile Drill-Down Panel */}
                    {selectedDoctorUrl && (
                        <DoctorProfilePanel
                            profileUrl={selectedDoctorUrl}
                            doctorName={selectedDoctorName}
                            onClose={() => { setSelectedDoctorUrl(null); setSelectedDoctorName(''); }}
                        />
                    )}

                    {/* Footer */}
                    <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3 shrink-0">
                        <button
                            onClick={onSave}
                            disabled={isSaved || loading}
                            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSaved ? "Saved to Records" : "Save Lead"}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
