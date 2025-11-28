import pandas as pd
import json
from pulp import *

# ======================
# CONFIGURATION
# ======================

MIN_LABS = 4
MAX_LABS = 5
MIN_COURSES = 2
MAX_COURSES = 3
COURSES_FILE = "Files\Course details for RA.xlsx"
RAS_FILE = "Files\Merged_RA.xlsx"
SLOT_MAP_FILE = "temp/l_to_slot_map.csv"
OUTPUT_FILE = "temp/allocations.json"

# ======================
# TIMETABLE MAPPING
# ======================

# Based on the provided timetable image
# Maps lab slots to (day_index, time_block_index)
# day_index: 0=MON, 1=TUE, 2=WED, 3=THU, 4=FRI
# time_block_index: 0=08:00, 1=09:51, 2=10:41, 3=11:40, 4=12:31, 5=2:00, 6=2:51, 7=3:51, 8=4:41, 9=5:40, 10=6:31

SLOT_TIMETABLE = {
    # Monday
    "L1": (0, 0), "L2": (0, 1), "L3": (0, 2), "L4": (0, 3), "L5": (0, 4), "L6": (0, 5),
    # Tuesday
    "L7": (1, 0), "L8": (1, 1), "L9": (1, 2), "L10": (1, 3), "L11": (1, 4), "L12": (1, 5),
    # Wednesday
    "L13": (2, 0), "L14": (2, 1), "L15": (2, 2), "L16": (2, 3), "L17": (2, 4), "L18": (2, 5),
    # Thursday
    "L19": (3, 0), "L20": (3, 1), "L21": (3, 2), "L22": (3, 3), "L23": (3, 4), "L24": (3, 5),
    # Friday
    "L25": (4, 0), "L26": (4, 1), "L27": (4, 2), "L28": (4, 3), "L29": (4, 4), "L30": (4, 5),
    
    # Afternoon slots (after lunch)
    # Monday afternoon
    "L31": (0, 6), "L32": (0, 7), "L33": (0, 8), "L34": (0, 9), "L35": (0, 10), "L36": (0, 11),
    # Tuesday afternoon
    "L37": (1, 6), "L38": (1, 7), "L39": (1, 8), "L40": (1, 9), "L41": (1, 10), "L42": (1, 11),
    # Wednesday afternoon
    "L43": (2, 6), "L44": (2, 7), "L45": (2, 8), "L46": (2, 9), "L47": (2, 10), "L48": (2, 11),
    # Thursday afternoon
    "L49": (3, 6), "L50": (3, 7), "L51": (3, 8), "L52": (3, 9), "L53": (3, 10), "L54": (3, 11),
    # Friday afternoon
    "L55": (4, 6), "L56": (4, 7), "L57": (4, 8), "L58": (4, 9), "L59": (4, 10), "L60": (4, 11),
}

# Extend for L61-L160 (repeating pattern)
for i in range(61, 161):
    base_slot_num = ((i - 1) % 60) + 1
    base_slot = f"L{base_slot_num}"
    if base_slot in SLOT_TIMETABLE:
        SLOT_TIMETABLE[f"L{i}"] = SLOT_TIMETABLE[base_slot]

# Late slots: after 3:40 PM (time_block >= 8)
# Index 7 is 2:51 PM - 3:40 PM (Not late)
# Index 8 is 3:51 PM - 4:40 PM (Late)
LATE_SLOTS = {slot for slot, (day, time) in SLOT_TIMETABLE.items() if time >= 8}

# ======================
# HELPER FUNCTIONS
# ======================

def parse_slots(slot_str):
    if pd.isna(slot_str):
        return []
    return [s.strip() for s in slot_str.split('+') if s.strip()]

def group_lab_hours(l_slots):
    if not l_slots:
        return []
    grouped = []
    for i in range(0, len(l_slots), 2):
        grouped.append('+'.join(l_slots[i:i+2]))
    return grouped

def has_clash(l_slots, busy_slots, l_to_theory_map):
    for l in l_slots:
        if l in busy_slots:
            return True
        if l_to_theory_map.get(l) in busy_slots:
            return True
    return False

def are_back_to_back(slot1_str, slot2_str):
    """Check if two lab slot strings are back-to-back on the same day"""
    slots1 = parse_slots(slot1_str)
    slots2 = parse_slots(slot2_str)
    
    if not slots1 or not slots2:
        return False
    
    # Get day and time for each slot group
    day1, time1 = SLOT_TIMETABLE.get(slots1[0], (None, None))
    day2, time2 = SLOT_TIMETABLE.get(slots2[0], (None, None))
    
    if day1 is None or day2 is None or day1 != day2:
        return False
    
    # Back-to-back if on same day and consecutive time blocks
    return abs(time1 - time2) == 1

