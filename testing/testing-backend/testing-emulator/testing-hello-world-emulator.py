import requests
import json

# --- CONFIGURATION ---
# ENSURE THIS MATCHES THE URL PRINTED IN YOUR EMULATOR TERMINAL
PROJECT_ID = "self-statistics-system-v2" 
REGION = "us-central1"
FUNCTION_NAME = "helloWorld"

URL = f"http://127.0.0.1:5001/{PROJECT_ID}/{REGION}/{FUNCTION_NAME}"

def run_test():
    print(f"Testing Local Emulator: {URL}")
    try:
        response = requests.get(URL)
        
        # 1. Check Status Code
        if response.status_code == 200:
            print("✅ SUCCESS (Status 200)")
            
            # 2. DEBUG: Print the raw text BEFORE parsing JSON
            print(f"🔎 RAW RESPONSE: '{response.text}'") 

            if not response.text.strip():
                print("❌ ERROR: Response body is empty!")
                return

            # 3. Safe Parse
            try:
                print(json.dumps(response.json(), indent=2))
            except json.JSONDecodeError:
                print("❌ ERROR: Response text is not valid JSON.")
        else:
            print(f"❌ FAILED: {response.status_code}")
            print(response.text)
            
    except requests.exceptions.ConnectionError:
        print("❌ CONNECTION REFUSED")
        print("Make sure you are running: 'npm run serve' in the /functions folder")

if __name__ == "__main__":
    run_test()