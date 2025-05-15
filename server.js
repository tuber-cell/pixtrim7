import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import cors from 'cors'; // ✅ Import CORS
import webhookRoute from './routes/webhook.js';
import subscriptionRoute from './routes/create-subscription.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Enable CORS for your frontend domain
app.use(cors({
  origin: 'https://image-compressor-five-azure.vercel.app', // 👈 your frontend URL
  methods: ['GET', 'POST'],
  credentials: true,
}));

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
