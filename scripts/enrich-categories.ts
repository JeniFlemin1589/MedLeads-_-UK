import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), 'app/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const CQC_BASE = 'https://api.service.cqc.org.uk/public/v1';
const CQC_API_KEY = process.env.CQC_API_KEY || '';

// Role RO76 = Community Pharmacy
const NHS_ODS_BASE = 'https://directory.spineservices.nhs.uk/ORD/2-0-0/organisations?Role=RO76&Status=Active&Limit=100';

async function syncCqcWeightLoss() {
    console.log('🔄 Syncing Weight Loss leads from CQC...');
    try {
        const searchTerms = ['Weight loss', 'Weight management'];
        
        for (const term of searchTerms) {
            console.log(`  🔍 Searching for service type: ${term}...`);
            const params = new URLSearchParams({
                perPage: '100',
                page: '1',
                gacServiceTypeDescription: term
            });

            const res = await fetch(`${CQC_BASE}/locations?${params}`, {
                headers: { 'Ocp-Apim-Subscription-Key': CQC_API_KEY, 'Accept': 'application/json' }
            });

            if (!res.ok) {
                console.warn(`  ⚠️ CQC search for "${term}" failed: ${res.status}`);
                continue;
            }
            
            const data = await res.json();
            const locations = data.locations || [];
            console.log(`  📍 Found ${locations.length} locations for "${term}".`);

            for (const loc of locations) {
                try {
                    const detailRes = await fetch(`${CQC_BASE}/locations/${loc.locationId}`, {
                        headers: { 'Ocp-Apim-Subscription-Key': CQC_API_KEY, 'Accept': 'application/json' }
                    });
                    if (!detailRes.ok) continue;
                    const det = await detailRes.json();

                    const lead = {
                        name: det.name,
                        source: 'cqc',
                        url: `https://www.cqc.org.uk/location/${det.locationId}`,
                        address: det.postalAddressLine1,
                        postcode: det.postalCode,
                        city: det.postalTown,
                        phone: det.mainPhoneNumber,
                        rating: det.currentRatings?.overall?.rating === 'Outstanding' ? 5 : (det.currentRatings?.overall?.rating === 'Good' ? 4 : 3),
                        categories: ['weight-loss'],
                        specialties: ['Weight Management'],
                        description: `CQC Registered Health Provider. Current Rating: ${det.currentRatings?.overall?.rating || 'Not Yet Rated'}.`,
                        raw_data: det
                    };

                    const { error } = await supabase.from('scraped_leads').upsert(lead, { onConflict: 'url' });
                    if (error) console.error(`    ❌ Error inserting ${det.name}:`, error.message);
                    else console.log(`    ✅ Synced: ${det.name}`);
                } catch (err: any) {
                    console.error(`    ⚠️ Detail error for ${loc.locationId}:`, err.message);
                }
            }
        }
    } catch (e: any) {
        console.error('❌ CQC Weight Loss Sync Failed:', e.message);
    }
}

async function syncNhsPharmacies() {
    console.log('🔄 Syncing Pharmacies from NHS ODS...');
    try {
        // NHS ODS API is very picky about headers. 
        // Try with specific JSON header first.
        const res = await fetch(NHS_ODS_BASE, {
            headers: { 'Accept': 'application/json' }
        });

        if (!res.ok) {
            console.error(`  ⚠️ NHS ODS Error Status: ${res.status} for ${NHS_ODS_BASE}`);
            if (res.status === 406) {
                console.log('  🔄 Retrying with wildcard Accept header...');
                const retryRes = await fetch(NHS_ODS_BASE, {
                   headers: { 'Accept': '*/*' }
                });
                if (retryRes.ok) {
                    console.log('  ✅ Got response with wildcard.');
                    // Process if possible
                }
            }
            return;
        }

        const data = await res.json();
        const orgs = data.Organisations || [];

        console.log(`📍 Found ${orgs.length} Pharmacies in NHS ODS.`);

        for (const org of orgs) {
            try {
                const lead = {
                    name: org.Name,
                    source: 'nhs',
                    url: `https://directory.spineservices.nhs.uk/ORD/2-0-0/organisations/${org.OrgId}`,
                    address: org.AddrLn1,
                    postcode: org.PostCode,
                    city: org.Town,
                    categories: ['pharmacy'],
                    specialties: ['Community Pharmacy'],
                    description: `Official NHS Registered Community Pharmacy (ODS: ${org.OrgId}). Status: ${org.Status}.`,
                    raw_data: org
                };

                const { error } = await supabase.from('scraped_leads').upsert(lead, { onConflict: 'url' });
                if (error) console.error(`  ❌ Error inserting ${org.Name}:`, error.message);
                else console.log(`  ✅ Synced: ${org.Name}`);
            } catch (err: any) {
                console.error(`  ⚠️ Error processing org ${org.OrgId}:`, err.message);
            }
        }
    } catch (e: any) {
        console.error('❌ NHS Pharmacy Sync Failed:', e.message);
    }
}

async function run() {
    await syncCqcWeightLoss();
    await syncNhsPharmacies();
    console.log('🏁 Expansion Sync Complete.');
}

run();
