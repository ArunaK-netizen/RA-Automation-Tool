import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Draft from '@/models/Draft';

export async function GET() {
    try {
        await dbConnect();
        const drafts = await Draft.find({}).sort({ createdAt: -1 });
        // Convert _id to id for frontend compatibility
        const formattedDrafts = drafts.map(doc => {
            const draft = doc.toObject();
            draft.id = draft._id.toString();
            delete draft._id;
            delete draft.__v;
            return draft;
        });
        return NextResponse.json(formattedDrafts);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch drafts' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await dbConnect();
        const body = await request.json();

        // Check for duplicate name
        const existing = await Draft.findOne({ name: body.name });
        if (existing) {
            return NextResponse.json({ error: 'Draft with this name already exists' }, { status: 400 });
        }

        const draft = new Draft(body);
        await draft.save();

        const formattedDraft = draft.toObject();
        formattedDraft.id = formattedDraft._id.toString();
        delete formattedDraft._id;
        delete formattedDraft.__v;

        return NextResponse.json(formattedDraft, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create draft' }, { status: 500 });
    }
}
