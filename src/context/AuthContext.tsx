import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  signInAnonymously,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile } from '../types/medication';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInAsStaffGuest: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfileData: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync profile from Firestore or create default
  const fetchOrCreateProfile = async (user: User) => {
    const userRef = doc(db, 'users', user.uid);
    try {
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        setUserProfile(snap.data() as UserProfile);
      } else {
        const newProfile: UserProfile = {
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
        await setDoc(userRef, newProfile);
        setUserProfile(newProfile);
      }
    } catch (err) {
      console.error('Failed to sync user profile:', err);
      // Fallback local profile if offline or permission restriction
      setUserProfile({
        uid: user.uid,
        displayName: user.displayName || 'Ward F3 Clinician',
        email: user.email || 'staff@healthoasis.org',
        role: 'Healthcare Professional',
        ward: 'Ward F3',
        hospital: 'Health Oasis Hospital',
        pushEnabled: true,
        reminderLeadTimes: [1, 2, 3],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchOrCreateProfile(user);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Google Sign In failed:', error);
      throw error;
    }
  };

  const signInAsStaffGuest = async () => {
    try {
      await signInAnonymously(auth);
    } catch (error) {
      console.error('Anonymous sign in failed:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await fbSignOut(auth);
      setCurrentUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const updateProfileData = async (data: Partial<UserProfile>) => {
    if (!currentUser) return;
    const userRef = doc(db, 'users', currentUser.uid);
    const updated = {
      ...userProfile,
      ...data,
      updatedAt: new Date().toISOString(),
    } as UserProfile;
    try {
      await setDoc(userRef, updated, { merge: true });
      setUserProfile(updated);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
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
