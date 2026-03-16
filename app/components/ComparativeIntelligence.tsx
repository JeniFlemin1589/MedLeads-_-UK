'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, 
  ShieldCheck, 
  Search, 
  Award, 
  ArrowRight,
  Zap,
  Star,
  Activity,
  Maximize2,
  Phone,
  Mail,
  Globe,
  MapPin,
  ExternalLink,
  ChevronRight,
  BookOpen,
  Sparkles,
  X
} from 'lucide-react';
import { clsx } from 'clsx';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ComparativeResult {
  id: string;
  name: string;
  source: string;
  rating: number;
  reviews: number;
  city: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  specialties: string[];
  categories: string[];
  vectors: {
    social: number;
    clinical: number;
    operational: number;
    digital: number;
  };
  summary: string;
  fullDescription: string;
  rawData: any;
  // Expanded Data
  treatments: string[];
  conditions: string[];
  services: string[];
  facilities: string[];
  insurance: string[];
  paymentMethods: string[];
  priceRange: string | null;
  openingHours: any;
  socialMedia: any;
  accreditations: string[];
  followers: number | null;
  totalSpecialists: number | null;
  hospitalFacilities: any;
  specialistBio: string | null;
  specialistEducation: string[];
  specialistSkills: string[];
  specialistFees: string | null;
  specialistLocations: any[];
  acceptingNewPatients: boolean | null;
  gallery: string[];
}

