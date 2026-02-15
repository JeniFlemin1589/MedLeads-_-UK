const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export interface EnrichedData {
    phoneNumber?: string;
    website?: string;
    rating?: number;
    userRatingsTotal?: number;
    placeId?: string;
    openingHours?: string[];
    photos?: string[];
}

export async function findPlace(name: string, postcode: string): Promise<string | null> {
    if (!GOOGLE_API_KEY) {
        console.error("Google Maps API Key is missing");
        return null;
    }

    const query = `${name} ${postcode} UK`;
    const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=place_id&key=${GOOGLE_API_KEY}`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        if (data.candidates && data.candidates.length > 0) {
            return data.candidates[0].place_id;
        }
    } catch (error) {
        console.error("Error finding place:", error);
    }
    return null;
}

export async function getPlaceDetails(placeId: string): Promise<EnrichedData | null> {
    if (!GOOGLE_API_KEY) {
        console.error("Google Maps API Key is missing");
        return null;
    }

    const fields = "formatted_phone_number,website,rating,user_ratings_total,opening_hours,photos";
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${GOOGLE_API_KEY}`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        if (data.result) {
            return {
                phoneNumber: data.result.formatted_phone_number,
                website: data.result.website,
                rating: data.result.rating,
                userRatingsTotal: data.result.user_ratings_total,
                placeId: placeId,
                openingHours: data.result.opening_hours?.weekday_text,
                photos: data.result.photos?.map((p: any) =>
                    `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${p.photo_reference}&key=${GOOGLE_API_KEY}`
                ).slice(0, 1) // Limit to 1 photo for now
            };
        }
    } catch (error) {
        console.error("Error getting place details:", error);
    }
    return null;
}
