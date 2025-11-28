import pandas as pd
import random
import json
import math

# ======================
# CONFIGURATION
# ======================


MIN_LABS = 4
MAX_LABS = 6
MIN_COURSES = 2
MAX_COURSES = 3
COURSES_FILE = "temp/courses.xlsx"
RAS_FILE = "temp/ras.xlsx"
SLOT_MAP_FILE = "temp/l_to_slot_map.csv"
OUTPUT_FILE = "temp/allocations.json"

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

# ======================
# LOAD DATA
# ======================

courses_df = pd.read_excel(COURSES_FILE)
ras_df = pd.read_excel(RAS_FILE)
slot_map_df = pd.read_csv(SLOT_MAP_FILE, header=None, names=["L", "Theory"])
l_to_theory = dict(zip(slot_map_df["L"], slot_map_df["Theory"]))

# Filter lab courses (LO and ELA)
courses_df = courses_df[courses_df["COURSE TYPE"].str.strip().isin(["LO", "ELA"])].copy()
courses_df["L_SLOTS"] = courses_df["SLOT"].apply(parse_slots)
courses_df["LAB_GROUPS"] = courses_df["L_SLOTS"].apply(group_lab_hours)

# Build Global Lab Pool (Bundles)
bundles_map = {}
for _, row in courses_df.iterrows():
    for group in row["LAB_GROUPS"]:
        lab_data = {
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
            "id": f"{row['COURSE CODE']}_{row['CLASS ID']}_{group}" # Unique ID
        }
        
        key = (lab_data["courseCode"], lab_data["classId"])
        if key not in bundles_map:
            bundles_map[key] = {
                "courseCode": lab_data["courseCode"],
                "classId": lab_data["classId"],
                "labs": []
            }
        bundles_map[key]["labs"].append(lab_data)

all_bundles = list(bundles_map.values())

# Prepare RAs
ras = []
for _, row in ras_df.iterrows():
    pfix = row.get("Pfix", "")
    name = row.get("Name of the student", "")
    ra_name = f"{str(pfix).strip()} {str(name).strip()}" if pd.notna(pfix) and str(pfix).strip() else str(name).strip()
    
    reg_slots_str = str(row.get("REGISTERED SLOTS", ""))
    busy_slots = set(s.strip() for s in reg_slots_str.replace(';', '+').split('+') if s.strip())
    
    ras.append({
        "raName": ra_name,
        "empId": row.get("Emp Id", ""),
        "phdRegNo": row.get("Ph.D Registration Number", ""),
        "registeredSlots": reg_slots_str,
        "busySlots": busy_slots,
        "assignedLabs": [],
        "usedCourses": set() # Track Course Codes
    })

# ======================
# ALLOCATION LOGIC
# ======================

# ======================
# ALLOCATION LOGIC
# ======================

def can_assign_single_lab(ra, lab):
    # Check busy slots
    if has_clash(parse_slots(lab["slot"]), ra["busySlots"], l_to_theory):
        return False
    # Check time clash with already assigned labs
    if any(l["slot"] == lab["slot"] for l in ra["assignedLabs"]):
        return False
    # Check course limit (if new course)
    if len(ra["usedCourses"]) >= MAX_COURSES and lab["courseCode"] not in ra["usedCourses"]:
        return False
    return True

def assign_lab(ra, lab):
    ra["assignedLabs"].append(lab)
    ra["usedCourses"].add(lab["courseCode"])

# Phase 1: Allocate up to MIN_LABS (4)
print("Starting Phase 1: Allocating up to 4 labs...")
random.shuffle(ras)

