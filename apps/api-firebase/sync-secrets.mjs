/**
 * Script to automatically update firebase function secrets from the .env file during deployment.
 * This ensures secrets are always up to date
 * 
 * Note: this script will error if Secret Manager API is not enabled in your firebase project. 
 *  Solution: enable secret manager: https://console.developers.google.com/apis/api/secretmanager.googleapis.com/overview?project=self-statistics-system-v2
 */
import fs from 'fs';
import { execSync } from 'child_process';

// 1. Read and parse the .env file manually
const envFile = fs.readFileSync('.env', 'utf8');

// Note: Ensure your .env file uses GOOGLE_AI_API_KEY to match this script
const keyLine = envFile.split('\n').find(line => line.startsWith('GOOGLE_AI_API_KEY='));

if (!keyLine) {
  console.error("Deployment Failed: GOOGLE_AI_API_KEY is missing from the .env file.");
  process.exit(1);
}

// Extract the actual key value
const apiKey = keyLine.split('=')[1].trim();

console.log("Syncing GOOGLE_AI_API_KEY to Firebase Secret Manager...");

try {
  // 2. Write the key to a temporary file
  fs.writeFileSync('.temp-secret', apiKey);
  
  // 3. Use Firebase CLI's --data-file flag to push the secret securely.
  // Using npx ensures it triggers the Firebase CLI installed in your node_modules.
  execSync('npx firebase functions:secrets:set GOOGLE_AI_API_KEY --data-file .temp-secret', {
    stdio: 'inherit' // This allows the Firebase CLI output to print to your terminal
  });
  
  console.log("✅ Secret synced successfully.");
} catch (error) {
  console.error("❌ Failed to sync secret. Ensure you are authenticated via 'firebase login'.");
  process.exit(1);
} finally {
  // 4. Always clean up the temporary file, even if the command fails
  if (fs.existsSync('.temp-secret')) {
    fs.unlinkSync('.temp-secret');
  }
}