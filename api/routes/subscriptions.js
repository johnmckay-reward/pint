const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');
const { User } = require('../models');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// POST /subscriptions/create-checkout-session - Create a Stripe checkout session
router.post('/create-checkout-session', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.subscriptionTier === 'plus') {
      return res.status(400).json({ error: 'User is already a Pint Plus subscriber' });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Pint Plus Subscription',
              description: 'Premium features for the ultimate pub experience',
            },
            unit_amount: 999, // $9.99 in cents
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:8100'}/subscription/success`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:8100'}/subscription/cancel`,
      metadata: {
        userId: userId,
      },
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session', details: error.message });
  }
});

// POST /stripe-webhooks - Handle Stripe webhook events
router.post('/stripe-webhooks', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    if (endpointSecret) {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } else {
      // For development without webhook secret
      event = JSON.parse(req.body);
    }
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        
        if (session.metadata && session.metadata.userId) {
          const userId = session.metadata.userId;
          
          // Update user's subscription tier
          await User.update(
            { subscriptionTier: 'plus' },
            { where: { id: userId } }
          );
          
          console.log(`User ${userId} upgraded to Pint Plus`);
        }
        break;

      case 'customer.subscription.deleted':
        // Handle subscription cancellation
        const subscription = event.data.object;
        
        // For a full implementation, you'd need to store customer ID
        // and map it back to user ID. For simplicity, we'll log this.
        console.log('Subscription cancelled:', subscription.id);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).json({ error: 'Failed to handle webhook' });
  }
});

// GET /subscriptions/status - Get current user's subscription status
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'subscriptionTier']
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      subscriptionTier: user.subscriptionTier,
      isPremium: user.subscriptionTier === 'plus'
    });
  } catch (error) {
    console.error('Error getting subscription status:', error);
    res.status(500).json({ error: 'Failed to get subscription status' });
  }
});

module.exports = router;