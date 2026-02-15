import { NextRequest, NextResponse } from 'next/server';

const ORD_API_URL = "https://directory.spineservices.nhs.uk/ORD/2-0-0/organisations";

export async function POST(request: NextRequest) {
    try {
        const { odsCode } = await request.json();

        if (!odsCode) {
            return NextResponse.json({ error: 'ODS Code is required' }, { status: 400 });
        }

        const url = `${ORD_API_URL}/${odsCode}`;

        const res = await fetch(url, {
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!res.ok) {
            return NextResponse.json({ error: 'NHS API Error' }, { status: res.status });
        }

        const data = await res.json();
        const org = data.Organisation || {};

        // Extract Contacts
        const contacts = org.Contacts?.Contact || [];
        let phoneNumber = '';
        let email = '';
        let website = '';

        contacts.forEach((c: any) => {
            const type = c.type.toLowerCase();
            const value = c.value;
            if (type === 'tel') phoneNumber = value;
            if (type === 'email') email = value;
            if (type === 'http') website = value;
        });

        // Extract Address
        const loc = org.GeoLoc?.Location || {};
        const fullAddress = [
            loc.AddrLn1,
            loc.AddrLn2,
            loc.AddrLn3,
            loc.Town,
            loc.County
        ].filter(Boolean).join(', ');

        return NextResponse.json({
            enriched: {
                phoneNumber,
                email,
                website,
                fullAddress,
                uprn: loc.UPRN,
                lastUpdated: org.LastChangeDate
            }
        });

    } catch (error) {
        console.error('Enrichment API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
