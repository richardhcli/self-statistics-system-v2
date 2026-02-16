import requests
import json
import sys

# --- CONFIGURATION ---
# 1. Project ID: Found in your .firebaserc file or the emulator start logs
PROJECT_ID = "self-statistics-system-v2" 

# 2. Region: Usually "us-central1" by default
REGION = "us-central1"

# 3. Function Name: Must match the export name in functions/src/index.ts
FUNCTION_NAME = "externalWebhook"

# 4. API Key: Must match the check inside your function (bare-metal-api.ts)
API_KEY = "MY_SECRET_LOCAL_KEY"

# Construct the Emulator URL
# Format: http://127.0.0.1:5001/<project-id>/<region>/<function-name>
URL = f"http://127.0.0.1:5001/{PROJECT_ID}/{REGION}/{FUNCTION_NAME}"

# --- TEST DATA ---
payload = {
    "userId": "richard_li",
    "action": "UPLOAD_STATS",
    "data": { 
        "nodeId": "math", 
        "amount": 100 
    }
}

headers = {
    "Content-Type": "application/json",
    "x-api-key": API_KEY
}

# --- EXECUTION ---
def run_test():
    print(f"🚀 Sending request to: {URL}")
    print(f"📦 Payload: {json.dumps(payload, indent=2)}")
    
    try:
        response = requests.post(URL, json=payload, headers=headers)
        
        # Check if the request was successful (HTTP 200-299)
        if response.status_code == 200:
            print("\n✅ SUCCESS!")
            print("Response:", response.json())
        else:
            print(f"\n❌ FAILED with Status Code: {response.status_code}")
            print("Response Text:", response.text)
            
    except requests.exceptions.ConnectionError:
        print("\n❌ CONNECTION ERROR")
        print("Could not connect to the emulator. Is it running?")
        print("Try running: 'firebase emulators:start' or 'npm run serve' in the functions folder.")
    except Exception as e:
        print(f"\n❌ UNEXPECTED ERROR: {e}")

if __name__ == "__main__":
    run_test()