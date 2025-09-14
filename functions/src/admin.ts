import * as functions from "firebase-functions";
import * as firebaseAdmin from "firebase-admin";
import * as cors from "cors";
import * as express from "express";

// Create Express router for admin functions
const adminApp = express();
adminApp.use(cors({origin: true}));
adminApp.use(express.json());

// Helper function to verify Firebase Auth token and admin role
const verifyAdminToken = async (req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({error: "No authorization token provided"});
      return;
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
    
    // Check if user has admin role
    const userDoc = await firebaseAdmin.firestore().collection("users").doc(decodedToken.uid).get();
    if (!userDoc.exists) {
      res.status(404).json({error: "User not found"});
      return;
    }

    const userData = userDoc.data();
    if (userData?.role !== "admin") {
      res.status(403).json({error: "Admin access required"});
      return;
    }

    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("Admin auth verification error:", error);
    res.status(401).json({error: "Invalid authorization token"});
  }
};

// Analytics Overview
adminApp.get("/analytics", verifyAdminToken, async (req, res): Promise<void> => {
  try {
    const db = firebaseAdmin.firestore();
    
    const usersSnapshot = await db.collection("users").get();
    const totalUsers = usersSnapshot.size;
    
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newUsersSnapshot = await db.collection("users")
      .where("createdAt", ">=", oneWeekAgo)
      .get();
    const newUsersThisWeek = newUsersSnapshot.size;

    const sessionsSnapshot = await db.collection("pintSessions").get();
    const totalSessions = sessionsSnapshot.size;

    res.json({
      users: {
        total: totalUsers,
        newThisWeek: newUsersThisWeek,
      },
      sessions: {
        total: totalSessions,
      },
    });
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({error: "Failed to fetch analytics data"});
  }
});

// Export admin functions
export const adminApi = functions.https.onRequest(adminApp);

// Declare module augmentation for Express Request
declare global {
  namespace Express {
    interface Request {
      user?: firebaseAdmin.auth.DecodedIdToken;
    }
  }
}