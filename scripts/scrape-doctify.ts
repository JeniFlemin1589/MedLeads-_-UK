/**
 * Doctify Practice Scraper — Enhanced Edition
 * 
 * Standalone script that scrapes comprehensive practice/hospital/specialist data
 * from Doctify UK sitemaps and stores it in the Supabase `scraped_leads` table.
 * 
 * Extracts: name, address, contact info, full doctor profiles, services,
 * treatments, insurance, facilities, social media, reviews, accreditations,
 * opening hours, gallery images, and more.
 * 
 * Usage:
 *   npx tsx scripts/scrape-doctify.ts
 *   npx tsx scripts/scrape-doctify.ts --limit 50         # scrape first 50 only
 *   npx tsx scripts/scrape-doctify.ts --category hair    # filter sitemap URLs by keyword
 *   npx tsx scripts/scrape-doctify.ts --type hospitals    # scrape hospitals sitemap
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
import { readFileSync, writeFileSync, existsSync } from 'fs';

// Load env vars from app/.env.local
config({ path: resolve(__dirname, '../app/.env.local') });

// ---- Config ----
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const DELAY_MS = 1500; // 1.5 seconds between requests (polite but faster)
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
const SCRAPE_ALL = args.includes('--all');
const RESUME = args.includes('--resume');
const VISIBLE = args.includes('--visible');
const LIMIT = limitArg !== -1 ? parseInt(args[limitArg + 1]) : Infinity;
const CATEGORY_FILTER = categoryArg !== -1 ? args[categoryArg + 1].toLowerCase() : '';
let PAGE_TYPE = typeArg !== -1 ? args[typeArg + 1].toLowerCase() : 'practices';

if (!SCRAPE_ALL && !PAGE_TYPES[PAGE_TYPE]) {
    console.error(`❌ Unknown type "${PAGE_TYPE}". Valid types: ${Object.keys(PAGE_TYPES).join(', ')}`);
    process.exit(1);
}

// These get updated per-type in --all mode
let SITEMAP_URL = PAGE_TYPES[PAGE_TYPE]?.sitemap || '';
let URL_PATTERN = PAGE_TYPES[PAGE_TYPE]?.urlPattern || /./;
let PATH_SEGMENT = PAGE_TYPES[PAGE_TYPE]?.pathSegment || '';

// ---- Progress tracking ----
const PROGRESS_FILE = resolve(__dirname, 'scrape-progress.json');

interface ScrapeProgress {
    lastRun: string;
    types: Record<string, {
        total: number;
        scraped: number;
        failed: number;
        completed: boolean;
        lastUrl: string | null;
    }>;
}

function loadProgress(): ScrapeProgress {
    if (existsSync(PROGRESS_FILE)) {
        try {
            return JSON.parse(readFileSync(PROGRESS_FILE, 'utf-8'));
        } catch { /* corrupted, start fresh */ }
    }
    return { lastRun: new Date().toISOString(), types: {} };
}

function saveProgress(progress: ScrapeProgress) {
    progress.lastRun = new Date().toISOString();
    writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

// ---- Resume: fetch already-scraped URLs from Supabase ----
async function getExistingUrls(): Promise<Set<string>> {
    const existing = new Set<string>();
    if (!RESUME) return existing;

    console.log('📂 Fetching already-scraped URLs from Supabase for resume...');
    try {
        let offset = 0;
        const batchSize = 1000;
        while (true) {
            const { data, error } = await getSupabase()
                .from('scraped_leads')
                .select('url')
                .eq('source', 'doctify')
                .range(offset, offset + batchSize - 1);

            if (error) {
                console.error(`  ⚠️ Error fetching existing URLs: ${error.message}`);
                break;
            }
            if (!data || data.length === 0) break;

            for (const row of data) {
                if (row.url) existing.add(row.url);
            }
            offset += batchSize;
            if (data.length < batchSize) break;
        }
        console.log(`  ✅ Found ${existing.size} already-scraped URLs (will skip)`);
    } catch (e: any) {
        console.error(`  ⚠️ Could not fetch existing URLs: ${e.message}`);
    }
    return existing;
}

// ---- Types ----

/** Consultation fees for a specialist */
interface SpecialistFees {
    newPatient: string | null;         // e.g. "£250"
    followUp: string | null;           // e.g. "£200"
    currency: string;
}

/** Education entry for a specialist */
interface EducationEntry {
    degree: string;
    institution: string | null;
    year: string | null;
}

/** Skill with endorsement count */
interface SkillEndorsement {
    skill: string;
    endorsementCount: number;
}

/** Practice location for a specialist */
interface PracticeLocation {
    name: string;
    address: string | null;
    rating: number | null;
    url: string | null;
}

/** Area of expertise for hospitals */
interface AreaOfExpertise {
    name: string;
    count: number;  // number of reviews or procedures
}

/** Detailed hospital facilities */
interface HospitalFacilities {
    parking: { available: boolean; onSite: boolean; paid: boolean; disabled: boolean } | null;
    generalFacilities: string[];       // cafe, wheelchair, prayer rooms, etc.
    healthcareServices: string[];      // inpatient, outpatient, day surgery, pharmacy, etc.
    seesChildren: boolean | null;
    internationalPatients: boolean | null;
}

/** Detailed doctor / specialist profile */
interface DoctorProfile {
    name: string;
    title: string | null;           // Mr, Dr, Prof, etc.
    specialty: string | null;
    subSpecialties: string[];
    qualifications: string | null;  // MBBS, FRCS, etc.
    gmcNumber: string | null;
    rating: number | null;
    reviewCount: number;
    profileUrl: string | null;
    imageUrl: string | null;
    jobTitle: string | null;        // e.g. "Consultant Surgeon"
    // NEW fields from Doctify specialist pages
    yearsOfExperience: number | null;
    consultationFees: SpecialistFees | null;
    education: EducationEntry[];
    skills: SkillEndorsement[];
    practiceLocations: PracticeLocation[];
    bio: string | null;             // Professional biography
    aiReviewSummary: string | null;  // AI-generated review summary
}

/** Structured opening hours */
interface OpeningHoursEntry {
    day: string;
    opens: string;
    closes: string;
}

/** Social media links */
interface SocialMediaLinks {
    facebook: string | null;
    twitter: string | null;
    instagram: string | null;
    linkedin: string | null;
    youtube: string | null;
    tiktok: string | null;
}

/** Review summary */
interface ReviewSummary {
    author: string | null;
    rating: number | null;
    date: string | null;
    text: string;
}

/** Full scraped data structure */
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
    raw_data: {
        slug: string;
        pageType: string;
        geo: { lat: number; lng: number } | null;
        faxNumber: string | null;
        openingHours: OpeningHoursEntry[] | string | null;
        doctors: DoctorProfile[];
        services: string[];
        conditionsTreated: string[];
        treatments: string[];
        insurance: string[];
        paymentMethods: string[];
        priceRange: string | null;
        facilities: string[];
        languages: string[];
        socialMedia: SocialMediaLinks;
        galleryImages: string[];
        accreditations: string[];
        reviews: ReviewSummary[];
        acceptingNewPatients: boolean | null;
        aboutText: string | null;
        aggregateRating: {
            ratingValue: number | null;
            ratingCount: number | null;
            bestRating: number | null;
            worstRating: number | null;
        } | null;
        schemaType: string | null;
        foundationDate: string | null;
        numberOfEmployees: number | null;
        areaServed: string | null;
        addressRegion: string | null;
        addressCountry: string | null;
        fullAddress: string | null;
        // NEW: Hospital-specific fields
        areasOfExpertise: AreaOfExpertise[];
        hospitalFacilities: HospitalFacilities | null;
        totalSpecialists: number | null;
        followers: number | null;
        // NEW: Specialist-specific (when scraping specialist pages)
        specialistBio: string | null;
        specialistEducation: EducationEntry[];
        specialistSkills: SkillEndorsement[];
        specialistFees: SpecialistFees | null;
        specialistLocations: PracticeLocation[];
        aiReviewSummary: string | null;
        yearsOfExperience: number | null;
    };
}

