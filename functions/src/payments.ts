import * as functions from "firebase-functions";
import * as firebaseAdmin from "firebase-admin";
import * as cors from "cors";
import * as express from "express";
import Stripe from "stripe";

// Initialize Stripe with secret key from environment
const stripe = new Stripe(functions.config().stripe?.secret_key || process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
});

// Create Express router for payment functions
const paymentsApp = express();
paymentsApp.use(cors({origin: true}));
paymentsApp.use(express.json());

// Helper function to verify Firebase Auth token
const verifyAuthToken = async (req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({error: "No authorization token provided"});
      return;
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("Auth verification error:", error);
    res.status(401).json({error: "Invalid authorization token"});
  }
};

// Create Stripe checkout session for subscription
paymentsApp.post("/create-checkout-session", verifyAuthToken, async (req, res): Promise<void> => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      res.status(401).json({error: "User ID not found"});
      return;
    }

    // Get user document from Firestore
    const userDoc = await firebaseAdmin.firestore().collection("users").doc(userId).get();
    if (!userDoc.exists) {
      res.status(404).json({error: "User not found"});
      return;
    }

    const userData = userDoc.data();
    if (userData?.subscriptionTier === "plus") {
      res.status(400).json({error: "User is already a Pint Plus subscriber"});
      return;
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Pint Plus Subscription",
              description: "Premium features for the ultimate pub experience",
            },
            unit_amount: 999, // $9.99 in cents
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${functions.config().app?.frontend_url || "http://localhost:8100"}/subscription/success`,
      cancel_url: `${functions.config().app?.frontend_url || "http://localhost:8100"}/subscription/cancel`,
      metadata: {
        userId: userId,
      },
    });

    res.json({sessionId: session.id, url: session.url});
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({error: "Failed to create checkout session"});
  }
});

// Handle Stripe webhook events
paymentsApp.post("/stripe-webhook", express.raw({type: "application/json"}), async (req, res): Promise<void> => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = functions.config().stripe?.webhook_secret || process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    if (endpointSecret) {
      event = stripe.webhooks.constructEvent(req.body, sig as string, endpointSecret);
    } else {
      // For development without webhook secret
      event = JSON.parse(req.body);
    }
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  try {
    // Handle the event
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object;

        if (session.metadata && session.metadata.userId) {
          const userId = session.metadata.userId;

          // Update user's subscription tier in Firestore
          await firebaseAdmin.firestore().collection("users").doc(userId).update({
            subscriptionTier: "plus",
            subscriptionUpdatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
          });

          console.log(`User ${userId} upgraded to Pint Plus`);
        }
        break;

      case "customer.subscription.deleted":
        // Handle subscription cancellation
        const subscription = event.data.object;
        console.log("Subscription cancelled:", subscription.id);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({received: true});
  } catch (error) {
    console.error("Error handling webhook:", error);
    res.status(500).json({error: "Failed to handle webhook"});
  }
});

// Get subscription status
paymentsApp.get("/subscription/status", verifyAuthToken, async (req, res): Promise<void> => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      res.status(401).json({error: "User ID not found"});
      return;
    }

    const userDoc = await firebaseAdmin.firestore().collection("users").doc(userId).get();
    if (!userDoc.exists) {
      res.status(404).json({error: "User not found"});
      return;
    }

    const userData = userDoc.data();
    res.json({
      subscriptionTier: userData?.subscriptionTier || "free",
      isPremium: userData?.subscriptionTier === "plus",
    });
  } catch (error) {
    console.error("Error getting subscription status:", error);
    res.status(500).json({error: "Failed to get subscription status"});
  }
});

// Export payment functions
export const payments = functions.https.onRequest(paymentsApp);

// Individual function exports for better organization
export const createCheckoutSession = functions.https.onCall(async (data, context) => {
  // Verify user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
  }

  try {
    const userId = context.auth.uid;
    
    // Get user document from Firestore
    const userDoc = await firebaseAdmin.firestore().collection("users").doc(userId).get();
    if (!userDoc.exists) {
      throw new functions.https.HttpsError("not-found", "User not found");
    }

    const userData = userDoc.data();
    if (userData?.subscriptionTier === "plus") {
      throw new functions.https.HttpsError("already-exists", "User is already a Pint Plus subscriber");
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Pint Plus Subscription",
              description: "Premium features for the ultimate pub experience",
            },
            unit_amount: 999, // $9.99 in cents
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${functions.config().app?.frontend_url || "http://localhost:8100"}/subscription/success`,
      cancel_url: `${functions.config().app?.frontend_url || "http://localhost:8100"}/subscription/cancel`,
      metadata: {
        userId: userId,
      },
    });

    return {sessionId: session.id, url: session.url};
  } catch (error) {
    console.error("Error creating checkout session:", error);
    throw new functions.https.HttpsError("internal", "Failed to create checkout session");
  }
});

// Declare module augmentation for Express Request
declare global {
  namespace Express {
    interface Request {
      user?: firebaseAdmin.auth.DecodedIdToken;
    }
  }
}