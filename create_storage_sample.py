#!/usr/bin/env python3
"""
Generate sample storage operations Excel file
"""

from openpyxl import Workbook
from datetime import datetime, timedelta
import random

# Create workbook
wb = Workbook()
ws = wb.active
ws.title = 'Storage Data'

# Add headers
headers = ['TimePeriod', 'Region', 'State', 'StorageType', 'CapacityMW', 
           'ChargeMW', 'DischargeMW', 'StateOfCharge', 'Efficiency', 'Cycles']
ws.append(headers)

# Define sample data
regions_data = [
    ('Northern', 'Delhi', 'Battery'),
    ('Western', 'Maharashtra', 'Battery'),
    ('Southern', 'Tamil Nadu', 'Battery'),
    ('Eastern', 'West Bengal', 'Pumped Hydro')
]

# Set seed for reproducibility
random.seed(42)

# Generate data for last 24 hours
base_time = datetime.now()
for hour in range(24):
    timestamp = base_time - timedelta(hours=hour)
    time_str = timestamp.strftime('%Y-%m-%d %H:%M:%S')
    
    for region, state, storage_type in regions_data:
        capacity = random.randint(300, 1000)
        charge = random.randint(100, 400)
        discharge = random.randint(80, 350)
        soc = round(random.uniform(40, 90), 1)
        efficiency = round(random.uniform(85, 95), 1)
        cycles = random.randint(1, 4)
        
        ws.append([time_str, region, state, storage_type, capacity, 
                   charge, discharge, soc, efficiency, cycles])

# Save file
filename = 'sample_storage_data.xlsx'
wb.save(filename)
print(f'✓ Sample storage Excel file created: {filename}')
print(f'✓ Contains {ws.max_row - 1} rows of data')
print(f'✓ Columns: {", ".join(headers)}')
print(f'\nYou can now upload this file via the Data Source Manager in the dashboard.')