// ---- Category inference from URL/name ----
function inferCategories(url: string, name: string, specialties: string[] = []): string[] {
    const text = `${url} ${name} ${specialties.join(' ')}`.toLowerCase();
    const cats: string[] = [];
    if (/weight|slim|bariatric|diet|obes/.test(text)) cats.push('weight-loss');
    if (/hair|transplant|trichol|fue|fht/.test(text)) cats.push('hair-loss');
    if (/cosmetic|aesthetic|beauty|botox|filler|plastic/.test(text)) cats.push('cosmetic');
    if (/dental|dentist|orthodont|smile|teeth|oral/.test(text)) cats.push('dental');
    if (/fertil|ivf|embryo|reproductive/.test(text)) cats.push('fertility');
    if (/physio|osteo|chiropract|rehab/.test(text)) cats.push('physiotherapy');
    if (/eye|ophthalm|laser|lasik|optom|vision/.test(text)) cats.push('eye-care');
    if (/mental|psych|counsel|therap|anxiety|depress/.test(text)) cats.push('mental-health');
    if (/dermat|skin/.test(text)) cats.push('dermatology');
    if (/cardio|heart/.test(text)) cats.push('cardiology');
    if (/ortho|joint|bone|spine|knee|hip|shoulder/.test(text)) cats.push('orthopaedics');
    if (/uro|kidney|bladder|prostate/.test(text)) cats.push('urology');
    if (/gastro|digest|bowel|stomach/.test(text)) cats.push('gastroenterology');
    if (/neuro|brain|nerve/.test(text)) cats.push('neurology');
    if (/oncol|cancer|tumour|tumor/.test(text)) cats.push('oncology');
    if (/gynaec|gynec|obstet|pregnan|maternity/.test(text)) cats.push('gynaecology');
    if (/ent|ear|nose|throat|sinus/.test(text)) cats.push('ent');
    if (/paediatr|pediatr|child/.test(text)) cats.push('paediatrics');
    if (/pharmacy|pharma|dispensar/.test(text)) cats.push('pharmacy');
    if (/care.?home|elderly|nursing|residential/.test(text)) cats.push('care-home');
    if (cats.length === 0) cats.push('general');
    return cats;
}

// ---- Helper: safe text extraction ----
async function safeText(page: Page, selector: string, timeout = 1500): Promise<string | null> {
    try {
        const el = page.locator(selector).first();
        const text = await el.textContent({ timeout });
        return text?.trim() || null;
    } catch { return null; }
}

async function safeAttr(page: Page, selector: string, attr: string, timeout = 1500): Promise<string | null> {
    try {
        return await page.getAttribute(selector, attr, { timeout });
    } catch { return null; }
}

async function safeAllTexts(page: Page, selector: string, timeout = 2000): Promise<string[]> {
    try {
        const elements = await page.locator(selector).all();
        const texts: string[] = [];
        for (const el of elements) {
            const text = await el.textContent({ timeout: 500 }).catch(() => null);
            if (text?.trim()) texts.push(text.trim());
        }
        return texts;
    } catch { return []; }
}

async function safeAllAttrs(page: Page, selector: string, attr: string): Promise<string[]> {
    try {
        const elements = await page.locator(selector).all();
        const results: string[] = [];
        for (const el of elements) {
            const val = await el.getAttribute(attr, { timeout: 500 }).catch(() => null);
            if (val?.trim()) results.push(val.trim());
        }
        return results;
    } catch { return []; }
}

// ---- Step 1: Fetch sitemap URLs ----
async function fetchSitemapUrls(): Promise<string[]> {
    console.log(`📡 Fetching sitemap: ${SITEMAP_URL}`);

    try {
        // Use HTTP fetch instead of browser — much faster and handles large XML
        const response = await fetch(SITEMAP_URL, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MedLeads/1.0)' }
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

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
        return [];
    }
}

// ---- Step 2: Extract full JSON-LD structured data ----
async function extractJsonLd(page: Page): Promise<any | null> {
    try {
        const scripts = await page.locator('script[type="application/ld+json"]').all();
        console.log(`  🔎 Found ${scripts.length} JSON-LD blocks`);

        const medicalTypes = [
            'MedicalClinic', 'Dentist', 'Hospital', 'Physician',
            'MedicalBusiness', 'Pharmacy', 'DiagnosticLab', 'Optician',
            'VeterinaryCare', 'HealthClub', 'MedicalOrganization',
            'LocalBusiness', 'Organization'
        ];

        // First pass: look for medical-specific types
        for (const script of scripts) {
            const content = await script.textContent();
            if (!content) continue;
            try {
                const parsed = JSON.parse(content);
                const items = Array.isArray(parsed) ? parsed : [parsed];
                for (const item of items) {
                    const type = item['@type'];
                    const types = Array.isArray(type) ? type : [type];
                    if (types.some((t: string) => medicalTypes.includes(t))) {
                        console.log(`  ✅ JSON-LD type: ${types.join(', ')}`);
                        return item;
                    }
                }
            } catch { /* skip invalid JSON */ }
        }

        // Second pass: take any JSON-LD with a name if no medical type found
        for (const script of scripts) {
            const content = await script.textContent();
            if (!content) continue;
            try {
                const parsed = JSON.parse(content);
                const items = Array.isArray(parsed) ? parsed : [parsed];
                for (const item of items) {
                    if (item.name && item['@type'] !== 'WebSite' && item['@type'] !== 'BreadcrumbList') {
                        console.log(`  ⚠️ Using fallback JSON-LD type: ${item['@type']}`);
                        return item;
                    }
                }
            } catch { /* skip */ }
        }

        console.log(`  ⚠️ No suitable JSON-LD found, using DOM only`);
        return null;
    } catch (e: any) {
        console.log(`  ⚠️ JSON-LD extraction error: ${e.message}`);
        return null;
    }
}

