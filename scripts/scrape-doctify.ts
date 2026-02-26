/**
 * Doctify Practice Scraper
 * 
 * Standalone script that scrapes practice data from Doctify UK sitemap
 * and stores it in the Supabase `scraped_leads` table.
 * 
 * Usage:
 *   npx tsx scripts/scrape-doctify.ts
 *   npx tsx scripts/scrape-doctify.ts --limit 50         # scrape first 50 only
 *   npx tsx scripts/scrape-doctify.ts --category hair    # filter sitemap URLs by keyword
 *   npx tsx scripts/scrape-doctify.ts --dry-run          # preview URLs without scraping
 * 
 * Requirements:
 *   npm install playwright @supabase/supabase-js
 *   npx playwright install chromium
 */

import { chromium, Browser, Page } from 'playwright';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load env vars from app/.env.local
config({ path: resolve(__dirname, '../app/.env.local') });

// ---- Config ----
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const DELAY_MS = 3000; // 3 seconds between requests (polite)
const MAX_RETRIES = 2;

// Supported page types and their sitemaps
const PAGE_TYPES: Record<string, { sitemap: string; urlPattern: RegExp; pathSegment: string }> = {
    'practices': { sitemap: 'https://www.doctify.com/sitemap.uk.practices.xml', urlPattern: /doctify\.com\/uk\/practice\//, pathSegment: 'practice' },
    'specialists': { sitemap: 'https://www.doctify.com/sitemap.uk.specialists.xml', urlPattern: /doctify\.com\/uk\/specialist\//, pathSegment: 'specialist' },
    'hospitals': { sitemap: 'https://www.doctify.com/sitemap.uk.hospitals.xml', urlPattern: /doctify\.com\/uk\/hospital\//, pathSegment: 'hospital' },
    'pharmacies': { sitemap: 'https://www.doctify.com/sitemap.uk.pharmacies.xml', urlPattern: /doctify\.com\/uk\/pharmacy\//, pathSegment: 'pharmacy' },
    'carehomes': { sitemap: 'https://www.doctify.com/sitemap.uk.carehomes.xml', urlPattern: /doctify\.com\/uk\/care-home\//, pathSegment: 'care-home' },
};

// Lazy Supabase client — only created when needed (not during dry runs)
let _supabase: SupabaseClient | null = null;
function getSupabase(): SupabaseClient {
    if (!_supabase) {
        if (!SUPABASE_URL || !SUPABASE_KEY) {
            console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
            console.error('   Make sure app/.env.local has these values');
            process.exit(1);
        }
        _supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    }
    return _supabase;
}

// ---- CLI args ----
const args = process.argv.slice(2);
const limitArg = args.indexOf('--limit');
const categoryArg = args.indexOf('--category');
const typeArg = args.indexOf('--type');
const dryRun = args.includes('--dry-run');
const LIMIT = limitArg !== -1 ? parseInt(args[limitArg + 1]) : Infinity;
const CATEGORY_FILTER = categoryArg !== -1 ? args[categoryArg + 1].toLowerCase() : '';
const PAGE_TYPE = typeArg !== -1 ? args[typeArg + 1].toLowerCase() : 'practices';

if (!PAGE_TYPES[PAGE_TYPE]) {
    console.error(`❌ Unknown type "${PAGE_TYPE}". Valid types: ${Object.keys(PAGE_TYPES).join(', ')}`);
    process.exit(1);
}

const SITEMAP_URL = PAGE_TYPES[PAGE_TYPE].sitemap;
const URL_PATTERN = PAGE_TYPES[PAGE_TYPE].urlPattern;
const PATH_SEGMENT = PAGE_TYPES[PAGE_TYPE].pathSegment;

// ---- Types ----
interface ScrapedPractice {
    source: string;
    name: string;
    url: string;
    address: string | null;
    postcode: string | null;
    city: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    specialties: string[];
    categories: string[];
    rating: number | null;
    review_count: number;
    description: string | null;
    image_url: string | null;
    raw_data: Record<string, any>;
}

// ---- Category inference from URL/name ----
function inferCategories(url: string, name: string): string[] {
    const text = `${url} ${name}`.toLowerCase();
    const cats: string[] = [];
    if (/weight|slim|bariatric|diet/.test(text)) cats.push('weight-loss');
    if (/hair|transplant|trichol|fue|fht/.test(text)) cats.push('hair-loss');
    if (/cosmetic|aesthetic|beauty|botox|filler/.test(text)) cats.push('cosmetic');
    if (/dental|dentist|orthodont|smile|teeth/.test(text)) cats.push('dental');
    if (/fertil|ivf|embryo/.test(text)) cats.push('fertility');
    if (/physio|osteo|chiropract/.test(text)) cats.push('physiotherapy');
    if (/eye|ophthalm|laser|lasik|optom/.test(text)) cats.push('eye-care');
    if (/mental|psych|counsel|therap/.test(text)) cats.push('mental-health');
    if (/dermat|skin/.test(text)) cats.push('dermatology');
    if (/cardio|heart/.test(text)) cats.push('cardiology');
    if (cats.length === 0) cats.push('general');
    return cats;
}

// ---- Step 1: Fetch sitemap URLs ----
async function fetchSitemapUrls(page: Page): Promise<string[]> {
    console.log(`📡 Fetching sitemap: ${SITEMAP_URL}`);

    try {
        // Intercept the raw XML response before browser renders it
        const [response] = await Promise.all([
            page.waitForResponse(resp => resp.url().includes('sitemap') && resp.status() === 200, { timeout: 30000 }),
            page.goto(SITEMAP_URL, { waitUntil: 'domcontentloaded', timeout: 30000 }),
        ]);

        const xml = await response.text();
        console.log(`📄 Raw XML length: ${xml.length}`);

        // Extract URLs matching the selected type
        const allUrlMatches = xml.match(/<loc>(https:\/\/www\.doctify\.com\/uk\/[^<]+)<\/loc>/g) || [];
        let urls = allUrlMatches
            .map(m => m.replace(/<\/?loc>/g, ''))
            .filter(url => URL_PATTERN.test(url));

        console.log(`📋 Found ${urls.length} ${PAGE_TYPE} URLs in sitemap`);

        // Filter by category keyword if specified
        if (CATEGORY_FILTER) {
            urls = urls.filter(url => url.toLowerCase().includes(CATEGORY_FILTER));
            console.log(`🔍 Filtered to ${urls.length} URLs matching "${CATEGORY_FILTER}"`);
        }

        return urls.slice(0, LIMIT);
    } catch (e: any) {
        console.error(`❌ Failed to fetch sitemap: ${e.message}`);
        // Fallback: try parsing the rendered page content
        const content = await page.content();
        const urlMatches = content.match(new RegExp(`https://www\\.doctify\\.com/uk/${PATH_SEGMENT}/[^"<\\s]+`, 'g')) || [];
        const urls = [...new Set(urlMatches)];
        console.log(`📋 Fallback: Found ${urls.length} ${PAGE_TYPE} URLs from page content`);
        return urls.slice(0, LIMIT);
    }
}

// ---- Step 2: Scrape individual practice page using JSON-LD structured data ----
async function scrapePractice(page: Page, url: string): Promise<ScrapedPractice | null> {
    try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await page.waitForTimeout(2000);

        // === PRIMARY: Extract from JSON-LD structured data (schema.org) ===
        let jsonLd: any = null;
        try {
            const scripts = await page.locator('script[type="application/ld+json"]').all();
            console.log(`  🔎 Found ${scripts.length} JSON-LD blocks`);
            for (const script of scripts) {
                const content = await script.textContent();
                if (!content) continue;
                const parsed = JSON.parse(content);
                const items = Array.isArray(parsed) ? parsed : [parsed];
                for (const item of items) {
                    if (['MedicalClinic', 'Dentist', 'Hospital', 'Physician', 'MedicalBusiness'].includes(item['@type'])) {
                        jsonLd = item;
                        break;
                    }
                }
                if (jsonLd) break;
            }
            if (jsonLd) {
                console.log(`  ✅ JSON-LD type: ${jsonLd['@type']}`);
            } else {
                console.log(`  ⚠️ No medical JSON-LD found, using DOM fallback`);
            }
        } catch (e: any) {
            console.log(`  ⚠️ JSON-LD parse error: ${e.message}`);
        }

        // --- Name ---
        let name = jsonLd?.name || '';
        if (!name) {
            try {
                const h1 = await page.locator('h1').first().textContent({ timeout: 2000 });
                name = h1?.trim() || '';
            } catch { /* skip */ }
        }
        if (!name) {
            console.log(`  ⚠️ No name found, skipping: ${url}`);
            return null;
        }

        // --- Address (from JSON-LD structured address) ---
        let address: string | null = null;
        let postcode: string | null = null;
        let city: string | null = null;
        if (jsonLd?.address) {
            const addr = jsonLd.address;
            address = addr.streetAddress || null;
            postcode = addr.postalCode || null;
            city = addr.addressLocality || null;
        }
        // Fallback: extract postcode from page text
        if (!postcode) {
            try {
                const body = await page.locator('body').textContent() || '';
                const m = body.match(/[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}/i);
                if (m) postcode = m[0].toUpperCase();
            } catch { /* skip */ }
        }

        // --- Phone (from JSON-LD) ---
        let phone = jsonLd?.telephone || null;
        if (!phone) {
            try {
                const tel = page.locator('a[href^="tel:"]').first();
                const href = await tel.getAttribute('href', { timeout: 1500 });
                phone = href?.replace('tel:', '') || null;
            } catch { /* skip */ }
        }

        // --- Email ---
        let email: string | null = null;
        try {
            const href = await page.locator('a[href^="mailto:"]').first().getAttribute('href', { timeout: 1500 });
            email = href?.replace('mailto:', '') || null;
        } catch { /* skip */ }

        // --- Website (external link, not doctify or social) ---
        const BLOCKED_DOMAINS = ['doctify', 'google', 'facebook', 'twitter', 'instagram', 'youtube', 'linkedin', 'apple.com', 'tiktok'];
        let website: string | null = null;
        try {
            const links = await page.locator('a[href*="://"][target="_blank"]').all();
            for (const link of links) {
                const href = await link.getAttribute('href');
                if (href && !BLOCKED_DOMAINS.some(d => href.includes(d))) {
                    website = href;
                    break;
                }
            }
        } catch { /* skip */ }

        // --- Rating (from page text pattern) ---
        let rating: number | null = null;
        let reviewCount = 0;
        try {
            const body = await page.locator('body').textContent() || '';
            const ratingMatch = body.match(/(\d\.\d)\s*\/\s*5/);
            if (ratingMatch) rating = parseFloat(ratingMatch[1]);
            const reviewMatch = body.match(/(\d+)\s*(?:verified\s+)?reviews?/i);
            if (reviewMatch) reviewCount = parseInt(reviewMatch[1]);
        } catch { /* skip */ }

        // --- Description (from JSON-LD, then meta fallback) ---
        let description = jsonLd?.description || null;
        if (!description) {
            try {
                description = await page.getAttribute('meta[name="description"]', 'content', { timeout: 1500 });
            } catch { /* skip */ }
        }

        // --- Image (from JSON-LD logo, then og:image) ---
        let imageUrl = jsonLd?.logo || jsonLd?.image || null;
        if (!imageUrl || imageUrl.includes('w=256')) {
            try {
                imageUrl = await page.getAttribute('meta[property="og:image"]', 'content', { timeout: 1500 });
            } catch { /* skip */ }
        }

        // --- Specialties (from JSON-LD medicalSpecialty) ---
        const specialties: string[] = [];
        if (jsonLd?.medicalSpecialty && Array.isArray(jsonLd.medicalSpecialty)) {
            for (const spec of jsonLd.medicalSpecialty) {
                if (spec.name) specialties.push(spec.name);
            }
        }

        // --- Geo coordinates ---
        const geo = jsonLd?.geo || null;

        // --- Opening hours ---
        const openingHours = jsonLd?.openingHours || null;

        // --- Employees / Doctors ---
        const employees: string[] = [];
        if (jsonLd?.employee && Array.isArray(jsonLd.employee)) {
            for (const emp of jsonLd.employee) {
                if (emp.name) employees.push(emp.name);
            }
        }

        const urlParts = url.split('/');
        const slug = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2];
        const categories = inferCategories(url, name);

        return {
            source: 'doctify',
            name,
            url,
            address,
            postcode,
            city,
            phone,
            email,
            website,
            specialties,
            categories,
            rating,
            review_count: reviewCount,
            description,
            image_url: imageUrl,
            raw_data: {
                slug,
                geo: geo ? { lat: geo.latitude, lng: geo.longitude } : null,
                openingHours,
                employees,
            }
        };
    } catch (err: any) {
        console.log(`  ❌ Error scraping ${url}: ${err.message}`);
        return null;
    }
}

// ---- Step 3: Store in Supabase ----
async function storeLead(lead: ScrapedPractice): Promise<boolean> {
    // Upsert by URL to avoid duplicates
    const { error } = await getSupabase()
        .from('scraped_leads')
        .upsert(lead, { onConflict: 'url' });

    if (error) {
        console.log(`  ❌ Supabase error: ${error.message}`);
        return false;
    }
    return true;
}

// ---- Main ----
async function main() {
    console.log('🚀 Doctify Scraper');
    console.log(`   Type: ${PAGE_TYPE}`);
    console.log(`   Limit: ${LIMIT === Infinity ? 'ALL' : LIMIT}`);
    console.log(`   Category: ${CATEGORY_FILTER || 'ALL'}`);
    console.log(`   Dry run: ${dryRun}\n`);

    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        viewport: { width: 1920, height: 1080 },
        locale: 'en-GB',
    });

    try {
        // 1. Get practice URLs from sitemap
        const sitemapPage = await context.newPage();
        const urls = await fetchSitemapUrls(sitemapPage);
        await sitemapPage.close();

        if (dryRun) {
            console.log('\n📋 Dry run — URLs to scrape:');
            urls.forEach((url, i) => console.log(`  ${i + 1}. ${url}`));
            console.log(`\n Total: ${urls.length}`);
            return;
        }

        // 2. Scrape each practice
        const page = await context.newPage();
        let success = 0;
        let failed = 0;

        for (let i = 0; i < urls.length; i++) {
            const url = urls[i];
            console.log(`[${i + 1}/${urls.length}] 🔍 ${url}`);

            let lead: ScrapedPractice | null = null;
            for (let retry = 0; retry <= MAX_RETRIES; retry++) {
                lead = await scrapePractice(page, url);
                if (lead) break;
                if (retry < MAX_RETRIES) {
                    console.log(`  🔄 Retrying (${retry + 1}/${MAX_RETRIES})...`);
                    await page.waitForTimeout(2000);
                }
            }

            if (lead) {
                console.log(`  📋 Extracted: ${lead.name}`);
                if (lead.address) console.log(`     📍 ${lead.address}`);
                if (lead.phone) console.log(`     📞 ${lead.phone}`);
                if (lead.website) console.log(`     🌐 ${lead.website}`);
                if (lead.rating) console.log(`     ⭐ ${lead.rating}`);
                console.log(`     🏷️  ${lead.categories.join(', ')}`);

                const stored = await storeLead(lead);
                if (stored) {
                    console.log(`  ✅ ${lead.name} | ${lead.categories.join(', ')} | ⭐${lead.rating || 'N/A'}`);
                    success++;
                } else {
                    failed++;
                }
            } else {
                failed++;
            }

            // Polite delay
            if (i < urls.length - 1) {
                await page.waitForTimeout(DELAY_MS);
            }
        }

        await page.close();

        console.log(`\n✨ Done! Scraped: ${success}, Failed: ${failed}, Total: ${urls.length}`);

    } finally {
        await browser.close();
    }
}

main().catch(console.error);
