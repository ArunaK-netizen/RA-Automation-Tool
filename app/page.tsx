'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { Draft, Allocation, SlotMap } from '@/lib/types'
import { loadDrafts, saveDraft, deleteDraft } from '@/lib/storage'
import DraftManager from '@/components/DraftManager'
import FileUpload from '@/components/FileUpload'
import TimetableView from '@/components/TimetableView'
import StatsDashboard from '@/components/StatsDashboard'
import AllocationTable from '@/components/AllocationTable'
import CustomSelect from '@/components/CustomSelect'
import { Calendar, BarChart2, Table2, AlertCircle } from 'lucide-react'

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
    // Unique Name Check
    if (drafts.some(d => d.name.toLowerCase() === name.toLowerCase())) {
      toast.error('A draft with this name already exists. Please choose a unique name.');
      return;
    }

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
    toast.success('New draft created successfully');
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
    toast.success('Draft deleted');
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

  const uniqueRAs = Array.from(new Set((allocations || []).map(a => a.raName))).sort()

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-in fade-in duration-500">
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
          <div className="space-y-8 animate-in slide-in-from-left-4 duration-500 delay-100">
            <FileUpload onDataUploaded={handleDataUploaded} setIsLoading={setIsLoading} />
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className="lg:col-span-3 space-y-6">
        {!selectedDraft ? (
          <div className="h-[60vh] glass-card rounded-3xl border-2 border-dashed border-border flex flex-col items-center justify-center text-center p-12 animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center mb-6">
              <Table2 className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-3xl font-bold font-display tracking-tight mb-3">
              Welcome to Allocation System
            </h2>
            <p className="text-muted-foreground max-w-md text-lg">
              Create a new draft or select an existing one from the sidebar to begin managing lab allocations.
            </p>
          </div>
        ) : allocations.length === 0 && !isLoading ? (
          <div className="h-[60vh] glass-card rounded-3xl border-2 border-dashed border-border flex flex-col items-center justify-center text-center p-12 animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <AlertCircle className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold font-display tracking-tight mb-3">
              No Data Uploaded Yet
            </h2>
            <p className="text-muted-foreground max-w-md">
              Please upload the Course Details and RA List Excel files using the upload panel on the left to generate the allocation.
            </p>
          </div>
        ) : (
          <div className="glass-card rounded-3xl overflow-hidden shadow-xl shadow-black/5 animate-in slide-in-from-bottom-8 duration-700">
            <div className="border-b border-border/50 bg-secondary/30 backdrop-blur-sm sticky top-0 z-10 flex flex-col md:flex-row items-center justify-between gap-4 p-4 md:px-6">
              <nav className="flex overflow-x-auto no-scrollbar" aria-label="Tabs">
                {[
                  { id: 'timetable', label: 'Timetable', icon: Calendar },
                  { id: 'stats', label: 'Statistics', icon: BarChart2 },
                  { id: 'table', label: 'Details', icon: Table2 },
                  { id: 'unallocated', label: 'Unallocated', icon: AlertCircle },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`
                      group flex items-center gap-2 py-2 px-4 rounded-lg font-medium text-sm transition-all duration-300 whitespace-nowrap mr-2
                      ${activeTab === tab.id
                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                        : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                      }
                    `}
                  >
                    <tab.icon className={`w-4 h-4 transition-transform duration-300 ${activeTab === tab.id ? 'scale-110' : 'group-hover:scale-110'}`} />
                    {tab.label}
                  </button>
                ))}
              </nav>

              {/* Filter Dropdown - Top Right */}
              <div className="w-full md:w-64">
                <CustomSelect
                  options={uniqueRAs.map(ra => ({ value: ra, label: ra }))}
                  value={selectedRA}
                  onChange={setSelectedRA}
                  placeholder="Filter by RA..."
                />
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6 md:p-8 bg-gradient-to-b from-transparent to-secondary/20 min-h-[500px]">
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
  )
}
