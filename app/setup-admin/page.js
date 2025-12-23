'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

export default function SetupAdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [adminsExist, setAdminsExist] = useState(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const checkAdmins = async () => {
      try {
        const snap = await getDocs(collection(db, 'admins'));
        setAdminsExist(!snap.empty);
        if (!snap.empty) {
          // If admins already exist, redirect away
          router.push('/');
        }
      } catch (err) {
        console.error('Error checking admins:', err);
        setMessage('Error checking system state.');
      }
    };

    checkAdmins();
  }, [router]);

  const claim = async () => {
    if (!user) {
      setMessage('Please log in first');
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      await setDoc(doc(db, 'admins', user.uid), {
        email: user.email,
        createdBy: user.uid,
        createdAt: serverTimestamp()
      });
      // try to set student role if present
      try {
        await updateDoc(doc(db, 'students', user.uid), { role: 'admin' });
      } catch (e) {
        // ignore if student doc doesn't exist
      }
      setMessage('You are now registered as the initial admin. Redirecting...');
      setTimeout(() => router.push('/dashboard/admin'), 1500);
    } catch (err) {
      console.error('Claim admin error', err);
      setMessage('Error registering as admin.');
    } finally {
      setBusy(false);
    }
  };

  if (loading || adminsExist === null) return <div className="min-h-screen flex items-center justify-center">Checking system status...</div>;

  if (adminsExist) {
    return <div className="min-h-screen flex items-center justify-center">Admins already exist. Redirecting...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded shadow max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Initial Admin Setup</h1>
        <p className="mb-4 text-sm text-gray-700">No administrator accounts were found. If you are the system owner, you can claim the initial admin account for your current logged-in user.</p>
        {message && <div className="mb-4 p-3 bg-blue-50 text-sm rounded">{message}</div>}
        <div className="flex gap-3">
          <button onClick={claim} disabled={busy} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded">{busy ? 'Processing...' : 'Claim Admin (Initial)'}</button>
          <button onClick={() => router.push('/')} className="flex-1 bg-gray-200 hover:bg-gray-300 py-2 rounded">Cancel</button>
        </div>
      </div>
    </div>
  );
}
