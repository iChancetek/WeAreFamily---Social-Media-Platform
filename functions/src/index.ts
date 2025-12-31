/**
 * Firebase Functions entry point
 * https://firebase.google.com/docs/functions
 */

import { setGlobalOptions } from "firebase-functions";
import { onRequest } from "firebase-functions/https";
import * as logger from "firebase-functions/logger";

// Apply global options to all functions
setGlobalOptions({ maxInstances: 10 });

// Example HTTP function (required so imports are used)
export const helloWorld = onRequest((req, res) => {
    logger.info("Hello logs!", { structuredData: true });
    res.status(200).send("Hello from Firebase!");
});