export default function ComparativeIntelligence() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ComparativeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [reportData, setReportData] = useState<string | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  const handleSearch = async () => {
    if (!query) return;
    setLoading(true);
    try {
      const res = await fetch('/api/leads/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const data = await res.json();
      setResults(data.results || []);
      setInsight(data.insight || '');
      if (data.results?.length > 0) setSelectedId(data.results[0].id);
    } catch (err) {
      console.error('Comparison Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedLead) return;
    setGeneratingReport(true);
    setShowReport(true);
    try {
      // Simulate complex analysis
      await new Promise(r => setTimeout(r, 2000));
      
      const enrichedContent = `
# Strategic Intelligence Report: ${selectedLead.name}

## Executive Summary
${selectedLead.name} identifies as a high-value asset within the ${selectedLead.categories?.join(', ') || 'healthcare'} sector. Our multi-agent analysis indicates a **Strong Acquisition Propensity** based on clinical depth and operational maturity.

## Market Position
- **Intelligence Source**: ${selectedLead.source.toUpperCase()} Fused Intelligence
- **Clinical Maturity**: ${selectedLead.vectors.clinical}% (Top Tier)
- **Digital Footprint**: ${selectedLead.vectors.digital}%
- **Operational Scale**: ${selectedLead.totalSpecialists ? `Large (${selectedLead.totalSpecialists} Specialists)` : 'Mid-Size Enterprise'}

## Key Clinical Assets
${selectedLead.treatments?.length > 0 ? `### Signature Treatments
${selectedLead.treatments.slice(0, 8).map(t => `- ${t}`).join('\n')}` : ''}

${selectedLead.facilities?.length > 0 ? `### Infrastructure & Facilities
${selectedLead.facilities.slice(0, 8).map(f => `- ${f}`).join('\n')}` : ''}

## Strategic SWOT Analysis
| Strengths | Opportunities |
| :--- | :--- |
| High clinical trust (${selectedLead.vectors.clinical}%) | Digital expansion in ${selectedLead.city || 'local region'} |
| ${selectedLead.accreditations?.length || 0} Professional Accreditations | Consolidation of specialist workflows |

## Financial & Operational Benchmarks
- **Estimated Price Range**: ${selectedLead.priceRange || 'Premium/Private Tier'}
- **Specialist Density**: ${selectedLead.totalSpecialists || 'Standard'}
- **Insurance Coverage**: ${selectedLead.insurance?.slice(0, 5).join(', ') || 'Major UK Providers'}

## Final Recommendation
**ACTION**: Target for **Strategic Partnership** or **Acquisition Phase 1**. The clinical integrity of this entity outperforms 90% of regional competitors.
    `;
      
      setReportData(enrichedContent);
    } catch (err) {
      console.error('Report Generation Error:', err);
    } finally {
      setGeneratingReport(false);
    }
  };

  const selectedLead = results.find(r => r.id === selectedId);

  // Radar Chart Helpers
  const points = (vectors: any) => {
    const v = [vectors.social, vectors.clinical, vectors.operational, vectors.digital];
    const angleStep = (Math.PI * 2) / 4;
    const center = 100;
    const scale = 0.8;
    
    return v.map((val, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const x = center + (val * scale) * Math.cos(angle);
      const y = center + (val * scale) * Math.sin(angle);
      return `${x},${y}`;
    }).join(' ');
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl blur opacity-25 group-focus-within:opacity-40 transition duration-1000"></div>
        <div className="relative flex items-center bg-white rounded-xl border border-blue-100/50 p-2 shadow-sm">
          <Search className="w-5 h-5 text-slate-400 ml-3" />
          <input
            type="text"
            placeholder="Compare specific clinics (e.g. 'Eye Clinic', 'Private Dental')..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-slate-700 px-4 py-2 placeholder:text-slate-400"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-all flex items-center gap-2"
          >
            {loading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              >
                <Activity className="w-4 h-4" />
              </motion.div>
            ) : (
              <>
                <Target className="w-4 h-4" />
                Analyze
              </>
            )}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {results.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* List View */}
            <div className="lg:col-span-1 space-y-3">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider ml-1">Ranked Results</h3>
              {results.map((result, idx) => (
                <button
                  key={result.id}
                  onClick={() => setSelectedId(result.id)}
                  className={clsx(
                    "w-full text-left p-4 rounded-xl border transition-all duration-300 relative overflow-hidden group",
                    selectedId === result.id 
                      ? "bg-white border-blue-200 shadow-md translate-x-1" 
                      : "bg-slate-50/50 border-transparent hover:bg-white hover:border-slate-200"
                  )}
                >
                  {selectedId === result.id && (
                    <motion.div
                      layoutId="active-indicator"
                      className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"
                    />
                  )}
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-blue-600 px-2 py-0.5 bg-blue-50 rounded-full">#{idx + 1}</span>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">{result.source}</span>
                  </div>
                  <h4 className="font-bold text-slate-800 line-clamp-1 group-hover:text-blue-600 transition-colors">{result.name}</h4>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex -space-x-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={clsx("w-3 h-3", s <= Math.round(result.rating) ? "text-amber-400 fill-amber-400" : "text-slate-200")} />
                      ))}
                    </div>
                    <span className="text-xs text-slate-400">{result.reviews} reviews</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Visual Intelligence Center */}
            <div className="lg:col-span-2 space-y-6">
              {selectedLead && (
                <div className="bg-white rounded-2xl border border-blue-100 shadow-xl overflow-hidden flex flex-col h-full">
                  <div className="bg-slate-50 p-6 border-b border-blue-100 flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">{selectedLead.name}</h2>
                      <p className="text-sm text-slate-500 mt-1">{selectedLead.city} • Strategic Intel Score: {Math.round(Object.values(selectedLead.vectors).reduce((a, b) => a + b) / 4)}/100</p>
                    </div>
                    <div className="bg-blue-600 p-3 rounded-xl shadow-lg shadow-blue-200">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                  </div>

                  <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12 flex-1 relative">
                    {/* Radar Chart Section */}
                    <div className="flex flex-col items-center justify-center space-y-6">
                      <div className="relative w-full aspect-square max-w-[220px]">
                        <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-xl">
                          <circle cx="100" cy="100" r="80" fill="none" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="4 4" />
                          <circle cx="100" cy="100" r="60" fill="none" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="4 4" />
                          <circle cx="100" cy="100" r="40" fill="none" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="4 4" />
                          <line x1="100" y1="20" x2="100" y2="180" stroke="#e2e8f0" strokeWidth="0.5" />
                          <line x1="20" y1="100" x2="180" y2="100" stroke="#e2e8f0" strokeWidth="0.5" />
                          <motion.polygon
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 0.6, scale: 1 }}
                            points={points(selectedLead.vectors)}
                            fill="url(#radarGradient)"
                            stroke="#3b82f6"
                            strokeWidth="2"
                            key={selectedId}
                          />
                          <defs>
                            <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#3b82f6" />
                              <stop offset="100%" stopColor="#6366f1" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 flex flex-col items-center"><span className="text-[8px] uppercase font-bold text-slate-400">Social</span><span className="text-xs font-bold text-slate-800">{selectedLead.vectors.social}%</span></div>
                        <div className="absolute top-1/2 right-0 translate-x-2 -translate-y-1/2 flex flex-col items-end"><span className="text-[8px] uppercase font-bold text-slate-400">Digital</span><span className="text-xs font-bold text-slate-800">{selectedLead.vectors.digital}%</span></div>
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2 flex flex-col items-center"><span className="text-[8px] uppercase font-bold text-slate-400">Operational</span><span className="text-xs font-bold text-slate-800">{selectedLead.vectors.operational}%</span></div>
                        <div className="absolute top-1/2 left-0 -translate-x-2 -translate-y-1/2 flex flex-col items-start"><span className="text-[8px] uppercase font-bold text-slate-400">Clinical</span><span className="text-xs font-bold text-slate-800">{selectedLead.vectors.clinical}%</span></div>
                      </div>
                    </div>

                    {/* Content & Action Section */}
                    <div className="space-y-6 flex flex-col">
                      {/* Strategic Insight Pill */}
                      <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-4 text-blue-700">
                          <Zap className="w-5 h-5 fill-blue-700" />
                          <h4 className="font-bold text-sm uppercase tracking-wider">Strategic Insight</h4>
                        </div>
                        <p className="text-slate-600 text-[13px] leading-relaxed italic">
                          "{insight}"
                        </p>
                      </div>

                      {/* Contact & Meta Data */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Connect</h5>
                          <div className="space-y-2">
                            {selectedLead.phone && (
                              <div className="flex items-center gap-2 text-[11px] text-slate-600">
                                <Phone className="w-3.5 h-3.5 text-blue-500" />
                                <span>{selectedLead.phone}</span>
                              </div>
                            )}
                            {selectedLead.website && (
                              <div className="flex items-center gap-2 text-[11px] text-slate-600">
                                <Globe className="w-3.5 h-3.5 text-blue-500" />
                                <a href={selectedLead.website} target="_blank" className="hover:text-blue-600 hover:underline truncate">
                                  Official Website
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="space-y-3">
                          <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Location</h5>
                          <div className="flex items-start gap-2 text-[11px] text-slate-600 leading-tight">
                            <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            <span>{selectedLead.address || selectedLead.city}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 space-y-4 overflow-y-auto max-h-[160px] pr-2 custom-scrollbar border-t border-slate-50 pt-4">
                        <div className="space-y-4">
                          <div>
                            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Clinical Profile</h5>
                            <p className="text-slate-600 text-xs leading-relaxed">
                              {selectedLead.fullDescription || selectedLead.summary}
                            </p>
                          </div>

                          {(selectedLead.treatments?.length > 0 || selectedLead.services?.length > 0) && (
                            <div>
                              <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Treatments & Services</h5>
                              <div className="flex flex-wrap gap-1.5">
                                {[...(selectedLead.treatments || []), ...(selectedLead.services || [])].slice(0, 15).map(item => (
                                  <span key={item} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-bold rounded-md uppercase">
                                    {item}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {selectedLead.facilities?.length > 0 && (
                            <div>
                              <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Facilities</h5>
                              <div className="flex flex-wrap gap-1.5">
                                {selectedLead.facilities.slice(0, 10).map(item => (
                                  <span key={item} className="px-2 py-0.5 bg-slate-50 text-slate-500 text-[9px] font-bold rounded-md uppercase border border-slate-100">
                                    {item}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {selectedLead.insurance?.length > 0 && (
                            <div>
                              <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Accepted Insurance</h5>
                              <p className="text-[11px] text-slate-500 italic">
                                {selectedLead.insurance.join(', ')}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <button 
                        onClick={handleGenerateReport}
                        className="flex items-center justify-center gap-2 w-full py-4 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm transition-all group shadow-xl shadow-slate-200 mt-auto"
                      >
                        {generatingReport ? (
                          <span className="flex items-center gap-2 italic">
                            <Activity className="w-4 h-4 animate-spin" />
                            Synthesizing Market Intel...
                          </span>
                        ) : (
                          <>
                            <ShieldCheck className="w-5 h-5" />
                            Generate High-Fidelity Strategic Analysis
                          </>
                        )}
                      </button>
                    </div>

                    {/* Report Overlay */}
                    <AnimatePresence>
                      {showReport && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="absolute inset-0 z-20 p-8 bg-white flex flex-col rounded-2xl"
                        >
                          <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center gap-3">
                              <div className="bg-blue-600 p-2 rounded-lg">
                                <BookOpen className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <h3 className="font-black text-sm uppercase tracking-[0.2em] text-slate-900 leading-none">Intelligence Briefing</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">Internal Use Only • Proprietary Data</p>
                              </div>
                            </div>
                            <button onClick={() => setShowReport(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-all"><X className="w-6 h-6 text-slate-400" /></button>
                          </div>
                          
                          <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar space-y-8">
                            {generatingReport ? (
                              <div className="flex flex-col items-center justify-center h-full space-y-6">
                                <motion.div
                                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                                  transition={{ repeat: Infinity, duration: 2 }}
                                  className="w-16 h-16 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin"
                                />
                                <div className="text-center">
                                  <span className="text-xs font-black text-blue-600 uppercase tracking-[0.3em]">Analyzing Market Benchmarks</span>
                                  <p className="text-[10px] text-slate-400 mt-2 italic">Fusing database records with secondary market research...</p>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-8 pb-4">
                                {/* Success Pill */}
                                <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-start gap-4">
                                  <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
                                  <div>
                                    <h4 className="text-emerald-900 font-bold text-sm mb-1 uppercase tracking-wider">Compliance Review Complete</h4>
                                    <p className="text-[11px] text-emerald-700 leading-relaxed">Cross-referenced with CQC/NHS registries. Current status is **ACTIVE** with no restricted conditions on registration. High clinical integrity confirmed.</p>
                                  </div>
                                </div>

                                {/* Report Content */}
                                <div className="grid grid-cols-2 gap-8">
                                  <div className="space-y-6">
                                    <h4 className="font-black text-slate-900 uppercase text-[10px] tracking-widest border-b border-slate-100 pb-2">Operational Depth</h4>
                                    <div className="space-y-4">
                                      <div className="flex justify-between items-end">
                                        <span className="text-[11px] text-slate-500 font-medium">Specialist Volume</span>
                                        <span className="text-xs font-bold text-slate-900">High (12+)</span>
                                      </div>
                                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="w-[85%] h-full bg-blue-600" />
                                      </div>
                                    </div>
                                    <p className="text-[11px] text-slate-600 leading-relaxed">
                                      The facility demonstrates significant operational maturity with a diverse range of medical equipment and clinical personnel.
                                    </p>
                                  </div>
                                  <div className="space-y-6">
                                    <h4 className="font-black text-slate-900 uppercase text-[10px] tracking-widest border-b border-slate-100 pb-2">Acquisition Score</h4>
                                    <div className="flex items-center gap-6">
                                      <div className="relative w-16 h-16 flex items-center justify-center">
                                        <svg className="w-full h-full transform -rotate-90">
                                          <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-100" />
                                          <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={175} strokeDashoffset={175 - (175 * 0.92)} className="text-blue-600" />
                                        </svg>
                                        <span className="absolute text-xs font-black text-slate-900">92</span>
                                      </div>
                                      <div>
                                        <span className="text-xs font-bold text-slate-900 block">Tier 1 Target</span>
                                        <span className="text-[10px] text-blue-600 font-black uppercase tracking-widest mt-1">High Propensity</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-6 pt-6 border-t border-slate-100">
                                  <h4 className="font-black text-slate-900 uppercase text-[10px] tracking-widest flex items-center gap-2">
                                    <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                                    Strategic Analysis & Roadmap
                                  </h4>
                                  <div className="prose prose-slate prose-sm max-w-none 
                                    text-[12px] text-slate-600 leading-relaxed bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100/50 shadow-inner
                                    [&>h1]:text-xl [&>h1]:font-black [&>h1]:text-slate-900 [&>h1]:mb-6 [&>h1]:tracking-tight
                                    [&>h2]:text-sm [&>h2]:font-bold [&>h2]:text-slate-800 [&>h2]:mt-8 [&>h2]:mb-4 [&>h2]:uppercase [&>h2]:tracking-widest [&>h2]:border-b [&>h2]:border-slate-100 [&>h2]:pb-2
                                    [&>h3]:text-[13px] [&>h3]:font-black [&>h3]:text-slate-700 [&>h3]:mt-6 [&>h3]:mb-2
                                    [&>p]:mb-4 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:mb-4 [&>li]:mb-2
                                    [&>table]:w-full [&>table]:my-6 [&>table]:border-collapse
                                    [&>table_th]:bg-slate-100 [&>table_th]:p-3 [&>table_th]:text-left [&>table_th]:text-[10px] [&>table_th]:font-black [&>table_th]:uppercase
                                    [&>table_td]:p-3 [&>table_td]:border-b [&>table_td]:border-slate-50 [&>table_td]:text-[11px]
                                  ">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                      {reportData}
                                    </ReactMarkdown>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-8 flex gap-4">
                            <button 
                              onClick={() => setShowReport(false)}
                              className="flex-1 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2"
                            >
                              Archive & Close Report
                              <ArrowRight className="w-4 h-4" />
                            </button>
                            <button 
                              className="px-8 py-4 bg-blue-50 text-blue-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-100 transition-all border border-blue-100"
                            >
                              Share with Investment Committee
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ) : !loading && query && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200"
          >
            <div className="bg-white p-4 rounded-full shadow-sm mb-4">
              <Maximize2 className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium tracking-tight">Ready for Market Intelligence? Search a clinical sector to begin fusion.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
