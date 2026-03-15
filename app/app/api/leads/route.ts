import { NextRequest, NextResponse } from 'next/server';
import { calculateLeadScore } from '@/lib/intelligence';

const ODS_API_URL = "https://directory.spineservices.nhs.uk/ORD/2-0-0/organisations";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get('role'); // e.g., RO182, RO172, RO197
    const limit = searchParams.get('limit') || '100';
    const offset = searchParams.get('offset') || '0';
    const search = searchParams.get('search') || '';
    const town = searchParams.get('town') || '';
    const postcode = searchParams.get('postcode') || '';

    try {
        let filterByCity = '';

        const queryParams: Record<string, string> = {
            PrimaryRoleId: role || 'RO172',
            Limit: limit,
            Status: 'Active'
        };

        if (offset && offset !== '0') {
            queryParams.Offset = offset;
        }

        if (search) {
            queryParams.Name = search;
        }

        // Handle Town/Postcode logic
        if (town) {
            const isPostcode = /^[a-zA-Z]{1,2}[0-9]/.test(town.trim());
            if (isPostcode) {
                queryParams.PostCode = town.trim();
            } else {
                filterByCity = town.trim().toLowerCase();
                if (!search) {
                    queryParams.Name = town.trim();
                }
            }
        }

        if (postcode) queryParams.PostCode = postcode;

        const queryString = new URLSearchParams(queryParams).toString();
        const url = `${ODS_API_URL}?${queryString}`;

        const res = await fetch(url, {
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!res.ok) {
            const text = await res.text();
            return NextResponse.json({ error: 'NHS API Error', details: text }, { status: res.status });
        }

        const data = await res.json();
        let orgs = data.Organisations || [];

        if (filterByCity) {
            orgs = orgs.filter((org: any) => {
                const addr = (org.GeoLoc?.Location?.AddrLn1 || '').toLowerCase();
                const town = (org.GeoLoc?.Location?.Town || '').toLowerCase();
                const name = (org.Name || '').toLowerCase();
                return addr.includes(filterByCity) || town.includes(filterByCity) || name.includes(filterByCity);
            });
        }

        // Transform to our Lead interface with Intelligent Scoring
        const leads = orgs.map((org: any) => {
            const type = mapRoleToType(org.PrimaryRoleId);
            const baseLead = {
                Name: org.Name,
                ODS_Code: org.OrgId,
                Status: org.Status,
                Address: org.GeoLoc?.Location?.AddrLn1 || '',
                City: org.GeoLoc?.Location?.Town || '',
                Postcode: org.PostCode || '',
                Country: 'UK',
                Role: org.PrimaryRoleDescription,
                Type: type,
            };

            return {
                ...baseLead,
                LeadScore: calculateLeadScore(baseLead)
            };
        });

        const totalCount = res.headers.get('X-Total-Count') || '0';

        return NextResponse.json({
            leads,
            total: parseInt(totalCount, 10),
            hasMore: leads.length === parseInt(limit, 10)
        });

    } catch (error) {
        console.error('API Route Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

function mapRoleToType(roleId: string): string {
    if (roleId === 'RO182') return 'Pharmacy';
    if (roleId === 'RO172') return 'Clinic';
    if (roleId === 'RO197') return 'Hospital';
    return 'Other';
}
