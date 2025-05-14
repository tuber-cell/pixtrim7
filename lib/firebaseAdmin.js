import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM __dirname workaround
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the JSON file (with special characters)
const serviceAccountPath = path.join(__dirname, '../serviceAccountKey (2).json');

// Read and parse the JSON file
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export default admin;
