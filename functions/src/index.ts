import { setGlobalOptions } from "firebase-functions";
import { onRequest } from "firebase-functions/https";
import * as logger from "firebase-functions/logger";

setGlobalOptions({ maxInstances: 10 });

export const helloWorld = onRequest((req, res) => {
    logger.info("Hello logs!", { structuredData: true });
    res.status(200).send("Hello from Firebase!");
});