def count_late_slots(lab_list):
    """Count how many labs are in late time slots"""
    late_count = 0
    for lab in lab_list:
        slot_str = lab.get("slot", "")
        slots = parse_slots(slot_str)
        if any(s in LATE_SLOTS for s in slots):
            late_count += 1
    return late_count

# ======================
# LOAD DATA
# ======================

print("Loading data...")
courses_df = pd.read_excel(COURSES_FILE)
ras_df = pd.read_excel(RAS_FILE)
slot_map_df = pd.read_csv(SLOT_MAP_FILE, header=None, names=["L", "Theory"])
l_to_theory = dict(zip(slot_map_df["L"], slot_map_df["Theory"]))

# Filter lab courses (LO and ELA)
courses_df = courses_df[courses_df["COURSE TYPE"].str.strip().isin(["LO", "ELA"])].copy()
courses_df["L_SLOTS"] = courses_df["SLOT"].apply(parse_slots)
courses_df["LAB_GROUPS"] = courses_df["L_SLOTS"].apply(group_lab_hours)

# Build lab list
labs = []
lab_id = 0
for _, row in courses_df.iterrows():
    for group in row["LAB_GROUPS"]:
        lab_data = {
            "id": lab_id,
            "courseCode": row["COURSE CODE"],
            "courseTitle": row["COURSE TITLE"],
            "courseOwner": row.get("COURSE OWNER"),
            "classId": row.get("CLASS ID"),
            "roomNumber": row.get("ROOM NUMBER"),
            "slot": group,
            "employeeName": row.get("EMPLOYEE NAME"),
            "employeeSchool": row.get("EMPLOYEE SCHOOL"),
            "courseMode": row.get("COURSE MODE"),
            "courseType": row.get("COURSE TYPE"),
        }
        labs.append(lab_data)
        lab_id += 1

# Prepare RAs
ras = []
ra_id = 0
for _, row in ras_df.iterrows():
    pfix = row.get("Pfix", "")
    name = row.get("Name of the student", "")
    ra_name = f"{str(pfix).strip()} {str(name).strip()}" if pd.notna(pfix) and str(pfix).strip() else str(name).strip()
    
    reg_slots_str = str(row.get("REGISTERED SLOTS", ""))
    busy_slots = set(s.strip() for s in reg_slots_str.replace(';', '+').split('+') if s.strip())
    
    ras.append({
        "id": ra_id,
        "raName": ra_name,
        "empId": row.get("Emp Id", ""),
        "phdRegNo": row.get("Ph.D Registration Number", ""),
        "registeredSlots": reg_slots_str,
        "busySlots": busy_slots,
    })
    ra_id += 1

print(f"Loaded {len(ras)} RAs and {len(labs)} labs")

# ======================
# ILP FORMULATION
# ======================

print("Building ILP model...")
prob = LpProblem("LabAllocation", LpMinimize)

# Decision variables: x[ra_id][lab_id] = 1 if lab assigned to RA
x = {}
for ra in ras:
    for lab in labs:
        x[(ra["id"], lab["id"])] = LpVariable(f"x_{ra['id']}_{lab['id']}", cat='Binary')

# Auxiliary variables for penalties
back_to_back_penalty = {}
for ra in ras:
    for i, lab1 in enumerate(labs):
        for j, lab2 in enumerate(labs):
            if i < j and are_back_to_back(lab1["slot"], lab2["slot"]):
                var_name = f"btb_{ra['id']}_{lab1['id']}_{lab2['id']}"
                back_to_back_penalty[(ra["id"], lab1["id"], lab2["id"])] = LpVariable(var_name, cat='Binary')

late_slot_violation = {ra["id"]: LpVariable(f"late_{ra['id']}", lowBound=0) for ra in ras}

# ======================
# HARD CONSTRAINTS
# ======================

print("Adding constraints...")

# 1. Each lab assigned to at most one RA
for lab in labs:
    prob += lpSum([x[(ra["id"], lab["id"])] for ra in ras]) <= 1, f"lab_{lab['id']}_once"

# 2. Min/Max labs per RA
for ra in ras:
    prob += lpSum([x[(ra["id"], lab["id"])] for lab in labs]) >= MIN_LABS, f"ra_{ra['id']}_min_labs"
    prob += lpSum([x[(ra["id"], lab["id"])] for lab in labs]) <= MAX_LABS, f"ra_{ra['id']}_max_labs"

# 3. No slot clashes with registered slots
for ra in ras:
    for lab in labs:
        if has_clash(parse_slots(lab["slot"]), ra["busySlots"], l_to_theory):
            prob += x[(ra["id"], lab["id"])] == 0, f"ra_{ra['id']}_lab_{lab['id']}_clash"

