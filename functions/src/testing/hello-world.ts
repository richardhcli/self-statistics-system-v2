import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

export const helloWorld = onRequest((req, res) => {
  logger.info("Hello logs!", {structuredData: true});
  
  //response.send("Hello from Firebase!")
  res.json({
    message: "Hello World!",
    timestamp: new Date().toISOString(),
    environment: process.env.FUNCTIONS_EMULATOR ? "emulator" : "production"
  });
});
