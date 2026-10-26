import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { UserProfile } from '../types/medication';

export interface AppUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL?: string | null;
  isStaffDemo?: boolean;
}

interface AuthContextType {
  currentUser: AppUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInAsStaffGuest: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfileData: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STAFF_SESSION_KEY = 'f3_staff_session_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync profile from Firestore or create default
  const fetchOrCreateProfile = async (user: AppUser) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        setUserProfile(snap.data() as UserProfile);
        return;
      }
    } catch (err) {
      console.warn('Profile fetch warning (using fallback profile):', err);
    }

    const defaultProfile: UserProfile = {
      uid: user.uid,
      displayName: user.displayName || 'Staff Nurse (Ward F3)',
      email: user.email || 'nurse.f3@healthoasis.org',
      role: 'Registered Staff Nurse',
      ward: 'Ward F3 (CareWare V5.0)',
      hospital: 'Health Oasis Hospital',
      pushEnabled: true,
      reminderLeadTimes: [1, 2, 3],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, defaultProfile, { merge: true });
    } catch (e) {
      // ignore offline write warning
    }

    setUserProfile(defaultProfile);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const appUser: AppUser = {
          uid: fbUser.uid,
          displayName: fbUser.displayName,
          email: fbUser.email,
          photoURL: fbUser.photoURL,
        };
        setCurrentUser(appUser);
        await fetchOrCreateProfile(appUser);
        setLoading(false);
      } else {
        // Check if there is an active local staff clinician session
        try {
          const savedStaff = localStorage.getItem(STAFF_SESSION_KEY);
          if (savedStaff) {
            const staffUser: AppUser = JSON.parse(savedStaff);
            setCurrentUser(staffUser);
            await fetchOrCreateProfile(staffUser);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.warn('Error reading staff session:', e);
        }

        setCurrentUser(null);
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        localStorage.removeItem(STAFF_SESSION_KEY);
      }
    } catch (error) {
      console.warn('Google Sign In warning:', error);
      throw error;
    }
  };

  // Ward F3 Clinician / Staff Access
  const signInAsStaffGuest = async () => {
    const staffUser: AppUser = {
      uid: 'staff-ward-f3',
      displayName: 'Ward F3 Charge Nurse',
      email: 'nurse.f3@healthoasis.org',
      isStaffDemo: true,
    };

    localStorage.setItem(STAFF_SESSION_KEY, JSON.stringify(staffUser));
    setCurrentUser(staffUser);
    await fetchOrCreateProfile(staffUser);
  };

  const signOut = async () => {
    try {
      await fbSignOut(auth);
    } catch (error) {
      console.warn('Sign out warning:', error);
    }
    localStorage.removeItem(STAFF_SESSION_KEY);
    setCurrentUser(null);
    setUserProfile(null);
  };

  const updateProfileData = async (data: Partial<UserProfile>) => {
    if (!currentUser) return;
    const updated = {
      ...userProfile,
      ...data,
      updatedAt: new Date().toISOString(),
    } as UserProfile;

    setUserProfile(updated);

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await setDoc(userRef, updated, { merge: true });
    } catch (err) {
      console.warn('Profile update warning:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        signInWithGoogle,
        signInAsStaffGuest,
        signOut,
        updateProfileData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
