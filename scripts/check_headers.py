import pandas as pd
import os
import sys

files = [
    "Files/RA NEW LIST.xlsx",
    "Files/Course details for RA.xlsx"
]

with open("headers_report.txt", "w", encoding="utf-8") as report:
    for f in files:
        report.write(f"--- Checking {f} ---\n")
        if not os.path.exists(f):
            report.write(f"File not found: {f}\n")
            continue
        
        try:
            df = pd.read_excel(f, nrows=5) # Read only first few rows
            report.write("Columns found:\n")
            for col in df.columns:
                report.write(f"  '{col}'\n")
                
            # Specific checks for Course file
            if "Course" in f:
                if "COURSE TYPE" in df.columns:
                    unique_types = df["COURSE TYPE"].unique()
                    report.write(f"Unique COURSE TYPE values (first 5 rows): {unique_types}\n")
                else:
                    report.write("WARNING: 'COURSE TYPE' column missing!\n")

        except Exception as e:
            report.write(f"Error reading file: {e}\n")
        report.write("\n")
