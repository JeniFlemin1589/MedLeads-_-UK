import dotenv from 'dotenv';
dotenv.config({ path: 'app/.env.local' });

async function run() {
  const CQC_API_KEY = process.env.CQC_API_KEY || '';
  console.log('Fetching CQC Service Types...');
  const res = await fetch('https://api.service.cqc.org.uk/public/v1/metadata/service-types', {
    headers: { 'Ocp-Apim-Subscription-Key': CQC_API_KEY, 'Accept': 'application/json' }
  });
  if (!res.ok) {
    console.error(`Error: ${res.status} ${res.statusText}`);
    const text = await res.text();
    console.error(text);
    return;
  }
  const data = await res.json();
  console.log('Service Types:', JSON.stringify(data, null, 2));
}

run();
