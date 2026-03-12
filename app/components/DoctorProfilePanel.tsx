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
                className="absolute inset-0 bg-slate-900 z-10 flex flex-col overflow-hidden"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-cyan-900/30 to-slate-900 p-4 border-b border-white/10 shrink-0">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/20">
                                    🩺 DOCTOR PROFILE
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-white truncate mt-1">
                                {loading ? (doctorName || 'Loading...') : (doctor?.Name || doctorName || 'Doctor Profile')}
                            </h3>
                            {!loading && doctor?.Specialties && doctor.Specialties.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {doctor.Specialties.slice(0, 3).map((s, i) => (
                                        <span key={i} className="px-1.5 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded text-[9px]">{s}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                        {!loading && doctor?.Rating && (
                            <div className="text-right shrink-0">
                                <div className="flex items-center gap-1">
                                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                                    <span className="text-sm font-bold text-yellow-400">{doctor.Rating.toFixed(1)}</span>
                                </div>
                                {doctor.ReviewCount ? <div className="text-[9px] text-slate-500">{doctor.ReviewCount} reviews</div> : null}
                            </div>
                        )}
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Loading state */}
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                            <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
                            <p className="text-sm text-slate-400">Loading doctor profile...</p>
                        </div>
                    )}

                    {/* Not found state */}
                    {!loading && notFound && (
                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                            <Stethoscope className="h-12 w-12 text-slate-700" />
                            <p className="text-sm text-slate-400 text-center">
                                Doctor profile not yet in our database.<br />
                                <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 mt-1 inline-flex items-center gap-1">
                                    View on Doctify <ExternalLink className="h-3 w-3" />
                                </a>
                            </p>
                        </div>
                    )}

                    {/* Doctor profile data */}
                    {!loading && doctor && (
                        <>
                            {/* Contact info */}
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                                {doctor.Address && (
                                    <span className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3 text-rose-400" />
                                        {doctor.Address}
                                    </span>
                                )}
                                {doctor.Phone && (
                                    <a href={`tel:${doctor.Phone}`} className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300">
                                        <Phone className="h-3 w-3" />{doctor.Phone}
                                    </a>
                                )}
                                {doctor.Email && (
                                    <a href={`mailto:${doctor.Email}`} className="flex items-center gap-1 text-blue-400 hover:text-blue-300">
                                        <Mail className="h-3 w-3" />{doctor.Email}
                                    </a>
                                )}
                                {doctor.Website && (
                                    <a href={doctor.Website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-400 hover:text-blue-300">
                                        <Globe className="h-3 w-3" />Website
                                    </a>
                                )}
                            </div>

                            {/* Bio / About */}
                            {doctor.Bio && (
                                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                    <SectionHeader icon={<FileText className="h-4 w-4" />} label="About" color="text-sky-400" />
                                    <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">{doctor.Bio}</p>
                                    {doctor.YearsOfExperience && (
                                        <div className="flex items-center gap-2 text-sm text-slate-400 mt-3">
                                            <Calendar className="h-4 w-4 text-emerald-400" />
                                            <span className="font-medium text-emerald-300">{doctor.YearsOfExperience}+ years</span> of experience
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* AI Review Summary */}
                            {doctor.AiReviewSummary && (
                                <div className="p-4 bg-purple-500/5 rounded-xl border border-purple-500/10">
                                    <SectionHeader icon={<Sparkles className="h-4 w-4" />} label="What Patients Say" color="text-purple-400" />
                                    <p className="text-slate-300 text-sm leading-relaxed italic">{"\u201C"}{doctor.AiReviewSummary}{"\u201D"}</p>
                                </div>
                            )}

                            {/* Consultation Fees */}
                            {doctor.ConsultationFees && (
                                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                    <SectionHeader icon={<DollarSign className="h-4 w-4" />} label="Consultation Fees" color="text-emerald-400" />
                                    <div className="grid grid-cols-2 gap-3">
                                        {doctor.ConsultationFees.newPatient && (
                                            <div className="p-3 bg-slate-800/50 rounded-lg text-center">
                                                <div className="text-[10px] text-slate-500 uppercase">New Patient</div>
                                                <div className="text-lg font-bold text-emerald-400">{doctor.ConsultationFees.newPatient}</div>
                                            </div>
                                        )}
                                        {doctor.ConsultationFees.followUp && (
                                            <div className="p-3 bg-slate-800/50 rounded-lg text-center">
                                                <div className="text-[10px] text-slate-500 uppercase">Follow-up</div>
                                                <div className="text-lg font-bold text-blue-400">{doctor.ConsultationFees.followUp}</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Qualifications & Education */}
                            {doctor.Education && doctor.Education.length > 0 && (
                                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                    <SectionHeader icon={<GraduationCap className="h-4 w-4" />} label={`Education (${doctor.Education.length})`} color="text-indigo-400" />
                                    <div className="space-y-2">
                                        {doctor.Education.map((edu, i) => (
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

                            {/* Skills & Endorsements */}
                            {doctor.Skills && doctor.Skills.length > 0 && (
                                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                    <SectionHeader icon={<Brain className="h-4 w-4" />} label={`Skills & Endorsements (${doctor.Skills.length})`} color="text-cyan-400" />
                                    <div className="flex flex-wrap gap-2">
                                        {doctor.Skills.map((s, i) => (
                                            <span key={i} className="px-2 py-1 bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 rounded-full text-[10px] font-medium">
                                                {s.skill}{s.endorsementCount > 0 && <span className="ml-1 text-cyan-500">({s.endorsementCount})</span>}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Practice Locations */}
                            {doctor.PracticeLocations && doctor.PracticeLocations.length > 0 && (
                                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                    <SectionHeader icon={<MapPinned className="h-4 w-4" />} label={`Practice Locations (${doctor.PracticeLocations.length})`} color="text-rose-400" />
                                    <div className="space-y-2">
                                        {doctor.PracticeLocations.map((loc, i) => (
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

                            {/* Services & Treatments */}
                            {((doctor.Services && doctor.Services.length > 0) || (doctor.Treatments && doctor.Treatments.length > 0) || (doctor.ConditionsTreated && doctor.ConditionsTreated.length > 0)) && (
                                <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-3">
                                    {doctor.Services && doctor.Services.length > 0 && (
                                        <div>
                                            <SectionHeader icon={<Activity className="h-4 w-4" />} label={`Services (${doctor.Services.length})`} color="text-teal-400" />
                                            <PillList items={doctor.Services} color="teal" />
                                        </div>
                                    )}
                                    {doctor.Treatments && doctor.Treatments.length > 0 && (
                                        <div>
                                            <SectionHeader icon={<Heart className="h-4 w-4" />} label={`Treatments (${doctor.Treatments.length})`} color="text-rose-400" />
                                            <PillList items={doctor.Treatments} color="rose" />
                                        </div>
                                    )}
                                    {doctor.ConditionsTreated && doctor.ConditionsTreated.length > 0 && (
                                        <div>
                                            <SectionHeader icon={<Activity className="h-4 w-4" />} label={`Conditions (${doctor.ConditionsTreated.length})`} color="text-amber-400" />
                                            <PillList items={doctor.ConditionsTreated} color="amber" />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Insurance */}
                            {doctor.Insurance && doctor.Insurance.length > 0 && (
                                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                    <SectionHeader icon={<Shield className="h-4 w-4" />} label={`Insurance Accepted (${doctor.Insurance.length})`} color="text-indigo-400" />
                                    <PillList items={doctor.Insurance} color="indigo" />
                                </div>
                            )}

                            {/* Languages */}
                            {doctor.Languages && doctor.Languages.length > 0 && (
                                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                    <SectionHeader icon={<Languages className="h-4 w-4" />} label={`Languages (${doctor.Languages.length})`} color="text-purple-400" />
                                    <PillList items={doctor.Languages} color="purple" />
                                </div>
                            )}

                            {/* Reviews */}
                            {doctor.Reviews && doctor.Reviews.length > 0 && (
                                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                    <SectionHeader icon={<MessageCircle className="h-4 w-4" />} label={`Patient Reviews (${doctor.Reviews.length})`} color="text-yellow-400" />
                                    <div className="space-y-2">
                                        {doctor.Reviews.slice(0, 5).map((review, i) => (
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

                            {/* View on Doctify link */}
                            <div className="text-center pt-2 pb-4">
                                <a
                                    href={doctor.Url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-600/20 rounded-xl text-blue-400 text-xs font-medium transition-colors"
                                >
                                    View full profile on Doctify <ExternalLink className="h-3 w-3" />
                                </a>
                            </div>
                        </>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
