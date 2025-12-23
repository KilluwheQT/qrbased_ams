# QR Code–Based Attendance System - Getting Started Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- Firebase project (free tier available at [firebase.google.com](https://firebase.google.com))
- A modern web browser with camera support

### Step 1: Clone & Install Dependencies

```bash
# Navigate to the project directory
cd qrbased

# Install dependencies
npm install
```

### Step 2: Setup Firebase

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication** (Email/Password method)
3. Create a **Cloud Firestore** database in test mode
4. Copy your Firebase config from Project Settings
5. Create a `.env.local` file in the root directory and add your Firebase credentials:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_DATABASE_URL=your_database_url
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

See `.env.local.example` for reference.

### Step 3: Setup Firestore Database

Create the following collections in Cloud Firestore:

#### 1. **students** Collection
```javascript
{
  email: "student@example.com",
  fullName: "John Doe",
  studentId: "STU-2024-001",
  course: "Computer Science",
  phoneNumber: "+1234567890",
  role: "student",
  createdAt: timestamp,
  updatedAt: timestamp,
  registrationStatus: "active"
}
```

#### 2. **events** Collection
```javascript
{
  eventName: "CS101 Lecture",
  eventDate: "2024-12-23",
  eventTime: "10:00",
  location: "Room 101",
  description: "Introduction to Computer Science",
  capacity: 50,
  category: "Lecture",
  createdBy: "admin_uid",
  createdAt: timestamp,
  updatedAt: timestamp,
  status: "active", // "active", "inactive", or "cancelled"
  sessionToken: "unique_token_here",
  startTime: timestamp,
  endTime: timestamp,
  qrCodeData: "eventId:sessionToken"
}
```

#### 3. **attendance** Collection
```javascript
{
  eventId: "event_id",
  studentId: "student_uid",
  email: "student@example.com",
  studentName: "John Doe",
  scannedAt: timestamp,
  checkInTime: timestamp,
  deviceInfo: "user_agent_string",
  status: "present", // "present" or "late"
  duration: 120 // seconds from event start to scan
}
```

### Step 4: Setup Firestore Security Rules

In Cloud Firestore, update the security rules to:

```firestore
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Students can read/write their own document
    match /students/{userId} {
      allow read: if request.auth.uid == userId;
      allow write: if request.auth.uid == userId;
    }
    
    // Anyone authenticated can read events
    match /events/{eventId} {
      allow read: if request.auth != null;
      allow create, update: if request.auth != null && 
        request.auth.uid == resource.data.createdBy;
      allow delete: if request.auth != null && 
        request.auth.uid == resource.data.createdBy;
    }
    
    // Anyone authenticated can read/write attendance
    match /attendance/{docId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
    }
  }
}
```

### Step 5: Create Admin Accounts

Manually create admin documents for admin users:

1. Create a user via registration
2. Go to Firebase Console > Firestore > Create a new `admins` collection
3. Add a document with the same user UID and role "admin"

Or modify `authContext.js` to auto-assign admin role based on email:

```javascript
const isAdmin = newUser.email.endsWith('@admin.example.com');
```

Server / CLI admin creation (recommended)

- A convenience CLI script is included at `scripts/create-admin.js` that will create or update a user, set the admin custom claim, and add an `admins/{uid}` document in Firestore.
- You can provide credentials directly:

  node scripts/create-admin.js --email=admin@example.com --password=secret --displayName="Admin Name"

