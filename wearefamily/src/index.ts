import { setGlobalOptions } from "firebase-functions";
import { onRequest } from "firebase-functions/https";

// Apply global options to all functions
setGlobalOptions({ maxInstances: 10 });

// Simple HTTP test function
export const helloWorld = onRequest((req, res) => {
    res.status(200).send("Hello from Firebase!");
});