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

    const subscription = await razorpay.subscriptions.create({
      plan_id: 'plan_QUgLogdVgnZKjk',
      customer_notify: 1,
      total_count: 12,
      notes: { firebaseUid: userId, email },
    });

    res.status(200).json({ subscriptionId: subscription.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Subscription creation failed' });
  }
});

export default router;