# 4. No time overlap (same slot)
for ra in ras:
    slot_groups = {}
    for lab in labs:
        slot_key = lab["slot"]
        if slot_key not in slot_groups:
            slot_groups[slot_key] = []
        slot_groups[slot_key].append(lab["id"])
    
    for slot_key, lab_ids in slot_groups.items():
        if len(lab_ids) > 1:
            prob += lpSum([x[(ra["id"], lid)] for lid in lab_ids]) <= 1, f"ra_{ra['id']}_slot_{slot_key}_once"

# 5. Course limits (MIN_COURSES to MAX_COURSES)
# For each RA, use binary variables to track if course is used
course_used = {}
for ra in ras:
    unique_courses = set(lab["courseCode"] for lab in labs)
    for course in unique_courses:
        course_used[(ra["id"], course)] = LpVariable(f"course_{ra['id']}_{course}", cat='Binary')
        
        # If any lab from this course is assigned, course_used must be 1
        course_labs = [lab for lab in labs if lab["courseCode"] == course]
        prob += lpSum([x[(ra["id"], lab["id"])] for lab in course_labs]) <= len(course_labs) * course_used[(ra["id"], course)], \
            f"ra_{ra['id']}_course_{course}_link"
    
    # Min/Max course constraint
    prob += lpSum([course_used[(ra["id"], c)] for c in unique_courses]) >= MIN_COURSES, f"ra_{ra['id']}_min_courses"
    prob += lpSum([course_used[(ra["id"], c)] for c in unique_courses]) <= MAX_COURSES, f"ra_{ra['id']}_max_courses"

# ======================
# SOFT CONSTRAINTS (PENALTIES)
# ======================

# 6. Back-to-back penalty
for ra in ras:
    for i, lab1 in enumerate(labs):
        for j, lab2 in enumerate(labs):
            if i < j and are_back_to_back(lab1["slot"], lab2["slot"]):
                btb_var = back_to_back_penalty[(ra["id"], lab1["id"], lab2["id"])]
                # btb_var = 1 if both labs assigned
                prob += btb_var >= x[(ra["id"], lab1["id"])] + x[(ra["id"], lab2["id"])] - 1, \
                    f"btb_{ra['id']}_{lab1['id']}_{lab2['id']}_link"

# 7. Late slot balance (no RA should have >60% late slots)
for ra in ras:
    total_labs_assigned = lpSum([x[(ra["id"], lab["id"])] for lab in labs])
    late_labs_assigned = lpSum([x[(ra["id"], lab["id"])] for lab in labs if any(s in LATE_SLOTS for s in parse_slots(lab["slot"]))])
    
    # late_slot_violation is the excess over 60%
    prob += late_slot_violation[ra["id"]] >= late_labs_assigned - 0.6 * total_labs_assigned, f"late_{ra['id']}_calc"

# ======================
# OBJECTIVE FUNCTION
# ======================

# Minimize: unallocated labs + back-to-back penalties + late slot penalties
unallocated_count = len(labs) - lpSum([x[(ra["id"], lab["id"])] for ra in ras for lab in labs])
btb_total = lpSum([back_to_back_penalty[key] for key in back_to_back_penalty])
late_total = lpSum([late_slot_violation[ra["id"]] for ra in ras])

prob += 1000 * unallocated_count + 10 * btb_total + 5 * late_total, "Total_Cost"

# ======================
# SOLVE
# ======================

print("Solving ILP...")
prob.solve(PULP_CBC_CMD(msg=1, timeLimit=120))  # 2 minute time limit

print(f"Status: {LpStatus[prob.status]}")
print(f"Objective value: {value(prob.objective)}")

# ======================
# EXTRACT SOLUTION
# ======================

final_allocations = []
unallocated_labs = []

for lab in labs:
    assigned = False
    for ra in ras:
        if value(x[(ra["id"], lab["id"])]) == 1:
            final_allocations.append({
                "raName": ra["raName"],
                "empId": ra["empId"],
                "phdRegNo": ra["phdRegNo"],
                "registeredSlots": ra["registeredSlots"],
                "numLabsReq": MIN_LABS,
                **lab,
                "comments": ""
            })
            assigned = True
            break
    
    if not assigned:
        unallocated_labs.append({
            **lab,
            "comments": "Unallocated"
        })

# Write output
output_data = {
    "allocations": final_allocations,
    "unallocatedLabs": unallocated_labs
}

with open(OUTPUT_FILE, "w") as f:
    json.dump(output_data, f, indent=2)

print(f"Allocated {len(final_allocations)} labs")
print(f"Unallocated {len(unallocated_labs)} labs")
print(f"Output written to {OUTPUT_FILE}")
