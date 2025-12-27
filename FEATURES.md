# QR Code–Based Attendance System - Feature List (Prototype Version)

## Overview
This is a **prototype-level** QR Code–Based Attendance System designed for educational institutions. The system enables administrators to create events, generate QR codes, and allow students to scan these codes to mark attendance. Built with Next.js and Firebase, this prototype focuses on core functionality and ease of implementation.

---

## 1. Student Registration

### Purpose
Enable students to create accounts and register in the system to participate in attendance tracking.

### Features

#### Student Account Creation
- Students can self-register with email and password
- Registration form with input validation
- Email must be unique in the database
- Password strength requirements (minimum 6 characters)

#### Required Student Information Fields
- **Email** (unique identifier)
- **Full Name** (first and last name)
- **Student ID** (institutional ID)
- **Course/Class** (optional field for organization)
- **Phone Number** (optional field)

#### Firebase Authentication Usage
- Uses Firebase Authentication for email/password signup
- Automatic user UID generation on successful registration
- Secure password storage (handled by Firebase)
- Session management via Firebase Auth tokens

#### Firestore Data Structure for Students
```
Collection: students
Document ID: {uid}
Fields:
  - email: string
  - fullName: string
  - studentId: string
  - course: string
  - phoneNumber: string
  - createdAt: timestamp
  - updatedAt: timestamp
  - registrationStatus: "active" | "inactive"
```

#### Validation & Duplicate Prevention
- Client-side email format validation
- Server-side duplicate email check before creating document
- Student ID uniqueness validation
- Password confirmation field
- Error messages for existing accounts
- Toast/notification feedback for successful registration

---

## 2. Event Management

### Purpose
Allow administrators/facilitators to create and manage attendance events with automatic QR code generation.

### Features

#### Admin/Facilitator Event Creation
- Dedicated admin dashboard for event creation
- Admin authentication required (email-based role assignment)
- Simple form-based event creation interface
- Ability to edit events before they go live

#### Event Details
- **Event Name** (required)
- **Event Date** (required, date picker)
- **Event Time** (required, time picker)
- **Location** (required, text field)
- **Description** (optional, text area)
- **Capacity** (optional, expected number of attendees)
- **Event Category** (e.g., Class, Workshop, Seminar)

#### Automatic QR Code Generation
- QR code generated automatically when event is created
- QR code encodes event ID and unique session token
- QR code is unique per event instance
- QR codes expire after event end time + buffer period (e.g., 1 hour)
- QR code can be displayed on screen or printed

#### Event Status Management
- **Active**: Event is currently running (accepts attendance scans)
- **Inactive**: Event has ended or not yet started (no scans accepted)
- **Cancelled**: Event cancelled (rejected scans with notification)
- Admin can manually toggle event status
- System automatically deactivates event after scheduled end time + grace period

#### Firestore Collections and Structure
```
Collection: events
Document ID: {eventId}
Fields:
  - eventName: string
  - eventDate: date
  - eventTime: time
  - location: string
  - description: string
  - capacity: number
  - category: string
  - createdBy: string (admin uid)
  - createdAt: timestamp
  - updatedAt: timestamp
  - status: "active" | "inactive" | "cancelled"
  - qrCodeData: string (encoded QR content)
  - qrCodeImage: string (QR code as data URL or URL)
  - sessionToken: string (unique token for this event)
  - startTime: timestamp
  - endTime: timestamp
```

---

## 3. QR Code Scanning

### Purpose
Enable students to scan event QR codes using their device camera to mark attendance.

### Features

#### Camera-Based QR Scanning
- Browser-based camera access using WebRTC/getUserMedia API
- HTML5 video element for live camera feed
- QR code detection library (e.g., `jsQR` or `ZXing`)
- Mobile and desktop browser support
- User-friendly camera permission requests
- Fallback option: manual QR code input field

#### Validation of QR Code Content
- Verify QR code format and structure
- Extract event ID and session token from QR data
- Confirm event exists in Firestore
- Validate session token matches event record
- Reject malformed or outdated QR codes

#### Linking Scanned QR to Event and Student
- Match scanned event ID to active event
- Link student UID (from authenticated session) to event
- Record scanner timestamp at moment of scan
- Store device/user-agent information for debugging

#### Handling Invalid or Expired QR Codes
- **Invalid QR**: Format doesn't match expected structure
  - Display: "Invalid QR code. Please try again."
- **Expired QR**: Event end time + buffer period has passed
  - Display: "This event has ended. Scanning is no longer available."
- **Non-existent Event**: Event ID not found in database
  - Display: "Event not found. Please contact the administrator."
- **Inactive Event**: Event status is "inactive" or "cancelled"
  - Display: "This event is not currently accepting attendance."

---

## 4. Attendance Logging

### Purpose
Automatically record attendance when a valid QR code is scanned by a student.

### Features

#### Automatic Attendance Recording
- Attendance record created immediately after successful QR validation
- No additional user confirmation required (after scan validation)
- Real-time update to Firestore database
- Visual confirmation shown to student ("Attendance Marked Successfully")

