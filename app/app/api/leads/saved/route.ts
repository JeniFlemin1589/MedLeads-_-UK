import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'saved_leads.json');

// Helper to read data
function readData() {
    if (!fs.existsSync(DATA_FILE)) {
        return [];
    }
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

// Helper to write data
function writeData(data: any[]) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

export async function GET() {
    const leads = readData();
    return NextResponse.json({ leads });
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { lead } = body;

        if (!lead || !lead.ODS_Code) {
            return NextResponse.json({ error: 'Invalid lead data' }, { status: 400 });
        }

        const currentLeads = readData();
        // Check for duplicate
        const exists = currentLeads.find((l: any) => l.ODS_Code === lead.ODS_Code);

        if (exists) {
            // Update existing? Or just ignore. Let's update.
            const updated = currentLeads.map((l: any) => l.ODS_Code === lead.ODS_Code ? { ...l, ...lead } : l);
            writeData(updated);
            return NextResponse.json({ message: 'Lead updated', lead });
        } else {
            const newLeads = [...currentLeads, { ...lead, SavedAt: new Date().toISOString() }];
            writeData(newLeads);
            return NextResponse.json({ message: 'Lead saved', lead });
        }

    } catch (error) {
        return NextResponse.json({ error: 'Internal Valid Error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const odsCode = searchParams.get('odsCode');

        if (!odsCode) {
            return NextResponse.json({ error: 'ODS Code required' }, { status: 400 });
        }

        const currentLeads = readData();
        const filtered = currentLeads.filter((l: any) => l.ODS_Code !== odsCode);
        writeData(filtered);

        return NextResponse.json({ message: 'Lead removed' });

    } catch (error) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
