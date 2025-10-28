import { Allocation, Course, RA, SlotMap } from './types'

const MIN_COURSES = 2
const MAX_COURSES = 3

function parseSlots(slotStr: string | undefined | null): string[] {
  if (!slotStr) return []
  return slotStr.split('+').map(s => s.trim()).filter(Boolean)
}

function groupLabHours(lSlots: string[]): string[] {
  if (!lSlots.length) return []
  const grouped: string[] = []
  for (let i = 0; i < lSlots.length; i += 2) {
    grouped.push(lSlots.slice(i, i + 2).join('+'))
  }
  return grouped
}

function hasClash(lSlots: string[], busySlots: Set<string>, lToTheoryMap: SlotMap): boolean {
  for (const l of lSlots) {
    // Check for direct lab slot clash
    if (busySlots.has(l)) {
      return true;
    }
    // Check for theory slot clash
    const theorySlot = lToTheoryMap[l];
    if (theorySlot && busySlots.has(theorySlot)) {
      return true;
    }
  }
  return false;
}

export function generateAllocation(courses: Course[], ras: RA[], slotMap: SlotMap): Allocation[] {
  // Defensively filter for lab courses, trimming whitespace from the type.
  const labCourses = courses.filter(c => c && typeof c['COURSE TYPE'] === 'string' && c['COURSE TYPE'].trim() === 'LO');

  const labPool: any[] = [];
  labCourses.forEach(course => {
    const slots = parseSlots(course.SLOT);
    const groups = groupLabHours(slots);
    groups.forEach(group => {
      labPool.push({ ...course, SLOT: group });
    });
  });

  const allocations: Allocation[] = [];

  ras.forEach(ra => {
    const raName = ra['Name of the Student'];
    const empId = ra['Emp Id'];
    const phdId = ra['Ph.D Registartion Number'] || '';
    const numLabs = parseInt(String(ra['NUMBER OF LABS']), 10) || 0;
    
    const regSlots = (ra['REGISTERED SLOTS'] || '');
    const busySlots = new Set(
      regSlots
        .replace(/[;+]/g, ',') // Replace all semicolons and plus signs with commas
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
    );

    // Shuffle the lab pool for randomness for each RA
    const shuffledPool = [...labPool].sort(() => Math.random() - 0.5);

    const assigned: any[] = [];
    const usedCourses = new Set<string>();

    // Pass 1: Collect non-conflicting labs
    for (const lab of shuffledPool) {
      if (assigned.length >= numLabs) break;

      if (hasClash(parseSlots(lab.SLOT), busySlots, slotMap)) {
        continue;
      }
      if (usedCourses.size >= MAX_COURSES && !usedCourses.has(lab.COURSE_CODE)) {
        continue;
      }
      assigned.push(lab);
      usedCourses.add(lab.COURSE_CODE);
    }

    // Pass 2: If not enough labs, fill with clashing labs
    if (assigned.length < numLabs) {
      const remainingFromPool = shuffledPool.filter(p => !assigned.some(a => a.CLASS_ID === p.CLASS_ID && a.SLOT === p.SLOT));
      for (const lab of remainingFromPool) {
        if (assigned.length >= numLabs) break;
        if (usedCourses.size >= MAX_COURSES && !usedCourses.has(lab.COURSE_CODE)) {
          continue;
        }
        assigned.push(lab);
        usedCourses.add(lab.COURSE_CODE);
      }
    }

    // Pass 3: If min course requirement is not met, swap labs to meet it
    if (usedCourses.size < MIN_COURSES) {
      const otherCourseLabs = shuffledPool.filter(p => !usedCourses.has(p.COURSE_CODE));
      let i = 0;
      while (usedCourses.size < MIN_COURSES && i < otherCourseLabs.length && i < assigned.length) {
        const newLab = otherCourseLabs[i];
        // Replace the last added lab with one from a new course
        assigned[assigned.length - 1 - i] = newLab;
        usedCourses.add(newLab.COURSE_CODE);
        i++;
      }
    }

    // Create allocation entries for this RA
    assigned.forEach(lab => {
      allocations.push({
        raName,
        empId,
        phdRegNo: phdId,
        numLabsReq: numLabs,
        registeredSlots: regSlots,
        courseCode: lab.COURSE_CODE,
        courseTitle: lab.COURSE_TITLE,
        courseOwner: lab.COURSE_OWNER || '',
        classId: lab.CLASS_ID || '',
        roomNumber: lab.ROOM_NUMBER || '',
        slot: lab.SLOT,
        employeeName: lab.EMPLOYEE_NAME || '',
        employeeSchool: lab.EMPLOYEE_SCHOOL || '',
        courseMode: lab.COURSE_MODE || '',
        courseType: lab.COURSE_TYPE || '',
        comments: '',
      });
    });
  });

  return allocations;
}
