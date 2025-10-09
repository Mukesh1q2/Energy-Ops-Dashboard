import time
import sys

print("Model name: Test Script")
print(f"Model run time {time.strftime('%Y-%m-%d %H:%M:%S')}")
time.sleep(1)

print("Testing Price Forecast Loop a bit")
time.sleep(1)

print("Running Deterministic Day-Ahead Model...")
time.sleep(1)

print("Wind profiles used for respective plant has been written...")
time.sleep(0.5)

print("Processing optimization parameters...")
time.sleep(0.5)

print("WARNING: This is a sample warning message", file=sys.stderr)
time.sleep(0.5)

print("Calculating optimal bid strategies...")
time.sleep(1)

print("Execution completed successfully")
print(f"Total execution time: {time.time():.2f} seconds")
