'use client';

import React, { useEffect, useState } from 'react';
import { X, Star, Phone, MapPin, Globe, Calendar, FileText, Activity, Award, Clock, ExternalLink, MessageCircle, Mail, Heart, Languages, GraduationCap, DollarSign, MapPinned, Brain, Sparkles, Stethoscope, ChevronLeft, Loader2, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DoctorData {
    Name: string;
    Url: string;
    Address?: string;
    City?: string;
    Postcode?: string;
    Phone?: string;
    Email?: string;
    Website?: string;
    Rating?: number;
    ReviewCount?: number;
    Description?: string;
    ImageUrl?: string;
    Specialties?: string[];
    Categories?: string[];
    PageType?: string;
    Bio?: string;
    AiReviewSummary?: string;
    YearsOfExperience?: number;
    Education?: { degree: string; institution?: string; year?: string }[];
    Skills?: { skill: string; endorsementCount: number }[];
    ConsultationFees?: { newPatient?: string; followUp?: string; currency?: string };
    PracticeLocations?: { name: string; address?: string; rating?: number; url?: string }[];
    Doctors?: any[];
    Reviews?: { author?: string; rating?: number; date?: string; text: string }[];
    Services?: string[];
    Treatments?: string[];
    ConditionsTreated?: string[];
    Insurance?: string[];
    Languages?: string[];
    SocialMedia?: any;
    Accreditations?: string[];
    OpeningHours?: any;
    AggregateRating?: { ratingValue: number; ratingCount: number };
    ScrapedAt?: string;
}

interface DoctorProfilePanelProps {
    profileUrl: string | null;
    doctorName?: string;
    onClose: () => void;
}

function PillList({ items, color = 'blue' }: { items: string[]; color?: string }) {
    const colorMap: Record<string, string> = {
        blue: 'bg-blue-50 text-blue-700 border-blue-100',
        teal: 'bg-teal-50 text-teal-700 border-teal-100',
        rose: 'bg-rose-50 text-rose-700 border-rose-100',
        amber: 'bg-amber-50 text-amber-700 border-amber-100',
        indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
        emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    };
    return (
        <div className="flex flex-wrap gap-1">
            {items.map((item, i) => (
                <span key={i} className={`px-2 py-0.5 ${colorMap[color] || colorMap.blue} border rounded-full text-[10px] font-bold`}>{item}</span>
            ))}
        </div>
    );
}

function SectionHeader({ icon, label, color = 'text-slate-400' }: { icon: React.ReactNode; label: string; color?: string }) {
    return (
        <div className="flex items-center gap-2 mb-3">
            <span className={color}>{icon}</span>
            <span className="text-xs text-slate-500 uppercase font-black tracking-wider">{label}</span>
        </div>
    );
}

export default function DoctorProfilePanel({ profileUrl, doctorName, onClose }: DoctorProfilePanelProps) {
    const [doctor, setDoctor] = useState<DoctorData | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        if (!profileUrl) return;

        setLoading(true);
        setNotFound(false);
        setDoctor(null);

        fetch(`/api/leads/doctor?url=${encodeURIComponent(profileUrl)}`)
            .then(res => res.json())
            .then(data => {
                if (data.found && data.doctor) {
                    setDoctor(data.doctor);
                } else {
                    setNotFound(true);
                }
            })
            .catch(() => setNotFound(true))
            .finally(() => setLoading(false));
    }, [profileUrl]);

    if (!profileUrl) return null;

    // Get the main doctor profile (first in the Doctors array, or use top-level data)
    const mainDoc = doctor?.Doctors?.[0];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                className="absolute inset-0 bg-white z-10 flex flex-col overflow-hidden"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-50 to-white p-4 border-b border-slate-100 shrink-0">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white border border-blue-700 shadow-sm uppercase tracking-widest">
                                    🩺 Dr Intelligence
                                </span>
                            </div>
                            <h3 className="text-lg font-black text-slate-900 truncate mt-1">
                                {loading ? (doctorName || 'Loading...') : (doctor?.Name || doctorName || 'Doctor Profile')}
                            </h3>
                            {!loading && doctor?.Specialties && doctor.Specialties.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {doctor.Specialties.slice(0, 3).map((s, i) => (
                                        <span key={i} className="px-1.5 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded text-[9px] font-bold">{s}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                        {!loading && doctor?.Rating && (
                            <div className="text-right shrink-0 p-2 bg-amber-50 rounded-xl border border-amber-100 shadow-sm">
                                <div className="flex items-center gap-1 justify-end">
                                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                                    <span className="text-sm font-black text-amber-600">{doctor.Rating.toFixed(1)}</span>
                                </div>
                                {doctor.ReviewCount ? <div className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">{doctor.ReviewCount} reviews</div> : null}
                            </div>
                        )}
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Loading state */}
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Hydrating Pulse...</p>
                            <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">Hydrating Pulse...</p>
                        </div>
                    )}

                    {/* Not found state */}
                    {!loading && notFound && (
                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                            <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center">
                                <Stethoscope className="h-8 w-8 text-slate-300" />
                            </div>
                            <p className="text-sm text-slate-500 text-center font-medium">
                                Doctor profile not found in local intelligence.<br />
                                <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 font-black mt-2 inline-flex items-center gap-1 uppercase tracking-tighter">
                                    Verify on Doctify <ExternalLink className="h-3 w-3" />
                                </a>
                            </p>
                        </div>
                    )}

                    {/* Doctor profile data */}
                    {!loading && doctor && (
                        <>
                            {/* Contact info */}
                            <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-bold">
                                {doctor.Address && (
                                    <span className="flex items-center gap-1.5 text-slate-500">
                                        <MapPin className="h-3.5 w-3.5 text-rose-500" />
                                        {doctor.Address}
                                    </span>
                                )}
                                {doctor.Phone && (
                                    <div className="flex flex-wrap gap-x-2 items-center">
                                        <Phone className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                        {doctor.Phone.split(/[,;]/).map((p, idx) => (
                                            <a key={idx} href={`tel:${p.trim()}`} className="text-emerald-600 hover:text-emerald-700 whitespace-nowrap">{p.trim()}</a>
                                        ))}
                                    </div>
                                )}
                                {doctor.Email && (
                                    <a href={`mailto:${doctor.Email}`} className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700">
                                        <Mail className="h-3.5 w-3.5" />{doctor.Email}
                                    </a>
                                )}
                                {doctor.Website && (
                                    <div className="flex flex-wrap gap-x-2 items-center break-all">
                                        <Globe className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                                        {doctor.Website.split(/[,;]/).map((w, idx) => (
                                            <a key={idx} href={w.trim().startsWith('http') ? w.trim() : `https://${w.trim()}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700">
                                                {w.trim().replace(/^https?:\/\//, '').replace(/\/$/, '') || 'Website'}
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Bio / About */}
                            {doctor.Bio && (
                                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm">
                                    <SectionHeader icon={<FileText className="h-4 w-4" />} label="Professional Dossier" color="text-blue-600" />
                                    <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">{doctor.Bio}</p>
                                    {doctor.YearsOfExperience && (
                                        <div className="flex items-center gap-2 text-sm text-slate-600 mt-4 pt-4 border-t border-slate-200">
                                            <Calendar className="h-4 w-4 text-emerald-600" />
                                            <span className="font-black text-emerald-700">{doctor.YearsOfExperience}+ years</span> of clinical tenure
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* AI Review Summary */}
                            {doctor.AiReviewSummary && (
                                <div className="p-5 bg-blue-600/5 rounded-2xl border border-blue-600/10 relative overflow-hidden group/ai">
                                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover/ai:scale-125 transition-transform">
                                        <Sparkles className="h-10 w-10 text-blue-600" />
                                    </div>
                                    <SectionHeader icon={<Sparkles className="h-4 w-4" />} label="Sentiment engine Summary" color="text-blue-700" />
                                    <p className="text-slate-800 text-sm font-medium italic relative z-10 leading-relaxed">{"\u201C"}{doctor.AiReviewSummary}{"\u201D"}</p>
                                </div>
                            )}

                            {/* Consultation Fees */}
                            {doctor.ConsultationFees && (
                                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm">
                                    <SectionHeader icon={<DollarSign className="h-4 w-4" />} label="Consultation Fees" color="text-emerald-600" />
                                    <div className="grid grid-cols-2 gap-3">
                                        {doctor.ConsultationFees.newPatient && (
                                            <div className="p-3 bg-white border border-slate-100 rounded-xl text-center shadow-sm">
                                                <div className="text-[10px] text-slate-500 uppercase">New Patient</div>
                                                <div className="text-lg font-bold text-emerald-600">{doctor.ConsultationFees.newPatient}</div>
                                            </div>
                                        )}
                                        {doctor.ConsultationFees.followUp && (
                                            <div className="p-3 bg-white border border-slate-100 rounded-xl text-center shadow-sm">
                                                <div className="text-[10px] text-slate-500 uppercase">Follow-up</div>
                                                <div className="text-lg font-bold text-blue-600">{doctor.ConsultationFees.followUp}</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Qualifications & Education */}
                            {doctor.Education && doctor.Education.length > 0 && (
                                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm">
                                    <SectionHeader icon={<GraduationCap className="h-4 w-4" />} label={`Academic credentials (${doctor.Education.length})`} color="text-indigo-600" />
                                    <div className="space-y-2">
                                        {doctor.Education.map((edu, i) => (
                                            <div key={i} className="p-3 bg-white border border-slate-100 rounded-xl flex items-center justify-between shadow-sm">
                                                <div>
                                                    <span className="text-xs text-slate-900 font-black uppercase tracking-tight">{edu.degree}</span>
                                                    {edu.institution && <span className="text-[10px] text-slate-500 block mt-0.5">{edu.institution}</span>}
                                                </div>
                                                {edu.year && <span className="px-2 py-1 bg-slate-100 rounded text-[9px] font-bold text-slate-500">{edu.year}</span>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Skills, Insurance & Languages */}
                            <div className="space-y-4">
                                {doctor.Skills && doctor.Skills.length > 0 && (
                                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
                                        <SectionHeader icon={<Brain className="h-4 w-4" />} label={`Active competencies (${doctor.Skills.length})`} color="text-blue-600" />
                                        <PillList items={doctor.Skills.map(s => `${s.skill} (${s.endorsementCount})`)} color="blue" />
                                    </div>
                                )}
                                
                                {doctor.Insurance && doctor.Insurance.length > 0 && (
                                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
                                        <SectionHeader icon={<Shield className="h-4 w-4" />} label="Recognized Carriers" color="text-indigo-600" />
                                        <PillList items={doctor.Insurance} color="indigo" />
                                    </div>
                                )}

                                {doctor.Languages && doctor.Languages.length > 0 && (
                                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
                                        <SectionHeader icon={<Languages className="h-4 w-4" />} label="Linguistic capabilities" color="text-purple-600" />
                                        <PillList items={doctor.Languages} color="purple" />
                                    </div>
                                )}
                            </div>

                            {/* Practice Locations */}
                            {doctor.PracticeLocations && doctor.PracticeLocations.length > 0 && (
                                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm">
                                    <SectionHeader icon={<MapPinned className="h-4 w-4" />} label={`Strategic Deployments (${doctor.PracticeLocations.length})`} color="text-rose-600" />
                                    <div className="space-y-2">
                                        {doctor.PracticeLocations.map((loc, i) => (
                                            <div key={i} className="p-3 bg-white border border-slate-100 rounded-xl flex items-center justify-between shadow-sm group/loc hover:border-rose-200 transition-all">
                                                <div className="min-w-0">
                                                    {loc.url ? (
                                                        <a href={loc.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:text-blue-700 font-black uppercase tracking-tighter">
                                                            {loc.name} <ExternalLink className="h-3 w-3 inline opacity-50" />
                                                        </a>
                                                    ) : (
                                                        <span className="text-xs text-slate-900 font-black uppercase tracking-tighter">{loc.name}</span>
                                                    )}
                                                    {loc.address && <div className="text-[10px] text-slate-500 truncate mt-0.5">{loc.address}</div>}
                                                </div>
                                                {loc.rating && (
                                                    <div className="flex items-center gap-1 shrink-0 p-1.5 bg-amber-50 rounded-lg border border-amber-100">
                                                        <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                                                        <span className="text-[10px] font-black text-amber-600">{loc.rating.toFixed(1)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Services & Treatments */}
                            {((doctor.Services && doctor.Services.length > 0) || (doctor.Treatments && doctor.Treatments.length > 0) || (doctor.ConditionsTreated && doctor.ConditionsTreated.length > 0)) && (
                                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                                    {doctor.Services && doctor.Services.length > 0 && (
                                        <div>
                                            <SectionHeader icon={<Activity className="h-4 w-4" />} label={`Services Rendered (${doctor.Services.length})`} color="text-teal-600" />
                                            <PillList items={doctor.Services} color="teal" />
                                        </div>
                                    )}
                                    {doctor.Treatments && doctor.Treatments.length > 0 && (
                                        <div>
                                            <SectionHeader icon={<Heart className="h-4 w-4" />} label={`Therapeutic Interventions (${doctor.Treatments.length})`} color="text-rose-600" />
                                            <PillList items={doctor.Treatments} color="rose" />
                                        </div>
                                    )}
                                    {doctor.ConditionsTreated && doctor.ConditionsTreated.length > 0 && (
                                        <div>
                                            <SectionHeader icon={<Activity className="h-4 w-4" />} label={`Conditions Managed (${doctor.ConditionsTreated.length})`} color="text-amber-600" />
                                            <PillList items={doctor.ConditionsTreated} color="amber" />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Reviews */}
                            {doctor.Reviews && doctor.Reviews.length > 0 && (
                                <div className="space-y-4">
                                    <SectionHeader icon={<MessageCircle className="h-4 w-4" />} label={`Patient Sentiment (${doctor.Reviews.length})`} color="text-amber-600" />
                                    <div className="space-y-3">
                                        {doctor.Reviews.slice(0, 5).map((review, i) => (
                                            <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 hover:bg-white hover:shadow-lg transition-all">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs font-black text-slate-900 uppercase tracking-tighter">{review.author || 'Intelligence Anonymous'}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold">{review.date}</span>
                                                </div>
                                                {review.rating && (
                                                    <div className="flex items-center gap-0.5 mb-3">
                                                        {[1, 2, 3, 4, 5].map(s => (
                                                            <Star key={s} className={`h-3 w-3 ${s <= review.rating! ? 'text-amber-500 fill-amber-500' : 'text-slate-200'}`} />
                                                        ))}
                                                    </div>
                                                )}
                                                <p className="text-xs text-slate-600 leading-relaxed font-medium italic">{"\u201C"}{review.text}{"\u201D"}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* View on Doctify link */}
                            <div className="text-center pt-8 pb-4">
                                <a
                                    href={doctor.Url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                                >
                                    Verify full Dossier on Doctify <ExternalLink className="h-3 w-3" />
                                </a>
                            </div>
                        </>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
