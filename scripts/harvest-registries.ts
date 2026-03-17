import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), 'app/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const ODS_BASE = 'https://directory.spineservices.nhs.uk/ORD/2-0-0/organisations';

async function harvestOdsNames() {
    console.log('🔄 Massive Harvesting from ODS...');
    const searchTerms = ['Weight', 'Slimming', 'Bariatric', 'Obesity', 'Diet', 'Nutrition', 'Dietitian', 'Nutritionist', 'Endocrinology', 'Diabetes', 'Spire', 'Nuffield'];
    for (const term of searchTerms) {
        const url = `${ODS_BASE}?Name=${term}&Status=Active&Limit=500`;
        try {
            console.log(`  🔎 Searching ODS for: ${term}...`);
            const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
            if (!res.ok) continue;
            const data = await res.json();
            const orgs = data.Organisations || [];
            console.log(`  📍 Found ${orgs.length} for ${term}.`);
            for (const org of orgs) {
                await supabase.from('scraped_leads').upsert({
                    name: org.Name,
                    source: 'nhs',
                    url: `https://directory.spineservices.nhs.uk/ORD/2-0-0/organisations/${org.OrgId}`,
                    address: org.AddrLn1,
                    city: org.Town,
                    postcode: org.PostCode,
                    categories: ['weight-loss'],
                    specialties: ['Specialist Clinical Service'],
                    raw_data: org
                }, { onConflict: 'url' });
            }
        } catch (e) {}
    }
}

async function run() {
    await harvestOdsNames();
    console.log('🏁 Massive Expansion Harvest Complete.');
}

run();
