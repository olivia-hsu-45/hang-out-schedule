export interface BookingDetails {
  location: string;
  time: string;
  activity: string;
}

export interface ScheduleEntry {
  date: string; // YYYY-MM-DD
  city: string;
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  isAvailable: boolean; // false means "已被預約 / 沒空"
  bookedBy?: string;
  bookingDetails?: BookingDetails;
}

export type Language = "zh" | "en" | "ja" | "ko";
