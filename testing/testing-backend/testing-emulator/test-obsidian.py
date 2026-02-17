import sys
import time
import json
from typing import Any, Dict

import requests

BASE_URL = "http://127.0.0.1:5001/self-statistics-system-v2/us-central1"
ENDPOINT = f"{BASE_URL}/obsidianApi"
HEADERS = {"x-user-id": "richard_li", "Content-Type": "application/json"}


def submit_entry() -> Dict[str, Any]:
    payload = {"content": "This is a journal entry test.", "duration": 60}
    response = requests.post(ENDPOINT, json=payload, headers=HEADERS, timeout=60)
    if response.status_code != 202:
        raise RuntimeError(f"Submit failed: {response.status_code} {response.text}")
    return response.json()


def poll_job(job_id: str) -> Dict[str, Any]:
    for _ in range(60):
        time.sleep(1)
        response = requests.get(ENDPOINT, params={"jobId": job_id}, headers=HEADERS, timeout=60)
        data = response.json()
        status = data.get("status")
        if status == "completed":
            return data
    raise TimeoutError("Job did not complete in time")


def main() -> None:
    print(f"Testing Obsidian pipeline: {ENDPOINT}")
    submission = submit_entry()
    job_id = submission["jobId"]
    print(f"Job queued: {job_id}")

    result = poll_job(job_id)
    print("Job completed. Result:\n" + json.dumps(result.get("result"), indent=2))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:  # noqa: BLE001
        print(f"Test failed: {error}")
        sys.exit(1)