// ---- Step 3: Extract doctor profiles ----
async function extractDoctors(page: Page, jsonLd: any): Promise<DoctorProfile[]> {
    const doctors: DoctorProfile[] = [];

    // === From JSON-LD employee array ===
    if (jsonLd?.employee && Array.isArray(jsonLd.employee)) {
        for (const emp of jsonLd.employee) {
            const name = emp.name || '';
            if (!name) continue;

            // Parse title from name (e.g., "Mr Adam Tucker", "Dr Sarah Jones", "Prof John Smith")
            const titleMatch = name.match(/^(Mr|Mrs|Ms|Miss|Dr|Prof|Professor)\s+/i);
            const title = titleMatch ? titleMatch[1] : null;

            // Extract specialty
            let specialty: string | null = null;
            const subSpecialties: string[] = [];
            if (emp.medicalSpecialty) {
                if (Array.isArray(emp.medicalSpecialty)) {
                    specialty = emp.medicalSpecialty[0]?.name || emp.medicalSpecialty[0] || null;
                    for (let i = 1; i < emp.medicalSpecialty.length; i++) {
                        const s = emp.medicalSpecialty[i]?.name || emp.medicalSpecialty[i];
                        if (s) subSpecialties.push(s);
                    }
                } else {
                    specialty = emp.medicalSpecialty.name || emp.medicalSpecialty || null;
                }
            }

            // Extract qualifications
            let qualifications: string | null = null;
            if (emp.hasCredential) {
                if (Array.isArray(emp.hasCredential)) {
                    qualifications = emp.hasCredential.map((c: any) => c.name || c).join(', ');
                } else {
                    qualifications = emp.hasCredential.name || emp.hasCredential;
                }
            }

            // Extract rating
            let rating: number | null = null;
            let reviewCount = 0;
            if (emp.aggregateRating) {
                rating = parseFloat(emp.aggregateRating.ratingValue) || null;
                reviewCount = parseInt(emp.aggregateRating.ratingCount || emp.aggregateRating.reviewCount) || 0;
            }

            // Profile URL
            let profileUrl: string | null = emp.url || emp['@id'] || null;
            if (profileUrl && !profileUrl.startsWith('http')) {
                profileUrl = `https://www.doctify.com${profileUrl}`;
            }

            // Image
            const imageUrl = emp.image || emp.logo || null;

            doctors.push({
                name,
                title,
                specialty,
                subSpecialties,
                qualifications,
                gmcNumber: emp.identifier || null,
                rating,
                reviewCount,
                profileUrl,
                imageUrl,
                jobTitle: emp.jobTitle || emp.description || null,
                yearsOfExperience: null,
                consultationFees: null,
                education: [],
                skills: [],
                practiceLocations: [],
                bio: null,
                aiReviewSummary: null,
            });
        }
    }

    // === From DOM: doctor/specialist cards ===
    const cardSelectors = [
        '[data-testid*="specialist"] a',
        '[data-testid*="doctor"] a',
        '.specialist-card',
        '.doctor-card',
        'a[href*="/specialist/"]',
        'a[href*="/doctor/"]',
    ];

    for (const selector of cardSelectors) {
        try {
            const cards = await page.locator(selector).all();
            if (cards.length === 0) continue;

            for (const card of cards) {
                const href = await card.getAttribute('href', { timeout: 500 }).catch(() => null);
                const text = await card.textContent({ timeout: 500 }).catch(() => '');
                if (!text?.trim()) continue;

                // Check if we already have this doctor from JSON-LD
                const cardName = text.trim().split('\n')[0].trim();
                if (doctors.some(d => d.name === cardName)) continue;

                let profileUrl: string | null = href || null;
                if (profileUrl && !profileUrl.startsWith('http')) {
                    profileUrl = `https://www.doctify.com${profileUrl}`;
                }

                // Only add if it looks like a doctor link
                if (profileUrl && profileUrl.includes('/specialist/')) {
                    const titleMatch = cardName.match(/^(Mr|Mrs|Ms|Miss|Dr|Prof|Professor)\s+/i);
                    doctors.push({
                        name: cardName,
                        title: titleMatch ? titleMatch[1] : null,
                        specialty: null,
                        subSpecialties: [],
                        qualifications: null,
                        gmcNumber: null,
                        rating: null,
                        reviewCount: 0,
                        profileUrl,
                        imageUrl: null,
                        jobTitle: null,
                        yearsOfExperience: null,
                        consultationFees: null,
                        education: [],
                        skills: [],
                        practiceLocations: [],
                        bio: null,
                        aiReviewSummary: null,
                    });
                }
            }
        } catch { /* skip this selector */ }
    }

    // === For specialist pages: extract the main profile data ===
    if (PAGE_TYPE === 'specialists' && jsonLd) {
        // The JSON-LD itself IS the doctor profile
        const name = jsonLd.name || '';
        if (name && !doctors.some(d => d.name === name)) {
            const titleMatch = name.match(/^(Mr|Mrs|Ms|Miss|Dr|Prof|Professor)\s+/i);
            let specialty: string | null = null;
            const subSpecialties: string[] = [];
            if (jsonLd.medicalSpecialty) {
                if (Array.isArray(jsonLd.medicalSpecialty)) {
                    specialty = jsonLd.medicalSpecialty[0]?.name || jsonLd.medicalSpecialty[0] || null;
                    for (let i = 1; i < jsonLd.medicalSpecialty.length; i++) {
                        const s = jsonLd.medicalSpecialty[i]?.name || jsonLd.medicalSpecialty[i];
                        if (s) subSpecialties.push(s);
                    }
                } else {
                    specialty = jsonLd.medicalSpecialty.name || jsonLd.medicalSpecialty || null;
                }
            }

            let qualifications: string | null = null;
            if (jsonLd.hasCredential) {
                if (Array.isArray(jsonLd.hasCredential)) {
                    qualifications = jsonLd.hasCredential.map((c: any) => c.name || c).join(', ');
                } else {
                    qualifications = jsonLd.hasCredential.name || jsonLd.hasCredential;
                }
            }

            let rating: number | null = null;
            let reviewCount = 0;
            if (jsonLd.aggregateRating) {
                rating = parseFloat(jsonLd.aggregateRating.ratingValue) || null;
                reviewCount = parseInt(jsonLd.aggregateRating.ratingCount || jsonLd.aggregateRating.reviewCount) || 0;
            }

            doctors.push({
                name,
                title: titleMatch ? titleMatch[1] : null,
                specialty,
                subSpecialties,
                qualifications,
                gmcNumber: jsonLd.identifier || null,
                rating,
                reviewCount,
                profileUrl: jsonLd.url || null,
                imageUrl: jsonLd.image || jsonLd.logo || null,
                jobTitle: jsonLd.jobTitle || jsonLd.description || null,
                yearsOfExperience: null,
                consultationFees: null,
                education: [],
                skills: [],
                practiceLocations: [],
                bio: null,
                aiReviewSummary: null,
            });
        }
    }

    return doctors;
}

// ---- Step 4: Extract services, treatments, conditions ----
async function extractServices(page: Page, jsonLd: any): Promise<{ services: string[]; treatments: string[]; conditions: string[] }> {
    const services: string[] = [];
    const treatments: string[] = [];
    const conditions: string[] = [];

    // === From JSON-LD availableService ===
    if (jsonLd?.availableService) {
        const svcList = Array.isArray(jsonLd.availableService) ? jsonLd.availableService : [jsonLd.availableService];
        for (const svc of svcList) {
            const name = svc.name || svc;
            if (typeof name === 'string' && name.trim()) services.push(name.trim());
        }
    }

    // === From JSON-LD knowsAbout ===
    if (jsonLd?.knowsAbout) {
        const knows = Array.isArray(jsonLd.knowsAbout) ? jsonLd.knowsAbout : [jsonLd.knowsAbout];
        for (const item of knows) {
            const name = item.name || item;
            if (typeof name === 'string' && name.trim()) conditions.push(name.trim());
        }
    }

    // === From DOM: services sections ===
    const serviceSelectors = [
        '[data-testid*="service"] li',
        '[data-testid*="treatment"] li',
        'section:has(h2:text-matches("service", "i")) li',
        'section:has(h2:text-matches("treatment", "i")) li',
        'div:has(h3:text-matches("service", "i")) li',
        'div:has(h3:text-matches("treatment", "i")) li',
    ];

    for (const sel of serviceSelectors) {
        const texts = await safeAllTexts(page, sel);
        for (const t of texts) {
            if (t.length > 2 && t.length < 200) {
                if (sel.includes('treatment')) treatments.push(t);
                else services.push(t);
            }
        }
    }

    // === From DOM: conditions sections ===
    const conditionSelectors = [
        '[data-testid*="condition"] li',
        'section:has(h2:text-matches("condition", "i")) li',
        'div:has(h3:text-matches("condition", "i")) li',
    ];

    for (const sel of conditionSelectors) {
        const texts = await safeAllTexts(page, sel);
        for (const t of texts) {
            if (t.length > 2 && t.length < 200) conditions.push(t);
        }
    }

    return {
        services: [...new Set(services)],
        treatments: [...new Set(treatments)],
        conditions: [...new Set(conditions)],
    };
}

