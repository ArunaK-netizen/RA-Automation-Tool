import { Allocation, SlotMap } from './types'

export const TIME_SLOTS = [
  { start: '8:00 AM', end: '8:50 AM', theory: '8:00 AM\nto\n8:50 AM', lab: '08:00 AM\nto\n08:50 AM' },
  { start: '9:00 AM', end: '9:50 AM', theory: '9:00 AM\nto\n9:50 AM', lab: '08:51 AM\nto\n09:40 AM' },
  { start: '10:00 AM', end: '10:50 AM', theory: '10:00 AM\nto\n10:50 AM', lab: '09:51 AM\nto\n10:40 AM' },
  { start: '11:00 AM', end: '11:50 AM', theory: '11:00 AM\nto\n11:50 AM', lab: '10:41 AM\nto\n11:30 AM' },
  { start: '12:00 PM', end: '12:50 PM', theory: '12:00 PM\nto\n12:50 PM', lab: '11:40 AM\nto\n12:30 PM' },
  { start: '12:31 PM', end: '1:20 PM', theory: '', lab: '12:31 PM\nto\n1:20 PM' },
  { start: '2:00 PM', end: '2:50 PM', theory: '2:00 PM\nto\n2:50 PM', lab: '2:00 PM\nto\n2:50 PM' },
  { start: '3:00 PM', end: '3:50 PM', theory: '3:00 PM\nto\n3:50 PM', lab: '2:51 PM\nto\n3:40 PM' },
  { start: '4:00 PM', end: '4:50 PM', theory: '4:00 PM\nto\n4:50 PM', lab: '3:51 PM\nto\n4:40 PM' },
  { start: '5:00 PM', end: '5:50 PM', theory: '5:00 PM\nto\n5:50 PM', lab: '4:41 PM\nto\n5:30 PM' },
  { start: '6:00 PM', end: '6:50 PM', theory: '6:00 PM\nto\n6:50 PM', lab: '5:40 PM\nto\n6:30 PM' },
  { start: '6:51 PM', end: '7:00 PM', theory: '6:51 PM\nto\n7:00 PM', lab: '6:31 PM\nto\n7:20 PM' },
  { start: '7:01 PM', end: '7:50 PM', theory: '7:01 PM\nto\n7:50 PM', lab: '' },
]

export const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI']

export function parseSlot(slot: string): string[] {
  return (slot || '').split('+').map(s => s.trim())
}

export function getTheorySlot(labSlot: string, slotMap: SlotMap): string {
  return slotMap[labSlot] || ''
}

export function getAllocationsForRA(allocations: Allocation[], raName: string): Allocation[] {
  return allocations.filter(a => a.raName === raName)
}

export function calculateStats(allocations: Allocation[]) {
  const raStats = new Map<string, {
    name: string
    labsAssigned: number
    labsRequired: number
    courses: Set<string>
    slots: string[]
    discrepancies: string[]
  }>()

  allocations.forEach(alloc => {
    if (!raStats.has(alloc.raName)) {
      raStats.set(alloc.raName, {
        name: alloc.raName,
        labsAssigned: 0,
        labsRequired: alloc.numLabsReq,
        courses: new Set(),
        slots: [],
        discrepancies: []
      })
    }

    const stats = raStats.get(alloc.raName)!
    stats.labsAssigned++
    stats.courses.add(alloc.courseCode)
    stats.slots.push(alloc.slot)

    // Check for discrepancies
    if (stats.labsAssigned > stats.labsRequired) {
      if (!stats.discrepancies.includes('Over-allocated')) {
        stats.discrepancies.push('Over-allocated')
      }
    }
  })

  // Check under-allocation
  raStats.forEach(stats => {
    if (stats.labsAssigned < stats.labsRequired) {
      stats.discrepancies.push('Under-allocated')
    }
    if (stats.courses.size < 2) {
      stats.discrepancies.push('Too few courses')
    }
    if (stats.courses.size > 3) {
      stats.discrepancies.push('Too many courses')
    }
  })

  const statsArray = Array.from(raStats.values())

  return {
    totalRAs: raStats.size,
    totalLabs: allocations.length,
    avgLabsPerRA: allocations.length / raStats.size,
    minLabs: Math.min(...statsArray.map(s => s.labsAssigned)),
    maxLabs: Math.max(...statsArray.map(s => s.labsAssigned)),
    raWithMinLabs: statsArray.find(s => s.labsAssigned === Math.min(...statsArray.map(s => s.labsAssigned)))?.name || '',
    raWithMaxLabs: statsArray.find(s => s.labsAssigned === Math.max(...statsArray.map(s => s.labsAssigned)))?.name || '',
    totalDiscrepancies: statsArray.filter(s => s.discrepancies.length > 0).length,
    raStats: statsArray,
    courseDistribution: calculateCourseDistribution(allocations),
    slotUtilization: calculateSlotUtilization(allocations)
  }
}

function calculateCourseDistribution(allocations: Allocation[]) {
  const courseCount = new Map<string, number>()
  allocations.forEach(alloc => {
    courseCount.set(alloc.courseCode, (courseCount.get(alloc.courseCode) || 0) + 1)
  })
  return Array.from(courseCount.entries())
    .map(([course, count]) => ({ course, count }))
    .sort((a, b) => b.count - a.count)
}

function calculateSlotUtilization(allocations: Allocation[]) {
  const slotCount = new Map<string, number>()
  allocations.forEach(alloc => {
    const slots = parseSlot(alloc.slot)
    slots.forEach(slot => {
      slotCount.set(slot, (slotCount.get(slot) || 0) + 1)
    })
  })
  return Array.from(slotCount.entries())
    .map(([slot, count]) => ({ slot, count }))
    .sort((a, b) => b.count - a.count)
}