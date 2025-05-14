import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import webhookRoute from './routes/webhook.js';
import subscriptionRoute from './routes/create-subscription.js';

dotenv.config();

console.log('RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID);
console.log('RAZORPAY_KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET);

const app = express();
const PORT = process.env.PORT || 3000;

// Parse raw body for webhook validation
app.use('/webhook', bodyParser.raw({ type: 'application/json' }));
// Parse JSON body for other routes
app.use(express.json());

// Routes
app.use('/webhook', webhookRoute);
app.use('/create-subscription', subscriptionRoute);

// Home route
app.get('/', (req, res) => {
  res.send('Backend is running 🚀');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
