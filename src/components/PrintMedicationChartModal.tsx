import React, { useState, useMemo } from 'react';
import { X, Printer, Filter, CheckCircle2, FileDown } from 'lucide-react';
import { MedicationItem, getDaysUntilRenewal, getUrgencyLevel } from '../types/medication';
import { useMedications } from '../context/MedicationContext';
import { useAuth } from '../context/AuthContext';

interface PrintMedicationChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  singleMedication?: MedicationItem | null;
}

export const PrintMedicationChartModal: React.FC<PrintMedicationChartModalProps> = ({
  isOpen,
  onClose,
  singleMedication,
}) => {
  const { medications } = useMedications();
  const { userProfile } = useAuth();

  // Print Filter Controls
  const [roomFilter, setRoomFilter] = useState<string>(
    singleMedication ? singleMedication.patientRoom : 'all'
  );
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  if (!isOpen) return null;

  // Filtered dataset for print
  const printableList = useMemo(() => {
    if (singleMedication) {
      return [singleMedication];
    }

    return medications.filter((m) => {
      // Room filter
      if (roomFilter !== 'all' && m.patientRoom !== roomFilter) {
        return false;
      }

      // Urgency filter
      if (urgencyFilter !== 'all') {
        const u = getUrgencyLevel(m);
        if (urgencyFilter === 'overdue' && u !== 'overdue') return false;
        if (urgencyFilter === 'one_day' && u !== 'one_day') return false;
        if (urgencyFilter === 'two_three_days' && u !== 'two_three_days') return false;
        if (urgencyFilter === 'safe' && u !== 'safe') return false;
        if (urgencyFilter === 'hold' && m.status !== 'hold') return false;
      }

      // Date range filter
      if (fromDate && m.renewDate < fromDate) return false;
      if (toDate && m.renewDate > toDate) return false;

      return true;
    });
  }, [medications, singleMedication, roomFilter, urgencyFilter, fromDate, toDate]);

  // Group by Room
  const groupedByRoom = useMemo(() => {
    const groups: Record<string, MedicationItem[]> = {};
    printableList.forEach((item) => {
      const rm = item.patientRoom || 'General';
      if (!groups[rm]) groups[rm] = [];
      groups[rm].push(item);
    });
    return groups;
  }, [printableList]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[94vh] flex flex-col overflow-hidden border border-gray-200 print:border-none print:shadow-none print:max-w-full print:max-h-full print:rounded-none">
        {/* Modal Controls Bar (Hidden during print) */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-gray-50 print:hidden">
          <div className="flex items-center space-x-2">
            <Printer className="w-5 h-5 text-[#1A5276]" />
            <h3 className="text-base font-bold text-gray-900">
              Print / Export Patient Medication Administration Record
            </h3>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-[#1A5276] text-white hover:bg-[#154360] transition shadow-xs inline-flex items-center space-x-1.5 active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Bar (Hidden during print) */}
        {!singleMedication && (
          <div className="p-4 bg-gray-100/70 border-b border-gray-200 grid grid-cols-1 sm:grid-cols-4 gap-3 print:hidden text-xs">
            <div>
              <label className="font-semibold text-gray-600 block mb-1">Filter by Room:</label>
              <select
                value={roomFilter}
                onChange={(e) => setRoomFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-md focus:ring-1 focus:ring-[#1A5276]"
              >
                <option value="all">All Rooms ({medications.length})</option>
                {[...new Set(medications.map((m) => m.patientRoom))].sort().map((rm) => (
                  <option key={rm} value={rm}>
                    Room {rm}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-gray-600 block mb-1">Renewal Urgency:</label>
              <select
                value={urgencyFilter}
                onChange={(e) => setUrgencyFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-md focus:ring-1 focus:ring-[#1A5276]"
              >
                <option value="all">All Urgency Levels</option>
                <option value="overdue">🔴 Due Today / Overdue</option>
                <option value="one_day">🟠 Due in 1 Day</option>
                <option value="two_three_days">🟡 Due in 2-3 Days</option>
                <option value="safe">🟢 Safe (&gt; 3 Days)</option>
                <option value="hold">🟣 Clinical HOLD</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-gray-600 block mb-1">Renewal From Date:</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-md font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-gray-600 block mb-1">Renewal To Date:</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-md font-mono"
              />
            </div>
          </div>
        )}

        {/* Printable Document Area */}
        <div className="overflow-y-auto p-6 sm:p-8 space-y-6 print:overflow-visible print:p-0 print:m-0 bg-white">
          {/* Hospital Official Header Banner */}
          <div className="border-2 border-[#1A5276] rounded-t-lg bg-[#1A5276] text-white p-3 text-center">
            <h1 className="text-lg sm:text-xl font-bold uppercase tracking-wider">
              Health Oasis Hospital • CareWare V5.0
            </h1>
            <h2 className="text-sm sm:text-base font-semibold tracking-wide text-blue-100">
              PATIENT MEDICATION ADMINISTRATION RECORD WARD F3
            </h2>
          </div>

          {/* Subheader Metadata */}
          <div className="flex flex-wrap items-center justify-between text-xs text-gray-600 border-b pb-3 -mt-3">
            <div>
              <span>Ward: </span>
              <strong className="text-gray-900">Ward F3</strong> • <span>Report Generated: </span>
              <strong className="text-gray-900">{new Date().toLocaleString()}</strong>
            </div>
            <div>
              <span>Prepared By: </span>
              <strong className="text-gray-900">
                {userProfile?.displayName || 'Ward F3 Charge Nurse'}
              </strong>
            </div>
            <div>
              <span>Total Displayed Medications: </span>
              <strong className="text-teal-800 font-bold">{printableList.length}</strong>
            </div>
          </div>

          {/* Table of Medications Grouped by Room */}
          {Object.keys(groupedByRoom).length > 0 ? (
            Object.entries(groupedByRoom).map(([room, items]) => (
              <div key={room} className="space-y-1.5 mb-6 page-break-inside-avoid">
                {/* Room Section Header Box */}
                <div className="flex items-center space-x-2">
                  <div className="px-4 py-1 bg-[#1A5276] text-white font-bold text-xs rounded-sm">
                    RM
                  </div>
                  <div className="px-6 py-1 bg-gray-100 border border-gray-300 text-gray-900 font-bold text-sm rounded-sm">
                    {room}
                  </div>
                  <span className="text-[11px] text-gray-500 font-medium">
                    ({items.length} active prescriptions)
                  </span>
                </div>

                {/* Table */}
                <div className="overflow-x-auto border border-gray-400">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-[#3498DB] text-white font-bold uppercase text-[10px]">
                        <th className="p-1.5 border border-gray-400 w-12 text-center">Rx #</th>
                        <th className="p-1.5 border border-gray-400">Medication Name</th>
                        <th className="p-1.5 border border-gray-400 w-24">Dose</th>
                        <th className="p-1.5 border border-gray-400">Frequency</th>
                        <th className="p-1.5 border border-gray-400 w-22 text-center">Start Date</th>
                        <th className="p-1.5 border border-gray-400 w-22 text-center">End Date</th>
                        <th className="p-1.5 border border-gray-400 w-20 text-center">End Time</th>
                        <th className="p-1.5 border border-gray-400 w-22 text-center">Renew Date</th>
                        <th className="p-1.5 border border-gray-400 w-20 text-center">Renew Time</th>
                        <th className="p-1.5 border border-gray-400 w-20 text-center">Status</th>
                        <th className="p-1.5 border border-gray-400 w-24 text-center">PTOM</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((m, idx) => {
                        const days = getDaysUntilRenewal(m.renewDate, m.renewTime);
                        let statusText = `${days} DAYS`;
                        let statusBg = 'bg-white';
                        let statusTextColor = 'text-gray-800';

                        if (m.status === 'hold') {
                          statusText = `${days} DAYS`;
                          statusBg = 'bg-purple-100';
                          statusTextColor = 'text-purple-900 font-bold';
                        } else if (days <= 0) {
                          statusText = '0 DAYS';
                          statusBg = 'bg-red-200';
                          statusTextColor = 'text-red-900 font-bold';
                        } else if (days === 1) {
                          statusText = '1 DAYS';
                          statusBg = 'bg-orange-200';
                          statusTextColor = 'text-orange-900 font-bold';
                        } else if (days <= 3) {
                          statusText = `${days} DAYS`;
                          statusBg = 'bg-amber-100';
                          statusTextColor = 'text-amber-900 font-bold';
                        }

                        return (
                          <tr
                            key={m.id || idx}
                            className={`border-b border-gray-300 ${
                              idx % 2 === 1 ? 'bg-gray-50/60' : 'bg-white'
                            }`}
                          >
                            <td className="p-1.5 border border-gray-300 text-center font-mono font-bold text-gray-700">
                              {room}
                            </td>
                            <td className="p-1.5 border border-gray-300 font-bold text-gray-900 uppercase">
                              {m.medicationName}
                            </td>
                            <td className="p-1.5 border border-gray-300 font-medium">{m.dose}</td>
                            <td className="p-1.5 border border-gray-300 text-gray-700 uppercase">
                              {m.frequency}
                            </td>
                            <td className="p-1.5 border border-gray-300 text-center font-mono">
                              {m.startDate}
                            </td>
                            <td className="p-1.5 border border-gray-300 text-center font-mono">
                              {m.endDate || '-'}
                            </td>
                            <td className="p-1.5 border border-gray-300 text-center font-mono">
                              {m.endTime || '-'}
                            </td>
                            <td className="p-1.5 border border-gray-300 text-center font-mono font-bold text-blue-900">
                              {m.renewDate}
                            </td>
                            <td className="p-1.5 border border-gray-300 text-center font-mono">
                              {m.renewTime || '-'}
                            </td>
                            <td
                              className={`p-1.5 border border-gray-300 text-center text-[10px] ${statusBg} ${statusTextColor}`}
                            >
                              {statusText}
                            </td>
                            <td className="p-1.5 border border-gray-300 text-center font-bold text-red-600 text-[10px]">
                              {m.ptom || (m.status === 'hold' ? 'HOLD' : '')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500 border border-dashed rounded-lg">
              No medications match the specified print filters.
            </div>
          )}

          {/* Footer Signature Box for Hospital Administration */}
          <div className="pt-6 border-t-2 border-gray-400 text-xs text-gray-700 space-y-4 page-break-inside-avoid">
            <div className="grid grid-cols-3 gap-6">
              <div className="border-t border-gray-400 pt-1 text-center">
                <span className="block font-semibold">Administering Nurse Signature</span>
                <span className="text-[10px] text-gray-500">Ward F3 Staff Verification</span>
              </div>
              <div className="border-t border-gray-400 pt-1 text-center">
                <span className="block font-semibold">Clinical Pharmacist Signature</span>
                <span className="text-[10px] text-gray-500">Central Inpatient Pharmacy</span>
              </div>
              <div className="border-t border-gray-400 pt-1 text-center">
                <span className="block font-semibold">Attending Physician Signature</span>
                <span className="text-[10px] text-gray-500">Medical Doctor Approval</span>
              </div>
            </div>
            <div className="text-[10px] text-gray-400 text-center">
              CareWare V5.0 Patient Medication Chart • Health Oasis Hospital • Strict Medical Confidentiality
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
