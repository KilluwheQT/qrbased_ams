# Quick Reference Guide

## 🚀 Start Here

### First Time Setup
```bash
cd qrbased
npm install
cp .env.local.example .env.local
# Edit .env.local with your Firebase config
npm run dev
```

### Firebase Setup Checklist
- [ ] Create Firebase project at firebase.google.com
- [ ] Enable Email/Password authentication
- [ ] Create Firestore database in test mode
- [ ] Copy config to .env.local
- [ ] Create collections: `students`, `events`, `attendance`
- [ ] Create admin user (manually in Firestore)

### Test Accounts
**Student Account:**
- Email: `student@test.com`
- Password: `password123`

**Admin Account:**
- Admin accounts are created either via Firestore (add an `admins/{uid}` doc) or using the included CLI `scripts/create-admin.js`.
- Recommended (env-based): set `FIREBASE_SERVICE_ACCOUNT`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` and run `npm run create-admin-env`.
- For ad-hoc creation, use the Admin Dashboard → "Create Admin Account (server)" with an `ADMIN_SECRET` set on the server.

---

## 📍 Key Routes

| Route | Purpose | Auth Required |
|-------|---------|---------------|
| `/` | Home page | No |
| `/auth/register` | Student signup | No |
| `/auth/login` | User login | No |
| `/dashboard/student` | QR scanner | ✓ Student |
| `/dashboard/admin` | Event management | ✓ Admin |
| `/events/create` | Create event | ✓ Admin |
| `/events/[eventId]` | Event details | ✓ Admin |
| `/attendance` | My attendance | ✓ Student |

---

## 🧩 Component Structure

### Page Hierarchy
```
Home (/)
├── Auth
│   ├── Register
│   └── Login
├── Student
│   ├── Dashboard (with QRScanner)
│   └── Attendance History
└── Admin
    ├── Dashboard
    ├── Event Create
    └── Event Details (with AttendanceList)
```

### Component Usage
```javascript
// Protected route
<ProtectedRoute requiredRole="admin">
  <YourComponent />
</ProtectedRoute>

// Use auth
const { user, userRole, logout } = useAuth();

// Use navbar
<Navbar /> // Auto in layout.js
```

---

## 🔑 Database Schema Quick View

### Students Collection
```javascript
{
  email: "student@example.com",
  fullName: "John Doe",
  studentId: "STU-001",
  course: "CS",
  phoneNumber: "123-456-7890",
  role: "student",
  createdAt: Timestamp,
  registrationStatus: "active"
}
```

### Events Collection
```javascript
{
  eventName: "CS101 Lecture",
  eventDate: "2024-12-23",
  eventTime: "10:00",
  location: "Room 101",
  status: "active",
  sessionToken: "abc123xyz",
  capacity: 50,
  createdBy: "admin_uid",
  startTime: Timestamp,
  endTime: Timestamp
}
```

### Attendance Collection
```javascript
{
  eventId: "event_uid",
  studentId: "student_uid",
  email: "student@example.com",
  studentName: "John Doe",
  scannedAt: Timestamp,
  status: "present",
  duration: 300
}
```

---

## 🎯 Common Tasks

### Create a Test Event
1. Login as admin
2. Go to `/events/create`
3. Fill form with:
   - Event Name: "Test Lecture"
   - Date: Today
   - Time: Now
   - Location: "Room 1"
4. Click Create
5. Download QR code

### Scan for Attendance
1. Login as student
2. Go to `/dashboard/student`
3. Click "Start Scanning"
4. Allow camera permission
5. Point camera at QR code
6. See "Attendance marked successfully!"

### View Attendance
1. As Admin: Go to `/events/[eventId]`
2. See real-time attendance list
3. Download CSV for records

### Export Attendance
1. View event details
2. Scroll to AttendanceList
3. Click "Download CSV"
4. File saves to Downloads

---

## 🧪 Testing Checklist

### Student Flow
- [ ] Register new account
- [ ] Login successfully
- [ ] See student dashboard
- [ ] Start QR scanner
- [ ] Test camera permissions
- [ ] Scan valid QR code
- [ ] See attendance confirmed
- [ ] View attendance history

### Admin Flow
- [ ] Login as admin
- [ ] See admin dashboard
- [ ] Create new event
- [ ] Get QR code
- [ ] View event details
- [ ] Monitor real-time attendance
- [ ] Export CSV

### Error Handling
- [ ] Try invalid QR code
- [ ] Try expired event
- [ ] Try duplicate scan
- [ ] Test form validation
- [ ] Test missing fields

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Can't login | Check Firebase config in .env.local |
| Camera not working | Check browser permissions, try Chrome |
| QR not scanning | Ensure good lighting, keep code centered |
| Firestore errors | Verify collections exist, check rules |
| Build fails | Run `npm install` again |
| Port 3000 in use | Kill process or use different port |

### Debug Mode
```javascript
// In components, add:
console.log('Event:', eventData);
console.log('User:', user);
console.log('Scanning:', scanning);
```

---

## 📦 Dependencies

Key npm packages:
- `next` - Framework
- `react` - UI library
- `firebase` - Backend
- `html5-qrcode` - QR scanning
- `qrcode` - QR generation
- `tailwindcss` - Styling

---

## 🚢 Deployment

### Deploy to Vercel
```bash
npm run build      # Test build
vercel             # Deploy
```

### Deploy Checklist
- [ ] Build passes locally (`npm run build`)
- [ ] .env.local vars added to Vercel
- [ ] Firebase rules configured
- [ ] Admin users created in Firestore
- [ ] Test registration on live site
- [ ] Test QR scanning on mobile

---

## 📚 Documentation Links

- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - What was built
- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - How to setup
- **[FEATURES.md](FEATURES.md)** - What features exist
- **[README.md](README.md)** - Project overview

---

## 🎓 Code Examples

### Get Current User
```javascript
import { useAuth } from '@/lib/authContext';

export default function MyComponent() {
  const { user, userRole } = useAuth();
  
  return <p>Hello {user?.email}</p>;
}
```

### Query Firestore
```javascript
import { db } from '@/lib/firebase';
import { collection, query, getDocs } from 'firebase/firestore';

const queryEvents = async () => {
  const q = query(collection(db, 'events'));
  const snapshots = await getDocs(q);
  snapshots.forEach(doc => console.log(doc.data()));
};
```

### Generate QR Code
```javascript
import { generateQRCode } from '@/lib/qrUtils';

const qrImage = await generateQRCode(`eventId:sessionToken`);
// qrImage is data URL, can be used in <img src={qrImage} />
```

---

## ⏱️ Performance Notes

- QR scanning: ~100-500ms
- Firestore queries: Real-time with listeners
- Static pages: Pre-rendered at build
- Dynamic pages: Server-rendered on demand

---

## 🔒 Security Notes

**Prototype Security:**
- Firebase Auth handles passwords
- Firestore rules restrict data access
- QR codes expire 1 hour after event
- Students can't modify others' records

**Production Requirements:**
- Implement rate limiting
- Add fraud detection
- Use HTTPS everywhere
- Audit logging
- Advanced RBAC

---

## 📞 Support

For issues:
1. Check [SETUP_GUIDE.md troubleshooting](SETUP_GUIDE.md#-troubleshooting)
2. Review error messages in browser console
3. Check Firebase console for data issues
4. Verify .env.local configuration

---

**Last Updated**: December 23, 2024  
**Version**: 0.1.0  
**Status**: Ready to Use ✅