// ---- Step 5: Extract insurance, payment, facilities ----
async function extractInsuranceAndFacilities(page: Page, jsonLd: any): Promise<{
    insurance: string[];
    paymentMethods: string[];
    facilities: string[];
    languages: string[];
    priceRange: string | null;
}> {
    const insurance: string[] = [];
    const paymentMethods: string[] = [];
    const facilities: string[] = [];
    const languages: string[] = [];
    let priceRange: string | null = jsonLd?.priceRange || null;

    // === From JSON-LD ===
    if (jsonLd?.paymentAccepted) {
        const pm = Array.isArray(jsonLd.paymentAccepted) ? jsonLd.paymentAccepted : [jsonLd.paymentAccepted];
        for (const p of pm) {
            if (typeof p === 'string' && p.trim()) paymentMethods.push(p.trim());
        }
    }

    if (jsonLd?.amenityFeature) {
        const am = Array.isArray(jsonLd.amenityFeature) ? jsonLd.amenityFeature : [jsonLd.amenityFeature];
        for (const a of am) {
            const name = a.name || a;
            if (typeof name === 'string' && name.trim()) facilities.push(name.trim());
        }
    }

    // === From DOM: insurance ===
    const insuranceSelectors = [
        '[data-testid*="insurance"] li',
        '[data-testid*="insurer"] li',
        'section:has(h2:text-matches("insurance", "i")) li',
        'section:has(h2:text-matches("insurer", "i")) li',
        'div:has(h3:text-matches("insurance", "i")) li',
        'div:has(h3:text-matches("insurer", "i")) li',
    ];

    for (const sel of insuranceSelectors) {
        const texts = await safeAllTexts(page, sel);
        for (const t of texts) {
            if (t.length > 1 && t.length < 150) insurance.push(t);
        }
    }

    // === From DOM: facilities ===
    const facilitySelectors = [
        '[data-testid*="facilit"] li',
        '[data-testid*="amenity"] li',
        'section:has(h2:text-matches("facilit", "i")) li',
        'div:has(h3:text-matches("facilit", "i")) li',
    ];

    for (const sel of facilitySelectors) {
        const texts = await safeAllTexts(page, sel);
        for (const t of texts) {
            if (t.length > 1 && t.length < 150) facilities.push(t);
        }
    }

    // === From DOM: languages ===
    const languageSelectors = [
        '[data-testid*="language"] li',
        'section:has(h2:text-matches("language", "i")) li',
        'div:has(h3:text-matches("language", "i")) li',
    ];

    for (const sel of languageSelectors) {
        const texts = await safeAllTexts(page, sel);
        for (const t of texts) {
            if (t.length > 1 && t.length < 50) languages.push(t);
        }
    }

    return {
        insurance: [...new Set(insurance)],
        paymentMethods: [...new Set(paymentMethods)],
        facilities: [...new Set(facilities)],
        languages: [...new Set(languages)],
        priceRange,
    };
}

// ---- Step 6: Extract social media links ----
async function extractSocialMedia(page: Page): Promise<SocialMediaLinks> {
    const social: SocialMediaLinks = {
        facebook: null,
        twitter: null,
        instagram: null,
        linkedin: null,
        youtube: null,
        tiktok: null,
    };

    try {
        const links = await page.locator('a[href*="://"]').all();
        for (const link of links) {
            const href = await link.getAttribute('href', { timeout: 300 }).catch(() => null);
            if (!href) continue;

            if (href.includes('facebook.com') && !social.facebook) social.facebook = href;
            else if ((href.includes('twitter.com') || href.includes('x.com')) && !social.twitter) social.twitter = href;
            else if (href.includes('instagram.com') && !social.instagram) social.instagram = href;
            else if (href.includes('linkedin.com') && !social.linkedin) social.linkedin = href;
            else if (href.includes('youtube.com') && !social.youtube) social.youtube = href;
            else if (href.includes('tiktok.com') && !social.tiktok) social.tiktok = href;
        }
    } catch { /* skip */ }

    return social;
}

// ---- Step 7: Extract reviews ----
async function extractReviews(page: Page, jsonLd: any): Promise<ReviewSummary[]> {
    const reviews: ReviewSummary[] = [];

    // === From JSON-LD review array ===
    if (jsonLd?.review && Array.isArray(jsonLd.review)) {
        for (const rev of jsonLd.review.slice(0, 10)) { // Cap at 10
            reviews.push({
                author: rev.author?.name || rev.author || null,
                rating: rev.reviewRating?.ratingValue ? parseFloat(rev.reviewRating.ratingValue) : null,
                date: rev.datePublished || null,
                text: (rev.reviewBody || rev.description || '').slice(0, 500),
            });
        }
    }

    // === From DOM: review cards ===
    if (reviews.length === 0) {
        const reviewSelectors = [
            '[data-testid*="review"]',
            '.review-card',
            '.review-item',
        ];

        for (const sel of reviewSelectors) {
            try {
                const cards = await page.locator(sel).all();
                for (const card of cards.slice(0, 10)) {
                    const text = await card.textContent({ timeout: 500 }).catch(() => null);
                    if (text && text.trim().length > 20) {
                        reviews.push({
                            author: null,
                            rating: null,
                            date: null,
                            text: text.trim().slice(0, 500),
                        });
                    }
                }
                if (reviews.length > 0) break;
            } catch { /* skip */ }
        }
    }

    return reviews;
}

// ---- Step 8: Extract gallery images ----
async function extractGalleryImages(page: Page): Promise<string[]> {
    const images: string[] = [];

    const imgSelectors = [
        '[data-testid*="gallery"] img',
        '[data-testid*="photo"] img',
        '.gallery img',
        '.photo-gallery img',
    ];

    for (const sel of imgSelectors) {
        const srcs = await safeAllAttrs(page, sel, 'src');
        for (const src of srcs) {
            if (src && src.startsWith('http') && !src.includes('avatar') && !src.includes('icon')) {
                images.push(src);
            }
        }
        if (images.length > 0) break;
    }

    return [...new Set(images)].slice(0, 20); // Cap at 20 images
}

// ---- Step 9: Extract accreditations / badges ----
async function extractAccreditations(page: Page): Promise<string[]> {
    const accreditations: string[] = [];

    const selectors = [
        '[data-testid*="accreditat"] img',
        '[data-testid*="badge"] img',
        '[data-testid*="award"] img',
        '.accreditation img',
        '.badge img',
    ];

    for (const sel of selectors) {
        const altTexts = await safeAllAttrs(page, sel, 'alt');
        for (const alt of altTexts) {
            if (alt && alt.length > 2 && alt.length < 100) {
                accreditations.push(alt);
            }
        }
    }

    // Also check for text-based accreditations
    const textSelectors = [
        '[data-testid*="accreditat"] span',
        '[data-testid*="accreditat"] p',
        'section:has(h2:text-matches("accredit", "i")) li',
    ];

    for (const sel of textSelectors) {
        const texts = await safeAllTexts(page, sel);
        for (const t of texts) {
            if (t.length > 2 && t.length < 100) accreditations.push(t);
        }
    }

    return [...new Set(accreditations)];
}

