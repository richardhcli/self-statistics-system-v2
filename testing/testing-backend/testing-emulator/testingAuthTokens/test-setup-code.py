import json
import os
import sys
import time
from pathlib import Path
from typing import Any, Dict, Optional

import requests

# Project-specific defaults
PROJECT_ID = "self-statistics-system-v2"
DEFAULT_BACKEND_URL = "http://127.0.0.1:5001/self-statistics-system-v2/us-central1"
TOKEN_FILE = Path(__file__).parent / ".selfstats-tokens.json"
CACHE_KEY = f"selfstats:{PROJECT_ID}:tokens"


def fatal(msg: str) -> None:
    print(f"❌ {msg}")
    sys.exit(1)


def load_tokens() -> Optional[Dict[str, Any]]:
    if not TOKEN_FILE.exists():
        return None
    try:
        return json.loads(TOKEN_FILE.read_text())
    except Exception:
        return None


def save_tokens(bundle: Dict[str, Any]) -> None:
    TOKEN_FILE.write_text(json.dumps(bundle, indent=2))


def exchange_setup_code(setup_code: str, api_key: str) -> Dict[str, Any]:
    print("\n🔄 Exchanging Setup Code with Google Identity Toolkit...")
    url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key={api_key}"
    payload = {"token": setup_code, "returnSecureToken": True}
    res = requests.post(url, json=payload, timeout=30)
    if not res.ok:
        fatal(f"Exchange failed: {res.status_code} {res.text}")
    data = res.json()
    if "idToken" not in data or "refreshToken" not in data:
        fatal("Exchange response missing tokens")
    # Decode exp from JWT for expiry tracking
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


def get_valid_id_token(api_key: str) -> str:
    cached = load_tokens()
    now = int(time.time())
    if cached and CACHE_KEY in cached:
        try:
            stored = json.loads(cached[CACHE_KEY])
        except Exception:
            stored = None
        if stored and "idToken" in stored and "expiresAt" in stored:
            if stored["expiresAt"] - now > 60:
                return stored["idToken"]
            if "refreshToken" in stored:
                refreshed = refresh_id_token(stored["refreshToken"], api_key)
                return json.loads(refreshed[CACHE_KEY])["idToken"]
    setup_code = input("Paste your 1-hour Setup Code (Custom Token): ").strip()
    if not setup_code:
        fatal("Setup Code is required")
    exchanged = exchange_setup_code(setup_code, api_key)
    return json.loads(exchanged[CACHE_KEY])["idToken"]


def post_journal(backend_url: str, id_token: str) -> None:
    url = f"{backend_url}/apiRouter"
    payload = {"rawText": "Sandbox test entry: Python token exchange path."}
    headers = {"Authorization": f"Bearer {id_token}", "Content-Type": "application/json"}
    print(f"\n🚀 Posting journal to {url}")
    res = requests.post(url, headers=headers, json=payload, timeout=60)
    if not res.ok:
        fatal(f"Backend request failed: {res.status_code} {res.text}")
    print("✅ Backend response:")
    print(json.dumps(res.json(), indent=2))


def decode_expiry(id_token: str) -> int:
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
        return int(time.time()) + 3600
    return int(time.time()) + 3600


def main() -> None:
    api_key = os.environ.get("FIREBASE_API_KEY", "").strip()
    if not api_key:
        fatal("Set FIREBASE_API_KEY env var to your Firebase Web API Key")

    backend_url = os.environ.get("BACKEND_URL", DEFAULT_BACKEND_URL).rstrip("/")
    print("=== Self Statistics System: Custom Token Sandbox ===")
    print(f"Backend: {backend_url}")

    id_token = get_valid_id_token(api_key)
    post_journal(backend_url, id_token)


if __name__ == "__main__":
    main()