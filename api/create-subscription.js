import Razorpay from 'razorpay';
import admin from '../firebaseAdmin.js'; // this uses your Firebase Admin SDK

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const authHeader = req.headers.authorization || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!idToken) return res.status(401).json({ error: 'Unauthorized: No token provided' });

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    const userId = decoded.uid;
    const email = decoded.email;

    const subscription = await razorpay.subscriptions.create({
      plan_id: 'plan_QUgLogdVgnZKjk', // Use your actual plan
      customer_notify: 1,
      total_count: 12,
      notes: {
        firebaseUid: userId,
        email: email,
      },
    });

    return res.status(200).json({ subscriptionId: subscription.id });
  } catch (err) {
    console.error('Subscription error:', err);
    return res.status(500).json({ error: 'Failed to create subscription' });
  }
}