# We iterate multiple times to fill up to 4 evenly
changed = True
while changed:
    changed = False
    random.shuffle(all_bundles) # Shuffle bundles each pass
    
    for ra in ras:
        if len(ra["assignedLabs"]) >= MIN_LABS:
            continue
            
        # Try to find a bundle
        for bundle in all_bundles:
            if not bundle["labs"]: continue
            
            # 1. Try to assign WHOLE bundle
            all_valid = True
            for l in bundle["labs"]:
                if not can_assign_single_lab(ra, l):
                    all_valid = False
                    break
            
            # If whole bundle fits and doesn't exceed MAX_LABS (8)
            if all_valid and (len(ra["assignedLabs"]) + len(bundle["labs"]) <= MAX_LABS):
                # Assign all
                for l in list(bundle["labs"]): # Copy list to avoid modification issues
                    assign_lab(ra, l)
                    bundle["labs"].remove(l)
                changed = True
                break # Move to next RA
            
            # 2. If whole bundle doesn't fit (due to MAX_LABS), try to split
            # Only split if we really need labs to reach MIN_LABS
            # And only if the course limit allows
            if not all_valid:
                # Check if at least some labs are valid
                valid_labs = [l for l in bundle["labs"] if can_assign_single_lab(ra, l)]
                
                if valid_labs:
                    # Take as many as needed to reach MIN_LABS, but respect MAX_LABS
                    # Actually, in Phase 1 we just want to reach MIN_LABS (4)
                    # But we can go up to MAX_LABS if it helps take a whole bundle (handled above)
                    # Here we are splitting because we CAN'T take the whole bundle
                    
                    needed = MIN_LABS - len(ra["assignedLabs"])
                    if needed > 0:
                        take_count = min(len(valid_labs), needed)
                        to_assign = valid_labs[:take_count]
                        for l in to_assign:
                            assign_lab(ra, l)
                            bundle["labs"].remove(l)
                        changed = True
                        break

        # Cleanup empty bundles
        all_bundles = [b for b in all_bundles if b["labs"]]

# Phase 2: Fill remaining labs up to MAX_LABS
# PRIORITY: First ensure everyone reaches MIN_LABS, then distribute extras
print(f"Starting Phase 2: Allocating remaining labs up to {MAX_LABS}...")
if all_bundles:
    # Sub-phase 2A: Prioritize under-allocated RAs (less than MIN_LABS)
    print(f"Phase 2A: Prioritizing RAs with < {MIN_LABS} labs...")
    changed = True
    while changed:
        changed = False
        random.shuffle(all_bundles)
        
        # Sort RAs: under-allocated first
        sorted_ras = sorted(ras, key=lambda r: len(r["assignedLabs"]))
        
        for ra in sorted_ras:
            if len(ra["assignedLabs"]) >= MIN_LABS:
                continue  # Skip RAs who already reached minimum
                
            # Try to grab one more lab (splitting allowed here to fill gaps)
            for bundle in all_bundles:
                if not bundle["labs"]: continue
                
                lab = bundle["labs"][0]
                if can_assign_single_lab(ra, lab):
                    assign_lab(ra, lab)
                    bundle["labs"].remove(lab)
                    changed = True
                    break
            
            all_bundles = [b for b in all_bundles if b["labs"]]
            if not all_bundles: break
    
    # Sub-phase 2B: Distribute remaining labs up to MAX_LABS
    print(f"Phase 2B: Distributing extras up to {MAX_LABS}...")
    if all_bundles:
        changed = True
        while changed:
            changed = False
            random.shuffle(all_bundles)
            
            for ra in ras:
                if len(ra["assignedLabs"]) >= MAX_LABS:
                    continue
                    
                for bundle in all_bundles:
                    if not bundle["labs"]: continue
                    
                    lab = bundle["labs"][0]
                    if can_assign_single_lab(ra, lab):
                        assign_lab(ra, lab)
                        bundle["labs"].remove(lab)
                        changed = True
                        break
                
                all_bundles = [b for b in all_bundles if b["labs"]]
                if not all_bundles: break

# ======================
# OUTPUT GENERATION
# ======================

final_allocations = []
for ra in ras:
    for lab in ra["assignedLabs"]:
        final_allocations.append({
            "raName": ra["raName"],
            "empId": ra["empId"],
            "phdRegNo": ra["phdRegNo"],
            "registeredSlots": ra["registeredSlots"],
            "numLabsReq": MIN_LABS, # Base requirement
            **lab,
            "comments": ""
        })

# Calculate unallocated
unallocated_labs = []
for bundle in all_bundles:
    unallocated_labs.extend(bundle["labs"])

result = {
    "allocations": final_allocations,
    "unallocatedLabs": unallocated_labs
}

with open(OUTPUT_FILE, 'w') as f:
    json.dump(result, f, indent=2)

print(f"Allocation saved. Unallocated labs: {len(unallocated_labs)}")
