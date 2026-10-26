import React from 'react';
import { Home, Pill, Plus, Bell, Settings } from 'lucide-react';
import { useMedications } from '../context/MedicationContext';

interface BottomNavProps {
  activeTab: 'dashboard' | 'medications' | 'notifications' | 'settings';
  onChangeTab: (tab: 'dashboard' | 'medications' | 'notifications' | 'settings') => void;
  onOpenAddModal: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  onOpenAddModal,
}) => {
  const { unreadNotificationCount } = useMedications();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg md:hidden">
      <div className="grid grid-cols-5 h-16 items-center max-w-md mx-auto relative px-2">
        {/* Tab 1: Dashboard */}
        <button
          onClick={() => onChangeTab('dashboard')}
          className={`flex flex-col items-center justify-center space-y-1 py-1 transition ${
            activeTab === 'dashboard' ? 'text-[#1A5276] font-bold' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Home</span>
        </button>

        {/* Tab 2: Medications */}
        <button
          onClick={() => onChangeTab('medications')}
          className={`flex flex-col items-center justify-center space-y-1 py-1 transition ${
            activeTab === 'medications' ? 'text-[#1A5276] font-bold' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Pill className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Ward F3</span>
        </button>

        {/* Tab 3: Central Elevated FAB (Add) */}
        <div className="flex justify-center -mt-6">
          <button
            onClick={onOpenAddModal}
            title="Add Medication"
            className="w-13 h-13 rounded-full bg-teal-500 hover:bg-teal-600 text-white shadow-lg flex items-center justify-center border-4 border-white transition-transform active:scale-95"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Tab 4: Notifications / Alerts */}
        <button
          onClick={() => onChangeTab('notifications')}
          className={`relative flex flex-col items-center justify-center space-y-1 py-1 transition ${
            activeTab === 'notifications' ? 'text-[#1A5276] font-bold' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <div className="relative">
            <Bell className="w-5 h-5" />
            {unreadNotificationCount > 0 && (
              <span className="absolute -top-1.5 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#E74C3C] text-[9px] font-bold text-white shadow-xs animate-pulse">
                {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight">Alerts</span>
        </button>

        {/* Tab 5: Settings */}
        <button
          onClick={() => onChangeTab('settings')}
          className={`flex flex-col items-center justify-center space-y-1 py-1 transition ${
            activeTab === 'settings' ? 'text-[#1A5276] font-bold' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Settings</span>
        </button>
      </div>
    </nav>
  );
};
