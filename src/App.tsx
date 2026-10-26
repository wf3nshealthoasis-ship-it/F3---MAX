import React, { useState, useEffect, useMemo } from 'react';
import { AuthProvider } from './context/AuthContext';
import { MedicationProvider, useMedications } from './context/MedicationContext';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { BottomNav } from './components/BottomNav';
import { AddEditMedicationModal } from './components/AddEditMedicationModal';
import { MedicationDetailModal } from './components/MedicationDetailModal';
import { PrintMedicationChartModal } from './components/PrintMedicationChartModal';
import { NotificationsModal } from './components/NotificationsModal';
import { CareWareFrequencyGuideModal } from './components/CareWareFrequencyGuideModal';
import { SettingsModal } from './components/SettingsModal';
import { MedicationItem } from './types/medication';
import { testConnection } from './firebase';
import { Plus } from 'lucide-react';

function MainApp() {
  const { medications } = useMedications();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'medications' | 'notifications' | 'settings'>('dashboard');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [medicationToEdit, setMedicationToEdit] = useState<MedicationItem | null>(null);
  
  // Track active detail medication by ID so updates are always reflected in real time
  const [selectedMedicationId, setSelectedMedicationId] = useState<string | null>(null);

  const activeDetailMedication = useMemo(() => {
    if (!selectedMedicationId) return null;
    return medications.find((m) => m.id === selectedMedicationId) || null;
  }, [medications, selectedMedicationId]);

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [singlePrintMedication, setSinglePrintMedication] = useState<MedicationItem | null>(null);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [isFrequencyGuideOpen, setIsFrequencyGuideOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Validate Firestore Connection on boot per Skill requirement
  useEffect(() => {
    testConnection();
  }, []);

  const handleOpenAdd = () => {
    setMedicationToEdit(null);
    setIsAddModalOpen(true);
  };

  const handleEditMedication = (med: MedicationItem) => {
    setMedicationToEdit(med);
    setIsAddModalOpen(true);
  };

  const handleViewDetail = (med: MedicationItem) => {
    setSelectedMedicationId(med.id);
  };

  const handlePrintAll = () => {
    setSinglePrintMedication(null);
    setIsPrintModalOpen(true);
  };

  const handlePrintSingle = (med: MedicationItem) => {
    setSinglePrintMedication(med);
    setIsPrintModalOpen(true);
  };

  const handleBottomTabChange = (tab: 'dashboard' | 'medications' | 'notifications' | 'settings') => {
    setActiveTab(tab);
    if (tab === 'notifications') {
      setIsNotificationsModalOpen(true);
    } else if (tab === 'settings') {
      setIsSettingsModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-[#1C2833] pb-24 md:pb-12 flex flex-col font-sans">
      {/* Top Application Bar */}
      <Header
        onOpenPrint={handlePrintAll}
        onOpenNotifications={() => setIsNotificationsModalOpen(true)}
        onOpenFrequencyGuide={() => setIsFrequencyGuideOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenAddModal={handleOpenAdd}
      />

      {/* Main Content Dashboard */}
      <main className="flex-1">
        <Dashboard
          onOpenAddModal={handleOpenAdd}
          onViewDetail={handleViewDetail}
          onEditMedication={handleEditMedication}
          onOpenPrint={handlePrintAll}
        />
      </main>

      {/* Floating Action Button (Visible on desktop/tablet) */}
      <button
        onClick={handleOpenAdd}
        title="Add Patient Medication"
        className="hidden md:flex fixed bottom-8 right-8 z-30 w-14 h-14 rounded-full bg-teal-600 hover:bg-teal-500 text-white shadow-xl items-center justify-center transition-transform hover:scale-105 active:scale-95 border-2 border-white cursor-pointer"
      >
        <Plus className="w-7 h-7" />
      </button>

      {/* Mobile Fixed 5-Tab Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={handleBottomTabChange}
        onOpenAddModal={handleOpenAdd}
      />

      {/* Add / Edit Medication Full-Screen Sheet */}
      <AddEditMedicationModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setMedicationToEdit(null);
        }}
        medicationToEdit={medicationToEdit}
      />

      {/* Medication Detail View Modal - dynamically reactive to live edits */}
      <MedicationDetailModal
        medication={activeDetailMedication}
        onClose={() => setSelectedMedicationId(null)}
        onEdit={(med) => {
          handleEditMedication(med);
        }}
        onPrintSingle={(med) => {
          handlePrintSingle(med);
        }}
      />

      {/* Official Patient Medication Administration Record Print Modal */}
      <PrintMedicationChartModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        singleMedication={singlePrintMedication}
      />

      {/* Notifications Center */}
      <NotificationsModal
        isOpen={isNotificationsModalOpen}
        onClose={() => setIsNotificationsModalOpen(false)}
        onSelectMedication={handleViewDetail}
      />

      {/* CareWare V5.0 Drug Frequencies Schedule Modal */}
      <CareWareFrequencyGuideModal
        isOpen={isFrequencyGuideOpen}
        onClose={() => setIsFrequencyGuideOpen(false)}
      />

      {/* Profile & Hospital Ward Settings */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MedicationProvider>
        <MainApp />
      </MedicationProvider>
    </AuthProvider>
  );
}
