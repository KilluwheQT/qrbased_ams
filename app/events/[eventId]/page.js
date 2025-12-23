'use client';

import { useParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import AttendanceList from '@/components/AttendanceList';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { generateQRCode } from '@/lib/qrUtils';

export default function EventDetailsPage() {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [qrImage, setQrImage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId) return;

    const fetchEvent = async () => {
      try {
        const docRef = doc(db, 'events', eventId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const eventData = docSnap.data();
          setEvent(eventData);

          // Generate QR code
          try {
            const qr = await generateQRCode(`${eventId}:${eventData.sessionToken}`);
            setQrImage(qr);
          } catch (err) {
            console.warn('QR generation warning:', err);
          }
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching event:', err);
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading event details...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-lg text-red-600">Event not found</div>
      </div>
    );
  }

  const startTime = event.startTime?.toDate?.() || new Date(event.startTime);

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <a href="/dashboard/admin" className="text-blue-600 hover:text-blue-700 font-semibold mb-4 inline-block">
            ← Back to Admin Dashboard
          </a>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {/* Event Info */}
            <div className="md:col-span-2 bg-white rounded-lg shadow-lg p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{event.eventName}</h1>

              <div className="space-y-3 text-gray-700">
                <div>
                  <p className="font-semibold text-gray-800">Category</p>
                  <p>{event.category || 'General'}</p>
                </div>

                <div>
                  <p className="font-semibold text-gray-800">Date & Time</p>
                  <p>
                    {event.eventDate} at {event.eventTime}
                  </p>
                </div>

                <div>
                  <p className="font-semibold text-gray-800">Location</p>
                  <p>{event.location}</p>
                </div>

                <div>
                  <p className="font-semibold text-gray-800">Status</p>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                      event.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : event.status === 'inactive'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {event.status}
                  </span>
                </div>

                {event.description && (
                  <div>
                    <p className="font-semibold text-gray-800">Description</p>
                    <p>{event.description}</p>
                  </div>
                )}

                {event.capacity > 0 && (
                  <div>
                    <p className="font-semibold text-gray-800">Expected Capacity</p>
                    <p>{event.capacity} students</p>
                  </div>
                )}
              </div>
            </div>

            {/* QR Code */}
            <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center justify-center">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Event QR Code</h2>
              {qrImage ? (
                <>
                  <img src={qrImage} alt="Event QR Code" className="w-64 h-64 border-2 border-gray-300 rounded-lg" />
                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = qrImage;
                      link.download = `${event.eventName}-qr.png`;
                      link.click();
                    }}
                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition"
                  >
                    Download QR Code
                  </button>
                </>
              ) : (
                <div className="text-gray-500">QR Code generation pending...</div>
              )}
            </div>
          </div>

          {/* Attendance List */}
          <AttendanceList eventId={eventId} />
        </div>
      </div>
    </ProtectedRoute>
  );
}