// ---- Step 10: Extract specialist-specific details (fees, education, skills) ----
async function extractSpecialistDetails(page: Page, jsonLd: any): Promise<{
    bio: string | null;
    education: EducationEntry[];
    skills: SkillEndorsement[];
    fees: SpecialistFees | null;
    practiceLocations: PracticeLocation[];
    aiReviewSummary: string | null;
    yearsOfExperience: number | null;
}> {
    const result = {
        bio: null as string | null,
        education: [] as EducationEntry[],
        skills: [] as SkillEndorsement[],
        fees: null as SpecialistFees | null,
        practiceLocations: [] as PracticeLocation[],
        aiReviewSummary: null as string | null,
        yearsOfExperience: null as number | null,
    };

    try {
        // --- Bio / about text ---
        const bioSelectors = [
            '[data-testid*="bio"] p',
            '[data-testid*="about"] p',
            'section:has(h2:text-matches("about", "i")) p',
            'section:has(h2:text-matches("bio", "i")) p',
            '.specialist-bio p',
            '.about-section p',
        ];
        for (const sel of bioSelectors) {
            const texts = await safeAllTexts(page, sel);
            if (texts.length > 0) {
                result.bio = texts.join('\n\n').slice(0, 3000);
                break;
            }
        }

        // --- Years of experience from page text ---
        try {
            const body = await page.locator('body').textContent({ timeout: 2000 }) || '';
            const yearsMatch = body.match(/(\d+)\s*(?:\+\s*)?years?\s*(?:of\s*)?experience/i);
            if (yearsMatch) result.yearsOfExperience = parseInt(yearsMatch[1]);
        } catch { /* skip */ }

        // --- Education from JSON-LD ---
        if (jsonLd?.alumniOf) {
            const schools = Array.isArray(jsonLd.alumniOf) ? jsonLd.alumniOf : [jsonLd.alumniOf];
            for (const school of schools) {
                const name = school.name || school;
                if (typeof name === 'string' && name.trim()) {
                    result.education.push({
                        degree: school.description || 'Medical Education',
                        institution: name.trim(),
                        year: null,
                    });
                }
            }
        }

        // --- Education from DOM ---
        if (result.education.length === 0) {
            const eduSelectors = [
                '[data-testid*="education"] li',
                '[data-testid*="qualification"] li',
                'section:has(h2:text-matches("education|qualification", "i")) li',
                '.education-section li',
            ];
            for (const sel of eduSelectors) {
                const texts = await safeAllTexts(page, sel);
                for (const t of texts) {
                    if (t.length > 3 && t.length < 200) {
                        // Try to parse "Degree - Institution (Year)" format
                        const parts = t.split(/\s*[-–,]\s*/);
                        result.education.push({
                            degree: parts[0] || t,
                            institution: parts[1] || null,
                            year: t.match(/\b(19|20)\d{2}\b/)?.[0] || null,
                        });
                    }
                }
                if (result.education.length > 0) break;
            }
        }

        // --- Skills/endorsements from DOM ---
        const skillSelectors = [
            '[data-testid*="skill"] li',
            '[data-testid*="endorsement"] li',
            'section:has(h2:text-matches("skill|endorsement", "i")) li',
            '.skills-section li',
        ];
        for (const sel of skillSelectors) {
            try {
                const items = await page.locator(sel).all();
                for (const item of items) {
                    const text = await item.textContent({ timeout: 500 }).catch(() => '');
                    if (text && text.trim().length > 2) {
                        const countMatch = text.match(/\((\d+)\)/);
                        result.skills.push({
                            skill: text.replace(/\(\d+\)/, '').trim(),
                            endorsementCount: countMatch ? parseInt(countMatch[1]) : 0,
                        });
                    }
                }
                if (result.skills.length > 0) break;
            } catch { /* skip */ }
        }

        // --- Consultation fees ---
        const feeSelectors = [
            '[data-testid*="fee"]',
            '[data-testid*="price"]',
            '[data-testid*="cost"]',
            'section:has(h2:text-matches("fee|price|cost|consultation", "i"))',
            '.fees-section',
        ];
        for (const sel of feeSelectors) {
            try {
                const feeEl = page.locator(sel).first();
                const feeText = await feeEl.textContent({ timeout: 1500 });
                if (feeText) {
                    const prices = feeText.match(/£\s*[\d,]+(?:\.\d{2})?/g) || [];
                    if (prices.length > 0) {
                        result.fees = {
                            newPatient: prices[0] || null,
                            followUp: prices[1] || prices[0] || null,
                            currency: 'GBP',
                        };
                        break;
                    }
                }
            } catch { /* skip */ }
        }

        // --- Practice locations from DOM ---
        const locationSelectors = [
            '[data-testid*="location"] a[href*="/practice/"]',
            '[data-testid*="location"] a[href*="/hospital/"]',
            'section:has(h2:text-matches("location", "i")) a[href*="/practice/"]',
            'section:has(h2:text-matches("location", "i")) a[href*="/hospital/"]',
        ];
        for (const sel of locationSelectors) {
            try {
                const locElements = await page.locator(sel).all();
                for (const loc of locElements) {
                    const name = await loc.textContent({ timeout: 500 }).catch(() => '');
                    const href = await loc.getAttribute('href', { timeout: 500 }).catch(() => null);
                    if (name && name.trim().length > 2) {
                        let url = href || null;
                        if (url && !url.startsWith('http')) url = `https://www.doctify.com${url}`;
                        result.practiceLocations.push({
                            name: name.trim().split('\n')[0].trim(),
                            address: null,
                            rating: null,
                            url,
                        });
                    }
                }
                if (result.practiceLocations.length > 0) break;
            } catch { /* skip */ }
        }

        // --- AI Review Summary ---
        const aiSelectors = [
            '[data-testid*="ai-summary"]',
            '[data-testid*="review-summary"]',
            '.ai-review-summary',
            'section:has(h3:text-matches("patients say|review summary", "i")) p',
        ];
        for (const sel of aiSelectors) {
            const text = await safeText(page, sel, 2000);
            if (text && text.length > 20) {
                result.aiReviewSummary = text.slice(0, 1000);
                break;
            }
        }

    } catch (e: any) {
        console.log(`  ⚠️ Specialist details extraction error: ${e.message}`);
    }

    return result;
}

// ---- Step 11: Extract hospital-specific details ----
async function extractHospitalDetails(page: Page, jsonLd: any): Promise<{
    areasOfExpertise: AreaOfExpertise[];
    hospitalFacilities: HospitalFacilities | null;
    totalSpecialists: number | null;
    followers: number | null;
}> {
    const result = {
        areasOfExpertise: [] as AreaOfExpertise[],
        hospitalFacilities: null as HospitalFacilities | null,
        totalSpecialists: null as number | null,
        followers: null as number | null,
    };

    try {
        // --- Total specialists & followers from page text ---
        try {
            const body = await page.locator('body').textContent({ timeout: 2000 }) || '';
            const specMatch = body.match(/(\d+)\s*specialists?/i);
            if (specMatch) result.totalSpecialists = parseInt(specMatch[1]);
            const follMatch = body.match(/(\d+)\s*followers?/i);
            if (follMatch) result.followers = parseInt(follMatch[1]);
        } catch { /* skip */ }

        // --- Areas of expertise ---
        const expertiseSelectors = [
            '[data-testid*="expertise"] li',
            '[data-testid*="area"] li',
            'section:has(h2:text-matches("expertise|areas", "i")) li',
            'section:has(h2:text-matches("specialit|procedure", "i")) li',
            '.areas-of-expertise li',
        ];
        for (const sel of expertiseSelectors) {
            try {
                const items = await page.locator(sel).all();
                for (const item of items) {
                    const text = await item.textContent({ timeout: 500 }).catch(() => '');
                    if (text && text.trim().length > 2) {
                        const countMatch = text.match(/\((\d+)\)/);
                        result.areasOfExpertise.push({
                            name: text.replace(/\(\d+\)/, '').trim(),
                            count: countMatch ? parseInt(countMatch[1]) : 0,
                        });
                    }
                }
                if (result.areasOfExpertise.length > 0) break;
            } catch { /* skip */ }
        }

        // --- Hospital facilities (detailed) ---
        const generalFacilities: string[] = [];
        const healthcareServices: string[] = [];
        let seesChildren: boolean | null = null;
        let internationalPatients: boolean | null = null;
        let parking: HospitalFacilities['parking'] = null;

        // Try clicking Facilities tab
        try {
            const tabs = await page.locator('button, a, [role="tab"]').all();
            for (const tab of tabs) {
                const tabText = await tab.textContent({ timeout: 300 }).catch(() => '');
                if (tabText && /facilit|service/i.test(tabText)) {
                    await tab.click({ timeout: 1500 }).catch(() => {});
                    await page.waitForTimeout(1000);
                    break;
                }
            }
        } catch { /* skip */ }

        // Facilities from DOM
        const facilityListSelectors = [
            '[data-testid*="facilit"] li',
            '[data-testid*="parking"] li',
            'section:has(h2:text-matches("facilit|parking|service", "i")) li',
            'section:has(h3:text-matches("facilit|parking", "i")) li',
        ];
        for (const sel of facilityListSelectors) {
            const texts = await safeAllTexts(page, sel);
            for (const t of texts) {
                if (t.length < 2) continue;
                const lower = t.toLowerCase();
                // Categorize
                if (/parking/i.test(lower)) {
                    parking = {
                        available: !/no parking|not available/i.test(lower),
                        onSite: /on.?site/i.test(lower),
                        paid: /paid|charge|fee/i.test(lower),
                        disabled: /disabled|accessible/i.test(lower),
                    };
                } else if (/inpatient|outpatient|day surgery|pharmacy|radiol|laborator|theatr|icu|a&e|emergency/i.test(lower)) {
                    healthcareServices.push(t);
                } else if (/see.*children|paediatric/i.test(lower)) {
                    seesChildren = !/not|no/i.test(lower);
                } else if (/international/i.test(lower)) {
                    internationalPatients = !/not|no/i.test(lower);
                } else {
                    generalFacilities.push(t);
                }
            }
        }

        if (generalFacilities.length > 0 || healthcareServices.length > 0 || parking) {
            result.hospitalFacilities = {
                parking,
                generalFacilities: [...new Set(generalFacilities)],
                healthcareServices: [...new Set(healthcareServices)],
                seesChildren,
                internationalPatients,
            };
        }

    } catch (e: any) {
        console.log(`  ⚠️ Hospital details extraction error: ${e.message}`);
    }

    return result;
}

