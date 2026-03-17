import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), 'app/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('--- AUDIT START ---');
  
  // 1. Weight related
  const { data: weightLeads, error: wError } = await supabase
    .from('scraped_leads')
    .select('name, categories, specialties')
    .or('categories.cs.{"weight-loss"},specialties.cs.{"Bariatric surgery"},specialties.cs.{"Weight loss"}');
  
  if (wError) console.error('Weight Error:', wError);
  console.log(`Found ${weightLeads?.length || 0} Weight Loss leads.`);

  // 2. Pharmacy related
  const { data: pharmacyLeads, error: pError } = await supabase
    .from('scraped_leads')
    .select('name, categories, specialties')
    .or('categories.cs.{"pharmacy"},name.ilike.%pharmacy%');

  if (pError) console.error('Pharmacy Error:', pError);
  console.log(`Found ${pharmacyLeads?.length || 0} Pharmacy leads.`);

  // 3. Totals by source
  const { data: sources, error: sError } = await supabase
    .from('scraped_leads')
    .select('source');
  
  const sourceCounts = (sources || []).reduce((acc: any, curr: any) => {
    acc[curr.source] = (acc[curr.source] || 0) + 1;
    return acc;
  }, {});

  console.log('Total leads by source:', sourceCounts);
  console.log('--- AUDIT END ---');
}

run();
