"""
Sample Market Snapshot Data Generator
Creates Excel file with realistic market data for testing DMO Dashboard
"""

import pandas as pd
from datetime import datetime, timedelta
import numpy as np

# Configuration
# Use today's date at midnight for easier testing
START_DATE = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
BLOCKS_PER_DAY = 96  # 15-minute intervals
BASE_DAM_PRICE = 3.5
BASE_RTM_PRICE = 3.6
BASE_GDAM_PRICE = 3.4
BASE_SCHEDULED_MW = 120
BASE_MODEL_MW = 122

# Generate data for one day (96 timeblocks)
data = []

for block in range(1, BLOCKS_PER_DAY + 1):
    # Calculate time for this block (15-minute intervals)
    time_offset = (block - 1) * 15
    time_period = START_DATE + timedelta(minutes=time_offset)
    
    # Add some realistic variation to prices
    # Prices tend to be higher during peak hours (9 AM - 10 PM)
    hour = block // 4
    is_peak = 9 <= hour <= 22
    peak_multiplier = 1.3 if is_peak else 0.9
    
    # Add random noise
    noise = np.random.normal(0, 0.1)
    
    # Generate prices with daily pattern
    dam_price = BASE_DAM_PRICE * peak_multiplier + noise
    rtm_price = BASE_RTM_PRICE * peak_multiplier + noise * 1.1
    gdam_price = BASE_GDAM_PRICE * peak_multiplier + noise * 0.9
    
    # Generate volumes with similar pattern
    volume_noise = np.random.normal(0, 5)
    scheduled_mw = BASE_SCHEDULED_MW * peak_multiplier + volume_noise
    modelresult_mw = BASE_MODEL_MW * peak_multiplier + volume_noise * 1.05
    
    # Optional: Add purchase and sell bid volumes
    purchase_bid_mw = scheduled_mw * 0.95
    sell_bid_mw = modelresult_mw * 1.05
    
    data.append({
        'TimePeriod': time_period.strftime('%Y-%m-%d %H:%M:%S'),
        'Timeblock': block,
        'DAMprice': round(dam_price, 2),
        'RTMprice': round(rtm_price, 2),
        'GDAMprice': round(gdam_price, 2),
        'ScheduleMW': round(scheduled_mw, 2),
        'ModelresultMW': round(modelresult_mw, 2),
        'PurchaseBidMW': round(purchase_bid_mw, 2),
        'SellBidMW': round(sell_bid_mw, 2),
        'State': 'MH',
        'PlantName': 'Plant1',
        'Region': 'Western',
        'ContractName': 'PPA-001'
    })

# Create DataFrame
df = pd.DataFrame(data)

# Save to Excel
output_file = 'sample_market_snapshot.xlsx'
df.to_excel(output_file, index=False, sheet_name='Market Data')

print(f"✅ Sample data generated successfully!")
print(f"📁 File: {output_file}")
print(f"📊 Records: {len(df)}")
print(f"📅 Date: {START_DATE.strftime('%Y-%m-%d')}")
print(f"⏰ Time blocks: 1-{BLOCKS_PER_DAY} (15-minute intervals)")
print("\n📋 Column Summary:")
print(df.describe())
print("\n🎯 Sample rows:")
print(df.head(10))
print(f"\n✨ Upload this file to the DMO Dashboard at http://localhost:3000/dmo")
