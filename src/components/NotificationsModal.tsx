import React, { useState } from 'react';
import { X, Bell, CheckCircle2, AlertTriangle, Clock, ArrowRight } from 'lucide-react';
import { useMedications } from '../context/MedicationContext';
import { getUrgencyConfig, MedicationItem } from '../types/medication';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMedication: (med: MedicationItem) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  onSelectMedication,
}) => {
  const {
    medications,
    notifications,
    unreadNotificationCount,
    markNotificationRead,
    markAllNotificationsRead,
  } = useMedications();

  const [activeTab, setActiveTab] = useState<'pending' | 'sent' | 'dismissed'>('pending');

  if (!isOpen) return null;

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'pending') return n.status === 'pending';
    if (activeTab === 'sent') return true; // all alerts generated
    if (activeTab === 'dismissed') return n.status === 'dismissed';
    return true;
  });

  const handleOpenMed = (medicationId: string) => {
    const med = medications.find((m) => m.id === medicationId);
    if (med) {
      onSelectMedication(med);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Ward F3 Renewal Alerts</h3>
              <p className="text-xs text-gray-500">
                {unreadNotificationCount} active renewal notifications
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {unreadNotificationCount > 0 && (
              <button
                onClick={markAllNotificationsRead}
                className="text-xs font-semibold text-teal-700 hover:text-teal-900 px-2.5 py-1 rounded hover:bg-teal-50 transition"
              >
                Mark All Read
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Segmented Tabs */}
        <div className="flex border-b border-gray-200 px-5 bg-white text-xs font-semibold">
          <button
            onClick={() => setActiveTab('pending')}
            className={`py-3 px-3 border-b-2 transition ${
              activeTab === 'pending'
                ? 'border-[#1A5276] text-[#1A5276]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Pending ({unreadNotificationCount})
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`py-3 px-3 border-b-2 transition ${
              activeTab === 'sent'
                ? 'border-[#1A5276] text-[#1A5276]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            All Scheduled ({notifications.length})
          </button>
          <button
            onClick={() => setActiveTab('dismissed')}
            className={`py-3 px-3 border-b-2 transition ${
              activeTab === 'dismissed'
                ? 'border-[#1A5276] text-[#1A5276]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Dismissed ({notifications.filter((n) => n.status === 'dismissed').length})
          </button>
        </div>

        {/* List of Notification Items */}
        <div className="overflow-y-auto p-4 space-y-2.5 flex-1">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notif) => {
              const urgencyConfig = getUrgencyConfig(notif.urgencyLevel);
              return (
                <div
                  key={notif.id}
                  onClick={() => handleOpenMed(notif.medicationId)}
                  className="relative p-3.5 pl-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50/80 shadow-2xs transition cursor-pointer flex flex-col justify-between overflow-hidden"
                >
                  <div
                    className={`absolute top-0 bottom-0 left-0 w-2 ${urgencyConfig.stripeClass}`}
                  />

                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-gray-900">
                          RM {notif.patientRoom} • {notif.medicationName}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${urgencyConfig.badgeBg}`}
                        >
                          {urgencyConfig.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{notif.message}</p>
                    </div>

                    {notif.status === 'pending' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markNotificationRead(notif.id);
                        }}
                        title="Mark as Read"
                        className="p-1 text-gray-400 hover:text-teal-700 rounded transition"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>Scheduled: {notif.scheduledTime}</span>
                    </span>
                    <span className="text-teal-700 font-semibold inline-flex items-center space-x-1 hover:underline">
                      <span>View Rx</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 text-gray-400">
              <Bell className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p className="text-sm font-medium">No alerts in this category</p>
              <p className="text-xs">All medications on Ward F3 are on schedule.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-50 border-t border-gray-200 text-center">
          <button
            onClick={onClose}
            className="px-5 py-1.5 text-xs font-semibold rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
