import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const CQC_BASE = 'https://api.service.cqc.org.uk/public/v1';
const CQC_API_KEY = process.env.CQC_API_KEY || '';
const ODS_BASE = 'https://directory.spineservices.nhs.uk/ORD/2-0-0/organisations';

// ─── Tool Definitions ────────────────────────────────────────────────────

const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
    {
        type: 'function',
        function: {
            name: 'query_scraped_db',
            description: 'Search the scraped healthcare leads database (Doctify, IHPN, Newmedica). Returns clinics, hospitals, doctors, and pharmacies with their ratings, reviews, categories, and contact info.',
            parameters: {
                type: 'object',
                properties: {
                    search: { type: 'string', description: 'Free-text search term for name matching' },
                    source: { type: 'string', enum: ['all', 'doctify', 'ihpn', 'newmedica'], description: 'Data source filter' },
                    category: { type: 'string', description: 'Category filter e.g. eye-care, dental, cosmetic, weight-loss, mental-health, cardiology' },
                    limit: { type: 'number', description: 'Max results to return (default 10)' },
                },
                required: [],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'query_cqc_locations',
            description: 'Query the live CQC (Care Quality Commission) API for registered healthcare locations. Returns official inspection ratings, registration status, and regulatory data. Use structured filters only.',
            parameters: {
                type: 'object',
                properties: {
                    serviceType: { type: 'string', description: 'CQC service type e.g. "Doctors consultation service", "Dental service"' },
                    directorate: { type: 'string', enum: ['Hospitals', 'Primary medical services', 'Adult social care'], description: 'Inspection directorate' },
                    page: { type: 'number', description: 'Page number for pagination' },
                    perPage: { type: 'number', description: 'Results per page (max 50)' },
                },
                required: [],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'query_cqc_location_detail',
            description: 'Fetch full CQC details for a specific location by its locationId. Returns ratings, inspection history, contacts, services, and regulated activities.',
            parameters: {
                type: 'object',
                properties: {
                    locationId: { type: 'string', description: 'The CQC location ID' },
                },
                required: ['locationId'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'query_nhs_ods',
            description: 'Search the NHS Organisation Data Service (ODS) for registered healthcare organizations by name and/or postcode. Returns official ODS codes, status, roles, and contact details.',
            parameters: {
                type: 'object',
                properties: {
                    name: { type: 'string', description: 'Organization name to search for' },
                    postcode: { type: 'string', description: 'Postcode or outward code to filter by' },
                    limit: { type: 'number', description: 'Max results (default 10)' },
                },
                required: [],
            },
        },
    },
];

// ─── Tool Implementations ────────────────────────────────────────────────

async function executeQueryScrapedDb(args: any) {
    let query = supabase.from('scraped_leads').select('name, source, city, postcode, phone, website, rating, review_count, categories, specialties, description, url').limit(args.limit || 10);
    
    if (args.source && args.source !== 'all') query = query.eq('source', args.source);
    if (args.category) query = query.contains('categories', [args.category]);
    if (args.search) query = query.ilike('name', `%${args.search}%`);
    
    const { data, error } = await query;
    if (error) return { error: error.message };
    return { results: data, count: data?.length || 0 };
}

async function executeQueryCqcLocations(args: any) {
    const params = new URLSearchParams({
        perPage: String(args.perPage || 10),
        page: String(args.page || 1),
    });
    if (args.serviceType) params.set('gacServiceTypeDescription', args.serviceType);
    if (args.directorate) params.set('inspectionDirectorate', args.directorate);
    
    const res = await fetch(`${CQC_BASE}/locations?${params}`, {
        headers: { 'Ocp-Apim-Subscription-Key': CQC_API_KEY, 'Accept': 'application/json' }
    });
    if (!res.ok) return { error: `CQC API returned ${res.status}` };
    const data = await res.json();
    
    // Fetch details for each location
    const locations = data.locations || [];
    const detailed = [];
    for (const loc of locations.slice(0, 5)) {
        const dRes = await fetch(`${CQC_BASE}/locations/${loc.locationId}`, {
            headers: { 'Ocp-Apim-Subscription-Key': CQC_API_KEY, 'Accept': 'application/json' }
        });
        if (dRes.ok) {
            const d = await dRes.json();
            detailed.push({
                locationId: d.locationId,
                name: d.name,
                type: d.type,
                address: [d.postalAddressLine1, d.postalAddressTownCity].filter(Boolean).join(', '),
                postcode: d.postalCode,
                overallRating: d.currentRatings?.overall?.rating || 'Not Rated',
                registrationStatus: d.registrationStatus,
                phone: d.mainPhoneNumber,
                website: d.website,
                inspectionDirectorate: d.inspectionDirectorate,
            });
        }
    }
    return { total: data.total, results: detailed };
}

async function executeQueryCqcLocationDetail(args: any) {
    const res = await fetch(`${CQC_BASE}/locations/${args.locationId}`, {
        headers: { 'Ocp-Apim-Subscription-Key': CQC_API_KEY, 'Accept': 'application/json' }
    });
    if (!res.ok) return { error: `CQC returned ${res.status}` };
    const d = await res.json();
    return {
        name: d.name,
        type: d.type,
        address: [d.postalAddressLine1, d.postalAddressLine2, d.postalAddressTownCity, d.postalCode].filter(Boolean).join(', '),
        overallRating: d.currentRatings?.overall?.rating || 'Not Rated',
        ratingDate: d.currentRatings?.overall?.reportDate,
        keyQuestionRatings: (d.currentRatings?.overall?.keyQuestionRatings || []).map((r: any) => `${r.name}: ${r.rating}`),
        phone: d.mainPhoneNumber,
        website: d.website,
        registrationDate: d.registrationDate,
        regulatedActivities: (d.regulatedActivities || []).map((a: any) => a.name),
        serviceTypes: (d.gacServiceTypes || []).map((s: any) => s.name),
        specialisms: (d.specialisms || []).map((s: any) => s.name),
        lastInspection: d.lastInspection?.date,
    };
}

async function executeQueryNhsOds(args: any) {
    const params = new URLSearchParams({ Limit: String(args.limit || 10), Status: 'Active' });
    if (args.name) params.set('Name', args.name);
    if (args.postcode) params.set('PostCode', args.postcode);
    
    const res = await fetch(`${ODS_BASE}?${params}`);
    if (!res.ok) return { error: `NHS ODS returned ${res.status}` };
    const data = await res.json();
    return {
        results: (data.Organisations || []).map((o: any) => ({
            odsCode: o.OrgId,
            name: o.Name,
            postcode: o.PostCode,
            status: o.Status,
            role: o.PrimaryRoleDescription,
        })),
    };
}

// ─── API Route Handler ───────────────────────────────────────────────────

export async function POST(request: NextRequest) {
    try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const { message, history } = await request.json();

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }
        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json({ error: 'OPENAI_API_KEY is not configured' }, { status: 500 });
        }

        const systemPrompt = `You are MedLeads Intelligence — an AI-powered Healthcare Business Intelligence Agent for the UK private healthcare market.

You have access to THREE live data sources:
1. **Scraped Database** (query_scraped_db): 70,000+ private healthcare leads from Doctify, IHPN, and Newmedica. Contains marketing data like ratings, reviews, categories, specialties, websites, and doctor profiles.
2. **CQC Live API** (query_cqc_locations, query_cqc_location_detail): Official UK Care Quality Commission data. Contains official inspection ratings (Outstanding/Good/Requires Improvement/Inadequate), regulated activities, and compliance status.
3. **NHS ODS API** (query_nhs_ods): Official NHS Organisation Data Service. Contains registered organisation codes, statuses, and contact details.

YOUR ROLE:
- Answer business intelligence questions about the UK healthcare market.
- Cross-reference marketing data (scraped) with official regulatory data (CQC/NHS) to provide unique insights.
- When asked about a specific clinic or hospital, check BOTH the scraped DB and live APIs.
- Provide actionable recommendations, not just data dumps.
- Format your responses with markdown for readability.
- When presenting data, use tables when appropriate.
- Always cite which data source your information comes from.

IMPORTANT: You are a decision-making engine, not a search box. Synthesize and analyze the data.`;

        const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
            { role: 'system', content: systemPrompt },
            ...(history || []),
            { role: 'user', content: message },
        ];

        // Agentic loop — keep calling tools until the model produces a final answer
        let iterations = 0;
        const maxIterations = 5;

        while (iterations < maxIterations) {
            iterations++;
            
            const response = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages,
                tools,
                tool_choice: 'auto',
                temperature: 0.3,
                max_tokens: 2000,
            });

            const choice = response.choices[0];
            const assistantMessage = choice.message;
            messages.push(assistantMessage);

            // If no tool calls, the model has produced a final answer
            if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
                return NextResponse.json({
                    response: assistantMessage.content,
                    iterations,
                });
            }

            // Execute each tool call
            for (const toolCall of assistantMessage.tool_calls) {
                const tc = toolCall as any;
                const args = JSON.parse(tc.function.arguments);
                let result: any;

                switch (tc.function.name) {
                    case 'query_scraped_db':
                        result = await executeQueryScrapedDb(args);
                        break;
                    case 'query_cqc_locations':
                        result = await executeQueryCqcLocations(args);
                        break;
                    case 'query_cqc_location_detail':
                        result = await executeQueryCqcLocationDetail(args);
                        break;
                    case 'query_nhs_ods':
                        result = await executeQueryNhsOds(args);
                        break;
                    default:
                        result = { error: `Unknown tool: ${tc.function.name}` };
                }

                messages.push({
                    role: 'tool',
                    tool_call_id: tc.id,
                    content: JSON.stringify(result),
                });
            }
        }

        // If we exhausted iterations, return the last assistant message
        const lastAssistant = messages.filter(m => m.role === 'assistant').pop();
        return NextResponse.json({
            response: (lastAssistant as any)?.content || 'I was unable to complete the analysis. Please try a simpler query.',
            iterations,
        });

    } catch (error: any) {
        console.error('Intelligence API Error:', error);
        return NextResponse.json({
            error: error.message || 'Internal Server Error'
        }, { status: 500 });
    }
}
