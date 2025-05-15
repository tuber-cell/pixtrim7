import express from 'express';
import Razorpay from 'razorpay';
import dotenv from 'dotenv';
import admin from '../lib/firebaseAdmin.js';

dotenv.config(); // ✅ load env variables

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

router.post('/', async (req, res) => {
  const authHeader = req.headers.authorization || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!idToken) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    const { uid: userId, email } = decoded;

    // ✅ Fetch the plan details
    const plan = await razorpay.plans.fetch('plan_QUgLogdVgnZKjk');

    // ✅ Create subscription
    const subscription = await razorpay.subscriptions.create({
      plan_id: plan.id,
      total_count: 12,
      customer_notify: 1,
      notes: {
        firebaseUid: userId,
        email: email,
      },
    });

    // ✅ Save subscription details in Firestore
    await admin.firestore().collection('subscriptions').doc(userId).set({
      subscriptionId: subscription.id,
      email: email,
      startAt: subscription.start_at * 1000, // Unix to JS timestamp
      endAt: subscription.end_at * 1000,
      status: subscription.status,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).json({
      subscriptionId: subscription.id,
      key: process.env.RAZORPAY_KEY_ID,
      userEmail: email,
      userName: decoded.name || 'Customer',
      amount: plan.item.amount,
      currency: plan.item.currency,
    });

  } catch (err) {
    console.error('Subscription creation failed:', err);
    res.status(500).json({
      error: 'Subscription creation failed',
      details: err?.description || err.message || 'Unknown error',
    });
  }
});

export default router;