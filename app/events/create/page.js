'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import EventForm from '@/components/EventForm';

export default function CreateEventPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Create New Event</h1>
          <EventForm />
        </div>
      </div>
    </ProtectedRoute>
  );
}
