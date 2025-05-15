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

    // ✅ Fetch plan details
    const plan = await razorpay.plans.fetch('plan_QUgLogdVgnZKjk');

    // ✅ Create customer
    const customer = await razorpay.customers.create({
      name: decoded.name || 'Customer',
      email,
      notes: { firebaseUid: userId },
    });

    // ✅ Create subscription
    const subscription = await razorpay.subscriptions.create({
      plan_id: plan.id,
      customer_notify: 1,
      total_count: 12,
      customer: customer.id,
      notes: {
        firebaseUid: userId,
        email: email,
      },
    });

    // ✅ Send response
    res.status(200).json({
      subscriptionId: subscription.id,
      key: process.env.RAZORPAY_KEY_ID,
      userEmail: email,
      userName: decoded.name || 'Customer',
      amount: plan.item.amount,     // For frontend display (e.g. 49900)
      currency: plan.item.currency, // INR
    });

  } catch (err) {
    console.error('Subscription creation failed:', err);
    res.status(500).json({ error: 'Subscription creation failed', details: err.message });
  }
});

export default router;
