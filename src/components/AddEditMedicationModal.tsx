import React, { useState, useEffect } from 'react';
import { X, Plus, Paperclip, Trash2, Calendar, Clock, AlertCircle } from 'lucide-react';
import {
  MedicationItem,
  MedicationForm,
  MedicationAttachment,
} from '../types/medication';
import { CAREWARE_FREQUENCIES } from '../data/wardF3Data';
import { useMedications } from '../context/MedicationContext';

interface AddEditMedicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  medicationToEdit?: MedicationItem | null;
}

const WARD_ROOM_OPTIONS = [
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

const MEDICATION_FORMS: MedicationForm[] = [
  'Tablet',
  'Capsule',
  'Liquid',
  'Syrup',
  'Injection',
  'Cream',
  'Gel',
  'Drops',
  'Inhaler',
  'Spray',
  'Sachet',
  'Shampoo',
  'Other',
];

export const AddEditMedicationModal: React.FC<AddEditMedicationModalProps> = ({
  isOpen,
  onClose,
  medicationToEdit,
}) => {
  const { addMedication, updateMedication } = useMedications();

  // Form State
  const [patientRoom, setPatientRoom] = useState('377');
  const [customRoom, setCustomRoom] = useState('');
  const [patientName, setPatientName] = useState('');
  const [medicationName, setMedicationName] = useState('');
  const [dose, setDose] = useState('');
  const [form, setForm] = useState<MedicationForm>('Tablet');
  const [frequency, setFrequency] = useState('ONCE DAILY');
  const [frequencyCode, setFrequencyCode] = useState('OD');
  const [doseTimes, setDoseTimes] = useState('09:00');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('9:00 AM');
  const [renewDate, setRenewDate] = useState('');
  const [renewTime, setRenewTime] = useState('9:00 AM');
  const [reminderDays, setReminderDays] = useState<number[]>([1, 2, 3]);
  const [prescribingDoctor, setPrescribingDoctor] = useState('');
  const [pharmacy, setPharmacy] = useState('');
  const [notes, setNotes] = useState('');
  const [ptom, setPtom] = useState('');
  const [attachments, setAttachments] = useState<MedicationAttachment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Pre-fill on Edit or set Defaults
  useEffect(() => {
    if (medicationToEdit) {
      if (WARD_ROOM_OPTIONS.includes(medicationToEdit.patientRoom)) {
        setPatientRoom(medicationToEdit.patientRoom);
        setCustomRoom('');
      } else {
        setPatientRoom('custom');
        setCustomRoom(medicationToEdit.patientRoom);
      }
      setPatientName(medicationToEdit.patientName || `Ward F3 - Bed ${medicationToEdit.patientRoom}`);
      setMedicationName(medicationToEdit.medicationName);
      setDose(medicationToEdit.dose);
      setForm(medicationToEdit.form || 'Tablet');
      setFrequency(medicationToEdit.frequency);
      setFrequencyCode(medicationToEdit.frequencyCode || '');
      setDoseTimes(medicationToEdit.doseTimes || '');
      setStartDate(medicationToEdit.startDate);
      setEndDate(medicationToEdit.endDate || '');
      setEndTime(medicationToEdit.endTime || '9:00 AM');
      setRenewDate(medicationToEdit.renewDate);
      setRenewTime(medicationToEdit.renewTime || '9:00 AM');
      setReminderDays(medicationToEdit.reminderDays || [1, 2, 3]);
      setPrescribingDoctor(medicationToEdit.prescribingDoctor || '');
      setPharmacy(medicationToEdit.pharmacy || '');
      setNotes(medicationToEdit.notes || '');
      setPtom(medicationToEdit.ptom || '');
      setAttachments(medicationToEdit.attachments || []);
    } else {
      // Default dates
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const renew = new Date();
      renew.setDate(today.getDate() + 7);
      const renewStr = renew.toISOString().split('T')[0];

      setPatientRoom('377');
      setCustomRoom('');
      setPatientName('Ward F3 - Bed 377');
      setMedicationName('');
      setDose('');
      setForm('Tablet');
      setFrequency('ONCE DAILY');
      setFrequencyCode('OD');
      setDoseTimes('09:00');
      setStartDate(todayStr);
      setEndDate('');
      setEndTime('9:00 AM');
      setRenewDate(renewStr);
      setRenewTime('9:00 AM');
      setReminderDays([1, 2, 3]);
      setPrescribingDoctor('Attending Physician');
      setPharmacy('Central Ward Pharmacy');
      setNotes('');
      setPtom('');
      setAttachments([]);
    }
    setErrorMessage('');
  }, [medicationToEdit, isOpen]);

  if (!isOpen) return null;

  // When CareWare frequency changes, auto-populate code and dose times
  const handleFrequencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedText = e.target.value;
    setFrequency(selectedText);

    const found = CAREWARE_FREQUENCIES.find(
      (f) =>
        f.frequency.toLowerCase() === selectedText.toLowerCase() ||
        f.code.toLowerCase() === selectedText.toLowerCase()
    );
    if (found) {
      setFrequencyCode(found.code);
      setDoseTimes(found.doseTimes);
    }
  };

  const toggleReminderLead = (day: number) => {
    if (reminderDays.includes(day)) {
      setReminderDays(reminderDays.filter((d) => d !== day));
    } else {
      setReminderDays([...reminderDays, day].sort());
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = () => {
        const newAtt: MedicationAttachment = {
          id: 'att-' + Date.now() + '-' + i,
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          url: reader.result as string,
          uploadedAt: new Date().toISOString(),
        };
        setAttachments((prev) => [...prev, newAtt]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAttachment = (attId: string) => {
    setAttachments(attachments.filter((a) => a.id !== attId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!medicationName.trim()) {
      setErrorMessage('Please enter the medication name.');
      return;
    }
    if (!dose.trim()) {
      setErrorMessage('Please enter the medication dosage (e.g. 500 mg, 14 UNIT).');
      return;
    }
    if (!renewDate) {
      setErrorMessage('Please specify the renewal date.');
      return;
    }

    const room = patientRoom === 'custom' ? customRoom.trim() || 'Ward' : patientRoom;

    setIsSubmitting(true);
    try {
      const payload = {
        patientRoom: room,
        patientName: patientName.trim() || `Ward F3 - Bed ${room}`,
        medicationName: medicationName.trim(),
        dose: dose.trim(),
        form,
        frequency,
        frequencyCode,
        doseTimes,
        startDate: startDate || new Date().toISOString().split('T')[0],
        endDate: endDate || '',
        endTime: endTime || '9:00 AM',
        renewDate,
        renewTime: renewTime || '9:00 AM',
        reminderDays,
        prescribingDoctor: prescribingDoctor.trim() || 'Attending Physician',
        pharmacy: pharmacy.trim() || 'Central Ward Pharmacy',
        notes: notes.trim(),
        status: medicationToEdit ? medicationToEdit.status : ('active' as const),
        ptom: ptom.trim(),
        attachments,
      };

      if (medicationToEdit) {
        await updateMedication(medicationToEdit.id, payload);
      } else {
        await addMedication(payload);
      }
      onClose();
    } catch (err) {
      console.error('Save error:', err);
      setErrorMessage('Failed to save medication. Check database connectivity.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50/90">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {medicationToEdit ? 'Edit Medication Record' : 'Add Medication to Ward F3'}
            </h3>
            <p className="text-xs text-gray-500">
              Health Oasis Hospital • Patient Medication Administration Record
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 sm:p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-semibold text-red-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Patient & Room */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Patient Room / Bed *
              </label>
              <div className="flex space-x-2">
                <select
                  value={patientRoom}
                  onChange={(e) => setPatientRoom(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-[#1A5276] focus:outline-none"
                >
                  {WARD_ROOM_OPTIONS.map((rm) => (
                    <option key={rm} value={rm}>
                      RM {rm}
                    </option>
                  ))}
                  <option value="custom">Other / Custom Room</option>
                </select>

                {patientRoom === 'custom' && (
                  <input
                    type="text"
                    placeholder="e.g. 399"
                    value={customRoom}
                    onChange={(e) => setCustomRoom(e.target.value)}
                    className="w-24 px-2 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#1A5276]"
                    required
                  />
                )}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Patient Name / Identification
              </label>
              <input
                type="text"
                placeholder="e.g. Ward F3 - Bed 377"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#1A5276] focus:outline-none"
              />
            </div>
          </div>

          {/* Section 2: Medication Name, Form, Dosage */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Medication Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Pantoprazole, Metformin, Enoxaparin"
                value={medicationName}
                onChange={(e) => setMedicationName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#1A5276] focus:outline-none font-medium"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Form</label>
              <select
                value={form}
                onChange={(e) => setForm(e.target.value as MedicationForm)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-[#1A5276] focus:outline-none"
              >
                {MEDICATION_FORMS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">
              Dose / Strength * (e.g. 500 mg, 14 UNIT, 1 TAB, 30 ML, APPLY)
            </label>
            <input
              type="text"
              placeholder="e.g. 500 mg, 20 mg, 14 UNIT, 2 DROPS"
              value={dose}
              onChange={(e) => setDose(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#1A5276] focus:outline-none font-medium"
              required
            />
          </div>

          {/* Section 3: Frequency & CareWare Standard Times */}
          <div className="p-3.5 bg-teal-50/40 rounded-xl border border-teal-200/60 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-teal-900 uppercase tracking-wider">
                CareWare V5.0 Frequency & Dosing Times
              </label>
              {frequencyCode && (
                <span className="text-[11px] font-mono text-teal-800 bg-teal-100 px-2 py-0.5 rounded font-bold">
                  Code: {frequencyCode}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">
                  Select Frequency Standard
                </label>
                <select
                  value={frequency}
                  onChange={handleFrequencyChange}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-teal-300 bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="ONCE DAILY">ONCE DAILY (OD - 09:00)</option>
                  <option value="TWICE DAILY">TWICE DAILY (BID - 09:00, 21:00)</option>
                  <option value="THRICE DAILY">THRICE DAILY (TID - 09:00, 15:00, 21:00)</option>
                  <option value="EVERY 6 HOURLY">EVERY 6 HOURLY (Q6H2 - 06:00, 12:00, 18:00, 00:00)</option>
                  <option value="EVERY 8 HOUR">EVERY 8 HOUR (Q8H1 - 01:00, 09:00, 17:00)</option>
                  <option value="ONCE DAILY AT NIGHT">ONCE DAILY AT NIGHT (HS - 21:00)</option>
                  <option value="AT BEDTIME">AT BEDTIME (HS - 22:00)</option>
                  <option value="ONCE WEEKLY">ONCE WEEKLY (WEEK - 00:00)</option>
                  <option value="EVERY OTHER DAY">EVERY OTHER DAY (O2D - 08:00)</option>
                  <option value="THRICE DAILY PRN">THRICE DAILY PRN (PRNTID - As needed)</option>
                  {CAREWARE_FREQUENCIES.map((f) => (
                    <option key={f.slNo} value={f.frequency}>
                      {f.code}: {f.frequency}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">
                  Specific Dose Times (CareWare Schedule)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 09:00, 21:00"
                  value={doseTimes}
                  onChange={(e) => setDoseTimes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-teal-300 bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Schedule & Renewal Date/Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Start Date *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#1A5276] focus:outline-none font-mono"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                End Date (Optional)
              </label>
              <div className="flex space-x-2">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#1A5276] focus:outline-none font-mono"
                />
                <input
                  type="text"
                  placeholder="9:00 PM"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-24 px-2 py-2 text-xs rounded-lg border border-gray-300 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Renewal Deadline Highlighted */}
          <div className="p-3.5 bg-orange-50/70 rounded-xl border border-orange-200 space-y-2">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-orange-600" />
              <label className="text-xs font-bold text-orange-900 uppercase">
                Renewal Schedule & Reminders *
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-xs text-gray-600 block mb-1">Renew Date *</span>
                <input
                  type="date"
                  value={renewDate}
                  onChange={(e) => setRenewDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-orange-300 bg-white focus:ring-2 focus:ring-orange-500 font-mono font-bold text-gray-900"
                  required
                />
              </div>
              <div>
                <span className="text-xs text-gray-600 block mb-1">Renew Time</span>
                <input
                  type="text"
                  placeholder="e.g. 9:00 AM"
                  value={renewTime}
                  onChange={(e) => setRenewTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-orange-300 bg-white focus:ring-2 focus:ring-orange-500 font-mono"
                />
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-gray-700 block mb-1">
                Notify Clinicians Before Renewal:
              </span>
              <div className="flex items-center space-x-2">
                {[1, 2, 3].map((d) => {
                  const isChecked = reminderDays.includes(d);
                  return (
                    <button
                      type="button"
                      key={d}
                      onClick={() => toggleReminderLead(d)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                        isChecked
                          ? 'bg-orange-600 text-white border-orange-600 shadow-2xs'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {d} Day{d > 1 ? 's' : ''} Before
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 5: Doctor, Pharmacy, Remarks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Prescribing Doctor
              </label>
              <input
                type="text"
                placeholder="e.g. Dr. Al-Mansoor, Dr. Tariq"
                value={prescribingDoctor}
                onChange={(e) => setPrescribingDoctor(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#1A5276]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Dispensing Pharmacy
              </label>
              <input
                type="text"
                placeholder="e.g. Central Ward Pharmacy"
                value={pharmacy}
                onChange={(e) => setPharmacy(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#1A5276]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">
              Remarks (PTOM / Hospital Flags)
            </label>
            <input
              type="text"
              placeholder="e.g. HOLD, PATIENT ON LEVOTHYROXINE, PTOM"
              value={ptom}
              onChange={(e) => setPtom(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#1A5276]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">
              Clinical Instructions & Notes
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Administer with food. Check BP before dose."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#1A5276]"
            />
          </div>

          {/* Section 6: File Attachments */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-700 flex items-center space-x-1.5">
                <Paperclip className="w-3.5 h-3.5 text-gray-500" />
                <span>Attach Prescriptions or Lab Reports</span>
              </label>
              <label className="cursor-pointer text-xs font-bold text-teal-700 hover:text-teal-900 bg-teal-50 px-2.5 py-1 rounded border border-teal-200">
                + Add Files
                <input
                  type="file"
                  multiple
                  accept="application/pdf,image/*,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {attachments.length > 0 && (
              <div className="space-y-1.5">
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between p-2 rounded bg-gray-50 border border-gray-200 text-xs"
                  >
                    <span className="truncate max-w-[80%] text-gray-700 font-medium">
                      {att.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(att.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-gray-200 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg text-xs font-semibold bg-[#1A5276] text-white hover:bg-[#154360] transition shadow-xs flex items-center space-x-1.5"
            >
              <span>{isSubmitting ? 'Saving...' : medicationToEdit ? 'Update Record' : 'Save Medication'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
