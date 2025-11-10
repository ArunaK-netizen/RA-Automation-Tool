export interface Draft {
  id: string
  name: string
  createdAt: string
  allocations: Allocation[]
  unallocatedLabs: Allocation[]
  slotMap: SlotMap
}

export interface Course {
  'COURSE CODE': string;
  'COURSE TITLE': string;
  'COURSE OWNER': string;
  'CLASS ID': string;
  'ROOM NUMBER': string;
  'SLOT': string;
  'EMPLOYEE NAME': string;
  'EMPLOYEE SCHOOL': string;
  'COURSE MODE': string;
  'COURSE TYPE': string;
}

export interface RA {
  'Name of the Student': string;
  'Emp Id': string;
  'Ph.D Registartion Number'?: string;
  'NUMBER OF LABS': number;
  'REGISTERED SLOTS'?: string;
}

export interface Allocation {
  raName: string
  empId: string
  phdRegNo: string
  numLabsReq: number
  registeredSlots: string
  courseCode: string
  courseTitle: string
  courseOwner: string
  classId: string
  roomNumber: string
  slot: string
  employeeName: string
  employeeSchool: string
  courseMode: string
  courseType: string
  comments: string
}

export interface SlotMap {
  [key: string]: string // L1 -> A1
}

export interface TimeSlot {
  start: string
  end: string
  theory: string
  lab: string
}