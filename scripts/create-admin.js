#!/usr/bin/env node

// Load .env automatically so `npm run create-admin-env` works without manual exports
try {
  require('dotenv').config();
} catch (e) {
  // dotenv optional — helpful message will appear later if required
}

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  args.forEach(arg => {
    if (arg.startsWith('--')) {
      const [k, v] = arg.slice(2).split('=');
      out[k] = v === undefined ? true : v;
    }
  });
  return out;
}

async function main() {
  const args = parseArgs();
  const email = args.email || process.env.ADMIN_EMAIL;
  const password = args.password || process.env.ADMIN_PASSWORD;
  const displayName = args.displayName || args.display_name || args.name;
  const uidOverride = args.uid || null;

  if (!email || !password) {
    console.error('Usage: node scripts/create-admin.js --email=you@example.com --password=secret [--displayName="Name"] [--uid=UID]');
    console.error('Or set ADMIN_EMAIL and ADMIN_PASSWORD env vars and run `npm run create-admin-env`');
    console.error('Make sure FIREBASE_SERVICE_ACCOUNT env var (JSON string) or serviceAccountKey.json exists');
    process.exit(1);
  }

  // Load service account key
  let serviceAccount = null;
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (e) {
      console.error('FIREBASE_SERVICE_ACCOUNT is set but not valid JSON');
      process.exit(1);
    }
  } else {
    const fallback = path.resolve(process.cwd(), 'serviceAccountKey.json');
    if (fs.existsSync(fallback)) {
      serviceAccount = JSON.parse(fs.readFileSync(fallback, 'utf8'));
    }
  }

  if (!serviceAccount) {
    console.error('No service account found. Set FIREBASE_SERVICE_ACCOUNT (JSON) or place serviceAccountKey.json in project root.');
    process.exit(1);
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  try {
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
      console.log(`User already exists: uid=${userRecord.uid}`);
    } catch (err) {
      // user doesn't exist
    }

    if (!userRecord) {
      const createOpts = { email, password };
      if (displayName) createOpts.displayName = displayName;
      if (uidOverride) createOpts.uid = uidOverride;
      userRecord = await admin.auth().createUser(createOpts);
      console.log(`Created user: uid=${userRecord.uid}`);
    } else {
      const updateOpts = { password };
      if (displayName) updateOpts.displayName = displayName;
      await admin.auth().updateUser(userRecord.uid, updateOpts);
      console.log(`Updated user password/displayName for uid=${userRecord.uid}`);
    }

    await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true });
    console.log('Set custom claim { admin: true }');

    const db = admin.firestore();
    await db.doc(`admins/${userRecord.uid}`).set({
      email,
      displayName: userRecord.displayName || displayName || null,
      createdBy: process.env.CREATOR || 'cli',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log('Created admin document in Firestore');

    // Optionally mark student role if collection exists
    try {
      await db.doc(`students/${userRecord.uid}`).set({ role: 'admin' }, { merge: true });
      console.log(`Marked students/${userRecord.uid} role as admin (if student doc existed)`);
    } catch (e) {
      // ignore
    }

    console.log(`Done. Admin UID: ${userRecord.uid}`);
    process.exit(0);
  } catch (err) {
    console.error('Error creating/updating admin user:', err);
    process.exit(2);
  }
}

main();
