'use client';

'use client';

import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from './ui/Button';

export function Navbar() {
  const { user, userRole, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <nav className="gradient-primary text-white shadow-2xl sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-5 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="text-3xl font-bold group-hover:animate-pulse-glow">
            🔐
          </div>
          <div>
            <h1 className="text-2xl font-bold">QR Attendance</h1>
            <p className="text-xs text-blue-100">Smart Attendance System</p>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4 glass-effect px-4 py-2 rounded-full">
              <div className="text-right">
                <div className="font-semibold text-sm text-white">{user.email}</div>
                <div className={`text-xs font-bold uppercase ${userRole === 'admin' ? 'text-yellow-200' : 'text-green-200'}`}>
                  {userRole}
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold">
                {user.email?.[0]?.toUpperCase()}
              </div>
              <Button variant="secondary" onClick={() => router.push('/dashboard')}>Dashboard</Button>
              <Button variant="danger" onClick={handleLogout}>Logout</Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/login"><Button variant="secondary">Login</Button></Link>
              <Link href="/auth/register"><Button>Register</Button></Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
