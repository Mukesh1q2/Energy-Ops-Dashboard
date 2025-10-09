
############## DETERMINISTIC DAY-AHEAD MODEL FORMULATION ###########################
####################################################################################

###### MODEL STRUCTURE ##############
# 1. TECHNOLOGIES MODELLED - thermal, solar, wind, hydro (run of river and pondage), pump-storage, battery
# 2. CONTRACTS MODELLED - PPAs, FIXED DEMAND (capture - Tolling, FDRE, RE-RTC, peak demand contracts) and GREEN AMMONIA
# 3. MARKETS MODELLED - DAM, GDAM and RTM
#####################################


##########################################################################
###### OVERALL CODE STRUCTURE ############################################
##########################################################################

import numpy as np
import os
import pandas as pd
import psutil
import time
from datetime import datetime
import warnings
import os
from openpyxl import load_workbook
warnings.filterwarnings("ignore")
from datetime import datetime, timedelta
import gurobipy as gp
from gurobipy import GRB
from gurobipy import quicksum
#import matplotlib.pyplot as plt
pd.set_option('display.max_columns', None)
import re

# Get the current datetime and format it for the file name
current_datetime = datetime.now()

current_datetime_str = current_datetime.strftime("%Y%m%d%H%M%S")
folder_marker = current_datetime.strftime("%Y%m%d%H%M")

## NOTE. For testing purposes, you can uncomment the following lines to set a specific date and time
current_datetime = datetime.strptime("202504031402", "%Y%m%d%H%M")
current_datetime_str = "202504031402"
folder_marker = "202504031402"


# Extract DDART run details
DDART_run_day = current_datetime.day
DDART_run_month = current_datetime.month
DDART_run_year = current_datetime.year

DDART_run_date_stamp = datetime(DDART_run_year, DDART_run_month, DDART_run_day)

# Calculate the next day
next_day = DDART_run_date_stamp + timedelta(days=1)

###############################################################################
start_time_main = time.time()
comment = ''
current_time = time.time()
current_datetime = datetime.fromtimestamp(current_time)
formatted_time = current_datetime.strftime('%Y-%m-%d %H:%M:%S')
print('Model name: '+comment)
print('Model run time '+formatted_time)
###############################################################################

T = 96   # No of Time Blocks

###############################################################################
# Update - Read solar-profile from historical data
###############################################################################


DAM_market_price = pd.read_csv(folder_marker + '/DDART_input' +'/' + 'dam_forecast.csv')
GDAM_market_price = pd.read_csv(folder_marker + '/DDART_input' +'/' + 'gdam_forecast.csv')
RTM_market_price = pd.read_csv(folder_marker + '/DDART_input' +'/' + 'rtm_forecast.csv')

PX_green_map = pd.read_excel(folder_marker + '/DDART_input'  +'/'+'power_exchange'+comment+'.xlsx','market_settings').drop(columns = ['market']).values

columns_to_keep = ["timeblock", "pred_f05", "pred_f10", "pred_f25", "pred_f50", "pred_f75", "pred_f90", "pred_f95"]

DDART_DAM_market_price = DAM_market_price[
    (DAM_market_price["day"] == next_day.day) & 
    (DAM_market_price["month"] == next_day.month) & 
    (DAM_market_price["year"] == next_day.year)
][columns_to_keep]

print(DDART_DAM_market_price.columns)

DDART_GDAM_market_price = GDAM_market_price[
    (GDAM_market_price["day"] == next_day.day) & 
    (GDAM_market_price["month"] == next_day.month) & 
    (DAM_market_price["year"] == next_day.year)
][columns_to_keep]

print(DDART_GDAM_market_price.columns)

DDART_RTM_market_price = RTM_market_price[
    (RTM_market_price["day"] == next_day.day) & 
    (RTM_market_price["month"] == next_day.month) & 
    (RTM_market_price["year"] == next_day.year)
][columns_to_keep]

print(DDART_RTM_market_price.columns)


# Write the resulting DataFrame to a CSV file
solar_plant_profiles = pd.read_csv(folder_marker + '/DDART_input' +'/'+ "solar_plant_profiles.csv").drop(columns = ['Date'])

# Write the resulting DataFrame to a CSV file
wind_plant_profiles  = pd.read_csv(folder_marker + '/DDART_input' +'/'+ "wind_plant_profiles.csv").drop(columns = ['Date'])

print(f"Wind profiles used for respctive plant has been written to wind_plant_profiles.csv in {folder_marker}/DDART_input folder")

###############################################################################
################## READ LATEST FORECAST PRICES
###############################################################################


##################################################################################
################## READ ALL OTHER DATA FOR MODEL HERE
###############################################################################

pDuration = 0.25

# Be able to read the name of price/scenario from price forecast sheets for the *defined* date

price_name = "f50"
price_names = ["f05", "f10", "f25", "f50", "f75", "f90", "f95"]

# for price_name in price_names:
scenario_name = "pred_"+price_name

print("Testing Price Forecast Loop a bit")
print( np.array(DDART_DAM_market_price[scenario_name])[1])
print(np.array(DDART_GDAM_market_price[scenario_name])[1])
print(np.array(DDART_DAM_market_price[scenario_name])[1])

print(f" Running Deterministic Day-Ahead Model for {DDART_run_date_stamp} & Scenario {price_name}")

reserve_price = pd.read_excel(folder_marker + '/DDART_input'  +'/'+'reserve_limits'+comment+'.xlsx','reserve_prices').drop(columns = ['Time','Block'])

###############################################################################