#### Timestamp Logging
- Exact scan timestamp recorded (down to milliseconds)
- Server-side timestamp (not client-side to prevent manipulation)
- Time zone handling (store as UTC, display in local time)
- Duration calculation: time from event start to attendance scan

#### Prevention of Duplicate Attendance Entries
- Query Firestore to check if student already scanned for this event
- If duplicate detected, return success message but don't create new record
- Allow grace period (e.g., 5 seconds) for rapid re-scans (single record)
- Log attempt timestamps for analytics if needed

#### Firestore Attendance Data Structure
```
Collection: attendance
Document ID: {auto-generated}
Fields:
  - eventId: string (reference to events collection)
  - studentId: string (reference to students collection, using uid)
  - email: string (denormalized for easy lookup)
  - studentName: string (denormalized for reports)
  - scannedAt: timestamp
  - checkInTime: timestamp (relative to event start)
  - deviceInfo: string (browser/device identifier)
  - status: "present" | "late"
  - duration: number (seconds from event start to scan)

Index: Composite index on (eventId, studentId) for duplicate prevention
```

---

## 5. Attendance Monitoring

### Purpose
Allow administrators to view real-time attendance data and generate simple reports.

### Features

#### Real-Time Attendance Viewing
- Live attendance list updates as students scan
- Refreshes without requiring page reload
- Shows student name, scan time, and check-in status
- Attendance counter (e.g., "42 of 60 present")

#### Event-Based Attendance Lists
- Filter attendance by specific event
- Display all attendees for selected event
- Show attendance timestamp for each student
- Show late arrivals (scanned after event start time + threshold)
- Simple search/filter by student name or ID

#### Basic Statistics
- **Total Attendees**: Count of students marked present for event
- **Attendance Rate**: Percentage (Total / Event Capacity or Invited Students)
- **Late Count**: Number of late arrivals
- **Absent Count**: (Optional for future versions)
- Display statistics on event details page

#### Firebase Real-Time Updates
- Use Firestore listeners for live data
- Listener setup on attendance subcollection of events
- Automatic UI refresh when new attendance record added
- Graceful handling of listener disconnections/reconnections
- Unsubscribe listeners when component unmounts (memory management)

#### Export Functionality (Basic)
- Download attendance list as CSV
- CSV columns: Student Name, Student ID, Email, Scan Time, Status
- One-click export button on attendance page

---

## Architecture Overview

### Pages/Routes (Next.js)

- `/` - Landing page / Home
- `/auth/register` - Student registration
- `/auth/login` - Login for students and admins
- `/dashboard/student` - Student dashboard (scan QR code)
- `/dashboard/admin` - Admin dashboard (event management)
- `/events/create` - Create new event (admin only)
- `/events/[eventId]` - View event details and attendance list (admin only)
- `/attendance` - View personal attendance records (student)

### Key Components

- **QRScanner** - Camera-based QR scanning component
- **EventForm** - Form for creating/editing events
- **AttendanceList** - Real-time attendance display
- **StudentRegistration** - Registration form
- **AdminDashboard** - Event management interface

### Firebase Integration

- **Firebase Authentication**: User signup/login
- **Cloud Firestore**: Database for students, events, attendance
- **Hosting**: Deploy via Vercel (optional Firebase hosting)
- **Realtime Database** (optional): For very real-time scenarios

---

## Technology Stack

- **Framework**: Next.js 13+ (App Router)
- **Backend**: Firebase (Auth, Firestore)
- **Language**: JavaScript (ES6+)
- **QR Code Library**: jsQR or ZXing.js
- **UI Framework**: React (built into Next.js)
- **Styling**: CSS/Tailwind CSS (optional)
- **Deployment**: Vercel (recommended for Next.js)
- **Firebase SDK**: firebase (npm package)

---

## Prototype Scope & Limitations

### What's Included
✅ Student self-registration
✅ Admin event creation
✅ QR code generation and scanning
✅ Attendance recording
✅ Real-time attendance monitoring
✅ Basic statistics and exports

### What's NOT Included (Future Enhancements)
❌ Advanced user role management (full RBAC)
❌ Biometric verification
❌ Geolocation validation
❌ Advanced fraud detection
❌ Mobile app (web-based only)
❌ Email notifications
❌ Advanced reporting/analytics
❌ Multi-language support
❌ API endpoint security with rate limiting

---

## Security Considerations (Prototype Level)

- Firebase Authentication handles password security
- Firestore Rules restrict data access to authenticated users
- Admin role manually assigned (email-based for prototype)
- QR code tokens are short-lived (event duration + 1 hour buffer)
- Student can only view own attendance records
- Admin can view all attendance data

---

## Getting Started

1. Set up Firebase project and configure credentials
2. Initialize Next.js app with Firebase SDK
3. Build authentication pages (register, login)
4. Create event management interface
5. Implement QR code generation and scanning
6. Build attendance tracking and monitoring pages
7. Deploy to Vercel

---

## Notes for Development

- Keep components functional (React hooks-based)
- Use Next.js Server Components where possible
- Handle Firebase real-time listeners carefully (cleanup)
- Implement proper error handling and user feedback
- Test QR scanning on multiple devices and browsers
- Document Firebase Security Rules setup
- Use environment variables for Firebase config
