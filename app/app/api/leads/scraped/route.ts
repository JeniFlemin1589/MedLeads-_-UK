import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const source = searchParams.get('source') || 'all';     // doctify | goprivate | all
    const category = searchParams.get('category') || 'all';  // weight-loss | hair-loss | cosmetic | etc.
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

        // Transform to match lead card format
        const leads = (data || []).map((row: any) => ({
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

            // Empty CQC-specific fields (for compatibility)
            Region: null,
            Latitude: row.raw_data?.geo?.lat || null,
            Longitude: row.raw_data?.geo?.lng || null,
            ServiceTypes: row.specialties || [],
            OverallRating: row.rating ? String(row.rating) : null,
            Contacts: (row.raw_data?.employees || []).map((name: string) => ({
                name: name,
                roles: ['Medical Professional']
            })),
        }));

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
