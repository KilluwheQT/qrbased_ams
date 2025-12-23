# QR Code–Based Attendance System

A prototype QR code-based attendance system built with **Next.js** and **Firebase**. This system enables institutions to streamline attendance tracking by allowing students to scan event QR codes for instant attendance recording.

## 🌟 Features

✅ Student Registration & Authentication (Firebase Auth)  
✅ Event Management with Automatic QR Code Generation  
✅ Camera-based QR Code Scanning  
✅ Real-time Attendance Logging & Monitoring  
✅ Attendance Statistics & CSV Export  
✅ Real-time Firestore Listeners  

## 🛠️ Tech Stack

- **Framework**: Next.js 16+ with App Router
- **Frontend**: React 19, Tailwind CSS
- **Backend**: Firebase (Auth, Firestore)
- **QR Code**: html5-qrcode & qrcode libraries
- **Deployment**: Vercel (recommended)

## 📋 Quick Start

```bash
# Install dependencies
npm install

# Configure Firebase (.env.local)
cp .env.local.example .env.local

# Run development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 📚 Documentation

- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Complete setup instructions
- **[FEATURES.md](FEATURES.md)** - Feature specification and system design

## 🚀 Usage

**Students**: Register → Scan QR codes → View attendance  
**Admins**: Create events → Monitor real-time attendance → Export records

## 🚢 Deployment

```bash
npm run build
vercel
```

---

**Version**: 0.1.0 | **Status**: Prototype | **Last Updated**: December 2024
