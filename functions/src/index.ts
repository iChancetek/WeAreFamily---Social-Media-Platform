import { setGlobalOptions } from "firebase-functions";

// Apply global options to all functions
setGlobalOptions({ maxInstances: 10 });