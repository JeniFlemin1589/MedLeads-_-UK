import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { calculateLeadScore } from '@/lib/intelligence';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const source = searchParams.get('source') || 'all';     // doctify | goprivate | all
    const category = searchParams.get('category') || 'all';  // weight-loss | hair-loss | cosmetic | etc.
    const pageType = searchParams.get('pageType') || 'all'; // specialists | practices | hospitals
    const search = searchParams.get('search') || '';

    try {
        let query = supabase
            .from('scraped_leads')
            .select('*', { count: 'exact' });

        // Filter by source
        if (source !== 'all') {
            query = query.eq('source', source);
        }

        // Filter by category (uses array contains)
        if (category !== 'all') {
            query = query.contains('categories', [category]);
        }

        // Filter by page type (Doctor/Specialist vs Practice/Hospital)
        if (pageType !== 'all') {
            // strip 's' from the end since we store 'specialist', 'practice', 'hospital'
            const storedType = pageType.endsWith('s') && pageType !== 'all' ? pageType.slice(0, -1) : pageType;
            query = query.filter('raw_data->>pageType', 'eq', storedType);
        }

        // Free-text search on name
        if (search) {
            query = query.ilike('name', `%${search}%`);
        }

        // Pagination & ordering
        query = query
            .order('scraped_at', { ascending: false })
            .range(offset, offset + limit - 1);

        const { data, error, count } = await query;

        if (error) {
            console.error('Scraped leads query error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Transform to match lead card format with enriched data
        const leads = (data || []).map((row: any) => {
            const rd = row.raw_data || {};

            // Build contacts from enriched doctor profiles (if available) or legacy employee names
            let contacts: any[] = [];
            if (rd.doctors && Array.isArray(rd.doctors) && rd.doctors.length > 0) {
                contacts = rd.doctors.map((doc: any) => ({
                    name: doc.name,
                    title: doc.title || null,
                    roles: [doc.specialty || doc.jobTitle || 'Medical Professional'].filter(Boolean),
                    qualifications: doc.qualifications || null,
                    gmcNumber: doc.gmcNumber || null,
                    rating: doc.rating || null,
                    reviewCount: doc.reviewCount || 0,
                    profileUrl: doc.profileUrl || null,
                    imageUrl: doc.imageUrl || null,
                    subSpecialties: doc.subSpecialties || [],
                    // NEW specialist-specific fields
                    yearsOfExperience: doc.yearsOfExperience || null,
                    consultationFees: doc.consultationFees || null,
                    education: doc.education || [],
                    skills: doc.skills || [],
                    practiceLocations: doc.practiceLocations || [],
                    bio: doc.bio || null,
                    aiReviewSummary: doc.aiReviewSummary || null,
                }));
            } else if (rd.employees && Array.isArray(rd.employees)) {
                // Legacy format: just employee names as strings
                contacts = rd.employees.map((name: string) => ({
                    name,
                    roles: ['Medical Professional'],
                }));
            }

            const leadObj: any = {
                Name: row.name,
                ODS_Code: row.id,
                Status: 'Active',
                Address: row.address,
                City: row.city,
                Postcode: row.postcode,
                Country: 'UK',
                Role: row.source === 'doctify' ? 'Doctify Practice' : 'GoPrivate Listing',
                Type: 'Scraped Lead',

                PhoneNumber: row.phone,
                Website: row.website || row.url,
                Email: row.email,

                // Scraped-specific fields
                Source: row.source,
                SourceUrl: row.url,
                Categories: row.categories,
                Specialties: row.specialties,
                Rating: row.rating,
                ReviewCount: row.review_count,
                Description: row.description,
                ImageUrl: row.image_url,
                ScrapedAt: row.scraped_at,

                // Location
                Region: rd.addressRegion || null,
                Latitude: rd.geo?.lat || null,
                Longitude: rd.geo?.lng || null,
                FullAddress: rd.fullAddress || null,

                // Service info
                ServiceTypes: row.specialties || [],
                OverallRating: row.rating ? String(row.rating) : null,
                Contacts: contacts,

                // Enriched data from enhanced scraper
                PageType: rd.pageType || null,
                FaxNumber: rd.faxNumber || null,
                OpeningHours: rd.openingHours || null,
                Services: rd.services || [],
                Treatments: rd.treatments || [],
                ConditionsTreated: rd.conditionsTreated || [],
                Insurance: rd.insurance || [],
                PaymentMethods: rd.paymentMethods || [],
                PriceRange: rd.priceRange || null,
                Facilities: rd.facilities || [],
                Languages: rd.languages || [],
                SocialMedia: rd.socialMedia || null,
                GalleryImages: rd.galleryImages || [],
                Accreditations: rd.accreditations || [],
                Reviews: rd.reviews || [],
                AcceptingNewPatients: rd.acceptingNewPatients ?? null,
                AboutText: rd.aboutText || null,
                AggregateRating: rd.aggregateRating || null,
                FoundationDate: rd.foundationDate || null,
                NumberOfEmployees: rd.numberOfEmployees || null,
                AreaServed: rd.areaServed || null,

                // NEW: Hospital-specific fields
                AreasOfExpertise: rd.areasOfExpertise || [],
                HospitalFacilities: rd.hospitalFacilities || null,
                TotalSpecialists: rd.totalSpecialists || null,
                Followers: rd.followers || null,

                // NEW: Specialist-specific fields
                SpecialistBio: rd.specialistBio || null,
                SpecialistEducation: rd.specialistEducation || [],
                SpecialistSkills: rd.specialistSkills || [],
                SpecialistFees: rd.specialistFees || null,
                SpecialistLocations: rd.specialistLocations || [],
                AiReviewSummary: rd.aiReviewSummary || null,
                YearsOfExperience: rd.yearsOfExperience || null,
            };

            leadObj.LeadScore = calculateLeadScore(leadObj);

            return leadObj;
        });

        return NextResponse.json({
            leads,
            total: count || 0,
            page: Math.floor(offset / limit) + 1,
            totalPages: Math.ceil((count || 0) / limit),
            hasMore: offset + limit < (count || 0)
        });

    } catch (error) {
        console.error('Scraped API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
