import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), 'app/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function audit() {
  console.log('Auditing database for Weight Loss and Pharmacy leads...');
  
  const { data: pharmacyCounts, error: pError } = await supabase
    .from('scraped_leads')
    .select('source, count', { count: 'exact', head: true })
    .or('categories.cs.{"Pharmacy"},specialties.cs.{"Pharmacy"}');

  const { data: weightLossCounts, error: wError } = await supabase
    .from('scraped_leads')
    .select('source, count', { count: 'exact', head: true })
    .or('categories.cs.{"Weight loss"},specialties.cs.{"Weight loss"}');

  console.log('Pharmacy Leads:', pharmacyCounts);
  console.log('Weight Loss Leads:', weightLossCounts);
}

audit();
