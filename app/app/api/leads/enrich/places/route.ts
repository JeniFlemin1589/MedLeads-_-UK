import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

export async function POST(request: NextRequest) {
    try {
        const { name, postcode, address } = await request.json();

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        if (!GOOGLE_API_KEY) {
            return NextResponse.json({ error: 'Google Places API key not configured' }, { status: 500 });
        }

        // Step 1: Find the place
        const searchQuery = `${name} ${address || ''} ${postcode || ''} UK`.trim();
        const findUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(searchQuery)}&inputtype=textquery&fields=place_id,name,formatted_address&key=${GOOGLE_API_KEY}`;

        const findRes = await fetch(findUrl);
        const findData = await findRes.json();

        if (findData.status !== 'OK' || !findData.candidates?.length) {
            return NextResponse.json({
                places: null,
                message: `No Google Places match found for "${name}"`
            });
        }

        const placeId = findData.candidates[0].place_id;

        // Step 2: Get full details
        const fields = [
            'name', 'formatted_address', 'formatted_phone_number', 'international_phone_number',
            'website', 'url', 'rating', 'user_ratings_total',
            'opening_hours', 'business_status', 'price_level',
            'reviews', 'types', 'photos'
        ].join(',');

        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${GOOGLE_API_KEY}`;

        const detailsRes = await fetch(detailsUrl);
        const detailsData = await detailsRes.json();

        if (detailsData.status !== 'OK') {
            return NextResponse.json({
                places: null,
                message: `Google Places details failed: ${detailsData.status}`
            });
        }

        const result = detailsData.result;

        // Step 3: Format the response
        const places = {
            placeId,
            name: result.name,
            formattedAddress: result.formatted_address,
            phone: result.formatted_phone_number || result.international_phone_number,
            website: result.website,
            googleMapsUrl: result.url,
            rating: result.rating,
            totalReviews: result.user_ratings_total,
            businessStatus: result.business_status,
            priceLevel: result.price_level,

            // Opening hours
            openNow: result.opening_hours?.open_now,
            weekdayHours: result.opening_hours?.weekday_text || [],

            // Reviews (up to 5 most relevant)
            reviews: (result.reviews || []).slice(0, 5).map((r: any) => ({
                author: r.author_name,
                rating: r.rating,
                text: r.text,
                time: r.relative_time_description,
                profilePhoto: r.profile_photo_url
            })),

            // Photo URL (just first one for now)
            photoUrl: result.photos?.[0] ?
                `https://maps.googleapis.com/maps/api/place/photo?maxwidth=600&photo_reference=${result.photos[0].photo_reference}&key=${GOOGLE_API_KEY}`
                : null,

            // Categories
            types: result.types || []
        };

        return NextResponse.json({ places });

    } catch (error) {
        console.error('Google Places Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
