import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import {
  MedicationItem,
  NotificationAlert,
  UrgencyLevel,
  getUrgencyLevel,
  getDaysUntilRenewal,
} from '../types/medication';
import { INITIAL_WARD_F3_MEDICATIONS } from '../data/wardF3Data';

interface MedicationContextType {
  medications: MedicationItem[];
  loading: boolean;
  isSeeding: boolean;
  notifications: NotificationAlert[];
  unreadNotificationCount: number;
  addMedication: (data: Omit<MedicationItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateMedication: (id: string, data: Partial<MedicationItem>) => Promise<void>;
  deleteMedication: (id: string) => Promise<void>;
  quickRenew: (id: string, additionalDays: number) => Promise<void>;
  toggleHoldStatus: (id: string) => Promise<void>;
  seedWardF3Data: () => Promise<void>;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  selectedRoom: string;
  setSelectedRoom: (room: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterUrgency: UrgencyLevel | 'all' | 'hold';
  setFilterUrgency: (urgency: UrgencyLevel | 'all' | 'hold') => void;
}

const MedicationContext = createContext<MedicationContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'f3_medications_cache_v2';

export const MedicationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [medications, setMedications] = useState<MedicationItem[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading local cache:', e);
    }
    // Default initial seed
    return INITIAL_WARD_F3_MEDICATIONS.map((m) => ({
      ...m,
      userId: 'ward-f3',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  });

  const [loading, setLoading] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('f3_dismissed_notifications');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [selectedRoom, setSelectedRoom] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterUrgency, setFilterUrgency] = useState<UrgencyLevel | 'all' | 'hold'>('all');

  // Helper to persist state to local cache
  const saveToLocalCache = (items: MedicationItem[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  };

  // Real-time Firestore sync
  useEffect(() => {
    const medsRef = collection(db, 'medications');

    const unsubscribe = onSnapshot(
      medsRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const items: MedicationItem[] = [];
          snapshot.forEach((d) => {
            items.push(d.data() as MedicationItem);
          });
          setMedications(items);
          saveToLocalCache(items);
          setLoading(false);
        } else {
          // If Firestore is completely empty, initialize automatically
          seedWardF3DataForUser(currentUser?.uid || 'ward-f3').catch((err) => {
            console.warn('Initial seed error:', err);
          });
        }
      },
      (error) => {
        console.warn('Firestore onSnapshot listener error (running in local mode):', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Seed Ward F3 Real Patient Records
  const seedWardF3DataForUser = async (userId: string) => {
    setIsSeeding(true);
    const items: MedicationItem[] = INITIAL_WARD_F3_MEDICATIONS.map((m) => ({
      ...m,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    // Update local state immediately
    setMedications(items);
    saveToLocalCache(items);

    try {
      const batch = writeBatch(db);
      for (const medData of items) {
        const docRef = doc(db, 'medications', medData.id);
        batch.set(docRef, medData);
      }
      await batch.commit();
    } catch (err) {
      console.warn('Failed to seed batch in cloud Firestore (using local storage):', err);
    } finally {
      setIsSeeding(false);
      setLoading(false);
    }
  };

  const seedWardF3Data = async () => {
    await seedWardF3DataForUser(currentUser?.uid || 'ward-f3');
  };

  // Add Medication
  const addMedication = async (
    data: Omit<MedicationItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<string> => {
    const id = 'f3-' + (data.patientRoom || 'gen') + '-' + Date.now();
    const userId = currentUser ? currentUser.uid : 'ward-f3';
    const newMed: MedicationItem = {
      ...data,
      id,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 1. Instant optimistic update
    setMedications((prev) => {
      const next = [newMed, ...prev.filter((m) => m.id !== id)];
      saveToLocalCache(next);
      return next;
    });

    // 2. Cloud sync
    try {
      const docRef = doc(db, 'medications', id);
      await setDoc(docRef, newMed);
    } catch (err) {
      console.warn('Cloud write failed, stored locally:', err);
    }

    return id;
  };

  // Update Medication
  const updateMedication = async (id: string, data: Partial<MedicationItem>): Promise<void> => {
    const updatedPayload = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    // 1. Instant optimistic state update
    setMedications((prev) => {
      const next = prev.map((item) => {
        if (item.id === id) {
          return { ...item, ...updatedPayload };
        }
        return item;
      });
      saveToLocalCache(next);
      return next;
    });

    // 2. Cloud sync in Firestore
    try {
      const docRef = doc(db, 'medications', id);
      await setDoc(docRef, updatedPayload, { merge: true });
    } catch (err) {
      console.warn('Cloud update failed, stored locally:', err);
    }
  };

  // Delete Medication
  const deleteMedication = async (id: string): Promise<void> => {
    // 1. Instant optimistic state update
    setMedications((prev) => {
      const next = prev.filter((item) => item.id !== id);
      saveToLocalCache(next);
      return next;
    });

    // 2. Cloud delete
    try {
      const docRef = doc(db, 'medications', id);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('Cloud delete failed, removed locally:', err);
    }
  };

  // Quick Renew (+7, +14, +30 days)
  const quickRenew = async (id: string, additionalDays: number): Promise<void> => {
    const med = medications.find((m) => m.id === id);
    if (!med) return;

    let baseDate = new Date();
    if (med.renewDate) {
      const parts = med.renewDate.split('-');
      if (parts.length === 3) {
        baseDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      }
    }
    if (baseDate < new Date()) {
      baseDate = new Date();
    }

    baseDate.setDate(baseDate.getDate() + additionalDays);
    const year = baseDate.getFullYear();
    const month = String(baseDate.getMonth() + 1).padStart(2, '0');
    const day = String(baseDate.getDate()).padStart(2, '0');
    const newRenewDate = `${year}-${month}-${day}`;

    await updateMedication(id, {
      renewDate: newRenewDate,
      status: 'active',
    });
  };

  // Toggle clinical HOLD status
  const toggleHoldStatus = async (id: string): Promise<void> => {
    const med = medications.find((m) => m.id === id);
    if (!med) return;
    const newStatus = med.status === 'hold' ? 'active' : 'hold';
    await updateMedication(id, {
      status: newStatus,
      ptom: newStatus === 'hold' ? 'HOLD' : '',
    });
  };

  // Compute Notifications & Alerts dynamically based on 1, 2, 3 day lead times
  const notifications = useMemo(() => {
    const alerts: NotificationAlert[] = [];

    medications.forEach((med) => {
      if (med.status === 'ended') return;
      const urgency = getUrgencyLevel(med);
      const days = getDaysUntilRenewal(med.renewDate, med.renewTime);

      let title = '';
      let message = '';

      if (med.status === 'hold') {
        title = `⚠️ Clinical HOLD: ${med.medicationName}`;
        message = `Room ${med.patientRoom}: Medication is currently withheld pending clinical review.`;
      } else if (days <= 0) {
        title = `🔴 Renewal OVERDUE / Due Today: ${med.medicationName}`;
        message = `Room ${med.patientRoom}: Renewal deadline is ${med.renewDate} at ${med.renewTime || '09:00 AM'}. Immediate pharmacy refill needed.`;
      } else if (days === 1) {
        title = `🟠 Renewal Due Tomorrow (1 Day): ${med.medicationName}`;
        message = `Room ${med.patientRoom}: Refill required by ${med.renewDate}. Contact Central Ward Pharmacy.`;
      } else if (days <= 3) {
        title = `🟡 Upcoming Renewal in ${days} Days: ${med.medicationName}`;
        message = `Room ${med.patientRoom}: Scheduled renewal on ${med.renewDate}.`;
      }

      if (title) {
        const notifId = `alert-${med.id}-${med.renewDate}`;
        const isDismissed = dismissedNotificationIds.has(notifId);
        alerts.push({
          id: notifId,
          userId: med.userId,
          medicationId: med.id,
          medicationName: med.medicationName,
          patientRoom: med.patientRoom,
          title,
          message,
          urgencyLevel: urgency,
          status: isDismissed ? 'dismissed' : 'pending',
          scheduledTime: `${med.renewDate} ${med.renewTime || '09:00 AM'}`,
          createdAt: med.updatedAt || new Date().toISOString(),
        });
      }
    });

    return alerts.sort((a, b) => {
      const order: Record<UrgencyLevel, number> = {
        overdue: 0,
        one_day: 1,
        two_three_days: 2,
        safe: 3,
        none: 4,
      };
      return (order[a.urgencyLevel] ?? 99) - (order[b.urgencyLevel] ?? 99);
    });
  }, [medications, dismissedNotificationIds]);

  const unreadNotificationCount = useMemo(() => {
    return notifications.filter((n) => n.status === 'pending').length;
  }, [notifications]);

  const markNotificationRead = (id: string) => {
    setDismissedNotificationIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem('f3_dismissed_notifications', JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const markAllNotificationsRead = () => {
    const allIds = notifications.map((n) => n.id);
    const next = new Set(allIds);
    setDismissedNotificationIds(next);
    localStorage.setItem('f3_dismissed_notifications', JSON.stringify(Array.from(next)));
  };

  return (
    <MedicationContext.Provider
      value={{
        medications,
        loading,
        isSeeding,
        notifications,
        unreadNotificationCount,
        addMedication,
        updateMedication,
        deleteMedication,
        quickRenew,
        toggleHoldStatus,
        seedWardF3Data,
        markNotificationRead,
        markAllNotificationsRead,
        selectedRoom,
        setSelectedRoom,
        searchQuery,
        setSearchQuery,
        filterUrgency,
        setFilterUrgency,
      }}
    >
      {children}
    </MedicationContext.Provider>
  );
};

export const useMedications = () => {
  const context = useContext(MedicationContext);
  if (!context) {
    throw new Error('useMedications must be used within a MedicationProvider');
  }
  return context;
};
