export type MedicationForm =
  | 'Tablet'
  | 'Capsule'
  | 'Liquid'
  | 'Syrup'
  | 'Injection'
  | 'Cream'
  | 'Gel'
  | 'Drops'
  | 'Inhaler'
  | 'Spray'
  | 'Sachet'
  | 'Shampoo'
  | 'Other';

export type MedicationStatus = 'active' | 'hold' | 'inactive' | 'ended';

export type UrgencyLevel = 'overdue' | 'one_day' | 'two_three_days' | 'safe' | 'none';

export interface MedicationAttachment {
  id: string;
  name: string;
  type: string; // 'application/pdf', 'image/jpeg', 'image/png', etc.
  size: number;
  url: string; // data URL or mock file preview URL
  uploadedAt: string;
}

export interface MedicationItem {
  id: string;
  userId: string;
  patientRoom: string; // e.g., "377", "380", "381", etc.
  patientName?: string;
  medicationName: string;
  dose: string; // e.g., "30 mg", "14 UNIT", "1 TAB"
  form: MedicationForm;
  frequency: string; // e.g., "TWICE DAILY", "ONCE DAILY", "EVERY 6 HOURLY"
  frequencyCode?: string; // e.g., "BID", "OD", "Q6H2"
  doseTimes?: string; // e.g., "09:00, 21:00"
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  endTime?: string; // e.g., "9:00 PM"
  renewDate: string; // YYYY-MM-DD
  renewTime: string; // e.g., "9:00 AM"
  reminderDays: number[]; // e.g., [1, 2, 3]
  prescribingDoctor?: string;
  pharmacy?: string;
  notes?: string;
  status: MedicationStatus;
  ptom?: string; // Patient's own medication or remarks e.g. "HOLD", "PATIENT ON LEVOTHYROXINE"
  attachments: MedicationAttachment[];
  createdAt: string;
  updatedAt: string;
}

export interface DrugFrequencyCode {
  slNo: number;
  code: string;
  frequency: string;
  startTime: string;
  doseTimes: string;
  remarks?: string;
}

export interface NotificationAlert {
  id: string;
  userId: string;
  medicationId: string;
  medicationName: string;
  patientRoom: string;
  title: string;
  message: string;
  urgencyLevel: UrgencyLevel;
  status: 'pending' | 'sent' | 'dismissed';
  scheduledTime: string;
  createdAt: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  role: string;
  ward: string;
  hospital: string;
  pushEnabled: boolean;
  reminderLeadTimes: number[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Calculates the difference in full days between current time and renew date
 */
export function getDaysUntilRenewal(renewDateStr: string, renewTimeStr?: string): number {
  if (!renewDateStr) return 999;
  
  // Clean parse
  const parts = renewDateStr.split('-');
  let targetYear = 0;
  let targetMonth = 0;
  let targetDay = 0;

  if (parts.length === 3) {
    if (parts[0].length === 4) {
      // YYYY-MM-DD
      targetYear = parseInt(parts[0], 10);
      targetMonth = parseInt(parts[1], 10) - 1;
      targetDay = parseInt(parts[2], 10);
    } else {
      // DD-MM-YYYY
      targetDay = parseInt(parts[0], 10);
      targetMonth = parseInt(parts[1], 10) - 1;
      targetYear = parseInt(parts[2], 10);
    }
  }

  const targetDate = new Date(targetYear, targetMonth, targetDay);
  if (renewTimeStr) {
    const timeMatch = renewTimeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      const ampm = timeMatch[3]?.toUpperCase();
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      targetDate.setHours(hours, minutes, 0, 0);
    }
  }

  const now = new Date();
  const diffTime = targetDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Determine urgency level based on days remaining and status
 */
export function getUrgencyLevel(med: MedicationItem): UrgencyLevel {
  if (med.status === 'ended' || !med.renewDate) {
    return 'none';
  }
  const days = getDaysUntilRenewal(med.renewDate, med.renewTime);
  if (days <= 0) return 'overdue';
  if (days === 1) return 'one_day';
  if (days <= 3) return 'two_three_days';
  return 'safe';
}

export interface UrgencyBadgeConfig {
  label: string;
  colorName: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  stripeClass: string;
  badgeBg: string;
}

export function getUrgencyConfig(level: UrgencyLevel, status?: MedicationStatus): UrgencyBadgeConfig {
  if (status === 'hold') {
    return {
      label: 'ON HOLD',
      colorName: 'Hold',
      bgClass: 'bg-purple-50',
      borderClass: 'border-purple-300',
      textClass: 'text-purple-800',
      stripeClass: 'bg-purple-600',
      badgeBg: 'bg-purple-100 text-purple-800',
    };
  }

  switch (level) {
    case 'overdue':
      return {
        label: 'Due Today / Overdue',
        colorName: 'Red',
        bgClass: 'bg-red-50',
        borderClass: 'border-red-300',
        textClass: 'text-red-700',
        stripeClass: 'bg-[#E74C3C]',
        badgeBg: 'bg-red-100 text-red-800 border-red-200',
      };
    case 'one_day':
      return {
        label: 'Due in 1 Day',
        colorName: 'Orange',
        bgClass: 'bg-orange-50',
        borderClass: 'border-orange-300',
        textClass: 'text-orange-700',
        stripeClass: 'bg-[#E67E22]',
        badgeBg: 'bg-orange-100 text-orange-800 border-orange-200',
      };
    case 'two_three_days':
      return {
        label: 'Due in 2-3 Days',
        colorName: 'Yellow',
        bgClass: 'bg-amber-50',
        borderClass: 'border-amber-300',
        textClass: 'text-amber-800',
        stripeClass: 'bg-[#F1C40F]',
        badgeBg: 'bg-amber-100 text-amber-900 border-amber-200',
      };
    case 'safe':
      return {
        label: 'Safe (> 3 Days)',
        colorName: 'Green',
        bgClass: 'bg-emerald-50',
        borderClass: 'border-emerald-300',
        textClass: 'text-emerald-700',
        stripeClass: 'bg-[#27AE60]',
        badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      };
    case 'none':
    default:
      return {
        label: 'No Renewal / Inactive',
        colorName: 'Grey',
        bgClass: 'bg-gray-50',
        borderClass: 'border-gray-200',
        textClass: 'text-gray-600',
        stripeClass: 'bg-[#95A5A6]',
        badgeBg: 'bg-gray-100 text-gray-700 border-gray-200',
      };
  }
}
