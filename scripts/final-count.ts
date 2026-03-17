import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), 'app/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('--- TOTAL RE-COUNTING ---');
  
  let totalWeight = 0;
  let totalPharmacy = 0;
  let totalRows = 0;
  
  let hasMore = true;
  let offset = 0;
  const limit = 1000;

  while (hasMore) {
    const { data: leads, error } = await supabase
      .from('scraped_leads')
      .select('id, categories, name, description, specialties')
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching leads:', error.message);
      break;
    }
    
    if (!leads || leads.length === 0) {
      hasMore = false;
      break;
    }

    for (const lead of leads) {
      const categories = (lead.categories || []).map((c: string) => c.toLowerCase());
      const specialties = (lead.specialties || []).map((s: string) => s.toLowerCase());
      const text = (lead.name + ' ' + (lead.description || '')).toLowerCase();
      
      const isWeight = categories.includes('weight-loss') || 
                       specialties.some((s: string) => /weight|slim|bariatric|diet|obes|gastric/.test(s)) ||
                       /weight|slim|bariatric|diet|obes|gastric/.test(text);

      const isPharm = categories.includes('pharmacy') || 
                      specialties.some((s: string) => /pharmacy|chemist/.test(s)) ||
                      /pharmacy|chemist/.test(text);

      if (isWeight) totalWeight++;
      if (isPharm) totalPharmacy++;
      totalRows++;
    }

    if (leads.length < limit) {
      hasMore = false;
    } else {
      offset += limit;
      console.log(`  Processed ${totalRows}...`);
    }
  }

  console.log(`FINAL Weight Loss Pool: ${totalWeight}`);
  console.log(`FINAL Pharmacy Pool: ${totalPharmacy}`);
  console.log(`TOTAL Database Leads: ${totalRows}`);
}

run();
