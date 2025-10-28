import pandas as pd
import random
import json
from itertools import combinations

# ======================
# CONFIGURATION
# ======================

COURSES_FILE = "temp/courses.xlsx"
RAS_FILE = "temp/ras.xlsx"
SLOT_MAP_FILE = "temp/l_to_slot_map.csv"  # e.g. "L1,A1"

OUTPUT_FILE = "temp/allocations.json" # Changed to JSON

# Maximum and minimum number of distinct courses per RA
MIN_COURSES = 2
MAX_COURSES = 3


# ======================
# HELPER FUNCTIONS
# ======================

def parse_slots(slot_str):
    """Convert 'L43+L44+L45+L46' -> ['L43','L44','L45','L46']"""
    if pd.isna(slot_str):
        return []
    return [s.strip() for s in slot_str.split('+') if s.strip()]


def group_lab_hours(l_slots):
    """Group consecutive Ls into pairs (2 Ls = 1 hour, 4 Ls = 2 hours)."""
    if not l_slots:
        return []
    grouped = []
    for i in range(0, len(l_slots), 2):
        grouped.append('+'.join(l_slots[i:i+2]))
    return grouped


def has_clash(l_slots, busy_slots, l_to_theory_map):
    """Check if lab's mapped theory slot overlaps with RA's busy slots."""
    for l in l_slots:
        if l in busy_slots:
            return True
        if l_to_theory_map.get(l) in busy_slots:
            return True
    return False


# ======================
# LOAD DATA
# ======================

courses_df = pd.read_excel(COURSES_FILE)
ras_df = pd.read_excel(RAS_FILE)
slot_map_df = pd.read_csv(SLOT_MAP_FILE, header=None, names=["L", "Theory"])

# Create dict for mapping
l_to_theory = dict(zip(slot_map_df["L"], slot_map_df["Theory"]))

# Filter lab courses only
courses_df = courses_df[courses_df["COURSE TYPE"].str.strip() == "LO"].copy()

# Expand slot strings into grouped lab hours
courses_df["L_SLOTS"] = courses_df["SLOT"].apply(parse_slots)
courses_df["LAB_GROUPS"] = courses_df["L_SLOTS"].apply(group_lab_hours)

# Flatten all lab groups for assignment
lab_pool = []
for _, row in courses_df.iterrows():
    for group in row["LAB_GROUPS"]:
        lab_pool.append({
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
        })

# ======================
# ASSIGNMENT LOGIC
# ======================

final_allocations = []

for _, ra in ras_df.iterrows():
    # Consistently create the RA name by combining Pfix and Name
    pfix = ra.get("Pfix", "")
    name = ra.get("Name of the Student", "")
    if pd.notna(pfix) and pfix.strip():
        ra_name = f"{pfix.strip()} {name.strip()}"
    else:
        ra_name = name.strip()
    emp_id = ra["Emp Id"]
    phd_id = ra.get("Ph.D Registartion Number", "")
    num_labs = int(ra["NUMBER OF LABS"])
    
    reg_slots_str = str(ra.get("REGISTERED SLOTS", ""))
    busy_slots = set(s.strip() for s in reg_slots_str.replace(';', '+').split('+') if s.strip())

    random.shuffle(lab_pool)

    assigned = []
    used_courses = set()

    # Pass 1: Collect non-conflicting labs
    for lab in lab_pool:
        if has_clash(parse_slots(lab["slot"]), busy_slots, l_to_theory):
            continue
        if len(used_courses) >= MAX_COURSES and lab["courseCode"] not in used_courses:
            continue
        assigned.append(lab)
        used_courses.add(lab["courseCode"])
        if len(assigned) >= num_labs:
            break

    # Pass 2: If less than required labs, fill remaining ignoring clashes
    if len(assigned) < num_labs:
        remaining = [l for l in lab_pool if not any(a['classId'] == l['classId'] and a['slot'] == l['slot'] for a in assigned)]
        for lab in remaining:
            if len(used_courses) >= MAX_COURSES and lab["courseCode"] not in used_courses:
                continue
            assigned.append(lab)
            used_courses.add(lab["courseCode"])
            if len(assigned) >= num_labs:
                break

    # Pass 3: If min course requirement is not met, swap labs
    if len(used_courses) < MIN_COURSES:
        other_course_labs = [l for l in lab_pool if l["courseCode"] not in used_courses]
        i = 0
        while len(used_courses) < MIN_COURSES and i < len(other_course_labs) and i < len(assigned):
            new_lab = other_course_labs[i]
            assigned[len(assigned) - 1 - i] = new_lab
            used_courses.add(new_lab["courseCode"])
            i += 1

    for lab in assigned:
        final_allocations.append({
            "raName": ra_name,
            "empId": emp_id,
            "phdRegNo": phd_id,
            "numLabsReq": num_labs,
            "registeredSlots": reg_slots_str,
            **lab,
            "comments": ""
        })

# ======================
# OUTPUT
# ======================

with open(OUTPUT_FILE, 'w') as f:
    json.dump(final_allocations, f, indent=2)

print(f"Allocation saved to {OUTPUT_FILE}")
