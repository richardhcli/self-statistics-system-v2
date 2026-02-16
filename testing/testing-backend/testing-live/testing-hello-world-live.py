import requests
import json

# --- CONFIGURATION ---
# REPLACE THIS with your actual Firebase Project ID (found in .firebaserc)
PROJECT_ID = "self-statistics-system-v2" 
REGION = "us-central1"
FUNCTION_NAME = "helloWorld"

# Live URL Structure: https://<region>-<project>.cloudfunctions.net/<function>
#https://us-central1-self-statistics-system-v2.cloudfunctions.net/helloWorld
URL = f"https://{REGION}-{PROJECT_ID}.cloudfunctions.net/{FUNCTION_NAME}"

def run_test():
    print(f"Testing Live Site: {URL}")
    try:
        response = requests.get(URL)
        
        if response.status_code == 200:
            print("✅ SUCCESS!")
            print(json.dumps(response.json(), indent=2))
        else:
            print(f"❌ FAILED: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"❌ ERROR: {e}")

if __name__ == "__main__":
    run_test()