import { NextRequest, NextResponse } from 'next/server';

const CQC_API_URL = "https://api.service.cqc.org.uk/public/v1";
const API_KEY = process.env.CQC_API_KEY;

// Service category → CQC API filter parameters
// These use official CQC API structured filters (directorate & serviceType)
const SERVICE_FILTERS: Record<string, { directorate?: string; serviceType?: string }> = {
    'all': { serviceType: 'Doctors consultation service' },
    'gp': { serviceType: 'Doctors consultation service' },
    'dental': { serviceType: 'Dental service' },
    'pharmacy': { directorate: 'Primary medical services' },
    'mental-health': { directorate: 'Hospitals' },
    'surgery': { directorate: 'Hospitals' },
    'diagnostics': { directorate: 'Hospitals' },
    'homecare': { directorate: 'Adult social care' },
    'nursing': { directorate: 'Adult social care' },
    'hospice': { directorate: 'Adult social care' },
    'rehabilitation': { directorate: 'Hospitals' },
    'urgent-care': { directorate: 'Primary medical services' },
    'ambulance': { directorate: 'Primary medical services' },
};

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const page = Math.floor(offset / limit) + 1;
    const service = searchParams.get('service') || 'all';

    if (!API_KEY) {
        return NextResponse.json({ error: 'CQC API Key missing. Add CQC_API_KEY to .env.local' }, { status: 500 });
    }

    try {
        const headers: Record<string, string> = {
            'Ocp-Apim-Subscription-Key': API_KEY,
            'Accept': 'application/json'
        };

        // 1. Fetch location list — use appropriate CQC filter
        const filter = SERVICE_FILTERS[service] || SERVICE_FILTERS['all'];
        const params = new URLSearchParams({
            perPage: limit.toString(),
            page: page.toString(),
        });

        if (filter.serviceType) params.set('gacServiceTypeDescription', filter.serviceType);
        if (filter.directorate) params.set('inspectionDirectorate', filter.directorate);

        const res = await fetch(`${CQC_API_URL}/locations?${params}`, { headers });

        if (!res.ok) {
            const txt = await res.text();
            console.error('CQC List Error:', res.status, txt);
            return NextResponse.json({ error: 'CQC API Error' }, { status: res.status });
        }

        const data = await res.json();
        const locations = data.locations || [];

        // 2. Fetch full details for each location (parallel)
        const detailPromises = locations.map(async (loc: any) => {
            try {
                const dRes = await fetch(`${CQC_API_URL}/locations/${loc.locationId}`, { headers });
                if (!dRes.ok) return null;
                return await dRes.json();
            } catch {
                return null;
            }
        });

        const detailsRaw = await Promise.all(detailPromises);
        const details = detailsRaw.filter((d): d is any => d !== null);

        // 3. Filter for Registered locations
        // When a specific service is selected, include all registered CQC locations for that service
        // When 'all' is selected, restrict to private/independent providers only
        const filteredDetails = details.filter((d: any) => {
            const isRegistered = d.registrationStatus === 'Registered';
            if (!isRegistered) return false;



            if (service === 'all' || service === 'gp') {
                const isPrivate = d.type === 'Independent Healthcare Org' || d.type === 'Independent Hospital';
                return isPrivate;
            }
            // For specific service types (dental, pharmacy, etc.), show all registered locations
            return true;
        });

        // 4. Transform to rich Lead format
        const leads = filteredDetails.map((org: any) => {
            // Extract manager/contact info from regulated activities
            const contacts = (org.regulatedActivities || []).flatMap((act: any) =>
                (act.contacts || []).map((c: any) => ({
                    name: [c.personTitle, c.personGivenName, c.personFamilyName].filter(Boolean).join(' '),
                    roles: c.personRoles || []
                }))
            );

            // Deduplicate contacts by name
            const uniqueContacts = contacts.filter((c: any, i: number, arr: any[]) =>
                arr.findIndex((x: any) => x.name === c.name) === i
            );

            // Extract CQC ratings
            const ratings = org.currentRatings?.overall;
            const keyRatings = ratings?.keyQuestionRatings || [];

            return {
                // Core lead info
                Name: org.name,
                ODS_Code: org.locationId,
                Status: 'Active',
                Address: [org.postalAddressLine1, org.postalAddressLine2].filter(Boolean).join(', '),
                City: org.postalAddressTownCity,
                Postcode: org.postalCode,
                Country: 'UK',
                Role: org.type,
                Type: 'Private Clinic',

                // Contact details (from CQC directly)
                PhoneNumber: org.mainPhoneNumber || null,
                Website: org.website ? (org.website.startsWith('http') ? org.website : `https://${org.website}`) : null,

                // Location & geography
                Region: org.region,
                Latitude: org.onspdLatitude,
                Longitude: org.onspdLongitude,
                LocalAuthority: org.localAuthority,
                Constituency: org.constituency,

                // CQC-specific data
                ProviderId: org.providerId,
                RegistrationDate: org.registrationDate,
                InspectionDirectorate: org.inspectionDirectorate,
                CareHome: org.careHome === 'Y',
                NumberOfBeds: org.numberOfBeds,

                // CQC Ratings
                OverallRating: ratings?.rating || null,
                RatingDate: ratings?.reportDate || null,
                DetailedRatings: keyRatings.map((r: any) => ({
                    category: r.name,
                    rating: r.rating
                })),

                // People / Contacts
                Contacts: uniqueContacts,

                // Services & Specialisms
                RegulatedActivities: (org.regulatedActivities || []).map((a: any) => a.name),
                ServiceTypes: (org.gacServiceTypes || []).map((s: any) => s.name),
                Specialisms: (org.specialisms || []).map((s: any) => s.name),
                InspectionCategories: (org.inspectionCategories || []).map((c: any) => c.name),

                // Inspection info
                LastInspectionDate: org.lastInspection?.date || null,
                LastReportDate: org.lastReport?.publicationDate || null,
                Reports: (org.reports || []).map((r: any) => ({
                    date: r.reportDate,
                    uri: r.reportUri ? `https://www.cqc.org.uk${r.reportUri}` : null
                })),

                // ICB info
                IcbName: org.onspdIcbName,
                CcgName: org.onspdCcgName
            };
        });

        return NextResponse.json({
            leads,
            total: data.total || 0,
            page,
            totalPages: data.totalPages || 0,
            hasMore: page < (data.totalPages || 0)
        });

    } catch (error) {
        console.error('Private API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
