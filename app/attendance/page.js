'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/lib/authContext';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';

export default function StudentAttendancePage() {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    late: 0,
    rate: '0%'
  });

  useEffect(() => {
    if (!user) return;

    const attendanceRef = collection(db, 'attendance');
    const q = query(attendanceRef, where('studentId', '==', user.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const records = [];
        let presentCount = 0;
        let lateCount = 0;

        snapshot.forEach((doc) => {
          const data = doc.data();
          records.push({
            id: doc.id,
            ...data,
            scannedAt: data.scannedAt?.toDate?.() || new Date(data.scannedAt)
          });

          if (data.status === 'present') presentCount++;
          if (data.status === 'late') lateCount++;
        });

        setAttendance(records.sort((a, b) => b.scannedAt - a.scannedAt));

        const total = records.length;
        const rate = total > 0 ? Math.round((presentCount / total) * 100) : 0;

        setStats({
          total,
          present: presentCount,
          late: lateCount,
          rate: `${rate}%`
        });

        setLoading(false);
      },
      (error) => {
        console.error('Error fetching attendance:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">My Attendance Records</h1>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-gray-600 text-sm font-medium">Total Events</p>
              <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-gray-600 text-sm font-medium">Present</p>
              <p className="text-3xl font-bold text-green-600">{stats.present}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-gray-600 text-sm font-medium">Late</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.late}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-gray-600 text-sm font-medium">On-Time Rate</p>
              <p className="text-3xl font-bold text-purple-600">{stats.rate}</p>
            </div>
          </div>

          {/* Attendance List */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Attendance History</h2>

            {loading ? (
              <p className="text-center py-8 text-gray-600">Loading attendance data...</p>
            ) : attendance.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-100 border-b-2 border-gray-300">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-gray-700">Event ID</th>
                      <th className="px-4 py-3 font-semibold text-gray-700">Scan Time</th>
                      <th className="px-4 py-3 font-semibold text-gray-700">Duration</th>
                      <th className="px-4 py-3 font-semibold text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map((record, index) => (
                      <tr
                        key={record.id}
                        className={`border-b border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                      >
                        <td className="px-4 py-3 text-gray-900 font-mono text-xs">
                          {record.eventId.substring(0, 12)}...
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {record.scannedAt.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {Math.floor(record.duration / 60)} min
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              record.status === 'present'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {record.status === 'present' ? '✓ Present' : '⏰ Late'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center py-8 text-gray-500">
                No attendance records yet. Start scanning QR codes at events!
              </p>
            )}
          </div>

          {/* Back Button */}
          <div className="mt-6">
            <a
              href="/dashboard/student"
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              ← Back to Dashboard
            </a>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
