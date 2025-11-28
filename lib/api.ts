import { Draft } from './types'

export async function fetchDrafts(): Promise<Draft[]> {
    const res = await fetch('/api/drafts');
    if (!res.ok) throw new Error('Failed to fetch drafts');
    return res.json();
}

export async function createDraft(name: string): Promise<Draft> {
    const res = await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, allocations: [], unallocatedLabs: [], slotMap: {} }),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create draft');
    }
    return res.json();
}

export async function updateDraft(draft: Draft): Promise<Draft> {
    const res = await fetch(`/api/drafts/${draft.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
    });
    if (!res.ok) throw new Error('Failed to update draft');
    return res.json();
}

export async function deleteDraft(id: string): Promise<void> {
    const res = await fetch(`/api/drafts/${id}`, {
        method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete draft');
}
