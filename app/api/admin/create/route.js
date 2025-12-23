import admin from 'firebase-admin';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Initialize Firebase Admin SDK once
if (!admin.apps.length) {
  // Try FIREBASE_SERVICE_ACCOUNT env var (JSON) first
  let serviceAccount = null;
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (e) {
      console.error('FIREBASE_SERVICE_ACCOUNT is set but not valid JSON');
    }
  }

  // Fallback: try local serviceAccountKey.json (useful for local development)
  if (!serviceAccount) {
    try {
      const filePath = path.resolve(process.cwd(), 'serviceAccountKey.json');
      if (fs.existsSync(filePath)) {
        serviceAccount = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      }
    } catch (e) {
      // ignore
    }
  }

  if (!serviceAccount) {
    console.error('No Firebase service account found. Set FIREBASE_SERVICE_ACCOUNT env var or add serviceAccountKey.json to project root');
  } else {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
}

export async function POST(req) {
  try {
    if (!admin.apps.length) {
      return NextResponse.json({ error: 'Server not configured with Firebase service account.' }, { status: 500 });
    }

    const body = await req.json();
    const { secret, email, password } = body || {};

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing email or password' }, { status: 400 });
    }

    // Authorization: either via existing admin ID token or ADMIN_SECRET
    let authorized = false;

    const authHeader = req.headers.get('authorization') || '';
    if (authHeader.startsWith('Bearer ')) {
      const idToken = authHeader.split(' ')[1];
      try {
        const decoded = await admin.auth().verifyIdToken(idToken);
        // Check admins collection
        const adminDoc = await admin.firestore().doc(`admins/${decoded.uid}`).get();
        if (adminDoc.exists) {
          authorized = true;
        }
      } catch (e) {
        console.warn('ID token verification failed', e?.message || e);
      }
    }

    if (!authorized && secret && process.env.ADMIN_SECRET && secret === process.env.ADMIN_SECRET) {
      authorized = true;
    }

    // Helpful error when caller provides a secret but server has no ADMIN_SECRET configured
    if (!authorized && secret && !process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Server not configured to accept secret-based admin creation (ADMIN_SECRET missing)' }, { status: 500 });
    }

    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // If user exists, update password; otherwise create
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
    } catch (err) {
      // user doesn't exist
    }

    if (!userRecord) {
      userRecord = await admin.auth().createUser({ email, password });
    } else {
      // Update password to provided one
      await admin.auth().updateUser(userRecord.uid, { password });
    }

    // Set custom claim and create admin doc
    await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true });

    await admin.firestore().doc(`admins/${userRecord.uid}`).set({
      email,
      createdBy: 'system',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Try to mark student's role (if present)
    try {
      await admin.firestore().doc(`students/${userRecord.uid}`).set({ role: 'admin' }, { merge: true });
    } catch (e) {
      // ignore
    }

    return NextResponse.json({ ok: true, uid: userRecord.uid });
  } catch (err) {
    console.error('Create admin error', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
