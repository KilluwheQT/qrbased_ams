'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/authContext';
import Button from '@/components/ui/Button';

export default function Home() {
  const { user, userRole } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 py-24">
        <div className="text-center mb-20 animate-fadeIn">
          <div className="inline-block mb-6 text-7xl animate-bounce">🎯</div>
          <h1 className="text-6xl font-black text-blue-700 mb-6">
            Smart Attendance System
          </h1>
          <p className="text-2xl text-gray-800 mb-4 font-semibold">
            Real-time QR Code Attendance Tracking
          </p>
          <p className="text-lg text-gray-700 mb-12 max-w-2xl mx-auto">
            Streamline your classroom with instant attendance marking. No more rollcalls. Just scan, click, done.
          </p>

          {!user ? (
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/auth/register">
                <Button>🚀 Get Started</Button>
              </Link>
              <Link href="/auth/login">
                <Button variant="outline">Sign In</Button>
              </Link>
            </div>
          ) : (
            <div className="flex gap-4 justify-center flex-wrap">
              {userRole === 'admin' ? (
                <>
                  <Link href="/dashboard/admin">
                    <Button>📊 Admin Dashboard</Button>
                  </Link>
                  <Link href="/events/create">
                    <Button variant="outline">✨ Create Event</Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/dashboard/student">
                    <Button>📱 Student Dashboard</Button>
                  </Link>
                  <Link href="/attendance">
                    <Button variant="outline">📋 View Attendance</Button>
                  </Link>
                </>
              )}
            </div>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {[
            { icon: '⚡', title: 'Lightning Fast', desc: 'Instant attendance marking with real-time sync' },
            { icon: '🔒', title: 'Secure & Reliable', desc: 'Firebase-backed with enterprise security' },
            { icon: '📊', title: 'Smart Analytics', desc: 'Detailed reports and attendance insights' }
          ].map((feature, i) => (
            <div key={i} className="group card-hover bg-white rounded-2xl shadow-lg p-8 border border-blue-100">
              <div className="text-5xl mb-4 group-hover:animate-float">{feature.icon}</div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* How It Works */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl p-16 mb-20 border-2 border-blue-200">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { num: '1️⃣', title: 'Admin Creates Event', desc: 'Setup a class/session' },
              { num: '2️⃣', title: 'QR Generated', desc: 'Unique code created' },
              { num: '3️⃣', title: 'Student Scans', desc: 'Point & scan QR' },
              { num: '4️⃣', title: 'Marked Present', desc: 'Instant confirmation' }
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl mb-3">{step.num}</div>
                <h3 className="font-bold text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tech Stack */}
        <div className="bg-white rounded-2xl shadow-xl p-12 border-t-4 border-blue-600">
          <h2 className="text-3xl font-bold mb-8 text-gray-900">⚙️ Built With</h2>
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="font-bold text-lg text-blue-600 mb-4 uppercase">Frontend Stack</h3>
              <ul className="space-y-3">
                {['Next.js 16', 'React 19', 'Tailwind CSS', 'JavaScript'].map((tech, i) => (
                  <li key={i} className="flex items-center text-gray-700 font-semibold">
                    <span className="mr-3 text-xl">✓</span> {tech}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg text-purple-600 mb-4 uppercase">Backend Stack</h3>
              <ul className="space-y-3">
                {['Firebase Auth', 'Firestore', 'Real-time Sync', 'Cloud Functions'].map((tech, i) => (
                  <li key={i} className="flex items-center text-gray-700 font-semibold">
                    <span className="mr-3 text-xl">✓</span> {tech}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
