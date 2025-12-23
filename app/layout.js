import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/authContext";
import { Navbar } from "@/components/Navbar";
import { ToastProvider } from '@/components/ui/ToastContext'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "QR Code Attendance System",
  description: "A prototype QR code-based attendance system built with Next.js and Firebase",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <ToastProvider>
            <Navbar />
            <main className="min-h-screen pb-12" style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #f3e8ff 100%)' }}>
              <div className="max-w-7xl mx-auto px-4 text-gray-900">{children}</div>
            </main>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
