import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as cors from "cors";
import * as express from "express";

// Initialize Firebase Admin SDK
admin.initializeApp();

// Export Firebase Functions
export * from "./payments";
export * from "./admin";

// Express app for handling HTTP functions with CORS
const app = express();
app.use(cors({origin: true}));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    message: "Pint Firebase Functions are running",
  });
});

// Export the Express app as an HTTP Cloud Function
export const api = functions.https.onRequest(app);