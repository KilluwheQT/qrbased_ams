'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import QRScanner from '@/components/QRScanner';
import { useAuth } from '@/lib/authContext';

export default function StudentDashboardPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute requiredRole="student">
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-2xl text-gray-800 mb-4 font-semibold">
            Welcome, {user?.email}!
          </h1>
          <p className="text-gray-600 mb-8">Scan QR codes to mark your attendance</p>

          <div className="grid md:grid-cols-2 gap-8">
            {/* QR Scanner */}
            <div>
              <QRScanner />
            </div>

            {/* Instructions */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">How to Use</h2>
              <div className="space-y-4 text-gray-700">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Step 1: Request Camera Access</h3>
                  <p>
                    Click "Start Scanning" to activate your device's camera. Grant permission when prompted.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">Step 2: Position QR Code</h3>
                  <p>
                    Hold the event's QR code in front of your camera. Make sure it's clearly visible and well-lit.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">Step 3: Automatic Scanning</h3>
                  <p>
                    The system will automatically detect and scan the QR code. A confirmation message will appear when your attendance is recorded.
                  </p>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mt-6">
                  <p className="font-semibold text-blue-900 mb-2">💡 Tips:</p>
                  <ul className="text-blue-800 space-y-1 text-sm">
                    <li>✓ Make sure there's enough light</li>
                    <li>✓ Keep QR code steady in frame</li>
                    <li>✓ You can only scan once per event</li>
                    <li>✓ Scanning is only available during the event</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Quick Links</h2>
            <div className="flex gap-4 flex-wrap">
              <a
                href="/attendance"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition"
              >
                View My Attendance
              </a>
              <a
                href="/"
                className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-6 rounded-lg transition"
              >
                Back to Home
              </a>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
