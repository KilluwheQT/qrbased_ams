'use client';

import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from './ui/Button';
import { useState } from 'react';

export function Navbar() {
  const { user, userRole, logout } = useAuth();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
      setIsMenuOpen(false);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <nav className="gradient-primary text-white shadow-2xl sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-4 md:py-5 flex justify-between items-center">
        {/* Logo Section */}
        <Link href="/" className="flex items-center gap-2 md:gap-3 group flex-shrink-0">
          <div className="text-2xl md:text-3xl font-bold group-hover:animate-pulse-glow">
            🔐
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg md:text-2xl font-bold">QR Attendance</h1>
            <p className="text-xs text-blue-100 hidden md:block">Smart Attendance System</p>
          </div>
        </Link>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden flex flex-col gap-1.5 p-2 hover:bg-white/10 rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          <span className={`h-0.5 w-6 bg-white transition-transform duration-300 ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
          <span className={`h-0.5 w-6 bg-white transition-opacity duration-300 ${isMenuOpen ? 'opacity-0' : ''}`}></span>
          <span className={`h-0.5 w-6 bg-white transition-transform duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
        </button>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-2 lg:gap-4">
          {user ? (
            <div className="flex items-center gap-2 lg:gap-4 glass-effect px-3 lg:px-4 py-2 rounded-full">
              <div className="text-right hidden sm:block">
                <div className="font-semibold text-sm text-white truncate max-w-xs">{user.email}</div>
                <div className={`text-xs font-bold uppercase ${userRole === 'admin' ? 'text-yellow-200' : 'text-green-200'}`}>
                  {userRole}
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm flex-shrink-0">
                {user.email?.[0]?.toUpperCase()}
              </div>
              <Button variant="secondary" onClick={() => router.push('/dashboard')} className="text-sm">Dashboard</Button>
              <Button variant="danger" onClick={handleLogout} className="text-sm">Logout</Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/login"><Button variant="secondary" className="text-sm">Login</Button></Link>
              <Link href="/auth/register"><Button className="text-sm">Register</Button></Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-gradient-to-b from-blue-600 to-purple-600 border-t border-white/10 animate-slideIn">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-3">
            {user ? (
              <>
                <div className="glass-effect px-3 py-3 rounded-lg mb-3">
                  <div className="font-semibold text-sm text-white truncate">{user.email}</div>
                  <div className={`text-xs font-bold uppercase ${userRole === 'admin' ? 'text-yellow-200' : 'text-green-200'}`}>
                    {userRole}
                  </div>
                </div>
                <button
                  onClick={() => {
                    router.push('/dashboard');
                    closeMenu();
                  }}
                  className="w-full bg-white/20 hover:bg-white/30 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
                >
                  Dashboard
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full bg-red-500/80 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" onClick={closeMenu} className="block">
                  <div className="w-full bg-white/20 hover:bg-white/30 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-center text-sm">
                    Login
                  </div>
                </Link>
                <Link href="/auth/register" onClick={closeMenu} className="block">
                  <div className="w-full bg-white/40 hover:bg-white/50 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-center text-sm">
                    Register
                  </div>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
