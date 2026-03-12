import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../app/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function scrapeNewmedica() {
    console.log("🚀 Starting Newmedica Scraper (Target: 200 items)...");
    
    // Step 1: Fetch the root sitemap
    console.log("Fetching Newmedica Root Sitemap...");
    const indexRes = await fetch("https://www.newmedica.co.uk/sitemap.xml");
    const indexText = await indexRes.text();
    
    // Extract child sitemaps
    const sitemapUrls = [...indexText.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
    
    let allUrlMatches: string[] = [];
    console.log(`Found ${sitemapUrls.length} child sitemaps. Fetching...`);
    
    for (const sitemap of sitemapUrls) {
        try {
            const res = await fetch(sitemap);
            const text = await res.text();
            const urls = [...text.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
            allUrlMatches.push(...urls);
        } catch(e) {}
    }

    // Filter to specific types
    const urlsToScrape = allUrlMatches.filter(url => 
        url.includes('/clinics/') || 
        url.includes('/conditions-and-treatments/') || 
        url.includes('/consultants-and-health-professionals/') ||
        url.includes('/health-professionals/') ||
        url.includes('/consultants/')
    );
    
    console.log(`Found ${urlsToScrape.length} useful URLs to scrape from sitemap.`);
    
    // Remove limit to scrape ALL of them
    const targetUrls = urlsToScrape;
    console.log(`Targeting ${targetUrls.length} URLs.`);

    const browser = await chromium.launch({ headless: true });
    
    try {
        let insertedCount = 0;
        let skippedCount = 0;

        for (let i = 0; i < targetUrls.length; i++) {
            const url = targetUrls[i];
            console.log(`\n[${i+1}/${targetUrls.length}] Scraping: ${url}`);
            
            // Check if it exists
            const { data: existing } = await supabase
                .from('scraped_leads')
                .select('id')
                .eq('url', url)
                .maybeSingle();
                
            if (existing) {
                console.log(`[SKIPPED] Already in DB`);
                skippedCount++;
                continue;
            }

            const ctx = await browser.newContext();
            const page = await ctx.newPage();
            
            try {
                await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
                // Let dynamic content load
                await page.waitForTimeout(2000);
                
                // Get page title
                const title = await page.title();
                const cleanTitle = title.replace(' | Newmedica', '').trim();
                
                // Determine category
                let category = 'newmedica-other';
                let pageType = 'other';
                if (url.includes('/clinics/')) {
                    category = 'newmedica-clinic';
                    pageType = 'clinic';
                } else if (url.includes('/conditions-and-treatments/')) {
                    category = 'newmedica-condition';
                    pageType = 'condition';
                } else if (url.includes('consultant') || url.includes('health-professional')) {
                    category = 'newmedica-specialist';
                    pageType = 'specialist';
                }
                
                // Extract description/text
                const texts = await page.locator('p').allTextContents();
                const description = texts.join('\n').substring(0, 500).trim();
                
                // Extract Address
                let addressParams = '';
                try {
                    addressParams = await page.locator('p.has-text-balanced').first().textContent() || '';
                } catch(e) {}
                const parts = addressParams.split(',').map(p => p.trim());
                let city = '';
                let postcode = '';
                if (parts.length > 2) {
                    postcode = parts[parts.length - 1];
                    city = parts[parts.length - 2];
                }

                // Extract Doctors
                const doctors: any[] = [];
                const doctorCards = await page.locator('.box.is-consultant').all();
                for (const card of doctorCards) {
                    try {
                        const href = await card.getAttribute('href');
                        const name = await card.locator('h3').textContent();
                        const title = await card.locator('p').first().textContent();
                        // we need to get the img src which is lazy loaded so check both src and data-src
                        let img = await card.locator('img').getAttribute('data-src');
                        if (!img) img = await card.locator('img').getAttribute('src');
                        
                        if (name) {
                            doctors.push({
                                name: name?.trim(),
                                title: title?.trim(),
                                profileUrl: href?.startsWith('http') ? href : `https://www.newmedica.co.uk${href}`,
                                imageUrl: img?.startsWith('data:image') ? null : img
                            });
                        }
                    } catch(e) {}
                }
                
                // Phone numbers
                const bodyText = await page.textContent('body') || '';
                const phoneMatch = bodyText.match(/0[0-9]{3} [0-9]{3} [0-9]{4}|0[0-9]{4} [0-9]{6}/);
                const phone = phoneMatch ? phoneMatch[0] : null;

                const leadData = {
                    source: 'newmedica',
                    url: url,
                    name: cleanTitle,
                    city: city || undefined,
                    postcode: postcode || undefined,
                    address: addressParams || undefined,
                    phone: phone,
                    description: description.substring(0, 1000), // Ensure it fits
                    categories: [category],
                    raw_data: {
                        pageType: pageType,
                        category: category,
                        url: url,
                        fullAddress: addressParams || null,
                        doctors: doctors
                    }
                };

                const { error } = await supabase
                    .from('scraped_leads')
                    .insert([leadData]);

                if (error) {
                    console.error(`❌ Error inserting ${cleanTitle}:`, error.message);
                } else {
                    console.log(`✅ [INSERTED] ${cleanTitle}`);
                    insertedCount++;
                }
            } catch (err: any) {
                console.error(`❌ Error scraping ${url}:`, err.message);
            } finally {
                await ctx.close();
            }
        }
        
        console.log(`\n🎉 Newmedica Scrape Complete!`);
        console.log(`📊 Inserted: ${insertedCount}`);
        console.log(`⏭️ Skipped (Duplicates): ${skippedCount}`);
        
    } finally {
        await browser.close();
    }
}

scrapeNewmedica().catch(console.error);
