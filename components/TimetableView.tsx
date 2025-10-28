'use client'

import { useMemo } from 'react'
import { Allocation, SlotMap } from '@/lib/types'
import { scheduleData } from '@/lib/schedule'

interface TimetableViewProps {
  allocations: Allocation[]
  slotMap: SlotMap // This might be redundant now but keeping for context
  selectedRA: string | null
}

const days = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
const timeSlots = Object.values(scheduleData.LAB_HOURS);

export default function TimetableView({ allocations, selectedRA }: TimetableViewProps) {

  // Filter allocations based on selectedRA, same as in AllocationTable
  const filteredAllocations = useMemo(() => {
    if (!selectedRA) {
      return allocations;
    }
    return allocations.filter(a => a.raName === selectedRA);
  }, [allocations, selectedRA]);

  // Create a map from the *filtered* allocations for efficient lookup
  const allocationMap = useMemo(() => {
    const map = new Map<string, Allocation>();
    filteredAllocations.forEach(alloc => {
      const labSlots = alloc.slot.split('+').map(s => s.trim());
      labSlots.forEach(labSlot => {
        map.set(labSlot, alloc);
      });
    });
    return map;
  }, [filteredAllocations]);

  return (
    <div className="overflow-x-auto border border-border rounded-lg bg-card">
      <table className="min-w-full divide-y divide-border">
        <thead className="bg-background">
          <tr>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider w-1/6">Time</th>
            {days.map(day => (
              <th key={day} scope="col" className="px-4 py-3 text-center text-xs font-medium text-muted uppercase tracking-wider w-1/5">{day}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {timeSlots.map((timeSlot, index) => (
            <tr key={index}>
              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-muted bg-background text-center">
                {timeSlot.time}
              </td>
              {days.map(day => {
                if (timeSlot.time === 'LUNCH') {
                  return (
                    <td key={day} className="bg-background/50 text-center">
                      <span className="font-semibold text-muted">LUNCH</span>
                    </td>
                  )
                }
                
                const daySchedule = scheduleData.SCHEDULE[day as keyof typeof scheduleData.SCHEDULE];
                const scheduleSlot = daySchedule.find(s => s.time.startsWith(timeSlot.time.split(' ')[0]));

                if (!scheduleSlot || !scheduleSlot.lab) {
                  return <td key={day} className="border-l border-border"></td>;
                }

                const allocation = allocationMap.get(scheduleSlot.lab);

                if (allocation) {
                  return (
                    <td key={day} className="border-l border-border p-2 align-top">
                      <div className="bg-primary/10 border border-primary/20 rounded-md p-2 text-center h-full">
                        <p className="font-bold text-primary text-sm">{allocation.courseCode}</p>
                        <p className="text-xs text-primary/80">{allocation.raName}</p>
                        <p className="text-xs text-muted">{allocation.roomNumber}</p>
                      </div>
                    </td>
                  )
                }

                return <td key={day} className="border-l border-border"></td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
