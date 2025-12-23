'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        
        // Fetch user role and additional data from Firestore
        try {
          const docRef = doc(db, 'students', firebaseUser.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            setUserRole(docSnap.data().role || 'student');
          } else {
            // Try admin collection
            const adminRef = doc(db, 'admins', firebaseUser.uid);
            const adminSnap = await getDoc(adminRef);
            if (adminSnap.exists()) {
              setUserRole('admin');
            } else {
              setUserRole('student');
            }
          }
        } catch (err) {
          console.error('Error fetching user role:', err);
          setUserRole('student');
        }
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const register = async (email, password, studentData) => {
    setError(null);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = result.user;

      // Create student document in Firestore
      await setDoc(doc(db, 'students', newUser.uid), {
        email: newUser.email,
        fullName: studentData.fullName,
        studentId: studentData.studentId,
        course: studentData.course || '',
        phoneNumber: studentData.phoneNumber || '',
        role: 'student',
        createdAt: new Date(),
        updatedAt: new Date(),
        registrationStatus: 'active'
      });

      setUser(newUser);
      setUserRole('student');
      return newUser;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const login = async (email, password) => {
    setError(null);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      setUser(result.user);
      return result.user;
    } catch (err) {
      console.error('Login error', err);
      // Map common Firebase errors to friendlier messages
      const code = err?.code || '';
      let userMessage = 'Login failed. Please check your credentials.';
      if (code === 'auth/invalid-credential') {
        userMessage = 'Authentication failed: invalid credential. Verify your Firebase web configuration and ensure Email/Password sign-in is enabled in the Firebase Console.';
      } else if (code === 'auth/wrong-password') {
        userMessage = 'Invalid password.';
      } else if (code === 'auth/user-not-found') {
        userMessage = 'No account found with that email.';
      }
      setError(userMessage);
      throw err;
    }
  };

  const logout = async () => {
    setError(null);
    try {
      await signOut(auth);
      setUser(null);
      setUserRole(null);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const value = {
    user,
    userRole,
    loading,
    error,
    register,
    login,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
