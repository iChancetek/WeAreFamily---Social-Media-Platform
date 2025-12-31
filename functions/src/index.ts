/**
 * Firebase Functions (Gen 2)
 * https://firebase.google.com/docs/functions
 */

import { setGlobalOptions } from "firebase-functions/v2";
import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

// Apply global options to all Gen 2 functions
setGlobalOptions({ maxInstances: 10 });

// Example HTTP function
export const helloWorld = onRequest((req, res) => {
    logger.info("Hello logs!", { structuredData: true });
    res.send("Hello from Firebase!");
});