import { NextRequest, NextResponse } from 'next/server';

const ODS_API_URL = "https://directory.spineservices.nhs.uk/ORD/2-0-0/organisations";

export async function GET(request: NextRequest) {
    const odsCode = request.nextUrl.searchParams.get('odsCode');

    if (!odsCode) {
        return NextResponse.json({ error: 'Missing odsCode' }, { status: 400 });
    }

    try {
        const res = await fetch(`${ODS_API_URL}/${odsCode}`, {
            headers: { 'Accept': 'application/json' },
        });

        if (!res.ok) {
            return NextResponse.json({ error: 'NHS API Error' }, { status: res.status });
        }

        const data = await res.json();
        const org = data.Organisation;

        // Extract deep metadata
        const contacts = (org.Contacts || []).map((c: any) => ({
            type: c.Type,
            value: c.Value
        }));

        const roles = (org.Roles?.Role || []).map((r: any) => ({
            id: r.id,
            description: r.uniqueId, // Usually a text description
            status: r.Status,
            primary: r.primaryRole === 'true'
        }));

        const parent = org.Rels?.Rel?.[0]?.Target?.OrgId?.extension || null;

        return NextResponse.json({
            Name: org.Name,
            ODS_Code: org.OrgId.extension,
            Status: org.Status,
            Address: org.GeoLoc?.Location?.AddrLn1 || '',
            City: org.GeoLoc?.Location?.Town || '',
            Postcode: org.GeoLoc?.Location?.PostCode || '',
            Contacts: contacts,
            Roles: roles,
            ParentOrg: parent,
            DateOpened: org.Date?.[0]?.value || null,
        });

    } catch (error) {
        console.error('NHS Detail Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
