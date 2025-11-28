'use client'

import { useMemo } from 'react'
import { Allocation, SlotMap } from '@/lib/types'
import { scheduleData } from '@/lib/schedule'
import { Clock, MapPin, User, BookOpen } from 'lucide-react'

interface TimetableViewProps {
  allocations: Allocation[]
  slotMap: SlotMap
  selectedRA: string | null
}

const days = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
const timeSlots = Object.values(scheduleData.LAB_HOURS);

export default function TimetableView({ allocations, selectedRA }: TimetableViewProps) {

  const filteredAllocations = useMemo(() => {
    if (!selectedRA) {
      return allocations;
    }
    return allocations.filter(a => a.raName === selectedRA);
  }, [allocations, selectedRA]);

  const allocationMap = useMemo(() => {
    const map = new Map<string, Allocation>();
    filteredAllocations.forEach(alloc => {
      const labSlots = (alloc.slot || '').split('+').map(s => s.trim());
      labSlots.forEach(labSlot => {
        map.set(labSlot, alloc);
      });
    });
    return map;
  }, [filteredAllocations]);

  return (
    <div className="glass-card rounded-2xl overflow-hidden border border-white/20 dark:border-white/10 animate-in fade-in duration-700">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border/50">
          <thead className="bg-secondary/50">
            <tr>
              <th scope="col" className="px-4 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[100px] sticky left-0 bg-secondary/95 backdrop-blur-sm z-10 border-r border-border/50">
                Time
              </th>
              {days.map(day => (
                <th key={day} scope="col" className="px-4 py-4 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider min-w-[180px]">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50 bg-card/50">
            {timeSlots.map((timeSlot, index) => (
              <tr key={index} className="group hover:bg-secondary/20 transition-colors">
                {/* Time Column */}
                <td className="px-4 py-3 whitespace-nowrap text-xs font-medium text-muted-foreground border-r border-border/50 sticky left-0 bg-card/95 backdrop-blur-sm z-10 group-hover:bg-secondary/30 transition-colors align-top">
                  <div className="flex flex-col gap-0.5 pt-1">
                    <span className="text-foreground font-bold text-sm">{timeSlot.time.split(' ')[0]}</span>
                    <span className="text-[10px] opacity-70">{timeSlot.time.split(' ').slice(1).join(' ')}</span>
                  </div>
                </td>

                {days.map(day => {
                  if (timeSlot.time === 'LUNCH') {
                    return (
                      <td key={day} className="bg-secondary/30 text-center p-2 align-middle">
                        <span className="text-[10px] font-bold text-muted-foreground/40 tracking-widest uppercase">Lunch</span>
                      </td>
                    )
                  }

                  const daySchedule = scheduleData.SCHEDULE[day as keyof typeof scheduleData.SCHEDULE];
                  const scheduleSlot = daySchedule.find(s => s.time.startsWith(timeSlot.time.split(' ')[0]));

                  if (!scheduleSlot || !scheduleSlot.lab) {
                    return <td key={day} className="border-l border-border/30"></td>;
                  }

                  const allocation = allocationMap.get(scheduleSlot.lab);

                  if (allocation) {
                    return (
                      <td key={day} className="border-l border-border/30 p-1.5 align-top">
                        <div className="bg-primary/5 border-l-2 border-primary rounded-r-lg p-2.5 h-full hover:bg-primary/10 transition-all duration-200 group/card">
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <span className="font-bold text-primary text-xs bg-primary/10 px-1.5 py-0.5 rounded">
                              {allocation.courseCode}
                            </span>
                            <span className="text-[10px] font-mono text-muted-foreground bg-background/50 px-1 rounded border border-border/50">
                              {allocation.roomNumber}
                            </span>
                          </div>

                          <p className="text-xs font-medium text-foreground line-clamp-2 mb-1.5 leading-tight" title={allocation.courseTitle}>
                            {allocation.courseTitle}
                          </p>

                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground group-hover/card:text-foreground transition-colors">
                            <User className="w-3 h-3" />
                            <span className="truncate" title={allocation.raName}>{allocation.raName}</span>
                          </div>
                        </div>
                      </td>
                    )
                  }

                  return <td key={day} className="border-l border-border/30"></td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