// ---- Step 12: Parse structured opening hours ----
function parseOpeningHours(raw: any): OpeningHoursEntry[] | string | null {
    if (!raw) return null;

    // If it's already a string, try to parse "Mo-Fr 09:00-17:00" format
    if (typeof raw === 'string') {
        const entries: OpeningHoursEntry[] = [];
        const dayMap: Record<string, string> = {
            'Mo': 'Monday', 'Tu': 'Tuesday', 'We': 'Wednesday',
            'Th': 'Thursday', 'Fr': 'Friday', 'Sa': 'Saturday', 'Su': 'Sunday'
        };

        const parts = raw.split(',').map(s => s.trim());
        for (const part of parts) {
            const match = part.match(/^([A-Za-z,-]+)\s+(\d{1,2}:\d{2})-(\d{1,2}:\d{2})$/);
            if (match) {
                const dayRange = match[1];
                const opens = match[2];
                const closes = match[3];

                // Handle day ranges like "Mo-Fr"
                const rangeParts = dayRange.split('-');
                if (rangeParts.length === 2) {
                    const dayKeys = Object.keys(dayMap);
                    const startIdx = dayKeys.indexOf(rangeParts[0]);
                    const endIdx = dayKeys.indexOf(rangeParts[1]);
                    if (startIdx !== -1 && endIdx !== -1) {
                        for (let i = startIdx; i <= endIdx; i++) {
                            entries.push({ day: dayMap[dayKeys[i]], opens, closes });
                        }
                    }
                } else {
                    const day = dayMap[dayRange] || dayRange;
                    entries.push({ day, opens, closes });
                }
            }
        }

        return entries.length > 0 ? entries : raw;
    }

    // If it's an array of OpeningHoursSpecification objects
    if (Array.isArray(raw)) {
        const entries: OpeningHoursEntry[] = [];
        const dayMap: Record<string, string> = {
            'Monday': 'Monday', 'Tuesday': 'Tuesday', 'Wednesday': 'Wednesday',
            'Thursday': 'Thursday', 'Friday': 'Friday', 'Saturday': 'Saturday', 'Sunday': 'Sunday',
            'http://schema.org/Monday': 'Monday', 'http://schema.org/Tuesday': 'Tuesday',
            'http://schema.org/Wednesday': 'Wednesday', 'http://schema.org/Thursday': 'Thursday',
            'http://schema.org/Friday': 'Friday', 'http://schema.org/Saturday': 'Saturday',
            'http://schema.org/Sunday': 'Sunday',
            'https://schema.org/Monday': 'Monday', 'https://schema.org/Tuesday': 'Tuesday',
            'https://schema.org/Wednesday': 'Wednesday', 'https://schema.org/Thursday': 'Thursday',
            'https://schema.org/Friday': 'Friday', 'https://schema.org/Saturday': 'Saturday',
            'https://schema.org/Sunday': 'Sunday',
        };

        for (const entry of raw) {
            if (entry.dayOfWeek) {
                const days = Array.isArray(entry.dayOfWeek) ? entry.dayOfWeek : [entry.dayOfWeek];
                for (const d of days) {
                    const day = dayMap[d] || d;
                    entries.push({
                        day,
                        opens: entry.opens || '',
                        closes: entry.closes || '',
                    });
                }
            }
        }

        return entries.length > 0 ? entries : null;
    }

    return raw;
}

