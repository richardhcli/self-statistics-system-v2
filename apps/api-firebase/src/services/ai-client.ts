import type {TopologyResponse} from "./genai-topology";

const buildGatewayUrl = (): string => {
  const projectId = process.env.GCLOUD_PROJECT || "self-statistics-system-v2";
  const emulatorHost = process.env.FUNCTIONS_EMULATOR || process.env.FIREBASE_EMULATOR_HOST;

  if (emulatorHost) {
    return `http://127.0.0.1:5001/${projectId}/us-central1/aiGateway`;
  }

  return `https://us-central1-${projectId}.cloudfunctions.net/aiGateway`;
};

export const analyzeJournal = async (
  payload: {content: string; duration?: number},
): Promise<TopologyResponse> => {
  const fetchFn: (input: string, init?: Record<string, unknown>) => Promise<any> =
    (globalThis as unknown as {fetch?: (input: string, init?: Record<string, unknown>) => Promise<any>}).fetch ??
    (() => {
      throw new Error("Fetch API not available in this runtime");
    });

  const response = await fetchFn(buildGatewayUrl(), {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`AI gateway error ${response.status}: ${text}`);
  }

  const data = (await response.json()) as TopologyResponse;
  return data;
};
