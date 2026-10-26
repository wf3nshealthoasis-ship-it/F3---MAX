import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Filter,
  ArrowUpDown,
  AlertTriangle,
  Clock,
  Pill,
  Sparkles,
  Calendar,
  CheckCircle2,
  Share2,
} from 'lucide-react';
import { useMedications } from '../context/MedicationContext';
import { UrgencyLegend } from './UrgencyLegend';
import { RoomFilterTabs } from './RoomFilterTabs';
import { MedicationCard } from './MedicationCard';
import {
  MedicationItem,
  getUrgencyLevel,
  getDaysUntilRenewal,
  UrgencyLevel,
} from '../types/medication';

interface DashboardProps {
  onOpenAddModal: () => void;
  onViewDetail: (med: MedicationItem) => void;
  onEditMedication: (med: MedicationItem) => void;
  onOpenPrint: () => void;
}

type SortOption = 'renew_asc' | 'renew_desc' | 'name_asc' | 'room_asc';

export const Dashboard: React.FC<DashboardProps> = ({
  onOpenAddModal,
  onViewDetail,
  onEditMedication,
  onOpenPrint,
}) => {
  const {
    medications,
    loading,
    selectedRoom,
    searchQuery,
    setSearchQuery,
    filterUrgency,
    setFilterUrgency,
  } = useMedications();

  const [sortBy, setSortBy] = useState<SortOption>('renew_asc');

  // Filter and Sort medications
  const filteredAndSortedMedications = useMemo(() => {
    return medications
      .filter((med) => {
        // Room Filter
        if (selectedRoom !== 'all' && med.patientRoom !== selectedRoom) {
          return false;
        }

        // Urgency Filter
        if (filterUrgency !== 'all') {
          if (filterUrgency === 'hold') {
            if (med.status !== 'hold') return false;
          } else {
            const urgency = getUrgencyLevel(med);
            if (urgency !== filterUrgency) return false;
          }
        }

        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = med.medicationName.toLowerCase().includes(q);
          const matchRoom = med.patientRoom.toLowerCase().includes(q);
          const matchDose = med.dose.toLowerCase().includes(q);
          const matchFreq = med.frequency.toLowerCase().includes(q);
          const matchDoc = med.prescribingDoctor?.toLowerCase().includes(q);
          const matchPtom = med.ptom?.toLowerCase().includes(q);
          if (!matchName && !matchRoom && !matchDose && !matchFreq && !matchDoc && !matchPtom) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name_asc') {
          return a.medicationName.localeCompare(b.medicationName);
        }
        if (sortBy === 'room_asc') {
          return a.patientRoom.localeCompare(b.patientRoom, undefined, { numeric: true });
        }
        if (sortBy === 'renew_desc') {
          return (b.renewDate || '').localeCompare(a.renewDate || '');
        }
        // default renew_asc (earliest renewal first)
        const daysA = getDaysUntilRenewal(a.renewDate, a.renewTime);
        const daysB = getDaysUntilRenewal(b.renewDate, b.renewTime);
        return daysA - daysB;
      });
  }, [medications, selectedRoom, filterUrgency, searchQuery, sortBy]);

  // Urgent Alerts (due today, 1 day, or overdue) for the quick renewal strip
  const urgentRenewalAlerts = useMemo(() => {
    return medications.filter((m) => {
      if (m.status === 'hold') return true;
      const days = getDaysUntilRenewal(m.renewDate, m.renewTime);
      return days <= 1;
    });
  }, [medications]);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4">
      {/* Urgent Renewal Banner (Visible if any renewals are overdue or due today) */}
      {urgentRenewalAlerts.length > 0 && (
        <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl shadow-md p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-white animate-bounce" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">
                Ward F3 Renewal Attention: {urgentRenewalAlerts.length} Prescription(s) Due Today or Tomorrow
              </h3>
              <p className="text-xs text-white/90">
                Action required with Central Inpatient Pharmacy to prevent medication disruption.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-end sm:self-auto">
            <button
              onClick={() => setFilterUrgency('overdue')}
              className="px-3 py-1.5 rounded-lg bg-white text-red-700 text-xs font-bold hover:bg-gray-100 transition shadow-xs"
            >
              Filter Due Today
            </button>
            <button
              onClick={onOpenPrint}
              className="px-3 py-1.5 rounded-lg bg-white/20 text-white hover:bg-white/30 text-xs font-semibold transition"
            >
              Print Urgent Chart
            </button>
          </div>
        </div>
      )}

      {/* Color Code Legend Strip */}
      <UrgencyLegend />

      {/* Room Tabs Filter Strip */}
      <RoomFilterTabs />

      {/* Search, Filter, Sort, and Add Controls Bar */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-3 sm:p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search medications by name (e.g. Pantoprazole), room (e.g. 380), dose, or doctor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-lg border border-gray-300 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-[#1A5276] focus:outline-none transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-xs text-gray-400 hover:text-gray-600 font-bold"
            >
              ×
            </button>
          )}
        </div>

        {/* Sort and Add Controls */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="flex items-center space-x-1.5 border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-gray-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-transparent font-semibold text-gray-700 focus:outline-none cursor-pointer"
            >
              <option value="renew_asc">Renewal: Due Soonest</option>
              <option value="renew_desc">Renewal: Latest</option>
              <option value="room_asc">Sort by Room #</option>
              <option value="name_asc">Drug Name: A - Z</option>
            </select>
          </div>

          <button
            onClick={onOpenAddModal}
            className="px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-[#1A5276] text-white hover:bg-[#154360] transition shadow-xs inline-flex items-center space-x-1.5 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Medication</span>
          </button>
        </div>
      </div>

      {/* Medication Cards Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-sm font-semibold text-gray-600">
            Syncing Ward F3 Medication Administration Records...
          </p>
        </div>
      ) : filteredAndSortedMedications.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-gray-500 px-1 font-medium">
            <span>
              Showing {filteredAndSortedMedications.length} of {medications.length} total active
              prescriptions
              {selectedRoom !== 'all' ? ` in Room ${selectedRoom}` : ' across Ward F3'}
            </span>
            <span>Sorted by: {sortBy.replace('_', ' ').toUpperCase()}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
            {filteredAndSortedMedications.map((med) => (
              <MedicationCard
                key={med.id}
                medication={med}
                onViewDetail={onViewDetail}
                onEdit={onEditMedication}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center space-y-3">
          <Pill className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="text-base font-bold text-gray-800">No Medications Found</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            {searchQuery
              ? `No records match "${searchQuery}". Try clearing your search.`
              : 'No medications in the selected room or urgency category.'}
          </p>
          <div className="pt-2">
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterUrgency('all');
              }}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
            >
              Reset All Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