// ---- Main scraping function ----
async function scrapePractice(page: Page, url: string): Promise<ScrapedPractice | null> {
    try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await page.waitForTimeout(2000);

        // === PRIMARY: Extract JSON-LD structured data ===
        const jsonLd = await extractJsonLd(page);

        // --- Name ---
        let name = jsonLd?.name || '';
        if (!name) {
            name = await safeText(page, 'h1') || '';
        }
        if (!name) {
            console.log(`  ⚠️ No name found, skipping: ${url}`);
            return null;
        }

        // --- Address ---
        let address: string | null = null;
        let postcode: string | null = null;
        let city: string | null = null;
        let addressRegion: string | null = null;
        let addressCountry: string | null = null;
        let fullAddress: string | null = null;

        if (jsonLd?.address) {
            const addr = jsonLd.address;
            address = addr.streetAddress || null;
            postcode = addr.postalCode || null;
            city = addr.addressLocality || null;
            addressRegion = addr.addressRegion || null;
            addressCountry = addr.addressCountry || null;

            // Build full address
            const parts = [address, city, addressRegion, postcode, addressCountry].filter(Boolean);
            fullAddress = parts.length > 0 ? parts.join(', ') : null;
        }

        // Fallback: extract postcode from page text
        if (!postcode) {
            try {
                const body = await page.locator('body').textContent() || '';
                const m = body.match(/[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}/i);
                if (m) postcode = m[0].toUpperCase();
            } catch { /* skip */ }
        }

        // --- Phone ---
        let phone = jsonLd?.telephone || null;
        if (!phone) {
            try {
                const tel = page.locator('a[href^="tel:"]').first();
                const href = await tel.getAttribute('href', { timeout: 1500 });
                phone = href?.replace('tel:', '') || null;
            } catch { /* skip */ }
        }

        // --- Fax ---
        const faxNumber = jsonLd?.faxNumber || null;

        // --- Email ---
        let email: string | null = null;
        try {
            const href = await page.locator('a[href^="mailto:"]').first().getAttribute('href', { timeout: 1500 });
            email = href?.replace('mailto:', '') || null;
        } catch { /* skip */ }

        // --- Website (external link, not doctify or social) ---
        const BLOCKED_DOMAINS = ['doctify', 'google', 'facebook', 'twitter', 'instagram', 'youtube', 'linkedin', 'apple.com', 'tiktok', 'x.com'];
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

        // --- Rating & Reviews (structured) ---
        let rating: number | null = null;
        let reviewCount = 0;
        let aggregateRating: ScrapedPractice['raw_data']['aggregateRating'] = null;

        if (jsonLd?.aggregateRating) {
            const ar = jsonLd.aggregateRating;
            rating = parseFloat(ar.ratingValue) || null;
            reviewCount = parseInt(ar.ratingCount || ar.reviewCount) || 0;
            aggregateRating = {
                ratingValue: rating,
                ratingCount: reviewCount,
                bestRating: parseFloat(ar.bestRating) || null,
                worstRating: parseFloat(ar.worstRating) || null,
            };
        }

        // Fallback: regex from page text
        if (!rating) {
            try {
                const body = await page.locator('body').textContent() || '';
                const ratingMatch = body.match(/(\d\.\d)\s*\/\s*5/);
                if (ratingMatch) rating = parseFloat(ratingMatch[1]);
                const reviewMatch = body.match(/(\d+)\s*(?:verified\s+)?reviews?/i);
                if (reviewMatch) reviewCount = parseInt(reviewMatch[1]);
            } catch { /* skip */ }
        }

        // --- Description ---
        let description = jsonLd?.description || null;
        if (!description) {
            description = await safeAttr(page, 'meta[name="description"]', 'content');
        }

        // --- Extended about text from page ----
        let aboutText: string | null = null;
        const aboutSelectors = [
            '[data-testid*="about"] p',
            'section:has(h2:text-matches("about", "i")) p',
            'div:has(h3:text-matches("about", "i")) p',
            '.about-section p',
        ];
        for (const sel of aboutSelectors) {
            const texts = await safeAllTexts(page, sel);
            if (texts.length > 0) {
                aboutText = texts.join('\n\n').slice(0, 2000);
                break;
            }
        }

        // --- Image ---
        let imageUrl = jsonLd?.logo || jsonLd?.image || null;
        if (typeof imageUrl === 'object' && imageUrl?.url) imageUrl = imageUrl.url;
        if (!imageUrl || imageUrl.includes('w=256')) {
            imageUrl = await safeAttr(page, 'meta[property="og:image"]', 'content');
        }

        // --- Specialties ---
        const specialties: string[] = [];
        if (jsonLd?.medicalSpecialty) {
            const specs = Array.isArray(jsonLd.medicalSpecialty) ? jsonLd.medicalSpecialty : [jsonLd.medicalSpecialty];
            for (const spec of specs) {
                const name = spec.name || spec;
                if (typeof name === 'string' && name.trim()) specialties.push(name.trim());
            }
        }

        // --- Geo coordinates ---
        const geo = jsonLd?.geo || null;

        // --- Opening hours ---
        const openingHours = parseOpeningHours(jsonLd?.openingHours || jsonLd?.openingHoursSpecification);

        // --- Doctors (comprehensive) ---
        console.log(`  👨‍⚕️ Extracting doctor profiles...`);
        const doctors = await extractDoctors(page, jsonLd);
        console.log(`  👨‍⚕️ Found ${doctors.length} doctors`);

        // --- Services, treatments, conditions ---
        console.log(`  📋 Extracting services and treatments...`);
        const { services, treatments, conditions } = await extractServices(page, jsonLd);
        console.log(`  📋 Services: ${services.length}, Treatments: ${treatments.length}, Conditions: ${conditions.length}`);

        // --- Insurance, payment, facilities, languages ---
        console.log(`  🏥 Extracting insurance, facilities, languages...`);
        const extras = await extractInsuranceAndFacilities(page, jsonLd);
        console.log(`  🏥 Insurance: ${extras.insurance.length}, Facilities: ${extras.facilities.length}, Languages: ${extras.languages.length}`);

        // --- Social media ---
        const socialMedia = await extractSocialMedia(page);

        // --- Reviews ---
        const reviews = await extractReviews(page, jsonLd);
        console.log(`  💬 Found ${reviews.length} reviews`);

        // --- Gallery images ---
        const galleryImages = await extractGalleryImages(page);

        // --- Accreditations ---
        const accreditations = await extractAccreditations(page);

        // --- Other JSON-LD fields ---
        const acceptingNewPatients = jsonLd?.isAcceptingNewPatients ?? null;
        const foundationDate = jsonLd?.foundingDate || jsonLd?.foundationDate || null;
        const numberOfEmployees = jsonLd?.numberOfEmployees?.value
            ? parseInt(jsonLd.numberOfEmployees.value)
            : (typeof jsonLd?.numberOfEmployees === 'number' ? jsonLd.numberOfEmployees : null);
        const areaServed = jsonLd?.areaServed?.name || jsonLd?.areaServed || null;
        const schemaType = jsonLd?.['@type']
            ? (Array.isArray(jsonLd['@type']) ? jsonLd['@type'].join(', ') : jsonLd['@type'])
            : null;

        // --- NEW: Specialist-specific details (for specialist pages) ---
        let specialistDetails = {
            bio: null as string | null,
            education: [] as EducationEntry[],
            skills: [] as SkillEndorsement[],
            fees: null as SpecialistFees | null,
            practiceLocations: [] as PracticeLocation[],
            aiReviewSummary: null as string | null,
            yearsOfExperience: null as number | null,
        };
        if (PAGE_TYPE === 'specialists') {
            console.log(`  🎓 Extracting specialist details (fees, education, skills)...`);
            specialistDetails = await extractSpecialistDetails(page, jsonLd);
            console.log(`  🎓 Education: ${specialistDetails.education.length}, Skills: ${specialistDetails.skills.length}, Fees: ${specialistDetails.fees ? 'Yes' : 'No'}`);
            // Merge specialist details into the main doctor profile if exists
            if (doctors.length > 0) {
                const mainDoc = doctors[0];
                mainDoc.yearsOfExperience = specialistDetails.yearsOfExperience;
                mainDoc.consultationFees = specialistDetails.fees;
                mainDoc.education = specialistDetails.education;
                mainDoc.skills = specialistDetails.skills;
                mainDoc.practiceLocations = specialistDetails.practiceLocations;
                mainDoc.bio = specialistDetails.bio;
                mainDoc.aiReviewSummary = specialistDetails.aiReviewSummary;
            }
        }

        // --- NEW: Hospital-specific details ---
        let hospitalDetails = {
            areasOfExpertise: [] as AreaOfExpertise[],
            hospitalFacilities: null as HospitalFacilities | null,
            totalSpecialists: null as number | null,
            followers: null as number | null,
        };
        if (PAGE_TYPE === 'hospitals') {
            console.log(`  🏥 Extracting hospital details (expertise, facilities)...`);
            hospitalDetails = await extractHospitalDetails(page, jsonLd);
            console.log(`  🏥 Areas of expertise: ${hospitalDetails.areasOfExpertise.length}, Total specialists: ${hospitalDetails.totalSpecialists || 'N/A'}`);
        }

        // --- Build result ---
        const urlParts = url.split('/');
        const slug = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2];
        const categories = inferCategories(url, name, specialties);

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
                pageType: PAGE_TYPE.replace(/s$/, ''), // practices -> practice
                geo: geo ? { lat: parseFloat(geo.latitude) || 0, lng: parseFloat(geo.longitude) || 0 } : null,
                faxNumber,
                openingHours,
                doctors,
                services,
                conditionsTreated: conditions,
                treatments,
                insurance: extras.insurance,
                paymentMethods: extras.paymentMethods,
                priceRange: extras.priceRange,
                facilities: extras.facilities,
                languages: extras.languages,
                socialMedia,
                galleryImages,
                accreditations,
                reviews,
                acceptingNewPatients,
                aboutText,
                aggregateRating,
                schemaType,
                foundationDate,
                numberOfEmployees,
                areaServed: typeof areaServed === 'string' ? areaServed : null,
                addressRegion,
                addressCountry,
                fullAddress,
                // NEW: Hospital-specific
                areasOfExpertise: hospitalDetails.areasOfExpertise,
                hospitalFacilities: hospitalDetails.hospitalFacilities,
                totalSpecialists: hospitalDetails.totalSpecialists,
                followers: hospitalDetails.followers,
                // NEW: Specialist-specific
                specialistBio: specialistDetails.bio,
                specialistEducation: specialistDetails.education,
                specialistSkills: specialistDetails.skills,
                specialistFees: specialistDetails.fees,
                specialistLocations: specialistDetails.practiceLocations,
                aiReviewSummary: specialistDetails.aiReviewSummary,
                yearsOfExperience: specialistDetails.yearsOfExperience,
            }
        };
    } catch (err: any) {
        console.log(`  ❌ Error scraping ${url}: ${err.message}`);
        return null;
    }
}

// ---- Store in Supabase ----
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

