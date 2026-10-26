import React, { useState } from 'react';
import { X, Search, Clock, HelpCircle, Pill } from 'lucide-react';
import { CAREWARE_FREQUENCIES } from '../data/wardF3Data';

interface CareWareFrequencyGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFrequency?: (freq: string, code: string, doseTimes: string) => void;
}

export const CareWareFrequencyGuideModal: React.FC<CareWareFrequencyGuideModalProps> = ({
  isOpen,
  onClose,
  onSelectFrequency,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filtered = CAREWARE_FREQUENCIES.filter(
    (item) =>
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.frequency.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.remarks && item.remarks.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-[#1A5276] text-white">
          <div className="flex items-center space-x-3">
            <Pill className="w-5 h-5 text-teal-300" />
            <div>
              <h3 className="text-base font-bold">
                Health Oasis Hospital • Drug Frequencies Schedule
              </h3>
              <p className="text-xs text-blue-100/80">CareWare V5.0 Reference (Screen V052024)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-blue-100 hover:text-white hover:bg-white/10 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center space-x-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search by code (e.g. OD, BID, Q6H, BIDI, HS, PRN) or frequency description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-[#1A5276] focus:outline-none"
            />
          </div>
          <span className="text-xs text-gray-500 font-semibold whitespace-nowrap">
            {filtered.length} of {CAREWARE_FREQUENCIES.length} Codes
          </span>
        </div>

        {/* Table of Frequencies */}
        <div className="overflow-y-auto p-4 flex-1">
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-100 text-gray-700 font-bold uppercase text-[11px] border-b border-gray-200">
                  <th className="p-2.5 w-12 text-center">#</th>
                  <th className="p-2.5 w-24">Code</th>
                  <th className="p-2.5">CareWare Frequency Standard</th>
                  <th className="p-2.5 w-24 text-center">Start Time</th>
                  <th className="p-2.5">Specific Dose Times Schedule</th>
                  <th className="p-2.5">Clinical Remarks</th>
                  {onSelectFrequency && <th className="p-2.5 w-20 text-center">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((item) => (
                  <tr key={item.slNo} className="hover:bg-teal-50/50 transition">
                    <td className="p-2.5 text-center font-mono text-gray-400">{item.slNo}</td>
                    <td className="p-2.5 font-mono font-bold text-[#1A5276] bg-blue-50/50">
                      {item.code}
                    </td>
                    <td className="p-2.5 font-medium text-gray-900">{item.frequency}</td>
                    <td className="p-2.5 text-center font-mono text-gray-600">{item.startTime}</td>
                    <td className="p-2.5 font-mono text-teal-800 font-medium">{item.doseTimes}</td>
                    <td className="p-2.5">
                      {item.remarks ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          {item.remarks}
                        </span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    {onSelectFrequency && (
                      <td className="p-2 text-center">
                        <button
                          onClick={() => {
                            onSelectFrequency(item.frequency, item.code, item.doseTimes);
                            onClose();
                          }}
                          className="px-2 py-1 rounded bg-teal-600 hover:bg-teal-700 text-white font-semibold text-[10px]"
                        >
                          Use Code
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-50 border-t border-gray-200 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
