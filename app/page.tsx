'use client'

import { useState, useEffect } from 'react'
import { Draft, Allocation, SlotMap } from '@/lib/types'
import { loadDrafts, saveDraft, deleteDraft } from '@/lib/storage'
import DraftManager from '@/components/DraftManager'
import FileUpload from '@/components/FileUpload'
import TimetableView from '@/components/TimetableView'
import StatsDashboard from '@/components/StatsDashboard'
import AllocationTable from '@/components/AllocationTable'

export default function Home() {
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null)
  const [allocations, setAllocations] = useState<Allocation[]>([])
  const [unallocatedLabs, setUnallocatedLabs] = useState<Allocation[]>([])
  const [slotMap, setSlotMap] = useState<SlotMap>({})
  const [activeTab, setActiveTab] = useState<'timetable' | 'stats' | 'table' | 'unallocated'>('timetable')
  const [selectedRA, setSelectedRA] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const loaded = loadDrafts()
    setDrafts(loaded)
  }, [])

  const handleCreateDraft = (name: string) => {
    const newDraft: Draft = {
      id: Date.now().toString(),
      name,
      createdAt: new Date().toISOString(),
      allocations: [],
      unallocatedLabs: [],
      slotMap: {}
    }
    const updated = saveDraft(newDraft)
    setDrafts(updated)
    setSelectedDraft(newDraft)
  }

  const handleSelectDraft = (draft: Draft) => {
    setSelectedDraft(draft)
    setAllocations(draft.allocations || [])
    setUnallocatedLabs(draft.unallocatedLabs || [])
    setSlotMap(draft.slotMap || {})
    setSelectedRA(null)
  }

  const handleDeleteDraft = (id: string) => {
    const updated = deleteDraft(id)
    setDrafts(updated)
    if (selectedDraft?.id === id) {
      setSelectedDraft(null)
      setAllocations([])
      setUnallocatedLabs([])
      setSlotMap({})
    }
  }

  const handleDataUploaded = (data: { allocations: Allocation[], unallocatedLabs: Allocation[], slotMap: SlotMap }) => {
    if (selectedDraft) {
      const updatedDraft = {
        ...selectedDraft,
        allocations: data.allocations,
        unallocatedLabs: data.unallocatedLabs,
        slotMap: data.slotMap
      }
      const updated = saveDraft(updatedDraft)
      setDrafts(updated)
      setSelectedDraft(updatedDraft)
      setAllocations(data.allocations)
      setUnallocatedLabs(data.unallocatedLabs)
      setSlotMap(data.slotMap)
    }
  }

  const uniqueRAs = Array.from(new Set((allocations || []).map(a => a.raName)))

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-foreground font-display">RA Lab Allocation System</h1>
          <p className="text-muted mt-1">Manage and visualize teaching assistant lab schedules</p>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-8">
            <DraftManager
              drafts={drafts}
              selectedDraft={selectedDraft}
              onCreateDraft={handleCreateDraft}
              onSelectDraft={handleSelectDraft}
              onDeleteDraft={handleDeleteDraft}
            />
            
            {selectedDraft && (
              <FileUpload onDataUploaded={handleDataUploaded} setIsLoading={setIsLoading} />
            )}

            {allocations.length > 0 && (
              <div className="bg-card rounded-lg shadow-sm p-4 border border-border">
                <h3 className="font-semibold text-foreground mb-3">Select RA</h3>
                <select
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary transition"
                  value={selectedRA || ''}
                  onChange={(e) => setSelectedRA(e.target.value || null)}
                >
                  <option value="">All RAs</option>
                  {uniqueRAs.map(ra => (
                    <option key={ra} value={ra}>{ra}</option>
                  ))}
                </select>
              </div>
            )}
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {!selectedDraft ? (
              <div className="bg-card rounded-lg shadow-sm border border-border p-12 text-center">
                <h2 className="text-2xl font-semibold text-foreground mb-2">
                  Welcome
                </h2>
                <p className="text-muted">
                  Create or select a draft to begin
                </p>
              </div>
            ) : allocations.length === 0 && !isLoading ? (
              <div className="bg-card rounded-lg shadow-sm border border-border p-12 text-center">
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  No Data Uploaded
                </h2>
                <p className="text-muted">
                  Upload course and RA files to generate an allocation
                </p>
              </div>
            ) : (
              <div className="bg-card rounded-lg shadow-sm border border-border">
                <div className="border-b border-border">
                  <nav className="flex space-x-4 px-6" aria-label="Tabs">
                    <button
                      onClick={() => setActiveTab('timetable')}
                      className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === 'timetable'
                          ? 'border-primary text-primary'
                          : 'border-transparent text-muted hover:text-foreground hover:border-gray-300'
                      }`}
                    >
                      Timetable
                    </button>
                    <button
                      onClick={() => setActiveTab('stats')}
                      className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === 'stats'
                          ? 'border-primary text-primary'
                          : 'border-transparent text-muted hover:text-foreground hover:border-gray-300'
                      }`}
                    >
                      Statistics
                    </button>
                    <button
                      onClick={() => setActiveTab('table')}
                      className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === 'table'
                          ? 'border-primary text-primary'
                          : 'border-transparent text-muted hover:text-foreground hover:border-gray-300'
                      }`}
                    >
                      Allocation Details
                    </button>
                    <button
                      onClick={() => setActiveTab('unallocated')}
                      className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === 'unallocated'
                          ? 'border-primary text-primary'
                          : 'border-transparent text-muted hover:text-foreground hover:border-gray-300'
                      }`}
                    >
                      Unallocated Labs
                    </button>
                  </nav>

                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {activeTab === 'timetable' && (
                    <TimetableView
                      allocations={allocations}
                      slotMap={slotMap}
                      selectedRA={selectedRA}
                    />
                  )}
                  {activeTab === 'stats' && (
                    <StatsDashboard
                      allocations={allocations}
                      unallocatedLabs={unallocatedLabs}
                      slotMap={slotMap}
                    />
                  )}
                  {activeTab === 'table' && (
                    <AllocationTable
                      allocations={allocations}
                      selectedRA={selectedRA}
                    />
                  )}
                  {activeTab === 'unallocated' && (
                    <AllocationTable
                      allocations={unallocatedLabs}
                      selectedRA={null}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
