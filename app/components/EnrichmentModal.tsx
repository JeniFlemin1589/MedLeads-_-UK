'use client';

import React from 'react';
import { X, Phone, MapPin, Globe, Building, Star, Users, Shield, Calendar, FileText, Activity, Award, Clock, ExternalLink, MessageCircle, Search } from 'lucide-react';
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

    // CQC-specific fields
    Region?: string;
    OverallRating?: string;
    RatingDate?: string;
    DetailedRatings?: { category: string; rating: string }[];
    Contacts?: { name: string; roles: string[] }[];
    RegulatedActivities?: string[];
    ServiceTypes?: string[];
    Specialisms?: string[];
    InspectionCategories?: string[];
    LastInspectionDate?: string;
    LastReportDate?: string;
    Reports?: { date: string; uri: string }[];
    RegistrationDate?: string;
    LocalAuthority?: string;
    IcbName?: string;
    NumberOfBeds?: number;
    ProviderId?: string;
}

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

export default function EnrichmentModal({ isOpen, onClose, lead, loading, onSave, isSaved, placesData, placesLoading }: EnrichmentModalProps) {
    if (!isOpen || !lead) return null;

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
                            <div className="flex items-center gap-2 mb-2">
                                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/20">
                                    {lead.Type}
                                </span>
                                {lead.OverallRating && <RatingBadge rating={lead.OverallRating} />}
                            </div>
                            <h2 className="text-2xl font-bold text-white leading-tight">{lead.Name}</h2>
                            <p className="text-slate-400 text-sm mt-1 flex items-center gap-2">
                                <Building className="h-3 w-3" /> {lead.ODS_Code}
                                {lead.Region && <span className="text-slate-500">• {lead.Region}</span>}
                            </p>
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
                                    </div>
                                </div>

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

                                {/* Key People / Contacts */}
                                {lead.Contacts && lead.Contacts.length > 0 && (
                                    <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Users className="h-4 w-4 text-cyan-400" />
                                            <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Key People</span>
                                        </div>
                                        <div className="space-y-2">
                                            {lead.Contacts.map((c, i) => (
                                                <div key={i} className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg">
                                                    <span className="text-sm text-slate-200 font-medium">{c.name}</span>
                                                    <span className="text-[10px] text-slate-500 uppercase">{c.roles.join(', ')}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Services & Activities */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {lead.RegulatedActivities && lead.RegulatedActivities.length > 0 && (
                                        <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Shield className="h-4 w-4 text-indigo-400" />
                                                <span className="text-[10px] text-slate-400 uppercase font-semibold">Regulated Activities</span>
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {lead.RegulatedActivities.map((a, i) => (
                                                    <span key={i} className="px-2 py-0.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-full text-[10px] font-medium">{a}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {lead.ServiceTypes && lead.ServiceTypes.length > 0 && (
                                        <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Activity className="h-4 w-4 text-teal-400" />
                                                <span className="text-[10px] text-slate-400 uppercase font-semibold">Service Types</span>
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {lead.ServiceTypes.map((s, i) => (
                                                    <span key={i} className="px-2 py-0.5 bg-teal-500/10 text-teal-300 border border-teal-500/20 rounded-full text-[10px] font-medium">{s}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Specialisms */}
                                {lead.Specialisms && lead.Specialisms.length > 0 && (
                                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Award className="h-4 w-4 text-rose-400" />
                                            <span className="text-[10px] text-slate-400 uppercase font-semibold">Specialisms</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            {lead.Specialisms.map((s, i) => (
                                                <span key={i} className="px-2 py-0.5 bg-rose-500/10 text-rose-300 border border-rose-500/20 rounded-full text-[10px] font-medium">{s}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Inspection Info */}
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

                                {/* Reports */}
                                {lead.Reports && lead.Reports.length > 0 && (
                                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                        <div className="flex items-center gap-2 mb-2">
                                            <FileText className="h-4 w-4 text-slate-400" />
                                            <span className="text-[10px] text-slate-400 uppercase font-semibold">CQC Inspection Reports</span>
                                        </div>
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
                                            {/* Google Rating + Reviews Count */}
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

                                            {/* Business Status + Open Now */}
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

                                            {/* Opening Hours */}
                                            {placesData.weekdayHours && placesData.weekdayHours.length > 0 && (
                                                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Clock className="h-4 w-4 text-blue-400" />
                                                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Opening Hours</span>
                                                    </div>
                                                    <div className="grid grid-cols-1 gap-0.5">
                                                        {placesData.weekdayHours.map((h: string, i: number) => (
                                                            <div key={i} className="text-xs text-slate-400 py-0.5">{h}</div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Google Reviews */}
                                            {placesData.reviews && placesData.reviews.length > 0 && (
                                                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <MessageCircle className="h-4 w-4 text-yellow-400" />
                                                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Recent Reviews</span>
                                                    </div>
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
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="p-1.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                                            <ExternalLink className="h-4 w-4 text-white" />
                                        </div>
                                        <span className="text-sm font-bold text-white uppercase tracking-wider">Patient Reviews</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        {/* Trustpilot Link */}
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

                                        {/* Google Maps Link */}
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
                                    </div>
                                </div>

                                {/* ICB Info */}
                                {lead.IcbName && (
                                    <div className="text-[10px] text-slate-600 text-center pt-2">
                                        {lead.IcbName}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

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
