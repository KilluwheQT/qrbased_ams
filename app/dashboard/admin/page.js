'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/lib/authContext';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, getDocs, doc, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/ui/ToastContext';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { push } = useToast();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEvents: 0,
    activeEvents: 0,
    totalAttendance: 0
  });

  // Admin management
  const [admins, setAdmins] = useState([]);
  const [adminSearch, setAdminSearch] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [adminMessage, setAdminMessage] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);

  // Server-side admin creation (uses /api/admin/create)
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createSecret, setCreateSecret] = useState('');
  const [createMessage, setCreateMessage] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    const eventsRef = collection(db, 'events');
    const q = query(eventsRef, where('createdBy', '==', user.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const eventsList = [];
        let activeCount = 0;
        let totalAttendance = 0;

        snapshot.forEach((doc) => {
          const data = doc.data();
          eventsList.push({
            id: doc.id,
            ...data,
            startTime: data.startTime?.toDate?.() || new Date(data.startTime),
            endTime: data.endTime?.toDate?.() || new Date(data.endTime)
          });

          if (data.status === 'active') activeCount++;
        });

        setEvents(eventsList.sort((a, b) => b.startTime - a.startTime));

        setStats({
          totalEvents: eventsList.length,
          activeEvents: activeCount,
          totalAttendance: totalAttendance
        });

        setLoading(false);
      },
      (error) => {
        console.error('Error fetching events:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Subscribe to admin list
  useEffect(() => {
    const adminsRef = collection(db, 'admins');
    const unsub = onSnapshot(adminsRef, (snap) => {
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setAdmins(list);
    }, (err) => console.error('admins listen error', err));

    return () => unsub();
  }, []);

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600 mb-8">Manage events and monitor attendance</p>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-blue-50 p-6 rounded-lg shadow">
              <p className="text-gray-600 text-sm font-medium">Total Events</p>
              <p className="text-4xl font-bold text-blue-600 mt-2">{stats.totalEvents}</p>
            </div>
            <div className="bg-green-50 p-6 rounded-lg shadow">
              <p className="text-gray-600 text-sm font-medium">Active Events</p>
              <p className="text-4xl font-bold text-green-600 mt-2">{stats.activeEvents}</p>
            </div>
            <div className="bg-purple-50 p-6 rounded-lg shadow">
              <p className="text-gray-600 text-sm font-medium">Total Attendance Records</p>
              <p className="text-4xl font-bold text-purple-600 mt-2">{stats.totalAttendance}</p>
            </div>
          </div>

          {/* Create Event Button */}
          <div className="mb-8">
            <Link
              href="/events/create"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition inline-block"
            >
              + Create New Event
            </Link>
          </div>

          {/* Admin Management */}
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Admin Management</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Promote student to Admin</label>
                  <div className="flex gap-3">
                    <input
                      type="email"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      placeholder="student@example.com"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                    />
                    <button
                      onClick={async () => {
                        setAdminMessage('');
                        if (!newAdminEmail) { setAdminMessage('Please enter an email'); return; }
                        setAdminLoading(true);
                        try {
                          // Look for existing student by email
                          const studentsRef = collection(db, 'students');
                          const q = query(studentsRef, where('email', '==', newAdminEmail));
                          const snap = await getDocs(q);
                          if (snap.empty) {
                            setAdminMessage('User not found. Make sure the user has registered first.');
                          } else {
                            const studentDoc = snap.docs[0];
                            const uid = studentDoc.id;
                            // create admin doc
                            await setDoc(doc(db, 'admins', uid), {
                              email: newAdminEmail,
                              createdBy: user.uid,
                              createdAt: serverTimestamp()
                            });
                            // update student role
                            await updateDoc(doc(db, 'students', uid), { role: 'admin' });
                            setAdminMessage('User promoted to admin successfully.');
                            setNewAdminEmail('');
                            push('User promoted to admin successfully', { type: 'success' });
                          }
                        } catch (err) {
                          console.error('Promote error', err);
                          setAdminMessage('Error promoting user.');
                        } finally {
                          setAdminLoading(false);
                        }
                      }}
                      disabled={adminLoading}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                    >
                      Promote
                    </button>
                  </div>
                  {adminMessage && <p className="mt-2 text-sm text-gray-600">{adminMessage}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Admins</label>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="mb-3">
                      <input value={adminSearch} onChange={(e) => setAdminSearch(e.target.value)} className="w-full px-3 py-2 border rounded" placeholder="Search admins by email" />
                    </div>
                    {admins.length === 0 ? (
                      <p className="text-sm text-gray-500">No admins found.</p>
                    ) : (
                      <ul className="space-y-2 text-sm">
                        {admins.filter(a => (a.email || a.id).toLowerCase().includes(adminSearch.toLowerCase())).map((a) => (
                          <li key={a.id} className="flex items-center justify-between">
                            <span className="text-gray-700">{a.email || a.id}</span>
                            <div className="flex gap-2">
                              <button
                                onClick={async () => {
                                  if (!confirm('Remove admin privileges from this user?')) return;
                                  try {
                                    await deleteDoc(doc(db, 'admins', a.id));
                                    // set student role back to student if exists
                                    const studentRef = doc(db, 'students', a.id);
                                    try { await updateDoc(studentRef, { role: 'student' }); } catch(e) { /* ignore if not exists */ }
                                    push('Admin removed successfully', { type: 'success' });
                                  } catch (err) {
                                    console.error('Remove admin error', err);
                                    setAdminMessage('Error removing admin');
                                    push('Error removing admin', { type: 'error' });
                                  }
                                }}
                                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded"
                              >
                                Remove
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Server-side create admin form */}
                    <div className="mt-4 border-t pt-3">
                      <p className="text-sm font-medium mb-2">Create Admin Account (server)</p>
                      <input type="email" value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} placeholder="email@example.com" className="w-full mb-2 px-3 py-2 border rounded" />
                      <input type="password" value={createPassword} onChange={(e) => setCreatePassword(e.target.value)} placeholder="password" className="w-full mb-2 px-3 py-2 border rounded" />
                      <input type="text" value={createSecret} onChange={(e) => setCreateSecret(e.target.value)} placeholder="(Optional) Admin secret" className="w-full mb-2 px-3 py-2 border rounded" />
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            setCreateMessage('');
                            if (!createEmail || !createPassword) { setCreateMessage('Provide email and password'); return; }
                            setCreateLoading(true);
                            try {
                              // Try to use logged in user's idToken first
                              let authToken = undefined;
                              try {
                                const { auth } = await import('@/lib/firebase');
                                if (auth.currentUser) {
                                  authToken = await auth.currentUser.getIdToken();
                                }
                              } catch (e) {
                                console.warn('Failed to get token', e);
                              }

                              const res = await fetch('/api/admin/create', {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                  ...(authToken ? { 'Authorization': 'Bearer ' + authToken } : {})
                                },
                                body: JSON.stringify({ email: createEmail, password: createPassword, secret: createSecret || undefined })
                              });
                              const json = await res.json();
                              if (!res.ok) {
                                setCreateMessage(json?.error || 'Error creating admin');
                                push(json?.error || 'Error creating admin', { type: 'error' });
                              } else {
                                setCreateMessage('Admin account created successfully (uid: ' + json.uid + ')');
                                push('Admin account created (uid: ' + json.uid + ')', { type: 'success' });
                                setCreateEmail(''); setCreatePassword(''); setCreateSecret('');
                              }
                            } catch (err) {
                              console.error('Create admin request failed', err);
                              setCreateMessage('Error creating admin');
                            } finally { setCreateLoading(false); }
                          }}
                          disabled={createLoading}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded"
                        >
                          {createLoading ? 'Creating...' : 'Create Admin'}
                        </button>
                        <button onClick={() => { setCreateEmail(''); setCreatePassword(''); setCreateSecret(''); setCreateMessage(''); }} className="px-3 py-1 bg-gray-200 rounded">Clear</button>
                      </div>
                      {createMessage && <p className="mt-2 text-sm text-gray-600">{createMessage}</p>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Events List */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Your Events</h2>

            {loading ? (
              <p className="text-center py-8 text-gray-600">Loading events...</p>
            ) : events.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-100 border-b-2 border-gray-300">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-gray-700">Event Name</th>
                      <th className="px-4 py-3 font-semibold text-gray-700">Date & Time</th>
                      <th className="px-4 py-3 font-semibold text-gray-700">Location</th>
                      <th className="px-4 py-3 font-semibold text-gray-700">Status</th>
                      <th className="px-4 py-3 font-semibold text-gray-700">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((event, index) => (
                      <tr
                        key={event.id}
                        className={`border-b border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                      >
                        <td className="px-4 py-3 text-gray-900 font-semibold">{event.eventName}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {event.eventDate} {event.eventTime}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{event.location}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              event.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : event.status === 'inactive'
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {event.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/events/${event.id}`}
                            className="text-blue-600 hover:text-blue-700 font-semibold"
                          >
                            View Details
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center py-8 text-gray-500">
                No events yet.{' '}
                <Link href="/events/create" className="text-blue-600 hover:text-blue-700 font-semibold">
                  Create one now
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
