import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), 'app/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('--- START FINAL AUDIT ---');
  
  // Weights (fixed specialty search for array)
  const { data: weights, error: wErr } = await supabase
    .from('scraped_leads')
    .select('id, source, name')
    .or('categories.cs.{"weight-loss"},name.ilike.%weight%,name.ilike.%slimming%,name.ilike.%bariatric%,description.ilike.%weight%,description.ilike.%slimming%');
  
  if (wErr) console.error('Weight Audit Error:', wErr.message);

  // Pharms
  const { data: pharms, error: pErr } = await supabase
    .from('scraped_leads')
    .select('id, source, name')
    .or('categories.cs.{"pharmacy"},name.ilike.%pharmacy%');

  if (pErr) console.error('Pharmacy Audit Error:', pErr.message);

  console.log(`Weight Loss Pool: ${weights?.length || 0}`);
  console.log(`Pharmacy Pool: ${pharms?.length || 0}`);

  const breakdown = (arr: any[]) => arr.reduce((acc, curr) => {
    acc[curr.source] = (acc[curr.source] || 0) + 1;
    return acc;
  }, {});

  console.log('Weight Sources:', breakdown(weights || []));
  console.log('Pharmacy Sources:', breakdown(pharms || []));
}

run();
