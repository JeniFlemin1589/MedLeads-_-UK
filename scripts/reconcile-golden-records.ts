import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import OpenAI from 'openai';

dotenv.config({ path: path.resolve(__dirname, '../app/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const CQC_API_KEY = process.env.CQC_API_KEY!;

const CQC_BASE = 'https://api.service.cqc.org.uk/public/v1';
const ODS_BASE = 'https://directory.spineservices.nhs.uk/ORD/2-0-0/organisations';

// ─── NHS ODS Search ──────────────────────────────────────────────────────
// The ODS API supports free-text name search — perfect for fuzzy matching

async function searchODS(name: string, postcode?: string): Promise<any[]> {
    const cleanName = name.replace(/[\(\)\[\]&,]/g, ' ').replace(/\s+/g, ' ').trim();
    // Try the first 3 meaningful words
    const words = cleanName.split(' ').filter(w => w.length > 2).slice(0, 3).join(' ');
    
    const params = new URLSearchParams({ Name: words, Limit: '5', Status: 'Active' });
    if (postcode) params.set('PostCode', postcode.split(' ')[0]); // Use outward code (e.g., "SK8")
    
    try {
        const res = await globalThis.fetch(`${ODS_BASE}?${params}`);
        if (!res.ok) return [];
        const data: any = await res.json();
        return (data.Organisations || []).map((o: any) => ({
            odsCode: o.OrgId,
            name: o.Name,
            postcode: o.PostCode,
            status: o.Status,
            role: o.PrimaryRoleDescription,
        }));
    } catch (e) {
        return [];
    }
}

// ─── CQC Location Lookup ────────────────────────────────────────────────
// Once we have a matched entity, fetch rich CQC data by location ID

async function fetchCQCByLocation(locationId: string): Promise<any | null> {
    try {
        const res = await globalThis.fetch(`${CQC_BASE}/locations/${locationId}`, {
            headers: { 'Ocp-Apim-Subscription-Key': CQC_API_KEY, 'Accept': 'application/json' }
        });
        if (!res.ok) return null;
        return await res.json();
    } catch (e) {
        return null;
    }
}

// ─── CQC Provider Lookup ────────────────────────────────────────────────

async function fetchCQCByProvider(providerId: string): Promise<any | null> {
    try {
        const res = await globalThis.fetch(`${CQC_BASE}/providers/${providerId}`, {
            headers: { 'Ocp-Apim-Subscription-Key': CQC_API_KEY, 'Accept': 'application/json' }
        });
        if (!res.ok) return null;
        return await res.json();
    } catch (e) {
        return null;
    }
}

// ─── CQC Batch Scan (Paginated) ─────────────────────────────────────────
// Fetch a batch of CQC locations and do local fuzzy matching

async function searchCQCLocations(page: number = 1): Promise<any[]> {
    try {
        const res = await globalThis.fetch(`${CQC_BASE}/locations?perPage=50&page=${page}`, {
            headers: { 'Ocp-Apim-Subscription-Key': CQC_API_KEY, 'Accept': 'application/json' }
        });
        if (!res.ok) return [];
        const data: any = await res.json();
        return (data.locations || []).map((l: any) => ({
            locationId: l.locationId,
            name: l.locationName,
            postcode: l.postalCode,
        }));
    } catch (e) {
        return [];
    }
}

// ─── OpenAI Reconciliation Agent ─────────────────────────────────────────

async function reconcileWithAI(lead: any, odsCandidates: any[]): Promise<string | null> {
    if (odsCandidates.length === 0) return null;

    const prompt = `You are a Healthcare Entity Reconciliation Agent for the UK NHS/CQC system.

SCRAPED LEAD (from a private healthcare directory):
- Name: "${lead.name}"
- Address: "${lead.address || 'N/A'}"
- City: "${lead.city || 'N/A'}"  
- Postcode: "${lead.postcode || 'N/A'}"
- Source: "${lead.source}"

NHS ODS CANDIDATES:
${JSON.stringify(odsCandidates, null, 2)}

MATCHING RULES:
1. Match = same physical building or organization (not just similar name).
2. Postcode match is a STRONG signal. Same outward code (e.g., "SK8") + similar name = likely match.
3. Account for: abbreviations, "Ltd", "Limited", "UK", "Healthcare", "Group", "Hospital", etc.
4. Individual doctor/specialist names (e.g., "Dr Smith") will RARELY match an ODS organization.
5. Hospital chains like "Spire" may have slightly different names between marketing and official registries.

Reply ONLY with a JSON object:
{"match": true, "odsCode": "THE_CODE", "confidence": 0.95}
OR
{"match": false}`;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.1,
            max_tokens: 60,
        });

        const raw = response.choices[0].message.content?.trim() || '';
        const cleaned = raw.replace(/```json\n?/g, '').replace(/```/g, '').trim();
        const result = JSON.parse(cleaned);
        
        if (result.match && result.odsCode && result.confidence >= 0.85) {
            return result.odsCode;
        }
        return null;
    } catch (e) {
        return null;
    }
}

