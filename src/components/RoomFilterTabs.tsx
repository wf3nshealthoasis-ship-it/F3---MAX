import React from 'react';
import { useMedications } from '../context/MedicationContext';
import { getUrgencyLevel } from '../types/medication';

const WARD_ROOMS = [
  '377',
  '380',
  '381',
  '382',
  '383',
  '384',
  '385',
  '386',
  '309',
  '387',
  '388',
  '390',
  '392',
  '394',
];

export const RoomFilterTabs: React.FC = () => {
  const { medications, selectedRoom, setSelectedRoom } = useMedications();

  // Compute room statistics (total count + overdue count per room)
  const roomStats = React.useMemo(() => {
    const stats: Record<string, { total: number; urgentCount: number }> = {};
    WARD_ROOMS.forEach((rm) => {
      stats[rm] = { total: 0, urgentCount: 0 };
    });

    medications.forEach((m) => {
      const rm = m.patientRoom;
      if (!stats[rm]) {
        stats[rm] = { total: 0, urgentCount: 0 };
      }
      stats[rm].total++;
      const urgency = getUrgencyLevel(m);
      if (urgency === 'overdue' || urgency === 'one_day' || m.status === 'hold') {
        stats[rm].urgentCount++;
      }
    });

    return stats;
  }, [medications]);

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
          <span>Ward F3 Patient Rooms</span>
          <span className="text-gray-400 font-normal">({WARD_ROOMS.length} Inpatient Rooms)</span>
        </label>
        {selectedRoom !== 'all' && (
          <button
            onClick={() => setSelectedRoom('all')}
            className="text-xs font-semibold text-teal-700 hover:text-teal-900 cursor-pointer"
          >
            Show All Rooms
          </button>
        )}
      </div>

      <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300">
        <button
          onClick={() => setSelectedRoom('all')}
          className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center space-x-1.5 cursor-pointer ${
            selectedRoom === 'all'
              ? 'bg-[#1A5276] text-white shadow-sm ring-2 ring-[#1A5276]/30'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <span>All Rooms</span>
          <span
            className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
              selectedRoom === 'all' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {medications.length}
          </span>
        </button>

        {WARD_ROOMS.map((room) => {
          const isSelected = selectedRoom === room;
          const stat = roomStats[room] || { total: 0, urgentCount: 0 };
          return (
            <button
              key={room}
              onClick={() => setSelectedRoom(room)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center space-x-1.5 cursor-pointer ${
                isSelected
                  ? 'bg-[#1A5276] text-white shadow-sm ring-2 ring-[#1A5276]/30'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <span>RM {room}</span>
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {stat.total}
              </span>
              {stat.urgentCount > 0 && (
                <span
                  title={`${stat.urgentCount} medication(s) require renewal attention`}
                  className="w-2 h-2 rounded-full bg-[#E74C3C] ring-2 ring-white animate-pulse"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
