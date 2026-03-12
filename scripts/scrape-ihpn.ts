import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from app/.env.local
dotenv.config({ path: path.resolve(__dirname, '../app/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function scrapeIHPN() {
    console.log("🚀 Starting IHPN Member Scraper...");
    
    // IHPN WPSL API Endpoint
    // We use a large search radius & max results to get everything from the center of the UK
    const url = 'https://www.ihpn.org.uk/wp-admin/admin-ajax.php?action=store_search&lat=54.2361&lng=-4.5481&max_results=5000&search_radius=1000&autoload=1';
    
    try {
        console.log(`Fetching from: ${url}`);
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`✅ Found ${data.length} IHPN members.`);

        let insertedCount = 0;
        let skippedCount = 0;

        for (const member of data) {
            const name = member.store.replace(/&#038;/g, '&').replace(/&#8211;/g, '-');
            const city = member.city;
            const postcode = member.zip;
            const address = `${member.address}${member.address2 ? ', ' + member.address2 : ''}`;
            const phone = member.phone;
            const website = member.url;
            
            const leadData = {
                source: 'ihpn',
                name: name,
                city: city,
                postcode: postcode,
                address: address,
                phone: phone,
                website: website,
                raw_data: {
                    id: member.id,
                    lat: member.lat,
                    lng: member.lng,
                    category: 'ihpn-member',
                    hours: member.hours
                }
            };

            // Check if already exists based on name + postcode to prevent duplicates
            const { data: existing } = await supabase
                .from('scraped_leads')
                .select('id')
                .eq('source', 'ihpn')
                .eq('name', name)
                .maybeSingle();

            if (existing) {
                console.log(`[SKIPPED] ${name} (Already exists)`);
                skippedCount++;
                continue;
            }

            const { error } = await supabase
                .from('scraped_leads')
                .insert([leadData]);

            if (error) {
                console.error(`❌ Error inserting ${name}:`, error.message);
            } else {
                console.log(`✅ [INSERTED] ${name} in ${city}`);
                insertedCount++;
            }
        }

        console.log(`\n🎉 IHPN Scrape Complete!`);
        console.log(`📊 Inserted: ${insertedCount}`);
        console.log(`⏭️ Skipped (Duplicates): ${skippedCount}`);
        
    } catch (e) {
        console.error("Fatal Error:", e);
    }
}

scrapeIHPN();
