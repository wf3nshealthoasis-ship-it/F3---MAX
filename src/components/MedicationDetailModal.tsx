import React, { useState } from 'react';
import {
  X,
  Edit2,
  Trash2,
  Calendar,
  Clock,
  User,
  Building,
  FileText,
  Paperclip,
  RotateCw,
  AlertTriangle,
  Download,
  Plus,
  Printer,
  PauseCircle,
  PlayCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  MedicationItem,
  getUrgencyLevel,
  getUrgencyConfig,
  getDaysUntilRenewal,
  MedicationAttachment,
} from '../types/medication';
import { useMedications } from '../context/MedicationContext';

interface MedicationDetailModalProps {
  medication: MedicationItem | null;
  onClose: () => void;
  onEdit: (med: MedicationItem) => void;
  onPrintSingle: (med: MedicationItem) => void;
}

export const MedicationDetailModal: React.FC<MedicationDetailModalProps> = ({
  medication,
  onClose,
  onEdit,
  onPrintSingle,
}) => {
  const { quickRenew, toggleHoldStatus, updateMedication, deleteMedication } = useMedications();
  const [selectedPreviewAttachment, setSelectedPreviewAttachment] = useState<MedicationAttachment | null>(null);
  const [isRenewing, setIsRenewing] = useState(false);

  if (!medication) return null;

  const urgency = getUrgencyLevel(medication);
  const urgencyConfig = getUrgencyConfig(urgency, medication.status);
  const daysRemaining = getDaysUntilRenewal(medication.renewDate, medication.renewTime);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const newAttachment: MedicationAttachment = {
        id: 'att-' + Date.now(),
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        url: reader.result as string,
        uploadedAt: new Date().toISOString(),
      };
      const updatedAttachments = [...(medication.attachments || []), newAttachment];
      await updateMedication(medication.id, { attachments: updatedAttachments });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAttachment = async (attId: string) => {
    if (window.confirm('Remove this attachment?')) {
      const updated = (medication.attachments || []).filter((a) => a.id !== attId);
      await updateMedication(medication.id, { attachments: updated });
      if (selectedPreviewAttachment?.id === attId) {
        setSelectedPreviewAttachment(null);
      }
    }
  };

  const handleRenew = async (days: number) => {
    setIsRenewing(true);
    try {
      await quickRenew(medication.id, days);
    } finally {
      setIsRenewing(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Delete ${medication.medicationName} from Ward F3 chart?`)) {
      await deleteMedication(medication.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-200">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gray-50/80">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-[#1A5276] text-white">
              RM {medication.patientRoom}
            </span>
            <span className="text-xs text-gray-500 font-medium">
              CareWare Rx #{medication.patientRoom}
            </span>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => onPrintSingle(medication)}
              title="Print Medication Chart Record"
              className="p-2 text-gray-600 hover:text-[#1A5276] hover:bg-white rounded-lg transition border border-gray-200 shadow-2xs"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={() => onEdit(medication)}
              title="Edit Record"
              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition border border-blue-200 shadow-2xs"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              title="Delete Record"
              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition border border-red-200 shadow-2xs"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Modal Body */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Urgency Color Status Banner */}
          <div
            className={`p-4 rounded-xl border ${urgencyConfig.bgClass} ${urgencyConfig.borderClass} flex flex-col sm:flex-row sm:items-center justify-between gap-3`}
          >
            <div className="flex items-center space-x-3">
              <div
                className={`w-4 h-4 rounded-full ${urgencyConfig.stripeClass} ring-4 ring-white shadow-xs`}
              />
              <div>
                <p className={`text-sm font-bold ${urgencyConfig.textClass}`}>
                  {urgencyConfig.label}
                </p>
                <p className="text-xs text-gray-600">
                  {daysRemaining <= 0
                    ? `Deadline reached (${medication.renewDate} at ${medication.renewTime || '09:00 AM'}). Immediate action required.`
                    : `${daysRemaining} day(s) until renewal deadline (${medication.renewDate}).`}
                </p>
              </div>
            </div>

            {/* Quick Renew Buttons in Banner */}
            <div className="flex items-center space-x-1.5 self-end sm:self-auto">
              <button
                onClick={() => handleRenew(7)}
                disabled={isRenewing}
                className="px-2.5 py-1 text-xs font-semibold rounded bg-white text-gray-800 hover:bg-gray-50 border border-gray-300 shadow-2xs transition active:scale-95"
              >
                +7 Days
              </button>
              <button
                onClick={() => handleRenew(14)}
                disabled={isRenewing}
                className="px-2.5 py-1 text-xs font-semibold rounded bg-white text-gray-800 hover:bg-gray-50 border border-gray-300 shadow-2xs transition active:scale-95"
              >
                +14 Days
              </button>
              <button
                onClick={() => handleRenew(30)}
                disabled={isRenewing}
                className="px-2.5 py-1 text-xs font-semibold rounded bg-teal-600 text-white hover:bg-teal-700 shadow-2xs transition active:scale-95"
              >
                +30 Days
              </button>
            </div>
          </div>

          {/* Medication Title & Core Clinical Summary */}
          <div>
            <div className="flex items-baseline justify-between">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                {medication.medicationName}
              </h2>
              <span className="text-sm font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
                {medication.dose}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              Form: <strong className="text-gray-800">{medication.form || 'Tablet'}</strong> • Room:{' '}
              <strong className="text-gray-800">Bed {medication.patientRoom}</strong>
            </p>
          </div>

          {/* Frequency & Timing Breakdown */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Administration Frequency & Timings
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-xs text-gray-500 block">CareWare Frequency:</span>
                <span className="font-semibold text-gray-900">{medication.frequency}</span>
                {medication.frequencyCode && (
                  <span className="ml-2 text-xs font-mono text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                    Code: {medication.frequencyCode}
                  </span>
                )}
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Dose Times Schedule:</span>
                <span className="font-mono font-semibold text-teal-800">
                  {medication.doseTimes || 'Standard Hospital Dosing'}
                </span>
              </div>
            </div>
          </div>

          {/* Schedule Dates & Renewal Timetable */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 bg-white rounded-xl border border-gray-200 space-y-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-gray-500 uppercase">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>Administration Duration</span>
              </div>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Start Date:</span>
                  <span className="font-mono font-medium text-gray-800">{medication.startDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">End Date:</span>
                  <span className="font-mono font-medium text-gray-800">
                    {medication.endDate || 'Ongoing'}
                  </span>
                </div>
                {medication.endTime && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">End Time:</span>
                    <span className="font-mono font-medium text-gray-800">{medication.endTime}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-gray-200 space-y-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-gray-500 uppercase">
                <Clock className="w-3.5 h-3.5 text-teal-600" />
                <span>Renewal Schedule</span>
              </div>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Renew Date:</span>
                  <span className="font-mono font-bold text-[#1A5276]">{medication.renewDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Renew Time:</span>
                  <span className="font-mono font-semibold text-gray-800">
                    {medication.renewTime || '09:00 AM'}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-gray-500 text-xs">Reminder Lead:</span>
                  <div className="flex space-x-1">
                    {(medication.reminderDays || [1, 2, 3]).map((d) => (
                      <span
                        key={d}
                        className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800"
                      >
                        {d}d
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Doctor & Pharmacy */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 border border-gray-150">
              <User className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <span className="text-[11px] font-semibold text-gray-500 uppercase block">
                  Prescribing Doctor
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {medication.prescribingDoctor || 'Attending Physician (Ward F3)'}
                </span>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 border border-gray-150">
              <Building className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <span className="text-[11px] font-semibold text-gray-500 uppercase block">
                  Dispensing Pharmacy
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {medication.pharmacy || 'Health Oasis Inpatient Pharmacy'}
                </span>
              </div>
            </div>
          </div>

          {/* Notes & Remarks (PTOM) */}
          {(medication.notes || medication.ptom) && (
            <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-amber-900 uppercase">
                <FileText className="w-3.5 h-3.5 text-amber-700" />
                <span>Clinical Notes & Remarks</span>
              </div>
              {medication.ptom && (
                <p className="text-xs font-bold text-amber-950">
                  Ward Remarks (PTOM): <span className="font-normal">{medication.ptom}</span>
                </p>
              )}
              {medication.notes && (
                <p className="text-xs text-gray-800 whitespace-pre-wrap">{medication.notes}</p>
              )}
            </div>
          )}

          {/* Attachments Section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Paperclip className="w-4 h-4 text-gray-500" />
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Attached Files ({medication.attachments?.length || 0})
                </h4>
              </div>
              <label className="cursor-pointer inline-flex items-center space-x-1 text-xs font-semibold text-teal-700 hover:text-teal-900 px-2 py-1 rounded bg-teal-50 hover:bg-teal-100 transition">
                <Plus className="w-3.5 h-3.5" />
                <span>Upload File</span>
                <input
                  type="file"
                  accept="application/pdf,image/*,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {medication.attachments && medication.attachments.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {medication.attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition"
                  >
                    <div
                      onClick={() => setSelectedPreviewAttachment(att)}
                      className="flex items-center space-x-2 truncate cursor-pointer flex-1"
                    >
                      <div className="w-8 h-8 rounded bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 font-bold text-[10px]">
                        {att.type.includes('pdf') ? 'PDF' : 'IMG'}
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-semibold text-gray-900 truncate">{att.name}</p>
                        <p className="text-[10px] text-gray-400">
                          {(att.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0">
                      <a
                        href={att.url}
                        download={att.name}
                        className="p-1 text-gray-500 hover:text-teal-700 rounded transition"
                        title="Download file"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => handleRemoveAttachment(att.id)}
                        className="p-1 text-gray-400 hover:text-red-600 rounded transition"
                        title="Delete attachment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic bg-gray-50 p-3 rounded-lg border border-dashed border-gray-200 text-center">
                No files attached yet. Upload prescriptions, doctor orders, or lab reports.
              </p>
            )}
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={() => toggleHoldStatus(medication.id)}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition inline-flex items-center space-x-1.5 ${
              medication.status === 'hold'
                ? 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {medication.status === 'hold' ? (
              <>
                <PlayCircle className="w-4 h-4" />
                <span>Resume (Hold Active)</span>
              </>
            ) : (
              <>
                <PauseCircle className="w-4 h-4" />
                <span>Put on Clinical HOLD</span>
              </>
            )}
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onEdit(medication)}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#1A5276] text-white hover:bg-[#154360] transition shadow-xs"
            >
              Edit Medication
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 transition"
            >
              Close
            </button>
          </div>
        </div>

        {/* Full-Screen Attachment Viewer Preview Modal */}
        {selectedPreviewAttachment && (
          <div className="fixed inset-0 z-60 bg-black/80 flex flex-col items-center justify-center p-4">
            <div className="max-w-3xl w-full bg-white rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
              <div className="p-3 bg-gray-900 text-white flex items-center justify-between">
                <span className="text-sm font-semibold truncate">
                  {selectedPreviewAttachment.name}
                </span>
                <button
                  onClick={() => setSelectedPreviewAttachment(null)}
                  className="p-1 hover:bg-gray-700 rounded text-gray-300 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 p-4 overflow-auto flex items-center justify-center bg-gray-100 min-h-[300px]">
                {selectedPreviewAttachment.type.includes('image') ? (
                  <img
                    src={selectedPreviewAttachment.url}
                    alt={selectedPreviewAttachment.name}
                    className="max-h-[60vh] max-w-full object-contain rounded"
                  />
                ) : (
                  <div className="text-center p-8 bg-white rounded-xl shadow-xs border border-gray-200">
                    <FileText className="w-16 h-16 text-teal-600 mx-auto mb-3" />
                    <p className="text-base font-bold text-gray-900">PDF Document Preview</p>
                    <p className="text-xs text-gray-500 mb-4">{selectedPreviewAttachment.name}</p>
                    <a
                      href={selectedPreviewAttachment.url}
                      download={selectedPreviewAttachment.name}
                      className="px-4 py-2 rounded-lg bg-[#1A5276] text-white text-xs font-semibold inline-flex items-center space-x-1.5"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download / Open Full PDF</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
