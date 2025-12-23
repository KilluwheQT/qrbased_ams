'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';

export default function RegisterPage() {
  const router = useRouter();
  const { register, error: authError } = useAuth();
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    studentId: '',
    course: '',
    phoneNumber: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!formData.studentId.trim()) {
      newErrors.studentId = 'Student ID is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      await register(formData.email, formData.password, {
        fullName: formData.fullName,
        studentId: formData.studentId,
        course: formData.course,
        phoneNumber: formData.phoneNumber
      });
      
      router.push('/dashboard/student');
    } catch (err) {
      console.error('Registration error:', err);
      setErrors(prev => ({
        ...prev,
        submit: err.message || 'Registration failed'
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-3xl shadow-2xl p-10 border-t-4 border-purple-600 animate-fadeIn">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🎓</div>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 mb-2">
              Join Us
            </h1>
            <p className="text-gray-600">Create your student account</p>
          </div>

          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">👤 Full Name *</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition ${
                  errors.fullName ? 'border-red-500 bg-red-50' : 'border-purple-200 focus:border-purple-600'
                }`}
                placeholder="John Doe"
              />
              {errors.fullName && <p className="text-red-500 text-sm mt-1 font-semibold">{errors.fullName}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">🆔 Student ID *</label>
              <input
                type="text"
                name="studentId"
                value={formData.studentId}
                onChange={handleChange}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition ${
                  errors.studentId ? 'border-red-500 bg-red-50' : 'border-purple-200 focus:border-purple-600'
                }`}
                placeholder="STU-2024-001"
              />
              {errors.studentId && <p className="text-red-500 text-sm mt-1 font-semibold">{errors.studentId}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">📚 Course</label>
              <input
                type="text"
                name="course"
                value={formData.course}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:outline-none focus:border-purple-600 transition"
                placeholder="e.g., CS"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">📧 Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition ${
                  errors.email ? 'border-red-500 bg-red-50' : 'border-purple-200 focus:border-purple-600'
                }`}
                placeholder="you@example.com"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1 font-semibold">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">📱 Phone</label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:outline-none focus:border-purple-600 transition"
                placeholder="+1 (555) 000-0000"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">🔒 Password *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition ${
                  errors.password ? 'border-red-500 bg-red-50' : 'border-purple-200 focus:border-purple-600'
                }`}
                placeholder="••••••••"
              />
              {errors.password && <p className="text-red-500 text-sm mt-1 font-semibold">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">🔐 Confirm Password *</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition ${
                  errors.confirmPassword ? 'border-red-500 bg-red-50' : 'border-purple-200 focus:border-purple-600'
                }`}
                placeholder="••••••••"
              />
              {errors.confirmPassword && <p className="text-red-500 text-sm mt-1 font-semibold">{errors.confirmPassword}</p>}
            </div>

            {(errors.submit || authError) && (
              <div className="md:col-span-2 bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg font-semibold">
                {errors.submit || authError}
              </div>
            )}

            <Button type="submit" className="md:col-span-2 w-full py-3" disabled={isLoading}>
              {isLoading ? '⏳ Registering...' : '✨ Create Account'}
            </Button>
          </form>

          <p className="text-center text-gray-600 mt-6">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-purple-600 hover:text-purple-700 font-bold">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
