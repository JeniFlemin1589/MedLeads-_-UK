'use client';

import React, { useState } from 'react';
import { X, Phone, MapPin, Globe, Building, Star, Users, Shield, Calendar, FileText, Activity, Award, Clock, ExternalLink, MessageCircle, Search, Mail, Heart, Pill, Languages, Image, BadgeCheck, Facebook, Twitter, Instagram, Linkedin, Youtube, Briefcase, Stethoscope, CheckCircle, GraduationCap, DollarSign, MapPinned, Brain, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
        'Outstanding': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        'Good': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        'Requires improvement': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        'Inadequate': 'bg-red-500/20 text-red-300 border-red-500/30',
    };
    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${colors[rating] || 'bg-slate-500/20 text-slate-300 border-slate-500/30'}`}>
            {rating}
        </span>
    );
}

function GoogleStars({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} className={`h-4 w-4 ${i <= Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`} />
            ))}
            <span className="text-sm font-bold text-white ml-1">{rating.toFixed(1)}</span>
        </div>
    );
}

function PillList({ items, color = 'indigo' }: { items: string[]; color?: string }) {
    const colorMap: Record<string, string> = {
        indigo: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
        teal: 'bg-teal-500/10 text-teal-300 border-teal-500/20',
        rose: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
        amber: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
        cyan: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
        purple: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
        emerald: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
        sky: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
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
            <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">{label}</span>
        </div>
    );
}

export default function EnrichmentModal({ isOpen, onClose, lead, loading, onSave, isSaved, placesData, placesLoading }: EnrichmentModalProps) {
    const [selectedDoctorUrl, setSelectedDoctorUrl] = useState<string | null>(null);
    const [selectedDoctorName, setSelectedDoctorName] = useState<string>('');

    if (!isOpen || !lead) return null;

    const isScraped = lead.Type === 'Scraped Lead';

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative w-full max-w-2xl max-h-[85vh] bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 border-b border-white/5 shrink-0">
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                        <div className="pr-8">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${isScraped ? 'bg-purple-500/20 text-purple-400 border-purple-500/20' : 'bg-amber-500/20 text-amber-400 border-amber-500/20'}`}>
                                    {isScraped ? (lead.Source === 'doctify' ? '🔵 Doctify' : lead.Source || lead.Type) : lead.Type}
                                </span>
                                {lead.PageType && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-700/50 text-slate-400 border border-slate-600/30 capitalize">
                                        {lead.PageType}
                                    </span>
                                )}
                                {lead.OverallRating && <RatingBadge rating={lead.OverallRating} />}
                                {lead.AcceptingNewPatients !== undefined && lead.AcceptingNewPatients !== null && (
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${lead.AcceptingNewPatients ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'}`}>
                                        {lead.AcceptingNewPatients ? '✅ Accepting Patients' : '❌ Not Accepting'}
                                    </span>
                                )}
                            </div>
                            <h2 className="text-2xl font-bold text-white leading-tight">{lead.Name}</h2>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <p className="text-slate-400 text-sm flex items-center gap-2">
                                    <Building className="h-3 w-3" /> {lead.ODS_Code?.slice(0, 8)}
                                    {lead.Region && <span className="text-slate-500">• {lead.Region}</span>}
                                </p>
                                {/* Doctify star rating in header */}
                                {lead.Rating && lead.Rating > 0 && (
                                    <div className="flex items-center gap-1">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <Star key={i} className={`h-3.5 w-3.5 ${i <= Math.round(lead.Rating!) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`} />
                                        ))}
                                        <span className="text-sm font-bold text-yellow-400 ml-0.5">{lead.Rating.toFixed(1)}</span>
                                        {lead.ReviewCount ? <span className="text-xs text-slate-500">({lead.ReviewCount} reviews)</span> : null}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Scrollable Content */}
                    <div className="p-6 space-y-5 overflow-y-auto flex-1">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-4">
                                <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
                                <p>Fetching details...</p>
                            </div>
                        ) : (
                            <>
                                {/* Contact Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                                        <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 shrink-0">
                                            <Phone className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-[10px] text-slate-500 uppercase font-semibold">Phone</div>
                                            <div className="text-slate-200 font-medium text-sm">
                                                {lead.PhoneNumber ? (
                                                    <a href={`tel:${lead.PhoneNumber}`} className="hover:text-emerald-400 transition-colors">{lead.PhoneNumber}</a>
                                                ) : <span className="text-slate-600 italic">Not available</span>}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                                        <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400 shrink-0">
                                            <Globe className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-[10px] text-slate-500 uppercase font-semibold">Website</div>
                                            <div className="text-sm truncate">
                                                {lead.Website ? (
                                                    <a href={lead.Website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{lead.Website.replace(/^https?:\/\//, '')}</a>
                                                ) : <span className="text-slate-600 italic">Not available</span>}
                                            </div>
                                        </div>
                                    </div>

                                    {lead.Email && (
                                        <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                                            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400 shrink-0">
                                                <Mail className="h-4 w-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-[10px] text-slate-500 uppercase font-semibold">Email</div>
                                                <div className="text-sm truncate">
                                                    <a href={`mailto:${lead.Email}`} className="text-amber-400 hover:underline">{lead.Email}</a>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {lead.FaxNumber && (
                                        <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                                            <div className="p-2 bg-slate-500/10 rounded-lg text-slate-400 shrink-0">
                                                <Phone className="h-4 w-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-[10px] text-slate-500 uppercase font-semibold">Fax</div>
                                                <div className="text-slate-200 font-medium text-sm">{lead.FaxNumber}</div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Address */}
                                <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 shrink-0">
                                        <MapPin className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-slate-500 uppercase font-semibold">Address</div>
                                        <div className="text-slate-200 text-sm">
                                            {lead.FullAddress || [lead.Address, lead.City, lead.Postcode].filter(Boolean).join(', ')}
                                        </div>
                                        {lead.LocalAuthority && (
                                            <div className="text-slate-500 text-xs mt-1">{lead.LocalAuthority} • {lead.Region}</div>
                                        )}
                                        {lead.AreaServed && (
                                            <div className="text-slate-500 text-xs mt-1">Area served: {lead.AreaServed}</div>
                                        )}
                                    </div>
                                </div>

                                {/* ============================================================ */}
                                {/* ABOUT / DESCRIPTION (Doctify) */}
                                {/* ============================================================ */}
                                {(lead.Description || lead.AboutText) && (
                                    <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                        <SectionHeader icon={<FileText className="h-4 w-4" />} label="About" color="text-sky-400" />
                                        <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                                            {lead.AboutText || lead.Description}
                                        </p>
                                        <div className="flex flex-wrap gap-3 mt-3">
                                            {lead.FoundationDate && (
                                                <span className="text-[10px] text-slate-500"><Calendar className="h-3 w-3 inline mr-1" />Founded: {lead.FoundationDate}</span>
                                            )}
                                            {lead.NumberOfEmployees && (
                                                <span className="text-[10px] text-slate-500"><Users className="h-3 w-3 inline mr-1" />{lead.NumberOfEmployees} employees</span>
                                            )}
                                            {lead.PriceRange && (
                                                <span className="text-[10px] text-slate-500">💰 Price: {lead.PriceRange}</span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* ============================================================ */}
                                {/* OPENING HOURS (Doctify) */}
                                {/* ============================================================ */}
                                {lead.OpeningHours && (
                                    <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                        <SectionHeader icon={<Clock className="h-4 w-4" />} label="Opening Hours" color="text-blue-400" />
                                        {Array.isArray(lead.OpeningHours) ? (
                                            <div className="grid grid-cols-1 gap-1">
                                                {lead.OpeningHours.map((h, i) => (
                                                    <div key={i} className="flex items-center justify-between py-1.5 px-3 bg-slate-800/50 rounded-lg">
                                                        <span className="text-xs font-medium text-slate-300">{h.day}</span>
                                                        <span className="text-xs text-slate-400">{h.opens} — {h.closes}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-sm text-slate-400">{String(lead.OpeningHours)}</div>
                                        )}
                                    </div>
                                )}

                                {/* ============================================================ */}
                                {/* DOCTORS & SPECIALISTS (Doctify) */}
                                {/* ============================================================ */}
                                {lead.Contacts && lead.Contacts.length > 0 && (
                                    <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                        <SectionHeader icon={<Stethoscope className="h-4 w-4" />} label={isScraped ? `Doctors & Specialists (${lead.Contacts.length})` : 'Key People'} color="text-cyan-400" />
                                        <div className="space-y-2">
                                            {lead.Contacts.map((c, i) => (
                                                <div key={i} className="p-3 bg-slate-800/50 rounded-lg border border-white/5">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                {c.title && <span className="text-[10px] text-purple-400 font-semibold">{c.title}</span>}
                                                                <span className="text-sm text-slate-200 font-bold">{c.name}</span>
                                                                {c.profileUrl && (
                                                                    <button
                                                                        onClick={() => { setSelectedDoctorUrl(c.profileUrl!); setSelectedDoctorName(c.name); }}
                                                                        className="text-[10px] px-2 py-0.5 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/20 rounded-full transition-colors"
                                                                    >
                                                                        View Profile
                                                                    </button>
                                                                )}
                                                            </div>
                                                            <div className="text-[10px] text-slate-500 mt-0.5">
                                                                {c.roles?.join(', ')}
                                                            </div>
                                                            {c.qualifications && (
                                                                <div className="text-[10px] text-emerald-400/70 mt-0.5">{c.qualifications}</div>
                                                            )}
                                                            {c.gmcNumber && (
                                                                <div className="text-[10px] text-slate-600 mt-0.5">GMC: {c.gmcNumber}</div>
                                                            )}
                                                            {c.subSpecialties && c.subSpecialties.length > 0 && (
                                                                <div className="flex flex-wrap gap-1 mt-1">
                                                                    {c.subSpecialties.map((s, j) => (
                                                                        <span key={j} className="px-1.5 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded text-[9px]">{s}</span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                        {c.rating && c.rating > 0 && (
                                                            <div className="text-right shrink-0">
                                                                <div className="flex items-center gap-0.5">
                                                                    <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                                                                    <span className="text-xs font-bold text-yellow-400">{c.rating.toFixed(1)}</span>
                                                                </div>
                                                                {c.reviewCount ? <div className="text-[9px] text-slate-500">{c.reviewCount} reviews</div> : null}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* ============================================================ */}
                                {/* SPECIALIST BIO & DETAILS (for specialist pages) */}
                                {/* ============================================================ */}
                                {(lead.SpecialistBio || lead.AiReviewSummary || lead.YearsOfExperience) && (
                                    <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-3">
                                        {lead.SpecialistBio && (
                                            <div>
                                                <SectionHeader icon={<FileText className="h-4 w-4" />} label="Professional Bio" color="text-sky-400" />
                                                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line line-clamp-6">{lead.SpecialistBio}</p>
                                            </div>
                                        )}
                                        {lead.AiReviewSummary && (
                                            <div>
                                                <SectionHeader icon={<Sparkles className="h-4 w-4" />} label="What Patients Say (AI Summary)" color="text-purple-400" />
                                                <p className="text-slate-300 text-sm leading-relaxed italic">{"\u201C"}{lead.AiReviewSummary}{"\u201D"}</p>
                                            </div>
                                        )}
                                        {lead.YearsOfExperience && (
                                            <div className="flex items-center gap-2 text-sm text-slate-400">
                                                <Calendar className="h-4 w-4 text-emerald-400" />
                                                <span className="font-medium text-emerald-300">{lead.YearsOfExperience}+ years</span> of experience
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ============================================================ */}
                                {/* CONSULTATION FEES (Specialist) */}
                                {/* ============================================================ */}
                                {lead.SpecialistFees && (
                                    <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                        <SectionHeader icon={<DollarSign className="h-4 w-4" />} label="Consultation Fees" color="text-emerald-400" />
                                        <div className="grid grid-cols-2 gap-3">
                                            {lead.SpecialistFees.newPatient && (
                                                <div className="p-3 bg-slate-800/50 rounded-lg text-center">
                                                    <div className="text-[10px] text-slate-500 uppercase">New Patient</div>
                                                    <div className="text-lg font-bold text-emerald-400">{lead.SpecialistFees.newPatient}</div>
                                                </div>
                                            )}
                                            {lead.SpecialistFees.followUp && (
                                                <div className="p-3 bg-slate-800/50 rounded-lg text-center">
                                                    <div className="text-[10px] text-slate-500 uppercase">Follow-up</div>
                                                    <div className="text-lg font-bold text-blue-400">{lead.SpecialistFees.followUp}</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* ============================================================ */}
                                {/* EDUCATION & QUALIFICATIONS (Specialist) */}
                                {/* ============================================================ */}
                                {lead.SpecialistEducation && lead.SpecialistEducation.length > 0 && (
                                    <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                        <SectionHeader icon={<GraduationCap className="h-4 w-4" />} label={`Education (${lead.SpecialistEducation.length})`} color="text-indigo-400" />
                                        <div className="space-y-2">
                                            {lead.SpecialistEducation.map((edu, i) => (
                                                <div key={i} className="p-2 bg-slate-800/50 rounded-lg flex items-center justify-between">
                                                    <div>
                                                        <span className="text-xs text-slate-200 font-medium">{edu.degree}</span>
                                                        {edu.institution && <span className="text-[10px] text-slate-500 ml-2">— {edu.institution}</span>}
                                                    </div>
                                                    {edu.year && <span className="text-[10px] text-slate-600">{edu.year}</span>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* ============================================================ */}
                                {/* SKILLS & ENDORSEMENTS (Specialist) */}
                                {/* ============================================================ */}
                                {lead.SpecialistSkills && lead.SpecialistSkills.length > 0 && (
                                    <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                        <SectionHeader icon={<Brain className="h-4 w-4" />} label={`Skills & Endorsements (${lead.SpecialistSkills.length})`} color="text-cyan-400" />
                                        <div className="flex flex-wrap gap-2">
                                            {lead.SpecialistSkills.map((s, i) => (
                                                <span key={i} className="px-2 py-1 bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 rounded-full text-[10px] font-medium">
                                                    {s.skill}{s.endorsementCount > 0 && <span className="ml-1 text-cyan-500">({s.endorsementCount})</span>}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* ============================================================ */}
                                {/* PRACTICE LOCATIONS (Specialist) */}
                                {/* ============================================================ */}
                                {lead.SpecialistLocations && lead.SpecialistLocations.length > 0 && (
                                    <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                        <SectionHeader icon={<MapPinned className="h-4 w-4" />} label={`Practice Locations (${lead.SpecialistLocations.length})`} color="text-rose-400" />
                                        <div className="space-y-2">
                                            {lead.SpecialistLocations.map((loc, i) => (
                                                <div key={i} className="p-2 bg-slate-800/50 rounded-lg flex items-center justify-between">
                                                    <div className="min-w-0">
                                                        {loc.url ? (
                                                            <a href={loc.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:text-blue-300 font-medium">
                                                                {loc.name} <ExternalLink className="h-3 w-3 inline" />
                                                            </a>
                                                        ) : (
                                                            <span className="text-xs text-slate-200 font-medium">{loc.name}</span>
                                                        )}
                                                        {loc.address && <div className="text-[10px] text-slate-500 truncate">{loc.address}</div>}
                                                    </div>
                                                    {loc.rating && (
                                                        <div className="flex items-center gap-0.5 shrink-0">
                                                            <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                                                            <span className="text-[10px] font-bold text-yellow-400">{loc.rating.toFixed(1)}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* ============================================================ */}
                                {/* AREAS OF EXPERTISE (Hospital) */}
                                {/* ============================================================ */}
                                {lead.AreasOfExpertise && lead.AreasOfExpertise.length > 0 && (
                                    <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                        <SectionHeader icon={<Award className="h-4 w-4" />} label={`Areas of Expertise (${lead.AreasOfExpertise.length})`} color="text-amber-400" />
                                        <div className="flex flex-wrap gap-2">
                                            {lead.AreasOfExpertise.map((area, i) => (
                                                <span key={i} className="px-2 py-1 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-full text-[10px] font-medium">
                                                    {area.name}{area.count > 0 && <span className="ml-1 text-amber-500">({area.count})</span>}
                                                </span>
                                            ))}
                                        </div>
                                        {(lead.TotalSpecialists || lead.Followers) && (
                                            <div className="flex gap-4 mt-3 text-[10px] text-slate-500">
                                                {lead.TotalSpecialists && <span><Users className="h-3 w-3 inline mr-1" />{lead.TotalSpecialists} specialists</span>}
                                                {lead.Followers && <span><Heart className="h-3 w-3 inline mr-1" />{lead.Followers} followers</span>}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ============================================================ */}
                                {/* HOSPITAL FACILITIES (Detailed) */}
                                {/* ============================================================ */}
                                {lead.HospitalFacilities && (
                                    <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-3">
                                        <SectionHeader icon={<Building className="h-4 w-4" />} label="Hospital Facilities & Services" color="text-teal-400" />
                                        {lead.HospitalFacilities.parking && (
                                            <div className="p-3 bg-slate-800/50 rounded-lg">
                                                <div className="text-[10px] text-slate-500 uppercase mb-1">Parking</div>
                                                <div className="flex flex-wrap gap-2">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] border ${lead.HospitalFacilities.parking.available ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' : 'bg-red-500/10 text-red-300 border-red-500/20'}`}>
                                                        {lead.HospitalFacilities.parking.available ? '✅ Available' : '❌ Not Available'}
                                                    </span>
                                                    {lead.HospitalFacilities.parking.onSite && <span className="px-2 py-0.5 bg-sky-500/10 text-sky-300 border border-sky-500/20 rounded text-[10px]">On-site</span>}
                                                    {lead.HospitalFacilities.parking.disabled && <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded text-[10px]">♿ Disabled</span>}
                                                    {lead.HospitalFacilities.parking.paid && <span className="px-2 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded text-[10px]">💰 Paid</span>}
                                                </div>
                                            </div>
                                        )}
                                        {lead.HospitalFacilities.healthcareServices && lead.HospitalFacilities.healthcareServices.length > 0 && (
                                            <div>
                                                <div className="text-[10px] text-slate-500 uppercase mb-1">Healthcare Services</div>
                                                <PillList items={lead.HospitalFacilities.healthcareServices} color="teal" />
                                            </div>
                                        )}
                                        {lead.HospitalFacilities.generalFacilities && lead.HospitalFacilities.generalFacilities.length > 0 && (
                                            <div>
                                                <div className="text-[10px] text-slate-500 uppercase mb-1">General Facilities</div>
                                                <PillList items={lead.HospitalFacilities.generalFacilities} color="sky" />
                                            </div>
                                        )}
                                        <div className="flex flex-wrap gap-3 text-[10px]">
                                            {lead.HospitalFacilities.seesChildren !== null && lead.HospitalFacilities.seesChildren !== undefined && (
                                                <span className={lead.HospitalFacilities.seesChildren ? 'text-emerald-400' : 'text-slate-600'}>
                                                    {lead.HospitalFacilities.seesChildren ? '👶 Sees Children' : '🚫 No Children'}
                                                </span>
                                            )}
                                            {lead.HospitalFacilities.internationalPatients !== null && lead.HospitalFacilities.internationalPatients !== undefined && (
                                                <span className={lead.HospitalFacilities.internationalPatients ? 'text-emerald-400' : 'text-slate-600'}>
                                                    {lead.HospitalFacilities.internationalPatients ? '🌍 International Patients' : '🚫 No International'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* ============================================================ */}
                                {/* SERVICES, TREATMENTS, CONDITIONS (Doctify) */}
                                {/* ============================================================ */}
                                {((lead.Services && lead.Services.length > 0) || (lead.Treatments && lead.Treatments.length > 0) || (lead.ConditionsTreated && lead.ConditionsTreated.length > 0)) && (
                                    <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-3">
                                        {lead.Services && lead.Services.length > 0 && (
                                            <div>
                                                <SectionHeader icon={<Activity className="h-4 w-4" />} label={`Services (${lead.Services.length})`} color="text-teal-400" />
                                                <PillList items={lead.Services} color="teal" />
                                            </div>
                                        )}
                                        {lead.Treatments && lead.Treatments.length > 0 && (
                                            <div>
                                                <SectionHeader icon={<Pill className="h-4 w-4" />} label={`Treatments (${lead.Treatments.length})`} color="text-rose-400" />
                                                <PillList items={lead.Treatments} color="rose" />
                                            </div>
                                        )}
                                        {lead.ConditionsTreated && lead.ConditionsTreated.length > 0 && (
                                            <div>
                                                <SectionHeader icon={<Heart className="h-4 w-4" />} label={`Conditions Treated (${lead.ConditionsTreated.length})`} color="text-amber-400" />
                                                <PillList items={lead.ConditionsTreated} color="amber" />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* CQC Ratings */}
                                {lead.DetailedRatings && lead.DetailedRatings.length > 0 && (
                                    <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Star className="h-4 w-4 text-amber-400" />
                                            <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">CQC Ratings</span>
                                            {lead.RatingDate && <span className="text-[10px] text-slate-600 ml-auto">{lead.RatingDate}</span>}
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                            {lead.DetailedRatings.map((r, i) => (
                                                <div key={i} className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg">
                                                    <span className="text-xs text-slate-400">{r.category}</span>
                                                    <RatingBadge rating={r.rating} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* ============================================================ */}
                                {/* INSURANCE & PAYMENT (Doctify) */}
                                {/* ============================================================ */}
                                {((lead.Insurance && lead.Insurance.length > 0) || (lead.PaymentMethods && lead.PaymentMethods.length > 0)) && (
                                    <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-3">
                                        {lead.Insurance && lead.Insurance.length > 0 && (
                                            <div>
                                                <SectionHeader icon={<Shield className="h-4 w-4" />} label={`Insurance Accepted (${lead.Insurance.length})`} color="text-indigo-400" />
                                                <PillList items={lead.Insurance} color="indigo" />
                                            </div>
                                        )}
                                        {lead.PaymentMethods && lead.PaymentMethods.length > 0 && (
                                            <div>
                                                <SectionHeader icon={<Briefcase className="h-4 w-4" />} label="Payment Methods" color="text-emerald-400" />
                                                <PillList items={lead.PaymentMethods} color="emerald" />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ============================================================ */}
                                {/* FACILITIES, LANGUAGES, SPECIALTIES */}
                                {/* ============================================================ */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {lead.Facilities && lead.Facilities.length > 0 && (
                                        <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                            <SectionHeader icon={<Building className="h-4 w-4" />} label="Facilities" color="text-sky-400" />
                                            <PillList items={lead.Facilities} color="sky" />
                                        </div>
                                    )}

                                    {lead.Languages && lead.Languages.length > 0 && (
                                        <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                            <SectionHeader icon={<Languages className="h-4 w-4" />} label="Languages" color="text-purple-400" />
                                            <PillList items={lead.Languages} color="purple" />
                                        </div>
                                    )}

                                    {lead.RegulatedActivities && lead.RegulatedActivities.length > 0 && (
                                        <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                            <SectionHeader icon={<Shield className="h-4 w-4" />} label="Regulated Activities" color="text-indigo-400" />
                                            <PillList items={lead.RegulatedActivities} color="indigo" />
                                        </div>
                                    )}

                                    {((lead.ServiceTypes && lead.ServiceTypes.length > 0) || (lead.Specialties && lead.Specialties.length > 0)) && (
                                        <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                            <SectionHeader icon={<Activity className="h-4 w-4" />} label={lead.Specialties?.length ? 'Specialties' : 'Service Types'} color="text-teal-400" />
                                            <PillList items={lead.Specialties?.length ? lead.Specialties : (lead.ServiceTypes || [])} color="teal" />
                                        </div>
                                    )}
                                </div>

                                {/* Specialisms (CQC) */}
                                {lead.Specialisms && lead.Specialisms.length > 0 && (
                                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                        <SectionHeader icon={<Award className="h-4 w-4" />} label="Specialisms" color="text-rose-400" />
                                        <PillList items={lead.Specialisms} color="rose" />
                                    </div>
                                )}

                                {/* ============================================================ */}
                                {/* ACCREDITATIONS (Doctify) */}
                                {/* ============================================================ */}
                                {lead.Accreditations && lead.Accreditations.length > 0 && (
                                    <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                        <SectionHeader icon={<BadgeCheck className="h-4 w-4" />} label="Accreditations" color="text-amber-400" />
                                        <PillList items={lead.Accreditations} color="amber" />
                                    </div>
                                )}

                                {/* ============================================================ */}
                                {/* DOCTIFY REVIEWS */}
                                {/* ============================================================ */}
                                {lead.Reviews && lead.Reviews.length > 0 && (
                                    <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                        <SectionHeader icon={<MessageCircle className="h-4 w-4" />} label={`Doctify Reviews (${lead.Reviews.length})`} color="text-yellow-400" />
                                        <div className="space-y-2">
                                            {lead.Reviews.slice(0, 5).map((review, i) => (
                                                <div key={i} className="p-3 bg-slate-800/50 rounded-lg border border-white/5">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-xs font-medium text-slate-300">{review.author || 'Anonymous'}</span>
                                                        <span className="text-[10px] text-slate-600">{review.date}</span>
                                                    </div>
                                                    {review.rating && (
                                                        <div className="flex items-center gap-0.5 mb-2">
                                                            {[1, 2, 3, 4, 5].map(s => (
                                                                <Star key={s} className={`h-3 w-3 ${s <= review.rating! ? 'text-yellow-400 fill-yellow-400' : 'text-slate-700'}`} />
                                                            ))}
                                                        </div>
                                                    )}
                                                    <p className="text-xs text-slate-400 line-clamp-3">{review.text}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* ============================================================ */}
                                {/* SOCIAL MEDIA (Doctify) */}
                                {/* ============================================================ */}
                                {lead.SocialMedia && Object.values(lead.SocialMedia).some(v => v) && (
                                    <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                        <SectionHeader icon={<Globe className="h-4 w-4" />} label="Social Media" color="text-blue-400" />
                                        <div className="flex flex-wrap gap-2">
                                            {lead.SocialMedia.facebook && (
                                                <a href={lead.SocialMedia.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-600/20 rounded-xl text-blue-400 text-xs font-medium transition-colors">
                                                    <Facebook className="h-4 w-4" /> Facebook
                                                </a>
                                            )}
                                            {lead.SocialMedia.twitter && (
                                                <a href={lead.SocialMedia.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 rounded-xl text-sky-400 text-xs font-medium transition-colors">
                                                    <Twitter className="h-4 w-4" /> Twitter
                                                </a>
                                            )}
                                            {lead.SocialMedia.instagram && (
                                                <a href={lead.SocialMedia.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/20 rounded-xl text-pink-400 text-xs font-medium transition-colors">
                                                    <Instagram className="h-4 w-4" /> Instagram
                                                </a>
                                            )}
                                            {lead.SocialMedia.linkedin && (
                                                <a href={lead.SocialMedia.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 bg-blue-700/10 hover:bg-blue-700/20 border border-blue-700/20 rounded-xl text-blue-300 text-xs font-medium transition-colors">
                                                    <Linkedin className="h-4 w-4" /> LinkedIn
                                                </a>
                                            )}
                                            {lead.SocialMedia.youtube && (
                                                <a href={lead.SocialMedia.youtube} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-red-400 text-xs font-medium transition-colors">
                                                    <Youtube className="h-4 w-4" /> YouTube
                                                </a>
                                            )}
                                            {lead.SocialMedia.tiktok && (
                                                <a href={lead.SocialMedia.tiktok} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 bg-slate-500/10 hover:bg-slate-500/20 border border-slate-500/20 rounded-xl text-slate-300 text-xs font-medium transition-colors">
                                                    🎵 TikTok
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* ============================================================ */}
                                {/* GALLERY IMAGES (Doctify) */}
                                {/* ============================================================ */}
                                {lead.GalleryImages && lead.GalleryImages.length > 0 && (
                                    <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                        <SectionHeader icon={<Image className="h-4 w-4" />} label={`Gallery (${lead.GalleryImages.length})`} color="text-pink-400" />
                                        <div className="grid grid-cols-3 gap-2">
                                            {lead.GalleryImages.slice(0, 6).map((img, i) => (
                                                <a key={i} href={img} target="_blank" rel="noopener noreferrer" className="rounded-lg overflow-hidden border border-white/5 hover:border-purple-500/30 transition-colors">
                                                    <img src={img} alt={`Gallery ${i + 1}`} className="w-full h-20 object-cover" loading="lazy" />
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Inspection Info (CQC) */}
                                <div className="grid grid-cols-2 gap-3">
                                    {lead.LastInspectionDate && (
                                        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                                            <Calendar className="h-4 w-4 text-orange-400 shrink-0" />
                                            <div>
                                                <div className="text-[10px] text-slate-500 uppercase font-semibold">Last Inspection</div>
                                                <div className="text-slate-200 text-sm">{lead.LastInspectionDate}</div>
                                            </div>
                                        </div>
                                    )}
                                    {lead.RegistrationDate && (
                                        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                                            <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                                            <div>
                                                <div className="text-[10px] text-slate-500 uppercase font-semibold">Registered Since</div>
                                                <div className="text-slate-200 text-sm">{lead.RegistrationDate}</div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Reports (CQC) */}
                                {lead.Reports && lead.Reports.length > 0 && (
                                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                        <SectionHeader icon={<FileText className="h-4 w-4" />} label="CQC Inspection Reports" color="text-slate-400" />
                                        <div className="space-y-1">
                                            {lead.Reports.map((r, i) => (
                                                <a key={i} href={r.uri} target="_blank" rel="noopener noreferrer"
                                                    className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg hover:bg-slate-700/50 transition-colors group">
                                                    <span className="text-xs text-slate-300">Report: {r.date}</span>
                                                    <ExternalLink className="h-3 w-3 text-slate-500 group-hover:text-blue-400" />
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* ================================================================ */}
                                {/* GOOGLE PLACES ANALYSIS SECTION */}
                                {/* ================================================================ */}
                                <div className="border-t border-white/10 pt-4 mt-4">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="p-1.5 bg-gradient-to-r from-blue-500 to-red-500 rounded-lg">
                                            <Search className="h-4 w-4 text-white" />
                                        </div>
                                        <span className="text-sm font-bold text-white uppercase tracking-wider">Google Analysis</span>
                                        {placesLoading && (
                                            <div className="animate-spin h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full ml-2"></div>
                                        )}
                                    </div>

                                    {placesLoading ? (
                                        <div className="text-center py-6 text-slate-500 text-xs">
                                            <div className="animate-pulse">Searching Google Places...</div>
                                        </div>
                                    ) : placesData ? (
                                        <div className="space-y-3">
                                            {placesData.rating && (
                                                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-500/10 to-transparent rounded-xl border border-blue-500/10">
                                                    <div>
                                                        <div className="text-[10px] text-slate-500 uppercase font-semibold mb-1">Google Rating</div>
                                                        <GoogleStars rating={placesData.rating} />
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-2xl font-bold text-white">{placesData.totalReviews}</div>
                                                        <div className="text-[10px] text-slate-500">Reviews</div>
                                                    </div>
                                                </div>
                                            )}

                                            {placesData.openNow !== undefined && (
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${placesData.openNow ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'}`}>
                                                        {placesData.openNow ? '● OPEN NOW' : '● CLOSED'}
                                                    </span>
                                                    {placesData.googleMapsUrl && (
                                                        <a href={placesData.googleMapsUrl} target="_blank" rel="noopener noreferrer"
                                                            className="text-[10px] text-blue-400 hover:underline flex items-center gap-1">
                                                            View on Google Maps <ExternalLink className="h-3 w-3" />
                                                        </a>
                                                    )}
                                                </div>
                                            )}

                                            {placesData.weekdayHours && placesData.weekdayHours.length > 0 && (
                                                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                                    <SectionHeader icon={<Clock className="h-4 w-4" />} label="Opening Hours" color="text-blue-400" />
                                                    <div className="grid grid-cols-1 gap-0.5">
                                                        {placesData.weekdayHours.map((h: string, i: number) => (
                                                            <div key={i} className="text-xs text-slate-400 py-0.5">{h}</div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {placesData.reviews && placesData.reviews.length > 0 && (
                                                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                                    <SectionHeader icon={<MessageCircle className="h-4 w-4" />} label="Recent Google Reviews" color="text-yellow-400" />
                                                    <div className="space-y-3">
                                                        {placesData.reviews.map((review: any, i: number) => (
                                                            <div key={i} className="p-3 bg-slate-800/50 rounded-lg border border-white/5">
                                                                <div className="flex items-center justify-between mb-1">
                                                                    <span className="text-xs font-medium text-slate-300">{review.author}</span>
                                                                    <span className="text-[10px] text-slate-600">{review.time}</span>
                                                                </div>
                                                                <div className="flex items-center gap-0.5 mb-2">
                                                                    {[1, 2, 3, 4, 5].map(s => (
                                                                        <Star key={s} className={`h-3 w-3 ${s <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-700'}`} />
                                                                    ))}
                                                                </div>
                                                                <p className="text-xs text-slate-400 line-clamp-3">{review.text}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center py-4 text-slate-600 text-xs">
                                            No Google Places data found for this location.
                                        </div>
                                    )}
                                </div>

                                {/* ================================================================ */}
                                {/* PATIENT REVIEW LINKS SECTION */}
                                {/* ================================================================ */}
                                <div className="border-t border-white/10 pt-4 mt-4">
                                    <SectionHeader icon={<ExternalLink className="h-4 w-4" />} label="Patient Reviews" color="text-emerald-400" />
                                    <div className="grid grid-cols-2 gap-3">
                                        <a
                                            href={`https://www.trustpilot.com/search?query=${encodeURIComponent(lead.Name)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 p-3 bg-[#00b67a]/10 hover:bg-[#00b67a]/20 border border-[#00b67a]/20 rounded-xl transition-all group cursor-pointer"
                                        >
                                            <div className="p-2 bg-[#00b67a]/20 rounded-lg group-hover:bg-[#00b67a]/30 transition-colors">
                                                <Star className="h-4 w-4 text-[#00b67a]" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-[#00b67a]">Trustpilot</div>
                                                <div className="text-[10px] text-slate-500">View Reviews →</div>
                                            </div>
                                        </a>

                                        <a
                                            href={`https://www.google.com/maps/search/${encodeURIComponent(lead.Name + ' ' + (lead.Postcode || ''))}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 p-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-xl transition-all group cursor-pointer"
                                        >
                                            <div className="p-2 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                                                <MapPin className="h-4 w-4 text-blue-400" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-blue-400">Google Maps</div>
                                                <div className="text-[10px] text-slate-500">View Location →</div>
                                            </div>
                                        </a>

                                        {lead.SourceUrl && (
                                            <a
                                                href={lead.SourceUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-3 p-3 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-xl transition-all group cursor-pointer"
                                            >
                                                <div className="p-2 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-colors">
                                                    <Globe className="h-4 w-4 text-purple-400" />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold text-purple-400">Doctify Page</div>
                                                    <div className="text-[10px] text-slate-500">View Source →</div>
                                                </div>
                                            </a>
                                        )}
                                    </div>
                                </div>

                                {/* ICB / Metadata */}
                                {(lead.IcbName || lead.ScrapedAt) && (
                                    <div className="text-[10px] text-slate-600 text-center pt-2 space-y-0.5">
                                        {lead.IcbName && <div>{lead.IcbName}</div>}
                                        {lead.ScrapedAt && <div>Scraped: {new Date(lead.ScrapedAt).toLocaleDateString()}</div>}
                                    </div>
                                )}
                            </>
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
                    <div className="p-4 border-t border-white/5 bg-white/5 flex gap-3 shrink-0">
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
