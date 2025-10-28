'use client'

import { useState } from 'react'
import { Draft } from '@/lib/types'
import { FilePlus, Trash2, ChevronRight } from 'lucide-react'

interface DraftManagerProps {
  drafts: Draft[]
  selectedDraft: Draft | null
  onCreateDraft: (name: string) => void
  onSelectDraft: (draft: Draft) => void
  onDeleteDraft: (id: string) => void
}

export default function DraftManager({
  drafts,
  selectedDraft,
  onCreateDraft,
  onSelectDraft,
  onDeleteDraft
}: DraftManagerProps) {
  const [newDraftName, setNewDraftName] = useState('')

  const handleCreate = () => {
    if (newDraftName.trim()) {
      onCreateDraft(newDraftName.trim())
      setNewDraftName('')
    }
  }

  return (
    <div className="bg-card rounded-lg shadow-sm border border-border p-4">
      <h3 className="font-semibold text-foreground mb-4">Drafts</h3>
      <div className="flex space-x-2 mb-4">
        <input
          type="text"
          value={newDraftName}
          onChange={(e) => setNewDraftName(e.target.value)}
          placeholder="New draft name..."
          className="flex-grow bg-background border border-border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary transition"
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
        />
        <button
          onClick={handleCreate}
          className="bg-primary text-white px-3 py-2 rounded-md hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!newDraftName.trim()}
        >
          <FilePlus className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-2">
        {drafts.length > 0 ? (
          drafts.map(draft => (
            <div
              key={draft.id}
              onClick={() => onSelectDraft(draft)}
              className={`group flex items-center justify-between p-3 rounded-md cursor-pointer transition-colors ${
                selectedDraft?.id === draft.id
                  ? 'bg-primary/10'
                  : 'hover:bg-background'
              }`}>
              <div className="flex-grow">
                <p className={`font-medium text-sm ${
                  selectedDraft?.id === draft.id ? 'text-primary' : 'text-foreground'
                }`}>
                  {draft.name}
                </p>
                <p className="text-xs text-muted">
                  {(draft.allocations || []).length} allocations
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Are you sure you want to delete this draft?')) {
                      onDeleteDraft(draft.id);
                    }
                  }}
                  className="text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                {selectedDraft?.id === draft.id && (
                  <ChevronRight className="w-5 h-5 text-primary" />
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted text-center py-4">No drafts yet.</p>
        )}
      </div>
    </div>
  )
}