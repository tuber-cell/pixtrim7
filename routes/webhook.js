import express from 'express';
import crypto from 'crypto';
import admin from '../lib/firebaseAdmin.js';

const router = express.Router();

router.post('/', async (req, res) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers['x-razorpay-signature'];
  const rawBody = req.body;

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  if (signature !== expectedSignature) {
    return res.status(400).json({ error: 'Invalid signature' });
  }

  const parsed = JSON.parse(rawBody.toString());
  const event = parsed.event;

  try {
    if (event === 'payment.captured') {
      const paymentData = parsed.payload.payment.entity;
      const firebaseUid = paymentData.notes?.firebaseUid;

      if (firebaseUid) {
        await admin.firestore().collection('users').doc(firebaseUid).set(
          {
            isSubscribed: true,
            subscriptionStatus: 'active',
            lastPaymentId: paymentData.id,
            paymentAmount: paymentData.amount / 100,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }

      console.log('✅ Payment captured and Firebase updated');
    }

    res.status(200).json({ status: 'Webhook received' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Webhook error' });
  }
});

export default router;
