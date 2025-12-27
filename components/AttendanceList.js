'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy
} from 'firebase/firestore';

export default function AttendanceList({ eventId }) {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [indexError, setIndexError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    late: 0,
    rate: '0%'
  });

  useEffect(() => {
    if (!eventId) {
      setLoading(false);
      return;
    }

    const attendanceRef = collection(db, 'attendance');
    const q = query(
      attendanceRef,
      where('eventId', '==', eventId),
      orderBy('scannedAt', 'desc')
    );

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

        setAttendance(records);

        // Update stats
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
        // If Firestore complains about missing composite index, surface a friendly message and link
        let indexLink = null;
        try {
          const match = (error?.message || '').match(/https?:\/\/[^\s)]+/);
          if (match) indexLink = match[0];
        } catch (e) {
          // ignore
        }
        if (indexLink) {
          setAttendance([]);
          setLoading(false);
          setStats((s) => ({ ...s }));
          // set a UI-visible error via state
          setIndexError(indexLink);
        } else {
          setLoading(false);
        }
      }
    );

    return () => unsubscribe();
  }, [eventId]);

  const downloadCSV = () => {
    if (attendance.length === 0) {
      alert('No attendance records to download');
      return;
    }

    let csv = 'Student Name,Student ID,Email,Time In,Time Out,Duration (min),Status\n';

    attendance.forEach((record) => {
      const timeIn = record.timeIn?.toDate?.() || record.scannedAt;
      const timeOut = record.timeOut?.toDate?.() || null;
      const duration = record.totalDuration || (timeOut ? Math.round((timeOut - timeIn) / 60000) : '');
      csv += `"${record.studentName}","${record.studentId || 'N/A'}","${record.email}","${timeIn.toLocaleString()}","${timeOut ? timeOut.toLocaleString() : 'Pending'}","${duration}","${record.status}"\n`;
    });

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
    element.setAttribute('download', `attendance-${eventId}.csv`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-600">Loading attendance data...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Attendance Records</h2>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-gray-600 text-sm font-medium">Total Attendees</p>
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
          <p className="text-gray-600 text-sm font-medium">Attendance Rate</p>
          <p className="text-3xl font-bold text-purple-600">{stats.rate}</p>
        </div>
      </div>

      {/* Download Button */}
      <div className="mb-6">
        <button
          onClick={downloadCSV}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition"
        >
          Download CSV
        </button>
      </div>

      {indexError && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
          <p className="mb-2 font-semibold">Firestore index required to view attendance</p>
          <p className="text-xs text-gray-700 mb-2">This query needs a composite index in Firestore to support filtering and sorting. Click the link below to create it automatically in the Firebase Console.</p>
          <a href={indexError} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Create required index in Firebase Console</a>
        </div>
      )}

      {/* Attendance Table */}
      <div className="overflow-x-auto">
        {attendance.length > 0 ? (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100 border-b-2 border-gray-300">
              <tr>
                <th className="px-4 py-3 font-semibold text-gray-700">Student Name</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Email</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Time In</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Time Out</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Duration</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((record, index) => {
                const timeIn = record.timeIn?.toDate?.() || record.scannedAt;
                const timeOut = record.timeOut?.toDate?.() || null;
                const duration = record.totalDuration || (timeOut ? Math.round((timeOut - timeIn) / 60000) : null);
                
                return (
                  <tr
                    key={record.id}
                    className={`border-b border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                  >
                    <td className="px-4 py-3 text-gray-900">{record.studentName}</td>
                    <td className="px-4 py-3 text-gray-600">{record.email}</td>
                    <td className="px-4 py-3 text-gray-600">
                      <div className="text-green-600 font-medium">
                        {timeIn.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="text-xs text-gray-500">
                        {timeIn.toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {timeOut ? (
                        <div className="text-red-600 font-medium">
                          {timeOut.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      ) : (
                        <span className="text-yellow-600 text-sm">Pending...</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {duration !== null ? (
                        <span className="font-medium">{duration} min</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
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
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="text-center py-8 text-gray-500">No attendance records yet</p>
        )}
      </div>
    </div>
  );
}
