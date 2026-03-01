import fs from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import readline from "node:readline";
import {SelfStatsClient} from "../../../shared/plugin-sdk/src/client";

// Location-local token cache to avoid polluting repo root
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cacheFile = path.join(__dirname, ".selfstats-tokens.json");
const projectId = "self-statistics-system-v2";
const cacheKey = `selfstats:${projectId}:tokens`;

const storage = {
  async getItem(key: string) {
    try {
      const text = await fs.readFile(cacheFile, "utf8");
      const data = JSON.parse(text);
      return typeof data[key] === "string" ? data[key] : null;
    } catch {
      return null;
    }
  },
  async setItem(key: string, value: string) {
    let data: Record<string, string> = {};
    try {
      data = JSON.parse(await fs.readFile(cacheFile, "utf8"));
    } catch {
      // start fresh
    }
    data[key] = value;
    await fs.writeFile(cacheFile, JSON.stringify(data, null, 2), "utf8");
  },
  async removeItem(key: string) {
    try {
      const text = await fs.readFile(cacheFile, "utf8");
      const data = JSON.parse(text);
      delete data[key];
      await fs.writeFile(cacheFile, JSON.stringify(data, null, 2), "utf8");
    } catch {
      // ignore
    }
  },
};

async function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({input: process.stdin, output: process.stdout});
  return new Promise(resolve => rl.question(question, answer => { rl.close(); resolve(answer.trim()); }));
}

async function main() {
  const apiKey = process.env.FIREBASE_API_KEY ?? "";
  if (!apiKey) throw new Error("Set FIREBASE_API_KEY env variable");

  const backendUrl = process.env.BACKEND_URL ?? "https://us-central1-self-statistics-system-v2.cloudfunctions.net";

  const client = new SelfStatsClient({
    projectId,
    apiKey,
    backendUrl,
    storage,
  });

  const hasTokens = await storage.getItem(cacheKey);
  if (!hasTokens) {
    const customToken = process.env.CUSTOM_TOKEN || (await prompt("Enter setup code (custom token): "));
    await client.exchangeCustomToken(customToken);
    console.log("Exchanged and cached tokens.");
  }

  const result = await client.submitObsidianNote("This is a journal entry test.", {duration: 60});
  console.log("Obsidian webhook result:\n" + JSON.stringify(result, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