- Or set environment variables (recommended for CI / local dev):

  1. Copy `.env.example` to `.env` and set `FIREBASE_SERVICE_ACCOUNT` (JSON) or drop `serviceAccountKey.json` in the project root.
  2. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD`.
  3. Run:

     npm run create-admin-env

- For server-side admin creation via the app UI, the `/api/admin/create` route supports an `ADMIN_SECRET` env var. Set `ADMIN_SECRET` to a shared secret, then include `secret` in the request body when calling the API (or call it while authenticated as an existing admin).


```javascript
const isAdmin = newUser.email.endsWith('@admin.example.com');
```

### Step 6: Run the Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

### Troubleshooting: Authentication errors

If you see an error like `Firebase: Error (auth/invalid-credential)` during login:

- Ensure **Email/Password** sign-in is enabled in the Firebase Console: Authentication → Sign-in method → enable Email/Password.
- Verify the web Firebase config in `lib/firebase.js` (apiKey, authDomain, projectId) matches your Firebase project.
- If you have multiple projects, make sure the service account (used for admin operations) and the client config point to the same project.
- Inspect browser console / network tab for Identity Toolkit responses (requests to `identitytoolkit.googleapis.com`) to see details.

### Firestore: Missing composite index

If you see an error saying "The query requires an index" when viewing attendance or running reports, Firestore requires a composite index for certain compound queries (e.g., filtering by `eventId` and ordering by `scannedAt`).

To fix:
- Click the link included in the error message to create the index automatically in the Firebase Console.
- Or deploy the index with the Firebase CLI using the `firestore.indexes.json` file included at project root, e.g.:

```bash
# Install firebase-tools if you don't have it
npm install -g firebase-tools
# Authenticate and deploy only indexes
firebase login
firebase deploy --only firestore:indexes
```

If problems persist, paste the non-secret console error (code and message) and I’ll help debug further.

## 📋 User Flows

### Student Flow
1. **Register** → `/auth/register`
   - Enter full name, email, student ID, and password
   - Automatically creates profile in Firestore

2. **Login** → `/auth/login`
   - Sign in with email and password

3. **Scan QR Code** → `/dashboard/student`
   - Click "Start Scanning"
   - Grant camera permission
   - Point camera at QR code
   - Attendance recorded automatically

4. **View Attendance** → `/attendance`
   - See all scanned events
   - View timestamps and status (present/late)

### Admin Flow
1. **Create Event** → `/events/create`
   - Fill in event details
   - Automatic QR code generation
   - Event stored in Firestore

2. **View Event Details** → `/events/[eventId]`
   - See event info
   - Download QR code as image
   - Monitor real-time attendance

3. **Monitor Attendance** → Via event details page
   - Live attendance list
   - Statistics (total, present, late, rate)
   - Export to CSV

## 🔧 Key Features Implemented

✅ **Student Registration & Authentication**
- Email/password signup with Firebase Auth
- Validation and duplicate prevention

✅ **Event Management**
- Create events with automatic QR code generation
- Event status management (active/inactive/cancelled)
- Display event details

✅ **QR Code Scanning**
- Camera-based scanning with html5-qrcode
- Session token validation
- Duplicate prevention (3-second grace period)

✅ **Attendance Logging**
- Automatic recording after QR scan
- Timestamp and duration logging
- Late detection based on event start time

✅ **Real-time Monitoring**
- Live attendance lists with Firestore listeners
- Basic statistics (total, present, late, rate)
- CSV export functionality

## 📱 Browser Support

Works on:
- Chrome/Chromium (desktop & mobile)
- Firefox (desktop & mobile)
- Safari (requires https in production)
- Edge

## 🚢 Deployment to Vercel

```bash
# Build the project
npm run build

# Push to GitHub and connect to Vercel
# Or use Vercel CLI:
npm install -g vercel
vercel
```

## 🐛 Troubleshooting

### Camera not working
- Check browser permissions
- Ensure HTTPS in production
- Try a different browser

### QR code not scanning
- Ensure good lighting
- Keep QR code steady in frame
- Check event is still active

### Firestore errors
- Verify Firebase config in `.env.local`
- Check Firestore security rules
- Ensure collections exist

### Authentication errors
- Clear browser cache/cookies
- Check Firebase Authentication is enabled
- Verify .env.local variables

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [html5-qrcode](https://github.com/mebjas/html5-qrcode)

## 📝 Notes

- This is a **prototype version** - not for production use without additional security measures
- QR codes expire 1 hour after event end time
- Students can only scan once per event
- Admin role is manually assigned (see step 5 above)

---

**Version:** 0.1.0  
**Last Updated:** December 2024
