import React from 'react';
import {
  Pill,
  Bell,
  Printer,
  Cloud,
  CheckCircle2,
  RefreshCw,
  UserCheck,
  LogIn,
  LogOut,
  HelpCircle,
  Settings,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMedications } from '../context/MedicationContext';

interface HeaderProps {
  onOpenPrint: () => void;
  onOpenNotifications: () => void;
  onOpenFrequencyGuide: () => void;
  onOpenSettings: () => void;
  onOpenAddModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenPrint,
  onOpenNotifications,
  onOpenFrequencyGuide,
  onOpenSettings,
  onOpenAddModal,
}) => {
  const { currentUser, userProfile, signInWithGoogle, signInAsStaffGuest, signOut } = useAuth();
  const { medications, unreadNotificationCount, isSeeding, seedWardF3Data } = useMedications();

  return (
    <header className="sticky top-0 z-30 bg-[#1A5276] text-white shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Ward Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-teal-300 shadow-inner">
              <Pill className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg sm:text-xl font-bold tracking-tight text-white">
                  F3 - Medication Chart
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-teal-500/20 text-teal-200 border border-teal-400/30">
                  CareWare V5.0
                </span>
              </div>
              <p className="text-xs text-blue-100/80 font-medium">
                Health Oasis Hospital • Inpatient Ward F3 • {medications.length} Active Records
              </p>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center space-x-1.5 sm:space-x-3">
            {/* Seed / Sync Ward Data */}
            <button
              onClick={seedWardF3Data}
              disabled={isSeeding}
              title="Sync or Re-seed 141 Ward F3 Patient Records"
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-medium rounded-lg bg-white/10 hover:bg-white/20 text-white transition border border-white/15"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin text-teal-300' : ''}`} />
              <span className="hidden md:inline">
                {isSeeding ? 'Syncing...' : 'Sync Ward F3 (141)'}
              </span>
            </button>

            {/* CareWare Frequency Reference Guide */}
            <button
              onClick={onOpenFrequencyGuide}
              title="CareWare V5.0 Drug Frequencies Schedule (55 Codes)"
              className="p-2 sm:px-3 sm:py-2 text-xs font-medium rounded-lg bg-white/10 hover:bg-white/20 text-white transition border border-white/15 inline-flex items-center space-x-1.5"
            >
              <HelpCircle className="w-4 h-4 text-teal-200" />
              <span className="hidden lg:inline">Drug Frequencies</span>
            </button>

            {/* Print Medication Chart */}
            <button
              onClick={onOpenPrint}
              title="Print Filtered Ward F3 Medication Chart"
              className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg bg-teal-500 hover:bg-teal-400 text-[#0c314b] shadow-sm transition active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Print Chart</span>
            </button>

            {/* Notification Bell */}
            <button
              onClick={onOpenNotifications}
              title="Renewal Notifications"
              className="relative p-2 sm:p-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition border border-white/15"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#E74C3C] text-[10px] font-bold text-white shadow-md animate-pulse">
                  {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                </span>
              )}
            </button>

            {/* Settings */}
            <button
              onClick={onOpenSettings}
              title="Profile & Notification Settings"
              className="p-2 sm:p-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition border border-white/15"
            >
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Auth / Clinician Badge */}
            <div className="hidden sm:block border-l border-white/20 pl-3">
              {currentUser ? (
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center font-bold text-xs text-white border border-teal-300">
                    {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'N'}
                  </div>
                  <div className="text-left hidden xl:block">
                    <p className="text-xs font-semibold text-white leading-tight">
                      {userProfile?.displayName || 'Clinical Staff'}
                    </p>
                    <p className="text-[10px] text-teal-200 leading-tight">
                      {userProfile?.role || 'Staff Nurse'}
                    </p>
                  </div>
                  <button
                    onClick={signOut}
                    title="Sign Out"
                    className="p-1.5 text-blue-200 hover:text-white hover:bg-white/10 rounded transition"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={signInWithGoogle}
                    className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-white text-[#1A5276] hover:bg-gray-100 transition shadow-sm inline-flex items-center space-x-1"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In</span>
                  </button>
                  <button
                    onClick={signInAsStaffGuest}
                    className="px-2 py-1.5 text-xs font-medium rounded-lg bg-teal-600 text-white hover:bg-teal-500 transition"
                  >
                    Staff Demo
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
