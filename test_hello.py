#!/usr/bin/env python3
"""
Simple test script for sandbox functionality testing
"""
import time
import sys

def main():
    print("=" * 50)
    print("Test Script Execution Started")
    print("=" * 50)
    
    # Test stdout
    for i in range(1, 6):
        print(f"Processing step {i}/5...")
        time.sleep(0.5)
    
    # Test calculation
    result = sum(range(1, 101))
    print(f"\nCalculation Result: Sum of 1-100 = {result}")
    
    # Test warning (stderr)
    print("WARNING: This is a test warning message", file=sys.stderr)
    
    # More output
    print("\n✅ All tests completed successfully!")
    print("Script execution finished.")
    print("=" * 50)
    
    return 0

if __name__ == "__main__":
    try:
        exit_code = main()
        sys.exit(exit_code)
    except Exception as e:
        print(f"ERROR: {str(e)}", file=sys.stderr)
        sys.exit(1)
