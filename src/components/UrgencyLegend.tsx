import React from 'react';
import { UrgencyLevel, getUrgencyLevel, getDaysUntilRenewal } from '../types/medication';
import { useMedications } from '../context/MedicationContext';

export const UrgencyLegend: React.FC = () => {
  const { medications, filterUrgency, setFilterUrgency } = useMedications();

  // Calculate live counts
  const counts = React.useMemo(() => {
    let overdue = 0;
    let oneDay = 0;
    let twoThreeDays = 0;
    let safe = 0;
    let hold = 0;

    medications.forEach((m) => {
      if (m.status === 'hold') {
        hold++;
        return;
      }
      const days = getDaysUntilRenewal(m.renewDate, m.renewTime);
      if (days <= 0) overdue++;
      else if (days === 1) oneDay++;
      else if (days <= 3) twoThreeDays++;
      else safe++;
    });

    return { overdue, oneDay, twoThreeDays, safe, hold, total: medications.length };
  }, [medications]);

  const legendItems: {
    key: UrgencyLevel | 'all' | 'hold';
    label: string;
    dotColor: string;
    badgeBg: string;
    count: number;
    description: string;
  }[] = [
    {
      key: 'all',
      label: 'All Active',
      dotColor: 'bg-blue-600',
      badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
      count: counts.total,
      description: 'Full Ward F3 patient list',
    },
    {
      key: 'overdue',
      label: 'Due Today / Overdue',
      dotColor: 'bg-[#E74C3C]',
      badgeBg: 'bg-red-100 text-red-800 border-red-200',
      count: counts.overdue,
      description: 'Renewal due today or past deadline',
    },
    {
      key: 'one_day',
      label: 'Due in 1 Day',
      dotColor: 'bg-[#E67E22]',
      badgeBg: 'bg-orange-100 text-orange-800 border-orange-200',
      count: counts.oneDay,
      description: 'Requires pharmacy refill tomorrow',
    },
    {
      key: 'two_three_days',
      label: 'Due in 2-3 Days',
      dotColor: 'bg-[#F1C40F]',
      badgeBg: 'bg-amber-100 text-amber-900 border-amber-200',
      count: counts.twoThreeDays,
      description: 'Upcoming renewal window',
    },
    {
      key: 'safe',
      label: 'Safe (> 3 Days)',
      dotColor: 'bg-[#27AE60]',
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      count: counts.safe,
      description: 'Sufficient supply on ward',
    },
    {
      key: 'hold',
      label: 'Clinical HOLD',
      dotColor: 'bg-purple-600',
      badgeBg: 'bg-purple-100 text-purple-800 border-purple-200',
      count: counts.hold,
      description: 'Withheld pending MD evaluation',
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-3 sm:p-4 mb-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-gray-100">
        <div>
          <h2 className="text-xs sm:text-sm font-bold text-[#1C2833] uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
            Renewal Urgency Status & Color Codes
          </h2>
          <p className="text-[11px] text-gray-500">
            Click any urgency badge to filter medications in real time
          </p>
        </div>
        {filterUrgency !== 'all' && (
          <button
            onClick={() => setFilterUrgency('all')}
            className="text-xs font-semibold text-teal-700 hover:text-teal-900 underline self-start sm:self-auto cursor-pointer"
          >
            Clear Filter (Show All)
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {legendItems.map((item) => {
          const isSelected = filterUrgency === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setFilterUrgency(item.key)}
              className={`flex items-center justify-between p-2 rounded-lg text-left transition border cursor-pointer ${
                isSelected
                  ? 'border-teal-600 bg-teal-50/70 shadow-xs ring-1 ring-teal-600'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-2 truncate">
                <span className={`w-3 h-3 rounded-full shrink-0 ${item.dotColor} shadow-xs`}></span>
                <span
                  className={`text-xs font-medium truncate ${
                    isSelected ? 'font-bold text-teal-950' : 'text-gray-700'
                  }`}
                >
                  {item.label}
                </span>
              </div>
              <span
                className={`text-[11px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${item.badgeBg}`}
              >
                {item.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
