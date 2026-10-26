import React, { useState } from 'react';
import {
  Clock,
  Calendar,
  Paperclip,
  CheckCircle,
  AlertTriangle,
  MoreVertical,
  RotateCw,
  Eye,
  Edit2,
  Trash2,
  PauseCircle,
  PlayCircle,
} from 'lucide-react';
import {
  MedicationItem,
  getUrgencyLevel,
  getUrgencyConfig,
  getDaysUntilRenewal,
} from '../types/medication';
import { useMedications } from '../context/MedicationContext';

interface MedicationCardProps {
  medication: MedicationItem;
  onViewDetail: (med: MedicationItem) => void;
  onEdit: (med: MedicationItem) => void;
}

export const MedicationCard: React.FC<MedicationCardProps> = ({
  medication,
  onViewDetail,
  onEdit,
}) => {
  const { quickRenew, toggleHoldStatus, deleteMedication } = useMedications();
  const [showMenu, setShowMenu] = useState(false);
  const [isRenewing, setIsRenewing] = useState(false);

  const urgency = getUrgencyLevel(medication);
  const urgencyConfig = getUrgencyConfig(urgency, medication.status);
  const daysRemaining = getDaysUntilRenewal(medication.renewDate, medication.renewTime);

  const handleQuickRenew = async (e: React.MouseEvent, days: number) => {
    e.stopPropagation();
    setIsRenewing(true);
    try {
      await quickRenew(medication.id, days);
    } finally {
      setIsRenewing(false);
      setShowMenu(false);
    }
  };

  const handleToggleHold = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleHoldStatus(medication.id);
    setShowMenu(false);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete ${medication.medicationName}?`)) {
      await deleteMedication(medication.id);
    }
    setShowMenu(false);
  };

  return (
    <div
      onClick={() => onViewDetail(medication)}
      className="group relative bg-white rounded-xl shadow-xs hover:shadow-md border border-gray-200 overflow-hidden transition-all duration-200 cursor-pointer flex flex-col justify-between"
    >
      {/* Urgency Color Stripe (Left border bar) */}
      <div
        className={`absolute top-0 bottom-0 left-0 w-2.5 ${urgencyConfig.stripeClass} transition-colors`}
      />

      <div className="p-3.5 sm:p-4 pl-4.5 sm:pl-5">
        {/* Top Header: Room, Badges, Action Menu */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-[#1A5276]/10 text-[#1A5276] border border-[#1A5276]/20">
              RM {medication.patientRoom}
            </span>

            {medication.status === 'hold' ? (
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-purple-600" />
                HOLD
              </span>
            ) : (
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-bold border flex items-center gap-1 ${urgencyConfig.badgeBg}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${urgencyConfig.stripeClass}`} />
                {daysRemaining <= 0
                  ? 'DUE TODAY'
                  : daysRemaining === 1
                  ? 'DUE IN 1 DAY'
                  : `${daysRemaining} DAYS REMAIN`}
              </span>
            )}

            {medication.attachments && medication.attachments.length > 0 && (
              <span
                title={`${medication.attachments.length} attachment(s)`}
                className="px-1.5 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-700 flex items-center gap-1"
              >
                <Paperclip className="w-3 h-3 text-gray-500" />
                <span>{medication.attachments.length}</span>
              </span>
            )}
          </div>

          {/* Action Dropdown Menu */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
              title="Actions"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                  }}
                />
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-7 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50 text-xs font-medium text-gray-700 animate-in fade-in zoom-in-95 duration-100"
                >
                  <button
                    onClick={() => {
                      onViewDetail(medication);
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center space-x-2 text-gray-800"
                  >
                    <Eye className="w-3.5 h-3.5 text-gray-500" />
                    <span>View Full Details</span>
                  </button>
                  <button
                    onClick={() => {
                      onEdit(medication);
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center space-x-2 text-gray-800"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Edit Medication</span>
                  </button>

                  <div className="border-t border-gray-100 my-1" />

                  <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Quick Renew
                  </div>
                  <button
                    onClick={(e) => handleQuickRenew(e, 7)}
                    className="w-full px-3 py-1.5 text-left hover:bg-teal-50 text-teal-800 flex items-center space-x-2"
                  >
                    <RotateCw className="w-3.5 h-3.5 text-teal-600" />
                    <span>Extend +7 Days</span>
                  </button>
                  <button
                    onClick={(e) => handleQuickRenew(e, 14)}
                    className="w-full px-3 py-1.5 text-left hover:bg-teal-50 text-teal-800 flex items-center space-x-2"
                  >
                    <RotateCw className="w-3.5 h-3.5 text-teal-600" />
                    <span>Extend +14 Days</span>
                  </button>
                  <button
                    onClick={(e) => handleQuickRenew(e, 30)}
                    className="w-full px-3 py-1.5 text-left hover:bg-teal-50 text-teal-800 flex items-center space-x-2"
                  >
                    <RotateCw className="w-3.5 h-3.5 text-teal-600" />
                    <span>Extend +30 Days</span>
                  </button>

                  <div className="border-t border-gray-100 my-1" />

                  <button
                    onClick={handleToggleHold}
                    className="w-full px-3 py-2 text-left hover:bg-purple-50 text-purple-700 flex items-center space-x-2"
                  >
                    {medication.status === 'hold' ? (
                      <>
                        <PlayCircle className="w-3.5 h-3.5 text-purple-600" />
                        <span>Resume (Remove Hold)</span>
                      </>
                    ) : (
                      <>
                        <PauseCircle className="w-3.5 h-3.5 text-purple-600" />
                        <span>Put on Clinical HOLD</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleDelete}
                    className="w-full px-3 py-2 text-left hover:bg-red-50 text-red-600 flex items-center space-x-2"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    <span>Delete Record</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Medication Name & Dosage */}
        <div className="mb-2">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-[#1A5276] transition-colors leading-tight">
            {medication.medicationName}
          </h3>
          <div className="flex items-center space-x-2 mt-0.5">
            <span className="text-sm font-semibold text-gray-800 bg-gray-100 px-2 py-0.5 rounded">
              {medication.dose}
            </span>
            <span className="text-xs text-gray-500 font-medium">
              {medication.form || 'Tablet'}
            </span>
          </div>
        </div>

        {/* Frequency & CareWare Dose Times */}
        <div className="bg-gray-50/80 rounded-lg p-2 border border-gray-150 mb-3 text-xs">
          <div className="flex items-center justify-between text-gray-700 font-medium">
            <span className="text-gray-500">Frequency:</span>
            <span className="font-semibold text-gray-800">{medication.frequency}</span>
          </div>
          {medication.doseTimes && (
            <div className="flex items-center justify-between text-gray-600 text-[11px] mt-1 pt-1 border-t border-gray-200/60 font-mono">
              <span className="text-gray-400">Times:</span>
              <span className="text-teal-700 font-medium">{medication.doseTimes}</span>
            </div>
          )}
        </div>

        {/* Renewal Schedule Footer */}
        <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center space-x-1.5 text-gray-500">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <span>Renew:</span>
            <span className="font-semibold font-mono text-gray-800">
              {medication.renewDate}
            </span>
          </div>
          <div className="flex items-center space-x-1 text-gray-400 font-mono text-[11px]">
            <Clock className="w-3 h-3" />
            <span>{medication.renewTime || '09:00 AM'}</span>
          </div>
        </div>

        {/* PTOM / Remarks (if any) */}
        {medication.ptom && (
          <div className="mt-2 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-1 rounded border border-amber-200/60">
            Remarks: {medication.ptom}
          </div>
        )}
      </div>

      {/* Quick Action Footer on Card */}
      <div className="bg-gray-50/60 px-4 py-2 border-t border-gray-100 flex items-center justify-between">
        <button
          onClick={(e) => handleQuickRenew(e, 7)}
          disabled={isRenewing}
          className="text-xs font-semibold text-teal-700 hover:text-teal-900 inline-flex items-center space-x-1 px-2 py-1 rounded hover:bg-teal-50 transition"
        >
          <RotateCw className={`w-3 h-3 ${isRenewing ? 'animate-spin' : ''}`} />
          <span>Renew +7d</span>
        </button>

        <button
          onClick={() => onViewDetail(medication)}
          className="text-xs font-medium text-gray-500 hover:text-gray-800 transition"
        >
          Details →
        </button>
      </div>
    </div>
  );
};
