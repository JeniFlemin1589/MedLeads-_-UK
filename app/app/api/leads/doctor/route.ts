import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * GET /api/leads/doctor?url=<specialist_url>
 * 
 * Looks up a doctor's full profile from scraped_leads by their Doctify specialist URL.
 * Used for the doctor drill-down feature: when a user clicks a doctor
 * listed in a practice/hospital, we fetch their full profile.
 */
export async function GET(request: NextRequest) {
    const url = request.nextUrl.searchParams.get('url');

    if (!url) {
        return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
    }

    try {
        // Try exact URL match first
        let { data, error } = await supabase
            .from('scraped_leads')
            .select('*')
            .eq('url', url)
            .single();

        // If no exact match, try matching by slug (last part of URL)
        if (!data && !error) {
            const slug = url.split('/').pop();
            if (slug) {
                const result = await supabase
                    .from('scraped_leads')
                    .select('*')
                    .ilike('url', `%${slug}`)
                    .limit(1)
                    .single();
                data = result.data;
                error = result.error;
            }
        }

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!data) {
            return NextResponse.json({ found: false, doctor: null });
        }

        const rd = data.raw_data || {};

        // Transform to doctor profile format
        const doctor = {
            Name: data.name,
            Url: data.url,
            Address: data.address,
            City: data.city,
            Postcode: data.postcode,
            Phone: data.phone,
            Email: data.email,
            Website: data.website,
            Rating: data.rating,
            ReviewCount: data.review_count,
            Description: data.description,
            ImageUrl: data.image_url,
            Specialties: data.specialties || [],
            Categories: data.categories || [],
            PageType: rd.pageType || 'specialist',

            // Profile details
            Bio: rd.specialistBio || rd.aboutText || data.description || null,
            AiReviewSummary: rd.aiReviewSummary || null,
            YearsOfExperience: rd.yearsOfExperience || null,

            // Education & Skills
            Education: rd.specialistEducation || [],
            Skills: rd.specialistSkills || [],
            ConsultationFees: rd.specialistFees || null,
            PracticeLocations: rd.specialistLocations || [],

            // From doctor profiles (if available)
            Doctors: (rd.doctors || []).map((doc: any) => ({
                name: doc.name,
                title: doc.title || null,
                specialty: doc.specialty || null,
                subSpecialties: doc.subSpecialties || [],
                qualifications: doc.qualifications || null,
                gmcNumber: doc.gmcNumber || null,
                rating: doc.rating || null,
                reviewCount: doc.reviewCount || 0,
                imageUrl: doc.imageUrl || null,
                yearsOfExperience: doc.yearsOfExperience || null,
                consultationFees: doc.consultationFees || null,
                education: doc.education || [],
                skills: doc.skills || [],
                practiceLocations: doc.practiceLocations || [],
                bio: doc.bio || null,
                aiReviewSummary: doc.aiReviewSummary || null,
            })),

            // Additional data
            Reviews: rd.reviews || [],
            Services: rd.services || [],
            Treatments: rd.treatments || [],
            ConditionsTreated: rd.conditionsTreated || [],
            Insurance: rd.insurance || [],
            Languages: rd.languages || [],
            SocialMedia: rd.socialMedia || null,
            Accreditations: rd.accreditations || [],
            GalleryImages: rd.galleryImages || [],
            OpeningHours: rd.openingHours || null,

            // Aggregate rating
            AggregateRating: rd.aggregateRating || null,

            ScrapedAt: data.scraped_at,
        };

        return NextResponse.json({ found: true, doctor });
    } catch (error) {
        console.error('Doctor lookup error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
