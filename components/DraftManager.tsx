'use client'

import { useState } from 'react'
import { Draft } from '@/lib/types'
import { FilePlus, Trash2, ChevronRight, FileText, Clock } from 'lucide-react'

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
    <div className="glass-card rounded-2xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold font-display text-lg">Saved Drafts</h3>
        <span className="text-xs font-medium px-2 py-1 rounded-full bg-secondary text-muted-foreground">
          {drafts.length}
        </span>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={newDraftName}
          onChange={(e) => setNewDraftName(e.target.value)}
          placeholder="New draft name..."
          className="flex-grow bg-background/50 border border-border rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
        />
        <button
          onClick={handleCreate}
          className="bg-primary text-white p-2 rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:shadow-none"
          disabled={!newDraftName.trim()}
        >
          <FilePlus className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {drafts.length > 0 ? (
          drafts.map(draft => (
            <div
              key={draft.id}
              onClick={() => onSelectDraft(draft)}
              className={`group relative flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all duration-200 border ${selectedDraft?.id === draft.id
                  ? 'bg-primary/10 border-primary/20 shadow-sm'
                  : 'bg-secondary/30 border-transparent hover:bg-secondary/50 hover:border-border/50'
                }`}>
              <div className="flex-grow min-w-0 mr-4">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className={`w-4 h-4 ${selectedDraft?.id === draft.id ? 'text-primary' : 'text-muted-foreground'}`} />
                  <p className={`font-medium text-sm truncate ${selectedDraft?.id === draft.id ? 'text-primary' : 'text-foreground'
                    }`}>
                    {draft.name}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(draft.createdAt).toLocaleDateString()}
                  </span>
                  <span>•</span>
                  <span>{(draft.allocations || []).length} allocations</span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Are you sure you want to delete this draft?')) {
                      onDeleteDraft(draft.id);
                    }
                  }}
                  className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all duration-200"
                  title="Delete draft"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                {selectedDraft?.id === draft.id && (
                  <ChevronRight className="w-5 h-5 text-primary animate-in slide-in-from-left-2" />
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 border-2 border-dashed border-border rounded-xl">
            <p className="text-sm text-muted-foreground">No drafts saved yet</p>
          </div>
        )}
      </div>
    </div>
  )
}