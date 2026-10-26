import React, { useState } from 'react';
import {
  X,
  User,
  Bell,
  Database,
  ShieldCheck,
  Check,
  RefreshCw,
  LogOut,
  Hospital,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMedications } from '../context/MedicationContext';
import firebaseConfig from '../../firebase-applet-config.json';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, userProfile, updateProfileData, signOut } = useAuth();
  const { isSeeding, seedWardF3Data } = useMedications();

  const [displayName, setDisplayName] = useState(userProfile?.displayName || 'Ward F3 Clinician');
  const [role, setRole] = useState(userProfile?.role || 'Registered Staff Nurse');
  const [ward, setWard] = useState(userProfile?.ward || 'Ward F3 (CareWare V5.0)');
  const [pushEnabled, setPushEnabled] = useState(userProfile?.pushEnabled ?? true);
  const [reminderLeadTimes, setReminderLeadTimes] = useState<number[]>(
    userProfile?.reminderLeadTimes || [1, 2, 3]
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfileData({
      displayName,
      role,
      ward,
      pushEnabled,
      reminderLeadTimes,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const toggleLeadTime = (day: number) => {
    if (reminderLeadTimes.includes(day)) {
      setReminderLeadTimes(reminderLeadTimes.filter((d) => d !== day));
    } else {
      setReminderLeadTimes([...reminderLeadTimes, day].sort());
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setPushEnabled(true);
        new Notification('F3 - Medication Chart', {
          body: 'Push notifications enabled for Ward F3 medication renewals.',
          icon: '/favicon.ico',
        });
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div>
            <h3 className="text-base font-bold text-gray-900">Ward F3 Profile & System Settings</h3>
            <p className="text-xs text-gray-500">
              CareWare V5.0 Hospital Configuration & Notification Engine
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSaveProfile} className="overflow-y-auto p-6 space-y-6 flex-1">
          {savedSuccess && (
            <div className="p-3 bg-teal-50 border border-teal-200 text-teal-800 rounded-lg text-xs font-semibold flex items-center space-x-2">
              <Check className="w-4 h-4 text-teal-600" />
              <span>Settings saved and synced with cloud database.</span>
            </div>
          )}

          {/* Clinician Profile Section */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center space-x-1.5">
              <User className="w-4 h-4 text-gray-600" />
              <span>Clinician & Staff Profile</span>
            </h4>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Full Name / Title
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#1A5276] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Role / Position
                  </label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#1A5276] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Hospital Ward
                  </label>
                  <input
                    type="text"
                    value={ward}
                    onChange={(e) => setWard(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#1A5276] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Renewal Notification Preferences */}
          <div className="space-y-3 pt-3 border-t border-gray-200">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center space-x-1.5">
              <Bell className="w-4 h-4 text-gray-600" />
              <span>Renewal Notification Engine</span>
            </h4>

            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-gray-800 block">
                    Browser & Push Notifications
                  </span>
                  <span className="text-[11px] text-gray-500">
                    Receive active alerts before medication expiration
                  </span>
                </div>
                <button
                  type="button"
                  onClick={requestNotificationPermission}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    pushEnabled
                      ? 'bg-teal-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {pushEnabled ? 'Notifications Active' : 'Enable Notifications'}
                </button>
              </div>

              <div>
                <span className="text-xs font-semibold text-gray-700 block mb-1.5">
                  Default Renewal Reminder Lead Times:
                </span>
                <div className="flex space-x-2">
                  {[1, 2, 3].map((day) => {
                    const active = reminderLeadTimes.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleLeadTime(day)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                          active
                            ? 'bg-[#1A5276] text-white border-[#1A5276]'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {day} Day{day > 1 ? 's' : ''} Before
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Cloud Database Integration Info */}
          <div className="space-y-3 pt-3 border-t border-gray-200">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center space-x-1.5">
              <Database className="w-4 h-4 text-gray-600" />
              <span>Cloud Database Sync Status</span>
            </h4>

            <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/80 text-xs space-y-1.5 font-mono text-gray-700">
              <div className="flex justify-between">
                <span className="text-gray-500 font-sans">Firebase Project:</span>
                <span className="font-bold text-[#1A5276]">{firebaseConfig.projectId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-sans">Firestore Database:</span>
                <span className="truncate max-w-[200px] text-teal-800">
                  {firebaseConfig.firestoreDatabaseId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-sans">Sync State:</span>
                <span className="text-emerald-700 font-semibold font-sans flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Real-time onSnapshot Connected</span>
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={seedWardF3Data}
                disabled={isSeeding}
                className="text-xs font-semibold text-teal-700 hover:text-teal-900 inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-teal-50 border border-teal-200"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
                <span>Re-seed 141 Ward F3 Patient Records</span>
              </button>

              {currentUser && (
                <button
                  type="button"
                  onClick={signOut}
                  className="text-xs font-semibold text-red-600 hover:text-red-800 inline-flex items-center space-x-1 px-3 py-2 rounded-lg hover:bg-red-50"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              )}
            </div>
          </div>

          {/* App Info Footer */}
          <div className="pt-2 text-[11px] text-gray-400 text-center">
            F3 - Medication Chart PWA • Version 5.0.2 • CareWare V5.0 Compatible
          </div>

          <div className="pt-4 border-t border-gray-200 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg text-xs font-semibold bg-[#1A5276] text-white hover:bg-[#154360] shadow-xs"
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