// ─── Main Pipeline ───────────────────────────────────────────────────────

async function startGoldenRecordPipeline() {
    console.log("═══════════════════════════════════════════════════════════════");
    console.log("🚀 Phase 1: Golden Record Deduplication Pipeline (Dual-API)");
    console.log("   NHS ODS (Name Search) → AI Matching → CQC Rating Enrichment");
    console.log("═══════════════════════════════════════════════════════════════");
    
    if (!process.env.OPENAI_API_KEY) {
        console.error("❌ OPENAI_API_KEY missing from app/.env.local");
        process.exit(1);
    }

    const batchSize = parseInt(process.argv[2] || '20', 10);
    
    // Focus on IHPN leads first — they are actual organizations (Hospitals, Clinics)
    // Then Newmedica (specialty eye clinics), then Doctify practices
    const { data: leads, error } = await supabase
        .from('scraped_leads')
        .select('id, name, address, city, postcode, raw_data, source')
        .in('source', ['ihpn', 'newmedica', 'doctify'])
        .not('postcode', 'is', null)
        .order('source', { ascending: true }) // IHPN first, then others
        .limit(batchSize);

    if (error || !leads) {
        console.error("Database Error:", error);
        return;
    }

    // Filter already reconciled
    const unreconciled = leads.filter(l => !(l.raw_data?.golden_record));
    console.log(`\n📊 Processing ${unreconciled.length} unreconciled leads...\n`);

    let matchCount = 0;
    let processed = 0;

    for (const lead of unreconciled) {
        processed++;
        console.log(`\n[${processed}/${unreconciled.length}] 🔍 "${lead.name}" | ${lead.city || 'N/A'} | ${lead.postcode || 'N/A'} (${lead.source})`);

        // Step 1: Search NHS ODS API by name + postcode
        const odsCandidates = await searchODS(lead.name, lead.postcode);
        
        if (odsCandidates.length === 0) {
            // Retry with just the first word of the name
            const shortName = lead.name.split(' ')[0];
            const retry = await searchODS(shortName, lead.postcode);
            if (retry.length === 0) {
                console.log("   ❌ No ODS candidates found.");
                continue;
            }
            odsCandidates.push(...retry);
        }
        
        console.log(`   📋 Found ${odsCandidates.length} ODS candidates. Running AI match...`);

        // Step 2: AI-powered fuzzy match
        const matchedOdsCode = await reconcileWithAI(lead, odsCandidates);
        
        if (matchedOdsCode) {
            console.log(`   ✅ ODS MATCH: ${matchedOdsCode}`);
            
            // Step 3: Enrich with official ODS details
            let enrichment: any = { ods_code: matchedOdsCode, golden_record: true, reconciled_at: new Date().toISOString() };
            
            try {
                const odsDetail = await globalThis.fetch(`${ODS_BASE}/${matchedOdsCode}`, {
                    headers: { 'Accept': 'application/json' }
                });
                if (odsDetail.ok) {
                    const detail: any = await odsDetail.json();
                    const org = detail.Organisation || {};
                    const contacts = org.Contacts?.Contact || [];
                    let phone = '', email = '', website = '';
                    contacts.forEach((c: any) => {
                        if (c.type?.toLowerCase() === 'tel') phone = c.value;
                        if (c.type?.toLowerCase() === 'email') email = c.value;
                        if (c.type?.toLowerCase() === 'http') website = c.value;
                    });
                    
                    enrichment.ods_name = org.Name;
                    enrichment.ods_status = org.Status;
                    enrichment.ods_role = org.Roles?.Role?.[0]?.id || null;
                    enrichment.ods_phone = phone || null;
                    enrichment.ods_email = email || null;
                    enrichment.ods_website = website || null;
                    enrichment.ods_last_change = org.LastChangeDate || null;
                    console.log(`   📎 ODS Enriched: ${org.Name} | Status: ${org.Status}`);
                }
            } catch (e) { /* skip ODS enrichment */ }
            
            // Merge into raw_data
            const updatedRawData = { ...(lead.raw_data || {}), ...enrichment };
            
            await supabase
                .from('scraped_leads')
                .update({ raw_data: updatedRawData })
                .eq('id', lead.id);
            
            matchCount++;
        } else {
            console.log("   🔕 No confident match.");
        }
        
        // Rate limit
        await new Promise(r => setTimeout(r, 800));
        
        if (processed % 5 === 0) {
            console.log(`\n   ═══ Progress: ${processed}/${unreconciled.length} | Matched: ${matchCount} ═══`);
        }
    }

    console.log("\n═══════════════════════════════════════════════════════════════");
    console.log(`🎉 Golden Record Pipeline Complete!`);
    console.log(`   📊 Processed: ${processed}`);
    console.log(`   ✅ Golden Records Created: ${matchCount}`);
    console.log(`   📈 Match Rate: ${processed > 0 ? ((matchCount / processed) * 100).toFixed(1) : 0}%`);
    console.log("═══════════════════════════════════════════════════════════════");
}

startGoldenRecordPipeline();
