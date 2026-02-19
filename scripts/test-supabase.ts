import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

config({ path: resolve(__dirname, '../app/.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function showData() {
    const { data, error, count } = await supabase
        .from('scraped_leads')
        .select('*', { count: 'exact' });

    if (error) {
        console.error('Error:', error.message);
        return;
    }

    console.log(`\n=== SCRAPED LEADS IN SUPABASE (${count} total) ===\n`);

    for (const row of data || []) {
        console.log('─'.repeat(60));
        console.log(`  Name:        ${row.name}`);
        console.log(`  Source:      ${row.source}`);
        console.log(`  URL:         ${row.url}`);
        console.log(`  Address:     ${row.address || '—'}`);
        console.log(`  Postcode:    ${row.postcode || '—'}`);
        console.log(`  City:        ${row.city || '—'}`);
        console.log(`  Phone:       ${row.phone || '—'}`);
        console.log(`  Email:       ${row.email || '—'}`);
        console.log(`  Website:     ${row.website || '—'}`);
        console.log(`  Categories:  ${(row.categories || []).join(', ') || '—'}`);
        console.log(`  Specialties: ${(row.specialties || []).join(', ') || '—'}`);
        console.log(`  Rating:      ${row.rating || '—'}`);
        console.log(`  Reviews:     ${row.review_count || 0}`);
        console.log(`  Description: ${(row.description || '—').substring(0, 100)}...`);
        console.log(`  Image:       ${row.image_url || '—'}`);
        console.log(`  Scraped at:  ${row.scraped_at}`);
    }

    console.log('─'.repeat(60));
    console.log(`\nTotal records: ${count}`);
}

showData();
