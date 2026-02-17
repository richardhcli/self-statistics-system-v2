const BASE_URL = "http://127.0.0.1:5001/self-statistics-system-v2/us-central1";
const ENDPOINT = `${BASE_URL}/obsidianApi`;
const HEADERS = {"x-user-id": "richard_li", "Content-Type": "application/json"};

//tsx festing: 
// npx tsx testing/testing-backend/testing-emulator/test-obsidian.ts

type FetchLike = (input: string, init?: Record<string, unknown>) => Promise<any>;
const fetchFn: FetchLike = (globalThis as unknown as {fetch?: FetchLike}).fetch ?? (() => {
  throw new Error("Fetch API not available in this runtime");
});

const submitEntry = async () => {
  const payload = {content: "Architecture test.", duration: 60};
  const response = await fetchFn(ENDPOINT, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify(payload),
  });

  if (response.status !== 202) {
    const text = await response.text();
    throw new Error(`Submit failed: ${response.status} ${text}`);
  }

  return (await response.json()) as {jobId: string};
};

const pollJob = async (jobId: string) => {
  for (let i = 0; i < 10; i += 1) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const response = await fetchFn(`${ENDPOINT}?jobId=${encodeURIComponent(jobId)}`, {
      method: "GET",
      headers: HEADERS,
    });
    const data = (await response.json()) as {status?: string; result?: unknown};

    if (data.status === "completed") {
      return data;
    }
  }

  throw new Error("Job did not complete in time");
};

(async () => {
  try {
    console.log(`Testing Obsidian pipeline: ${ENDPOINT}`);
    const submission = await submitEntry();
    console.log(`Job queued: ${submission.jobId}`);

    const job = await pollJob(submission.jobId);
    console.log("Job completed. Result:\n" + JSON.stringify(job.result, null, 2));
  } catch (error) {
    console.error(`Test failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
})();
