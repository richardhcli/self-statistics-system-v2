import requests
import json
import time

# CONFIGURATION
# ---------------------------------------------------------
# Default Emulator URL. 
# REPLACE 'your-project-id' with your actual project ID (check .firebaserc)
# or look at the terminal output when you run 'npm run serve'.
PROJECT_ID = "self-statistics-system-v2" 
REGION = "us-central1"
BASE_URL = f"http://127.0.0.1:5001/{PROJECT_ID}/{REGION}/debugEndpoint"

API_KEY = "MY_SECRET_LOCAL_KEY"
# ---------------------------------------------------------

def print_result(test_name, success, details=None):
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status} | {test_name}")
    if details:
        print(f"      └─ {details}")

def run_tests():
    print(f"\n--- 🔍 Starting System Diagnosis ---\nTarget: {BASE_URL}\n")

    headers = {
        "Content-Type": "application/json",
        "x-api-key": API_KEY
    }

    # TEST 1: Health Check
    try:
        response = requests.post(BASE_URL, json={"action": "HEALTH"}, headers=headers)
        if response.status_code == 200:
            data = response.json()
            print_result("Health Check", True, f"Uptime: {data['uptime']}s | Ver: {data['nodeVersion']}")
        else:
            print_result("Health Check", False, f"Status: {response.status_code}")
    except Exception as e:
        print_result("Health Check", False, f"Connection Error: {str(e)}")
        return # Stop if we can't even connect

    # TEST 2: Echo (Data Integrity)
    payload = {"test_val": 12345, "message": "hello world"}
    try:
        response = requests.post(BASE_URL, json={"action": "ECHO", "payload": payload}, headers=headers)
        data = response.json()
        if data.get('received') == payload:
            print_result("Echo Test", True, "Payload matched perfectly")
        else:
            print_result("Echo Test", False, "Payload mismatch")
    except Exception as e:
        print_result("Echo Test", False, str(e))

    # TEST 3: Firestore Database Connectivity
    try:
        print("      ... Attempting DB Write/Read (this may take a moment) ...")
        response = requests.post(BASE_URL, json={"action": "DB_CONNECTIVITY_TEST", "payload": "py-script-test"}, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print_result("Database I/O", True, "Write & Read verified")
            else:
                print_result("Database I/O", False, "Logic failed internally")
        else:
            print_result("Database I/O", False, f"HTTP {response.status_code}: {response.text}")
    except Exception as e:
        print_result("Database I/O", False, str(e))

    print("\n--- Diagnosis Complete ---")

if __name__ == "__main__":
    run_tests()