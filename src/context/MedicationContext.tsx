import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
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

export const MedicationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [medications, setMedications] = useState<MedicationItem[]>([]);
  const [loading, setLoading] = useState(true);
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

  // Real-time Firestore sync
  useEffect(() => {
    if (!currentUser) {
      // In guest or unauthenticated state, load pre-seeded Ward F3 medications in local memory
      const localSeed: MedicationItem[] = INITIAL_WARD_F3_MEDICATIONS.map((m) => ({
        ...m,
        userId: 'demo-ward-f3',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      setMedications(localSeed);
      setLoading(false);
      return;
    }

    setLoading(true);
    const medsRef = collection(db, 'medications');
    const q = query(medsRef, where('userId', '==', currentUser.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: MedicationItem[] = [];
        snapshot.forEach((d) => {
          items.push(d.data() as MedicationItem);
        });

        // If user has zero records in cloud, auto-initialize with Ward F3 patient records
        if (items.length === 0 && !snapshot.metadata.hasPendingWrites) {
          // Initialize automatically so user immediately has live data
          seedWardF3DataForUser(currentUser.uid).catch((err) => {
            console.warn('Initial seed error:', err);
          });
        } else {
          setMedications(items);
          setLoading(false);
        }
      },
      (error) => {
        console.error('Firestore onSnapshot error:', error);
        // Fallback to local default records if offline or permission denied
        const localSeed: MedicationItem[] = INITIAL_WARD_F3_MEDICATIONS.map((m) => ({
          ...m,
          userId: currentUser.uid,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
        setMedications(localSeed);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Seed Ward F3 Real Patient Records
  const seedWardF3DataForUser = async (userId: string) => {
    setIsSeeding(true);
    try {
      // Use batches of 500 (141 items is well within single batch)
      const batch = writeBatch(db);
      const items: MedicationItem[] = [];

      for (const m of INITIAL_WARD_F3_MEDICATIONS) {
        const docRef = doc(db, 'medications', m.id);
        const medData: MedicationItem = {
          ...m,
          userId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        batch.set(docRef, medData);
        items.push(medData);
      }

      await batch.commit();
      setMedications(items);
    } catch (err) {
      console.error('Failed to seed batch in cloud Firestore:', err);
      // Fallback local memory
      setMedications(
        INITIAL_WARD_F3_MEDICATIONS.map((m) => ({
          ...m,
          userId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }))
      );
    } finally {
      setIsSeeding(false);
      setLoading(false);
    }
  };

  const seedWardF3Data = async () => {
    if (!currentUser) return;
    await seedWardF3DataForUser(currentUser.uid);
  };

  // Add Medication
  const addMedication = async (
    data: Omit<MedicationItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<string> => {
    const id = 'f3-' + (data.patientRoom || 'gen') + '-' + Date.now();
    const userId = currentUser ? currentUser.uid : 'demo-ward-f3';
    const newMed: MedicationItem = {
      ...data,
      id,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (currentUser) {
      const docRef = doc(db, 'medications', id);
      try {
        await setDoc(docRef, newMed);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `medications/${id}`);
      }
    } else {
      setMedications((prev) => [newMed, ...prev]);
    }
    return id;
  };

  // Update Medication
  const updateMedication = async (id: string, data: Partial<MedicationItem>): Promise<void> => {
    const updatedPayload = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    if (currentUser) {
      const docRef = doc(db, 'medications', id);
      try {
        await setDoc(docRef, updatedPayload, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `medications/${id}`);
      }
    } else {
      setMedications((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updatedPayload } : item))
      );
    }
  };

  // Delete Medication
  const deleteMedication = async (id: string): Promise<void> => {
    if (currentUser) {
      const docRef = doc(db, 'medications', id);
      try {
        await deleteDoc(docRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `medications/${id}`);
      }
    } else {
      setMedications((prev) => prev.filter((item) => item.id !== id));
    }
  };

  // Quick Renew (+7, +14, +30 days)
  const quickRenew = async (id: string, additionalDays: number): Promise<void> => {
    const med = medications.find((m) => m.id === id);
    if (!med) return;

    // Calculate new renewal date
    let baseDate = new Date();
    if (med.renewDate) {
      const parts = med.renewDate.split('-');
      if (parts.length === 3) {
        baseDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      }
    }
    // If base date is already overdue, renew starting from today
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

    // Sort by urgency: overdue first, then 1 day, then 2-3 days
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
