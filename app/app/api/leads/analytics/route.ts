import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
    try {
        // 1. Get Scraped Leads Summary (Handling pagination for >1000 rows)
        let allScrapedData: any[] = [];
        let from = 0;
        const limit = 1000;
        let hasMore = true;
        let totalScrapedCount = 0;

        while (hasMore) {
            const { data, count, error } = await supabase
                .from('scraped_leads')
                .select('source, rating, review_count', { count: 'exact' })
                .range(from, from + limit - 1);

            if (error) throw error;
            if (data) allScrapedData = [...allScrapedData, ...data];
            if (count !== null) totalScrapedCount = count;
            
            if (data.length < limit) {
                hasMore = false;
            } else {
                from += limit;
            }
        }

        // 2. Get Saved Leads Summary
        const { count: savedCount, error: savedError } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true });

        if (savedError) throw savedError;

        // 3. Process Scraped Statistics
        const sourceBreakdown: Record<string, number> = {};
        let totalRating = 0;
        let ratedLeads = 0;
        let totalReviews = 0;

        allScrapedData.forEach(lead => {
            const src = (lead.source || 'unknown').toLowerCase();
            sourceBreakdown[src] = (sourceBreakdown[src] || 0) + 1;
            
            if (lead.rating) {
                totalRating += lead.rating;
                ratedLeads++;
            }
            if (lead.review_count) {
                totalReviews += lead.review_count;
            }
        });

        const avgRating = ratedLeads > 0 ? (totalRating / ratedLeads).toFixed(2) : "0";

        // 4. AI Intelligence Briefing
        let briefing = {
            status: "Positive",
            trend: "Increasing engagement in Private Dental sector",
            recommendation: "Focus on London-based practices with >4.5 ratings for high-propensity acquisition."
        };

        if (process.env.OPENAI_API_KEY) {
            try {
                const OpenAI = (await import('openai')).default;
                const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
                
                const statsSummary = `
                    Total Leads: ${totalScrapedCount + (savedCount || 0)}
                    Scraped Sources: ${JSON.stringify(sourceBreakdown)}
                    Average Rating: ${avgRating}
                    Total Reviews: ${totalReviews}
                `;

                const aiResponse = await openai.chat.completions.create({
                    model: 'gpt-4o-mini',
                    messages: [
                        { 
                            role: 'system', 
                            content: 'You are a healthcare business intelligence analyst. Provide a punchy market brief based on current lead data. Return JSON with "status" (3 words), "trend" (1 sentence), and "recommendation" (1 specific strategic sentence).' 
                        },
                        { role: 'user', content: `Analyze this market data: ${statsSummary}` }
                    ],
                    response_format: { type: 'json_object' },
                    temperature: 0.7
                });

                const content = aiResponse.choices[0].message.content;
                if (content) {
                    briefing = JSON.parse(content) as typeof briefing;
                }
            } catch (aiError) {
                console.error('AI Briefing Generation Error:', aiError);
            }
        }

        return NextResponse.json({
            summary: {
                totalLeads: totalScrapedCount + (savedCount || 0),
                scrapedCount: totalScrapedCount,
                savedCount: savedCount || 0,
                totalReviews
            },
            marketShare: sourceBreakdown,
            qualityMetrics: {
                averageRating: parseFloat(avgRating),
                topSource: Object.entries(sourceBreakdown).sort((a, b: any) => b[1] - (a[1] as any))[0]?.[0] || 'N/A'
            },
            briefing,
            lastUpdated: new Date().toISOString()
        });

    } catch (error) {
        console.error('Analytics API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
