"""
DMO Generator Scheduling Sample Data Generator
Creates Excel file with generator scheduling data for testing DMO Dashboard
"""

import pandas as pd
from datetime import datetime, timedelta
import numpy as np

# Configuration
START_DATE = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
HOURS = 24  # 24 hours of data

# Technologies and regions
TECHNOLOGIES = ["Coal", "Gas", "Hydro", "Nuclear", "Solar", "Wind"]
REGIONS = ["Northern", "Western", "Southern", "Eastern"]
STATES = {
    "Northern": ["Delhi", "Punjab", "Haryana"],
    "Western": ["Maharashtra", "Gujarat"],
    "Southern": ["Tamil Nadu", "Karnataka"],
    "Eastern": ["West Bengal", "Odisha"]
}
CONTRACTS = ["PPA-001", "PPA-002", "Tender-A", "Merchant-1", "REC-Solar"]

# Generate data
data = []

for hour in range(HOURS):
    time_period = START_DATE + timedelta(hours=hour)
    
    for tech in TECHNOLOGIES:
        # Random region and state
        region = np.random.choice(REGIONS)
        state = np.random.choice(STATES[region])
        
        # Plant details
        plant_id = f"PLT-{np.random.randint(100, 999)}"
        plant_name = f"{tech} Plant {np.random.randint(1, 20)}"
        contract = np.random.choice(CONTRACTS)
        
        # Generation values (MW) - vary by technology
        base_capacity = {
            "Coal": 500,
            "Gas": 300,
            "Hydro": 200,
            "Nuclear": 400,
            "Solar": 150,
            "Wind": 100
        }.get(tech, 200)
        
        # Add time-of-day variation (solar/wind have more variation)
        if tech in ["Solar"]:
            # Solar: high during day (7 AM - 6 PM)
            if 7 <= time_period.hour <= 18:
                multiplier = 0.8 + np.random.random() * 0.4
            else:
                multiplier = 0.0
        elif tech in ["Wind"]:
            # Wind: variable
            multiplier = 0.3 + np.random.random() * 0.7
        else:
            # Baseload: relatively constant
            multiplier = 0.7 + np.random.random() * 0.3
        
        scheduled_mw = base_capacity * multiplier
        actual_mw = scheduled_mw * (0.92 + np.random.random() * 0.16)  # 92-108% of scheduled
        
        data.append({
            'TimePeriod': time_period.strftime('%Y-%m-%d %H:%M:%S'),
            'Region': region,
            'State': state,
            'PlantID': plant_id,
            'PlantName': plant_name,
            'TechnologyType': tech,
            'ContractName': contract,
            'ScheduledMW': round(scheduled_mw, 2),
            'ActualMW': round(actual_mw, 2)
        })

# Create DataFrame
df = pd.DataFrame(data)

# Save to Excel
output_file = 'sample_dmo_generator_scheduling.xlsx'
df.to_excel(output_file, index=False, sheet_name='Generator Scheduling')

print(f"✅ DMO Generator Scheduling sample data generated!")
print(f"📁 File: {output_file}")
print(f"📊 Records: {len(df)}")
print(f"📅 Date: {START_DATE.strftime('%Y-%m-%d')}")
print(f"⏰ Time range: 24 hours")
print(f"🔧 Technologies: {', '.join(TECHNOLOGIES)}")
print("\n📋 Column Summary:")
print(df.describe())
print("\n🎯 Sample rows:")
print(df.head(10))
print(f"\n✨ Upload this file to the DMO Dashboard")
