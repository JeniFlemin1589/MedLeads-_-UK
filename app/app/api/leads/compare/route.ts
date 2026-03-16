import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { calculateLeadScore } from '@/lib/intelligence';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const CQC_BASE = 'https://api.service.cqc.org.uk/public/v1';
const CQC_API_KEY = process.env.CQC_API_KEY || '';
const ODS_BASE = 'https://directory.spineservices.nhs.uk/ORD/2-0-0/organisations';

export async function POST(request: NextRequest) {
    try {
        const { query, sector } = await request.json();

        if (!query) {
            return NextResponse.json({ error: 'Query is required' }, { status: 400 });
        }

        // 1. Search Scraped Database (Doctify, IHPN, Newmedica)
        const { data: scrapedLeads, error: scrapedError } = await supabase
            .from('scraped_leads')
            .select('*')
            .or(`name.ilike.%${query}%,specialties.cs.{${query}},categories.cs.{${query}}`)
            .limit(10);

        if (scrapedError) throw scrapedError;

        // 2. Fetch CQC Locations for cross-referencing
        const cqcParams = new URLSearchParams({
            perPage: '10',
            page: '1',
            gacServiceTypeDescription: sector || 'Doctors consultation service'
        });
        
        const cqcRes = await fetch(`${CQC_BASE}/locations?${cqcParams}`, {
            headers: { 'Ocp-Apim-Subscription-Key': CQC_API_KEY, 'Accept': 'application/json' }
        });
        const cqcData = cqcRes.ok ? await cqcRes.json() : { locations: [] };

        // 3. Fusion Logic & Ranking
        const fusedResults = (scrapedLeads || []).map(lead => {
            const rd = lead.raw_data || {};
            
            // Intelligence Vectors (0-100)
            const socialProof = Math.min((lead.review_count / 100) * 50 + (lead.rating / 5) * 50, 100);
            const clinicalTrust = lead.rating >= 4.5 ? 90 : (lead.rating >= 4 ? 70 : 50);
            const operationalDepth = rd.doctors?.length > 0 ? 85 : 40;

            return {
                id: lead.id,
                name: lead.name,
                source: lead.source,
                rating: lead.rating,
                reviews: lead.review_count,
                city: lead.city,
                address: lead.address,
                phone: lead.phone,
                email: lead.email,
                website: lead.website,
                specialties: lead.specialties,
                categories: lead.categories,
                vectors: {
                    social: Math.round(socialProof),
                    clinical: Math.round(clinicalTrust),
                    operational: Math.round(operationalDepth),
                    digital: lead.website ? 95 : 20
                },
                summary: lead.description?.slice(0, 100) + '...',
                fullDescription: lead.description,
                rawData: rd,
                // Expanded Data Fusion
                treatments: rd.treatments || [],
                conditions: rd.conditionsTreated || [],
                services: rd.services || [],
                facilities: rd.facilities || [],
                insurance: rd.insurance || [],
                paymentMethods: rd.paymentMethods || [],
                priceRange: rd.priceRange || null,
                openingHours: rd.openingHours || null,
                socialMedia: rd.socialMedia || null,
                accreditations: rd.accreditations || [],
                followers: rd.followers || null,
                totalSpecialists: rd.totalSpecialists || null,
                hospitalFacilities: rd.hospitalFacilities || null,
                specialistBio: rd.specialistBio || null,
                specialistEducation: rd.specialistEducation || [],
                specialistSkills: rd.specialistSkills || [],
                specialistFees: rd.specialistFees || null,
                specialistLocations: rd.specialistLocations || [],
                acceptingNewPatients: rd.acceptingNewPatients ?? null,
                gallery: rd.galleryImages || []
            };
        });

        // 4. AI Strategic Comparison
        let aiInsight = "Data fusion complete. Select clinics to view detailed competitive analysis.";
        if (process.env.OPENAI_API_KEY && fusedResults.length > 0) {
            const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
            const topNames = fusedResults.slice(0, 3).map(r => r.name).join(', ');
            
            const aiResponse = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    { 
                        role: 'system', 
                        content: 'You are a healthcare acquisition strategist. Provide a 2-sentence summary of the market landscape for the given query and why the top results are competitive.' 
                    },
                    { role: 'user', content: `Analyze the market for "${query}". Top contenders: ${topNames}` }
                ]
            });
            aiInsight = aiResponse.choices[0].message.content || aiInsight;
        }

        return NextResponse.json({
            results: fusedResults.sort((a, b) => 
                (Object.values(b.vectors).reduce((sum, v) => sum + v, 0)) - 
                (Object.values(a.vectors).reduce((sum, v) => sum + v, 0))
            ),
            insight: aiInsight,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Comparison API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
