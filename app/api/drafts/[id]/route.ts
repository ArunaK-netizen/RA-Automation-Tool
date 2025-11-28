import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Draft from '@/models/Draft';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const body = await request.json();
        const { id } = await params;

        const draft = await Draft.findByIdAndUpdate(id, body, {
            new: true,
            runValidators: true,
        });

        if (!draft) {
            return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
        }

        const formattedDraft = draft.toObject();
        formattedDraft.id = formattedDraft._id.toString();
        delete formattedDraft._id;
        delete formattedDraft.__v;

        return NextResponse.json(formattedDraft);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update draft' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const { id } = await params;
        const deletedDraft = await Draft.findByIdAndDelete(id);

        if (!deletedDraft) {
            return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Draft deleted successfully' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete draft' }, { status: 500 });
    }
}
