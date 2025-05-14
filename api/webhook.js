const crypto = require('crypto');
const admin = require('../firebaseAdmin.js');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers['x-razorpay-signature'];
  const rawBody = JSON.stringify(req.body);

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  if (signature !== expectedSignature) {
    return res.status(400).json({ error: 'Invalid signature' });
  }

  const event = req.body.event;

  try {
    if (event === 'payment.captured') {
      const paymentData = req.body.payload.payment.entity;
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
    } else if (event === 'payment.failed') {
      console.warn('❌ Payment failed:', req.body.payload.payment.entity);
    } else {
      console.log('⚠️ Unhandled event type:', event);
    }

    return res.status(200).json({ status: 'Webhook received' });
  } catch (err) {
    console.error('Webhook handler error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