// ---- Pretty-print extraction summary ----
function printSummary(lead: ScrapedPractice) {
    console.log(`  📋 Extracted: ${lead.name}`);
    if (lead.address) console.log(`     📍 Address: ${lead.address}`);
    if (lead.postcode) console.log(`     📮 Postcode: ${lead.postcode}`);
    if (lead.city) console.log(`     🏙️  City: ${lead.city}`);
    if (lead.phone) console.log(`     📞 Phone: ${lead.phone}`);
    if (lead.email) console.log(`     📧 Email: ${lead.email}`);
    if (lead.website) console.log(`     🌐 Website: ${lead.website}`);
    if (lead.rating) console.log(`     ⭐ Rating: ${lead.rating}/5 (${lead.review_count} reviews)`);
    if (lead.specialties.length) console.log(`     🩺 Specialties: ${lead.specialties.join(', ')}`);
    console.log(`     🏷️  Categories: ${lead.categories.join(', ')}`);

    const rd = lead.raw_data;
    if (rd.doctors.length) console.log(`     👨‍⚕️ Doctors: ${rd.doctors.length} (${rd.doctors.slice(0, 3).map(d => d.name).join(', ')}${rd.doctors.length > 3 ? '...' : ''})`);
    if (rd.services.length) console.log(`     📋 Services: ${rd.services.length}`);
    if (rd.treatments.length) console.log(`     💊 Treatments: ${rd.treatments.length}`);
    if (rd.conditionsTreated.length) console.log(`     🏥 Conditions: ${rd.conditionsTreated.length}`);
    if (rd.insurance.length) console.log(`     🛡️  Insurance: ${rd.insurance.length}`);
    if (rd.facilities.length) console.log(`     🏗️  Facilities: ${rd.facilities.length}`);
    if (rd.languages.length) console.log(`     🗣️  Languages: ${rd.languages.join(', ')}`);
    if (rd.reviews.length) console.log(`     💬 Reviews: ${rd.reviews.length}`);
    if (rd.accreditations.length) console.log(`     🏆 Accreditations: ${rd.accreditations.join(', ')}`);
    if (rd.galleryImages.length) console.log(`     📸 Gallery: ${rd.galleryImages.length} images`);
    if (rd.faxNumber) console.log(`     📠 Fax: ${rd.faxNumber}`);
    if (rd.openingHours) console.log(`     🕐 Opening hours: present`);
    if (rd.acceptingNewPatients !== null) console.log(`     ✅ Accepting new patients: ${rd.acceptingNewPatients}`);

    const hasSocial = Object.values(rd.socialMedia).some(v => v !== null);
    if (hasSocial) {
        const platforms = Object.entries(rd.socialMedia).filter(([, v]) => v !== null).map(([k]) => k);
        console.log(`     📱 Social: ${platforms.join(', ')}`);
    }
}

// ---- Scrape a single page type ----
async function scrapeType(
    page: Page,
    typeName: string,
    existingUrls: Set<string>,
    progress: ScrapeProgress,
): Promise<{ success: number; failed: number; skipped: number; total: number }> {
    // Update globals for this type
    PAGE_TYPE = typeName;
    const typeConfig = PAGE_TYPES[typeName];
    SITEMAP_URL = typeConfig.sitemap;
    URL_PATTERN = typeConfig.urlPattern;
    PATH_SEGMENT = typeConfig.pathSegment;

    console.log(`\n${'🔷'.repeat(40)}`);
    console.log(`🏥 Scraping type: ${typeName.toUpperCase()}`);
    console.log(`   Sitemap: ${SITEMAP_URL}`);
    console.log(`${'🔷'.repeat(40)}\n`);

    // 1. Get URLs from sitemap
    let urls = await fetchSitemapUrls();

    if (dryRun) {
        console.log(`\n📋 Dry run — ${typeName} URLs to scrape:`);
        urls.forEach((url, i) => console.log(`  ${i + 1}. ${url}`));
        console.log(`\n Total ${typeName}: ${urls.length}`);
        return { success: 0, failed: 0, skipped: 0, total: urls.length };
    }

    const totalBefore = urls.length;

    // 2. Filter out already-scraped URLs (resume mode)
    let skipped = 0;
    if (RESUME && existingUrls.size > 0) {
        const before = urls.length;
        urls = urls.filter(url => !existingUrls.has(url));
        skipped = before - urls.length;
        if (skipped > 0) {
            console.log(`⏭️  Skipping ${skipped} already-scraped URLs (${urls.length} remaining)`);
        }
    }

    // 3. Scrape each page
    let success = 0;
    let failed = 0;

    for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        console.log(`\n${'='.repeat(80)}`);
        console.log(`[${typeName}] [${i + 1}/${urls.length}] 🔍 ${url}`);
        console.log('='.repeat(80));

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
            printSummary(lead);

            const stored = await storeLead(lead);
            if (stored) {
                console.log(`  ✅ Stored successfully!`);
                success++;
                existingUrls.add(url); // Track for resume
            } else {
                failed++;
            }
        } else {
            console.log(`  ❌ Failed to extract data`);
            failed++;
        }

        // Update progress every 10 URLs
        if ((i + 1) % 10 === 0) {
            progress.types[typeName] = {
                total: totalBefore,
                scraped: success + skipped,
                failed,
                completed: false,
                lastUrl: url,
            };
            saveProgress(progress);
        }

        // Polite delay
        if (i < urls.length - 1) {
            await page.waitForTimeout(DELAY_MS);
        }
    }

    // Save final progress for this type
    progress.types[typeName] = {
        total: totalBefore,
        scraped: success + skipped,
        failed,
        completed: true,
        lastUrl: urls[urls.length - 1] || null,
    };
    saveProgress(progress);

    console.log(`\n${'='.repeat(80)}`);
    console.log(`✨ [${typeName}] Done! Scraped: ${success}, Skipped: ${skipped}, Failed: ${failed}, Total in sitemap: ${totalBefore}`);
    console.log('='.repeat(80));

    return { success, failed, skipped, total: totalBefore };
}

// ---- Main ----
async function main() {
    const typesToScrape = SCRAPE_ALL ? Object.keys(PAGE_TYPES) : [PAGE_TYPE];

    console.log('🚀 Doctify Scraper — Enhanced Edition');
    console.log(`   Mode: ${SCRAPE_ALL ? 'ALL TYPES' : PAGE_TYPE}`);
    console.log(`   Types: ${typesToScrape.join(', ')}`);
    console.log(`   Limit: ${LIMIT === Infinity ? 'ALL' : LIMIT}`);
    console.log(`   Category: ${CATEGORY_FILTER || 'ALL'}`);
    console.log(`   Resume: ${RESUME}`);
    console.log(`   Headless: ${!VISIBLE}`);
    console.log(`   Dry run: ${dryRun}\n`);

    // Load existing URLs for resume
    const existingUrls = await getExistingUrls();

    // Load progress
    const progress = loadProgress();

    const browser = await chromium.launch({ headless: !VISIBLE });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        viewport: { width: 1920, height: 1080 },
        locale: 'en-GB',
    });

    try {
        const page = await context.newPage();
        const results: Record<string, { success: number; failed: number; skipped: number; total: number }> = {};

        for (const typeName of typesToScrape) {
            results[typeName] = await scrapeType(page, typeName, existingUrls, progress);
        }

        await page.close();

        // Print grand summary
        console.log(`\n${'🏆'.repeat(40)}`);
        console.log('📊 GRAND SUMMARY');
        console.log('🏆'.repeat(40));

        let grandSuccess = 0, grandFailed = 0, grandSkipped = 0, grandTotal = 0;
        for (const [type, r] of Object.entries(results)) {
            console.log(`  ${type.padEnd(15)} | Total: ${String(r.total).padStart(5)} | Scraped: ${String(r.success).padStart(5)} | Skipped: ${String(r.skipped).padStart(5)} | Failed: ${String(r.failed).padStart(5)}`);
            grandSuccess += r.success;
            grandFailed += r.failed;
            grandSkipped += r.skipped;
            grandTotal += r.total;
        }
        console.log('  ' + '-'.repeat(75));
        console.log(`  ${'TOTAL'.padEnd(15)} | Total: ${String(grandTotal).padStart(5)} | Scraped: ${String(grandSuccess).padStart(5)} | Skipped: ${String(grandSkipped).padStart(5)} | Failed: ${String(grandFailed).padStart(5)}`);
        console.log(`\n📁 Progress saved to: ${PROGRESS_FILE}`);

    } finally {
        await browser.close();
    }
}

main().catch(console.error);

