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
    
    // IHPN WPSL API Endpoint has a max limit of 150 per request.
    // To get all 550+ we query across major UK coordinates.
    const cities = [
        { name: 'London', lat: 51.5074, lng: -0.1278 },
        { name: 'Birmingham', lat: 52.4862, lng: -1.8904 },
        { name: 'Manchester', lat: 53.4808, lng: -2.2426 },
        { name: 'Leeds', lat: 53.8008, lng: -1.5491 },
        { name: 'Glasgow', lat: 55.8642, lng: -4.2518 },
        { name: 'Newcastle', lat: 54.9783, lng: -1.6178 },
        { name: 'Bristol', lat: 51.4545, lng: -2.5879 },
        { name: 'Edinburgh', lat: 55.9533, lng: -3.1883 },
        { name: 'Belfast', lat: 54.5973, lng: -5.9301 },
        { name: 'Cardiff', lat: 51.4816, lng: -3.1791 },
        { name: 'Plymouth', lat: 50.3755, lng: -4.1427 },
        { name: 'Norwich', lat: 52.6309, lng: 1.2974 },
        { name: 'Inverness', lat: 57.4778, lng: -4.2247 }
    ];

    try {
        let insertedCount = 0;
        let skippedCount = 0;
        const seenIds = new Set();
        
        for (const city of cities) {
            console.log(`\nFetching near ${city.name}...`);
            const url = `https://www.ihpn.org.uk/wp-admin/admin-ajax.php?action=store_search&lat=${city.lat}&lng=${city.lng}&max_results=500&search_radius=5000`;
            
            const response = await fetch(url);
            if (!response.ok) {
                console.error(`Failed to fetch ${city.name}: HTTP ${response.status}`);
                continue;
            }
            
            const data = await response.json();
            console.log(`✅ Found ${data.length} IHPN members in ${city.name} region.`);

            for (const member of data) {
                if (seenIds.has(member.id)) {
                    continue; // Skip duplicates between regions
                }
                seenIds.add(member.id);
            const name = member.store.replace(/&#038;/g, '&').replace(/&#8211;/g, '-');
            const city = member.city;
            const postcode = member.zip;
            const address = `${member.address}${member.address2 ? ', ' + member.address2 : ''}`;
            const phone = member.phone;
            const website = member.url;
            
            // Determine category tags for filtering
            const tags = ['general'];
            const lowerName = name.toLowerCase();
            if (lowerName.includes('specsavers') || 
                lowerName.includes('eye') || 
                lowerName.includes('optician') || 
                lowerName.includes('spamedica') || 
                lowerName.includes('optegra')) {
                tags.push('eye-care');
            }

            const leadData = {
                source: 'ihpn',
                name: name,
                city: city,
                postcode: postcode,
                address: address,
                phone: phone,
                website: website,
                categories: tags,
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
        }

        console.log(`\n🎉 Deep IHPN Scrape Complete!`);
        console.log(`📊 Inserted: ${insertedCount}`);
        console.log(`⏭️ Skipped (Duplicates): ${skippedCount}`);
        
    } catch (e) {
        console.error("Fatal Error:", e);
    }
}

scrapeIHPN();
