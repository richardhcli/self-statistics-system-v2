import json
import os
import sys
import time
from pathlib import Path
from typing import Any, Dict, Optional

import requests
from dotenv import load_dotenv

# ==========================================
# INITIALIZATION & CONSTANTS
# ==========================================
# Automatically read the .env file and populate os.environ
load_dotenv()

PROJECT_ID = "self-statistics-system-v2"
DEFAULT_BACKEND_URL = "http://127.0.0.1:5001/self-statistics-system-v2/us-central1"

# The local file where the permanent refresh token is cached
TOKEN_FILE = Path(__file__).parent / ".selfstats-tokens.json"
CACHE_KEY = f"selfstats:{PROJECT_ID}:tokens"

def fatal(msg: str) -> None:
    """Helper to print errors and exit cleanly."""
    print(f"❌ {msg}")
    sys.exit(1)

# ==========================================
# STORAGE ADAPTER LOGIC
# ==========================================
def load_tokens() -> Optional[Dict[str, Any]]:
    """Reads the cached tokens from the local file system."""
    if not TOKEN_FILE.exists():
        return None
    try:
        return json.loads(TOKEN_FILE.read_text())
    except Exception:
        return None

def save_tokens(bundle: Dict[str, Any]) -> None:
    """Persists the tokens to the local file system."""
    TOKEN_FILE.write_text(json.dumps(bundle, indent=2))

# ==========================================
# IDENTITY & AUTHENTICATION LOGIC
# ==========================================
def decode_expiry(id_token: str) -> int:
    """Extracts the expiration timestamp (exp) from a JWT payload."""
    try:
        parts = id_token.split(".")
        if len(parts) < 2:
            return int(time.time()) + 3600
        
        import base64
        padded = parts[1] + "=" * (-len(parts[1]) % 4)
        payload = json.loads(base64.urlsafe_b64decode(padded).decode("utf-8"))
        
        if "exp" in payload:
            return int(payload["exp"])
    except Exception:
        pass
    return int(time.time()) + 3600

    
def exchange_setup_code(setup_code: str, api_key: str) -> Dict[str, Any]:
    """Trades the 1-hour Custom Token (Setup Code) for a permanent Refresh Token."""
    print("\n🔄 Exchanging Setup Code with Google Identity Toolkit...")
    
    # Support Auth Emulator if FIREBASE_AUTH_EMULATOR_HOST is set in the environment
    auth_emulator = os.environ.get("FIREBASE_AUTH_EMULATOR_HOST")
    if auth_emulator:
        url = f"http://{auth_emulator}/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key={api_key}"
        print(f"⚠️  Using local Auth Emulator: {auth_emulator}")
    else:
        url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key={api_key}"
        
    payload = {"token": setup_code, "returnSecureToken": True}
    
    res = requests.post(url, json=payload, timeout=30)
    if not res.ok:
        fatal(f"Exchange failed: {res.status_code} {res.text}")
        
    data = res.json()
    if "idToken" not in data or "refreshToken" not in data:
        fatal("Exchange response missing tokens")
        
    expires_at = decode_expiry(data["idToken"])
    bundle = {CACHE_KEY: json.dumps({
        "idToken": data["idToken"],
        "refreshToken": data["refreshToken"],
        "expiresAt": expires_at,
    })}
    
    save_tokens(bundle)
    print(f"✅ Exchange successful. Tokens cached at {TOKEN_FILE}")
    return bundle

def refresh_id_token(refresh_token: str, api_key: str) -> Dict[str, Any]:
    """Uses the permanent Refresh Token to request a fresh 1-hour ID Token."""
    url = f"https://securetoken.googleapis.com/v1/token?key={api_key}"
    res = requests.post(
        url,
        data={"grant_type": "refresh_token", "refresh_token": refresh_token},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        timeout=30,
    )
    if not res.ok:
        fatal(f"Refresh failed: {res.status_code} {res.text}")
        
    data = res.json()
    expires_at = int(time.time()) + int(data.get("expires_in", 3600))
    bundle = {CACHE_KEY: json.dumps({
        "idToken": data["id_token"],
        "refreshToken": data["refresh_token"],
        "expiresAt": expires_at,
    })}
    
    save_tokens(bundle)
    print("🔁 Refreshed ID token")
    return bundle

def get_valid_id_token(api_key: str, setup_code: str) -> str:
    """
    Core Interceptor Logic: 
    1. Returns cached ID token if valid.
    2. Refreshes if expired.
    3. Exchanges setup code if no tokens exist.
    """
    cached = load_tokens()
    now = int(time.time())
    
    if cached and CACHE_KEY in cached:
        try:
            stored = json.loads(cached[CACHE_KEY])
        except Exception:
            stored = None
            
        if stored and "idToken" in stored and "expiresAt" in stored:
            # 1. Use existing token if it has more than 60 seconds of life left
            if stored["expiresAt"] - now > 60:
                return stored["idToken"]
            
            # 2. Refresh the token if we have a refresh token
            if "refreshToken" in stored:
                refreshed = refresh_id_token(stored["refreshToken"], api_key)
                return json.loads(refreshed[CACHE_KEY])["idToken"]
                
    # 3. If no valid cache exists, we require a setup code to bootstrap
    if not setup_code:
        fatal("No valid cached token found, and SETUP_CODE is missing from .env.")
        
    exchanged = exchange_setup_code(setup_code, api_key)
    return json.loads(exchanged[CACHE_KEY])["idToken"]

# ==========================================
# API EXECUTION
# ==========================================
def post_journal(backend_url: str, id_token: str) -> None:
    """Executes the authorized API call to the backend router."""
    url = f"{backend_url}/apiRouter"
    payload = {"rawText": "Sandbox test entry: Python token exchange path."}
    headers = {"Authorization": f"Bearer {id_token}", "Content-Type": "application/json"}
    
    print(f"\n🚀 Posting journal to {url}")
    res = requests.post(url, headers=headers, json=payload, timeout=60)
    
    if not res.ok:
        fatal(f"Backend request failed: {res.status_code} {res.text}")
        
    print("✅ Backend response:")
    print(json.dumps(res.json(), indent=2))

def main() -> None:
    # Read strict configuration from environment
    api_key = os.environ.get("FIREBASE_API_KEY", "").strip()
    if not api_key:
        fatal("Set FIREBASE_API_KEY in your .env file")

    backend_url = os.environ.get("BACKEND_URL", DEFAULT_BACKEND_URL).rstrip("/")
    setup_code = os.environ.get("SETUP_CODE", "").strip()

    print("=== Self Statistics System: Custom Token Sandbox ===")
    print(f"Backend: {backend_url}")

    # Fetch token and execute
    id_token = get_valid_id_token(api_key, setup_code)
    post_journal(backend_url, id_token)

if __name__ == "__main__":
    main()