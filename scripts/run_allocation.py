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

# Required number of labs per RA
MIN_LABS = 4
MAX_LABS = 5


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
# ASSIGNMENT LOGIC (bundle-aware)
# ======================

final_allocations = []

# Build bundles: group lab groups by (courseCode, classId)
bundles_map = {}
for lab in lab_pool:
    key = (lab.get("courseCode"), lab.get("classId"))
    if key not in bundles_map:
        bundles_map[key] = {
            "courseCode": lab.get("courseCode"),
            "courseTitle": lab.get("courseTitle"),
            "courseOwner": lab.get("courseOwner"),
            "classId": lab.get("classId"),
            "roomNumbers": [],
            "courseMode": lab.get("courseMode"),
            "courseType": lab.get("courseType"),
            "labs": []  # individual lab group dicts (slot, roomNumber, ...)
        }
    bundles_map[key]["labs"].append(lab)
    # keep track of room numbers seen (optional)
    rn = lab.get("roomNumber")
    if rn and rn not in bundles_map[key]["roomNumbers"]:
        bundles_map[key]["roomNumbers"].append(rn)

bundles = list(bundles_map.values())

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
    reg_slots_str = str(ra.get("REGISTERED SLOTS", ""))
    # Normalize separators and break into individual busy tokens
    busy_slots = set(s.strip() for s in reg_slots_str.replace(';', '+').split('+') if s.strip())

    # Shuffle bundles (group-level shuffle as requested)
    shuffled_bundles = bundles.copy()
    random.shuffle(shuffled_bundles)

    assigned = []
    used_courses = set()

    # Helper to check if a lab (dict) conflicts with busy slots
    def lab_has_clash(lab_dict):
        return has_clash(parse_slots(lab_dict["slot"]), busy_slots, l_to_theory)

    # Pass 1: Try to allocate whole bundles (all labs within bundle) where none of the bundle's labs clash
    for bundle in shuffled_bundles:
        bundle_course = bundle.get("courseCode")
        bundle_labs = bundle.get("labs", [])
        bundle_size = len(bundle_labs)

        # Check if adding this bundle would exceed MAX_LABS
        if len(assigned) + bundle_size > MAX_LABS:
            continue

        # Respect MAX_COURSES: if RA already has max distinct courses and this bundle is a new course, skip
        if len(used_courses) >= MAX_COURSES and bundle_course not in used_courses:
            continue

        # If any lab in bundle clashes, skip whole bundle for now
        if any(lab_has_clash(lab) for lab in bundle_labs):
            continue

        # Also ensure we aren't assigning duplicate classId+slot already assigned to this RA
        already = any(a.get('classId') == bundle.get('classId') and a.get('slot') in [l.get('slot') for l in bundle_labs] for a in assigned)
        if already:
            continue

        # Assign all labs in bundle
        for lab in bundle_labs:
            assigned.append(lab)
        used_courses.add(bundle_course)
    # Pass 2: Fill remaining slots until MIN_LABS is reached (ignoring clashes if necessary)
    while len(assigned) < MIN_LABS:
        # Flatten all labs from bundles, but avoid labs already added (same classId+slot)
        flat_labs = []
        for bundle in bundles:
            for lab in bundle.get('labs', []):
                if not any(a['classId'] == lab['classId'] and a['slot'] == lab['slot'] for a in assigned):
                    flat_labs.append(lab)
                    
        random.shuffle(flat_labs)

        for lab in flat_labs:
            if len(used_courses) >= MAX_COURSES and lab["courseCode"] not in used_courses:
                continue
            # In this pass we allow clashes (to fill requirement)
            assigned.append(lab)
            used_courses.add(lab["courseCode"])
            if len(assigned) >= MAX_LABS:
                break
    # Pass 3: If distinct course requirement not met, try swapping assigned labs with labs from other courses
    if len(used_courses) < MIN_COURSES:
        other_course_labs = [l for b in bundles for l in b.get('labs', []) if l['courseCode'] not in used_courses]
        i = 0
        while len(used_courses) < MIN_COURSES and i < len(other_course_labs) and i < len(assigned):
            new_lab = other_course_labs[i]
            assigned[len(assigned) - 1 - i] = new_lab
            used_courses.add(new_lab["courseCode"])
            i += 1

    # Append per-lab entries to final allocations (preserve individual lab rows)
    for lab in assigned:
        final_allocations.append({
            "raName": ra_name,
            "empId": emp_id,
            "phdRegNo": phd_id,
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
