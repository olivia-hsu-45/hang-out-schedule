import React, { useState, useEffect } from "react";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Globe, 
  ChevronRight, 
  ArrowLeft, 
  CheckCircle, 
  Settings, 
  Plus, 
  Trash2, 
  Edit2,
  Heart, 
  Send, 
  Lock, 
  Coffee,
  CalendarDays,
  Sparkles,
  AlertCircle,
  X,
  LogOut,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Language, ScheduleEntry } from "./types";
import { translations } from "./translations";

const getTodayStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function App() {
  // Global States
  const [lang, setLang] = useState<Language>("zh");
  const [step, setStep] = useState<number>(1);
  const [nickname, setNickname] = useState<string>(() => {
    return localStorage.getItem("olivia_user_nickname") || "";
  });
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Booking details page states
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [bookingLocation, setBookingLocation] = useState<string>("");
  const [bookingTime, setBookingTime] = useState<string>("");
  const [bookingActivity, setBookingActivity] = useState<string>("");
  const [timeError, setTimeError] = useState<boolean>(false);
  const [bookingSubmitting, setBookingSubmitting] = useState<boolean>(false);

  // Admin section states
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [adminPassword, setAdminPassword] = useState<string>("");
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [adminError, setAdminError] = useState<string>("");
  
  // Admin form states for creating/editing schedule
  const [adminDate, setAdminDate] = useState<string>(getTodayStr());
  const [adminCity, setAdminCity] = useState<string>("");
  const [adminStartTime, setAdminStartTime] = useState<string>("14:00");
  const [adminEndTime, setAdminEndTime] = useState<string>("18:00");
  const [adminIsAvailable, setAdminIsAvailable] = useState<boolean>(true);

  // Calendar displayed month/year states
  const [calendarYear, setCalendarYear] = useState<number>(() => new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState<number>(() => new Date().getMonth() + 1);

  // Admin form editing states
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [adminBookedBy, setAdminBookedBy] = useState<string>("");
  const [adminBookingLocation, setAdminBookingLocation] = useState<string>("");
  const [adminBookingTime, setAdminBookingTime] = useState<string>("");
  const [adminBookingActivity, setAdminBookingActivity] = useState<string>("");
  const [adminSessionPassword, setAdminSessionPassword] = useState<string>("");

  // Load schedule from backend
  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/schedule");
      if (res.ok) {
        const data = await res.json();
        setSchedules(data);
      }
    } catch (e) {
      console.error("Error fetching schedule:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  // Helper to translate text
  const t = (key: string): string => {
    return translations[lang][key] || key;
  };

  // Save nickname
  const handleSaveNickname = (e: React.FormEvent) => {
    e.preventDefault();
    if (nickname.trim()) {
      localStorage.setItem("olivia_user_nickname", nickname.trim());
      setStep(3);
    }
  };

  // Selection of a date
  const handleSelectDate = (dateStr: string) => {
    const entry = schedules.find((s) => s.date === dateStr);
    if (entry && entry.isAvailable) {
      setSelectedDate(dateStr);
      setBookingLocation("");
      setBookingTime(entry.startTime); // Default to start time
      setBookingActivity("");
      setTimeError(false);
      setStep(5);
    }
  };

  // Time Validation (防呆機制)
  useEffect(() => {
    if (!selectedDate || !bookingTime) return;
    const entry = schedules.find((s) => s.date === selectedDate);
    if (!entry) return;

    const parseTimeToMinutes = (t: string) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };

    const userMins = parseTimeToMinutes(bookingTime);
    const startMins = parseTimeToMinutes(entry.startTime);
    const endMins = parseTimeToMinutes(entry.endTime);

    if (userMins < startMins || userMins > endMins) {
      setTimeError(true);
    } else {
      setTimeError(false);
    }
  }, [bookingTime, selectedDate, schedules]);

  // Submit Booking to Backend
  const handleConfirmBooking = async () => {
    if (!selectedDate || !nickname || timeError) return;
    
    setBookingSubmitting(true);
    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nickname,
          date: selectedDate,
          bookingDetails: {
            location: bookingLocation || "未指定地點",
            time: bookingTime,
            activity: bookingActivity || "未指定活動",
          },
        }),
      });

      if (res.ok) {
        // Refresh schedule from backend to mark the date as booked
        await fetchSchedules();
        setStep(6);
      } else {
        alert("Booking failed. Please try again.");
      }
    } catch (e) {
      console.error(e);
      alert("Error sending booking!");
    } finally {
      setBookingSubmitting(false);
    }
  };

  // Admin Login
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === "oliviaisrich" || adminPassword === "oliviaisrich$$$" || adminPassword === "1234") {
      setIsAdminLoggedIn(true);
      setAdminSessionPassword(adminPassword);
      setAdminError("");
      setAdminPassword("");
    } else {
      setAdminError(t("loginError"));
    }
  };

  const handleEditClick = (s: ScheduleEntry) => {
    setEditingDate(s.date);
    setAdminDate(s.date);
    setAdminCity(s.city);
    setAdminStartTime(s.startTime);
    setAdminEndTime(s.endTime);
    setAdminIsAvailable(s.isAvailable);
    setAdminBookedBy(s.bookedBy || "");
    setAdminBookingLocation(s.bookingDetails?.location || "");
    setAdminBookingTime(s.bookingDetails?.time || "");
    setAdminBookingActivity(s.bookingDetails?.activity || "");
  };

  const handleCancelEdit = () => {
    setEditingDate(null);
    setAdminDate(getTodayStr());
    setAdminCity("");
    setAdminStartTime("14:00");
    setAdminEndTime("18:00");
    setAdminIsAvailable(true);
    setAdminBookedBy("");
    setAdminBookingLocation("");
    setAdminBookingTime("");
    setAdminBookingActivity("");
  };

  // Admin Save Entry
  const handleAdminSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminDate || !adminCity) {
      alert("Please fill in Date and City");
      return;
    }

    try {
      const entry: any = {
        date: adminDate,
        city: adminCity,
        startTime: adminStartTime,
        endTime: adminEndTime,
        isAvailable: adminIsAvailable,
      };

      if (!adminIsAvailable) {
        entry.bookedBy = adminBookedBy || "手動預約者";
        entry.bookingDetails = {
          location: adminBookingLocation || "未指定地點",
          time: adminBookingTime || adminStartTime,
          activity: adminBookingActivity || "未指定活動",
        };
      } else {
        entry.bookedBy = null;
        entry.bookingDetails = null;
      }

      const res = await fetch("/api/schedule/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: adminSessionPassword || "oliviaisrich",
          entry,
        }),
      });

      if (res.ok) {
        await fetchSchedules();
        alert(editingDate ? "更新成功！" : "新增成功！");
        handleCancelEdit();
      } else {
        let errMsg = "儲存失敗";
        try {
          const err = await res.json();
          errMsg = err.error || errMsg;
        } catch (_) {
          try {
            errMsg = await res.text();
          } catch (_) {}
        }
        alert(`Error saving schedule: ${errMsg} (Status: ${res.status})`);
      }
    } catch (e: any) {
      console.error(e);
      alert(`Network error while saving: ${e?.message || e}`);
    }
  };

  // Admin Delete Entry
  const handleAdminDeleteEntry = async (dateToDelete: string) => {
    if (!confirm(`您確定要刪除 ${dateToDelete} 的行程嗎？此動作將會從前台和後台的行程表中完全移除！`)) {
      return;
    }

    try {
      const res = await fetch("/api/schedule/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: adminSessionPassword || "oliviaisrich",
          date: dateToDelete,
        }),
      });

      if (res.ok) {
        await fetchSchedules();
        if (editingDate === dateToDelete) {
          handleCancelEdit();
        }
      } else {
        let errMsg = "刪除失敗";
        try {
          const err = await res.json();
          errMsg = err.error || errMsg;
        } catch (_) {
          try {
            errMsg = await res.text();
          } catch (_) {}
        }
        alert(`Error deleting: ${errMsg} (Status: ${res.status})`);
      }
    } catch (e: any) {
      console.error(e);
      alert(`Network error while deleting: ${e?.message || e}`);
    }
  };

  // Calendar render details
  const activeSchedule = selectedDate ? schedules.find((s) => s.date === selectedDate) : null;

  // Let's create an elegant grid for any year and month.
  const getDynamicGrid = (year: number, month: number) => {
    const days = [];
    // Sunday starts week. Start offset matches the day of week of the 1st of the month.
    const firstDay = new Date(year, month - 1, 1);
    const startDayOfWeek = firstDay.getDay(); 
    const totalDays = new Date(year, month, 0).getDate();

    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ blank: true, dateStr: `blank-${i}` });
    }

    for (let d = 1; d <= totalDays; d++) {
      const dayStr = d < 10 ? `0${d}` : `${d}`;
      const monthStr = month < 10 ? `0${month}` : `${month}`;
      const dateStr = `${year}-${monthStr}-${dayStr}`;
      const scheduleForDay = schedules.find((s) => s.date === dateStr);
      days.push({
        blank: false,
        dayNum: d,
        dateStr,
        schedule: scheduleForDay,
      });
    }
    return days;
  };

  const calendarDays = getDynamicGrid(calendarYear, calendarMonth);
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const handlePrevMonth = () => {
    setCalendarMonth((prev) => {
      if (prev === 1) {
        setCalendarYear((y) => y - 1);
        return 12;
      }
      return prev - 1;
    });
  };

  const handleNextMonth = () => {
    setCalendarMonth((prev) => {
      if (prev === 12) {
        setCalendarYear((y) => y + 1);
        return 1;
      }
      return prev + 1;
    });
  };

  return (
    <div className="min-h-screen mint-choco-dots text-choco-900 font-sans flex flex-col selection:bg-mint-200 selection:text-choco-900">
      
      {/* GLOBAL HEADER / LANGUAGE SWITCER */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b-2 border-choco-800/10 px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setStep(1)}>
          <div className="h-9 w-9 bg-choco-800 rounded-full overflow-hidden flex items-center justify-center text-mint-100 font-black text-base shadow-sm border border-choco-900">
            O
          </div>
          <span className="font-extrabold tracking-tight text-choco-900 text-lg">
            Olivia
          </span>
          <span className="hidden sm:inline text-xs text-choco-700 font-mono tracking-wider ml-1 px-1.5 py-0.5 rounded-md bg-mint-100 border border-mint-300">
            2026
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Language Picker */}
          <div className="relative flex items-center bg-mint-100 border-2 border-choco-800/10 rounded-full px-2 py-1 gap-1">
            <Globe className="h-3.5 w-3.5 text-choco-800" />
            <select 
              value={lang} 
              onChange={(e) => setLang(e.target.value as Language)}
              className="bg-transparent text-xs font-bold text-choco-800 outline-none cursor-pointer pr-1"
            >
              <option value="zh">繁中</option>
              <option value="en">EN</option>
              <option value="ja">日本語</option>
              <option value="ko">한국어</option>
            </select>
          </div>

          {/* Admin Toggle button */}
          <button
            onClick={() => {
              setIsAdminOpen(!isAdminOpen);
            }}
            className="flex items-center gap-1.5 text-xs text-choco-700 hover:text-choco-900 hover:bg-mint-100/50 font-bold px-3 py-1.5 rounded-full border-2 border-choco-800/10 transition-all cursor-pointer bg-white"
            id="admin-toggle-btn"
          >
            <Settings className="h-3.5 w-3.5 text-choco-700" />
            <span className="hidden sm:inline">{t("adminBtn")}</span>
          </button>
        </div>
      </header>

      {/* CORE CONTAINER FOR DYNAMIC VIEWS */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-center">
        
        {/* ADMIN OVERLAY DASHBOARD */}
        <AnimatePresence>
          {isAdminOpen && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-8 p-6 bg-white border-4 border-choco-800 rounded-3xl shadow-[6px_6px_0px_0px_rgba(74,39,23,0.15)] relative overflow-hidden"
              id="admin-panel"
            >
              {/* Backlight Decoration */}
              <div className="absolute -top-16 -right-16 w-32 h-32 bg-mint-100 rounded-full blur-3xl opacity-50" />
              <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-choco-100 rounded-full blur-3xl opacity-50" />

              {/* Absolute Close Button */}
              <button 
                onClick={() => setIsAdminOpen(false)}
                className="absolute top-4 right-4 z-50 p-2 bg-choco-50 hover:bg-choco-100 border-2 border-choco-800 rounded-full transition-all cursor-pointer text-choco-800 shadow-[2px_2px_0px_0px_rgba(74,39,23,0.15)] flex items-center justify-center hover:scale-105 active:scale-95"
                title="關閉"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center justify-between border-b-2 border-choco-100 pb-3 mb-4 pr-10">
                <div className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-choco-800" />
                  <h3 className="font-bold text-choco-900 text-lg">{t("adminPanelTitle")}</h3>
                </div>
              </div>

              {!isAdminLoggedIn ? (
                /* Admin Login View */
                <form onSubmit={handleAdminLogin} className="max-w-md mx-auto py-4">
                  <p className="text-sm text-choco-700 mb-3">{t("adminPasswordLabel")}</p>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      placeholder={t("adminPasswordPlaceholder")}
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="flex-1 border-2 border-choco-200 focus:border-choco-500 bg-choco-50/50 rounded-2xl px-4 py-2 text-sm outline-none transition-all text-choco-900"
                      required
                    />
                    <button
                      type="submit"
                      className="bg-choco-800 hover:bg-choco-900 text-mint-50 border-2 border-choco-950 font-bold px-5 py-2 rounded-2xl text-sm shadow-[2px_2px_0px_0px_rgba(74,39,23,0.15)] transition-all cursor-pointer"
                    >
                      {t("login")}
                    </button>
                  </div>
                  {adminError && (
                    <p className="text-xs text-red-600 font-bold mt-2 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {adminError}
                    </p>
                  )}
                </form>
              ) : (
                /* Admin Logged-In Manager */
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* Create / Edit Form */}
                  <form onSubmit={handleAdminSaveEntry} className="md:col-span-6 bg-mint-50/70 p-4 rounded-2xl border-2 border-choco-200 flex flex-col gap-3">
                    <h4 className="font-extrabold text-choco-800 text-sm flex items-center justify-between gap-1 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Plus className="h-4 w-4 text-choco-800" />
                        {editingDate ? `編輯行程 (${editingDate})` : "新增行程"}
                      </span>
                      {editingDate && (
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="text-[10px] bg-white text-choco-700 hover:text-choco-950 px-2 py-0.5 border border-choco-300 rounded-lg font-black transition-all cursor-pointer hover:scale-105"
                        >
                          切換至「新增行程」
                        </button>
                      )}
                    </h4>
                    
                    <div>
                      <label className="text-xs font-bold text-choco-700 block mb-1">{t("adminDate")}</label>
                      <input
                        type="date"
                        value={adminDate}
                        min={getTodayStr()}
                        onChange={(e) => setAdminDate(e.target.value)}
                        disabled={!!editingDate}
                        className={`w-full bg-white border-2 border-choco-100 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-choco-500 text-choco-900 ${editingDate ? "opacity-60 bg-choco-50/50 cursor-not-allowed" : ""}`}
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-choco-700 block mb-1">{t("adminCity")}</label>
                      <input
                        type="text"
                        placeholder="e.g. Taipei 台北"
                        value={adminCity}
                        onChange={(e) => setAdminCity(e.target.value)}
                        className="w-full bg-white border-2 border-choco-100 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-choco-500 text-choco-900"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-bold text-choco-700 block mb-1">{t("adminStartTime")}</label>
                        <input
                          type="time"
                          value={adminStartTime}
                          onChange={(e) => setAdminStartTime(e.target.value)}
                          className="w-full bg-white border-2 border-choco-100 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-choco-500 text-choco-900"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-choco-700 block mb-1">{t("adminEndTime")}</label>
                        <input
                          type="time"
                          value={adminEndTime}
                          onChange={(e) => setAdminEndTime(e.target.value)}
                          className="w-full bg-white border-2 border-choco-100 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-choco-500 text-choco-900"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 py-1">
                      <input
                        type="checkbox"
                        id="is_available_chk"
                        checked={adminIsAvailable}
                        onChange={(e) => setAdminIsAvailable(e.target.checked)}
                        className="h-4 w-4 rounded border-choco-300 text-choco-700 focus:ring-mint-400 cursor-pointer"
                      />
                      <label htmlFor="is_available_chk" className="text-xs font-bold text-choco-700 cursor-pointer">
                        {t("statusAvailable")}
                      </label>
                    </div>

                    {!adminIsAvailable && (
                      <div className="border-t-2 border-choco-200/50 pt-2.5 mt-1 flex flex-col gap-2">
                        <span className="text-[11px] font-black text-choco-800">✍️ 編輯預約詳細內容</span>
                        <div>
                          <label className="text-[10px] font-bold text-choco-700 block mb-0.5">預約者暱稱</label>
                          <input
                            type="text"
                            value={adminBookedBy}
                            onChange={(e) => setAdminBookedBy(e.target.value)}
                            className="w-full bg-white border-2 border-choco-100 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-choco-500 text-choco-900"
                            placeholder="請輸入或更新預約者暱稱"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-choco-700 block mb-0.5">約會地點</label>
                          <input
                            type="text"
                            value={adminBookingLocation}
                            onChange={(e) => setAdminBookingLocation(e.target.value)}
                            className="w-full bg-white border-2 border-choco-100 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-choco-500 text-choco-900"
                            placeholder="請輸入約會地點"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-choco-700 block mb-0.5">約會時間</label>
                            <input
                              type="time"
                              value={adminBookingTime}
                              onChange={(e) => setAdminBookingTime(e.target.value)}
                              className="w-full bg-white border-2 border-choco-100 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-choco-500 text-choco-900"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-choco-700 block mb-0.5">想做的事</label>
                            <input
                              type="text"
                              value={adminBookingActivity}
                              onChange={(e) => setAdminBookingActivity(e.target.value)}
                              className="w-full bg-white border-2 border-choco-100 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-choco-500 text-choco-900"
                              placeholder="請輸入要做甚麼事"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 mt-1">
                      <button
                        type="submit"
                        className="flex-1 bg-choco-800 hover:bg-choco-900 text-mint-50 border-2 border-choco-950 font-bold text-xs py-2 rounded-xl shadow-sm transition-all cursor-pointer"
                      >
                        {editingDate ? "儲存修改" : t("adminSave")}
                      </button>
                      {editingDate && (
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="bg-white hover:bg-choco-50 text-choco-800 border-2 border-choco-800 font-bold text-xs py-2 px-3 rounded-xl shadow-sm transition-all cursor-pointer"
                        >
                          取消編輯
                        </button>
                      )}
                    </div>
                  </form>

                  {/* List of current schedules to delete or inspect bookings */}
                  <div className="md:col-span-6 flex flex-col">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-extrabold text-choco-800 text-sm">目前的行程表 ({schedules.length})</h4>
                      <button 
                        onClick={() => setIsAdminLoggedIn(false)}
                        className="text-xs text-choco-700 hover:text-red-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <LogOut className="h-3 w-3" />
                        {t("adminExit")}
                      </button>
                    </div>
                    <div className="flex-1 max-h-64 overflow-y-auto border-2 border-choco-100 rounded-2xl p-2 bg-mint-50/20 flex flex-col gap-2">
                      {schedules.map((s) => (
                        <div 
                          key={s.date} 
                          className="relative p-2.5 pr-16 bg-white border-2 border-choco-100 rounded-xl flex items-start justify-between shadow-xs hover:shadow-sm transition-all"
                        >
                          <div className="text-xs text-choco-900 flex-1 min-w-0">
                            <div className="font-extrabold flex items-center gap-1.5 flex-wrap">
                              <span className="text-choco-800">{s.date}</span>
                              <span className="bg-mint-100 text-choco-800 border border-mint-200 px-1 rounded font-bold">{s.city}</span>
                            </div>
                            <div className="text-choco-600 mt-0.5 font-mono flex items-center gap-1">
                              <Clock className="h-3 w-3 inline text-choco-400" /> {s.startTime} - {s.endTime}
                            </div>
                            {s.isAvailable ? (
                              <span className="text-teal-700 font-extrabold text-[10px] bg-mint-100 border border-mint-200 px-1 rounded mt-1 inline-block">
                                {t("statusAvailable")}
                              </span>
                            ) : (
                              <div className="mt-1">
                                <span className="text-red-700 font-extrabold text-[10px] bg-red-50 border border-red-100 px-1 rounded inline-block mr-1">
                                  {t("statusBooked")}
                                </span>
                                {s.bookedBy && (
                                  <div className="mt-1 bg-choco-50 p-1.5 rounded text-[10px] text-choco-900 border border-choco-200 mr-2">
                                    <strong>{t("adminBookedBy")}</strong> {s.bookedBy}
                                    {s.bookingDetails && (
                                      <div className="mt-1 flex flex-col gap-0.5 text-choco-800">
                                        <span>📍 {s.bookingDetails.location}</span>
                                        <span>⏰ {s.bookingDetails.time}</span>
                                        <span>💬 {s.bookingDetails.activity}</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {/* Top-Right Corner Action Buttons */}
                          <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
                            <button
                              onClick={() => handleEditClick(s)}
                              className="p-1.5 bg-mint-50 hover:bg-mint-100 border border-mint-200 text-choco-700 rounded-lg transition-all cursor-pointer hover:scale-105"
                              title="編輯行程"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleAdminDeleteEntry(s.date)}
                              className="p-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-lg transition-all cursor-pointer hover:scale-105"
                              title={t("adminDelete")}
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {schedules.length === 0 && (
                        <p className="text-xs text-choco-500 text-center py-8">無行程，請在左側新增。</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>


        {/* MAIN VIEWS SWITCHER WITH PAGE-FADE-INS */}
        <AnimatePresence mode="wait">
          
          {/* STEP 1: WELCOME SCREEN */}
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="flex flex-col items-center text-center py-8 px-4"
              id="view-step-1"
            >
              {/* Floating Decorative Icons */}
              <div className="relative mb-8">
                <div className="absolute -top-6 -left-6 bg-choco-100 border-2 border-choco-800 rounded-full p-2.5 text-choco-800 animate-bounce shadow">
                  <Coffee className="h-6 w-6" />
                </div>
                <div className="absolute -bottom-4 -right-4 bg-mint-200 border-2 border-choco-800 rounded-full p-2.5 text-choco-900 animate-pulse shadow">
                  <Heart className="h-5 w-5" />
                </div>
                <div className="h-28 w-28 border-4 border-choco-800 rounded-full flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(74,39,23,0.15)] bg-choco-100">
                  <Sparkles className="h-12 w-12 text-choco-800 animate-pulse" />
                </div>
              </div>

              <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-choco-900 mb-10 text-center drop-shadow-xs">
                {t("title")}
              </h1>

              <button
                onClick={() => setStep(2)}
                className="group relative inline-flex items-center gap-2 bg-choco-800 hover:bg-choco-900 text-mint-50 font-black text-lg px-10 py-4 rounded-full shadow-[4px_4px_0px_0px_rgba(74,39,23,0.15)] hover:shadow-[2px_2px_0px_0px_rgba(74,39,23,0.15)] border-2 border-choco-950 transition-all transform hover:translate-y-0.5 cursor-pointer"
                id="enter-btn"
              >
                <span>{t("enter")}</span>
                <ChevronRight className="h-5 w-5 text-mint-300 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          )}


          {/* STEP 2: NICKNAME INPUT */}
          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-md w-full mx-auto bg-white p-8 rounded-3xl shadow-[6px_6px_0px_0px_rgba(74,39,23,0.15)] border-4 border-choco-800"
              id="view-step-2"
            >
              <h2 className="text-2xl font-black text-choco-900 mb-2 flex items-center gap-2">
                <User className="h-6 w-6 text-choco-800" />
                {t("nicknameTitle")}
              </h2>
              <p className="text-xs text-choco-600 mb-6 font-medium">讓 Olivia 知道是哪位可愛的好朋友送出邀請吧！</p>
 
              <form onSubmit={handleSaveNickname} className="flex flex-col gap-4">
                <input
                  type="text"
                  placeholder={t("nicknamePlaceholder")}
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="border-2 border-choco-200 focus:border-choco-500 hover:border-choco-300 rounded-2xl px-4 py-3 outline-none text-base transition-all font-bold bg-mint-50/20 focus:bg-white text-choco-900 placeholder-choco-300"
                  autoFocus
                  required
                />
                
                <div className="flex gap-2 justify-between mt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex items-center gap-1.5 text-sm text-choco-500 hover:text-choco-800 font-bold py-2 px-4 rounded-xl hover:bg-mint-100/50 transition-all cursor-pointer"
                  >
                    <ArrowLeft className="h-4 w-4 text-choco-500" />
                    {t("back")}
                  </button>
 
                  <button
                    type="submit"
                    className="bg-choco-800 hover:bg-choco-900 text-white font-extrabold text-sm px-6 py-2.5 rounded-xl border-2 border-choco-950 shadow-[2px_2px_0px_0px_rgba(74,39,23,0.15)] transition-all cursor-pointer"
                  >
                    {t("next")}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
 
          {/* STEP 3: ANNOUNCEMENT */}
          {step === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-lg w-full mx-auto bg-white border-4 border-choco-800 p-8 rounded-3xl shadow-[6px_6px_0px_0px_rgba(74,39,23,0.15)] text-center relative overflow-hidden"
              id="view-step-3"
            >
              {/* Backlight Decoration */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-mint-200 rounded-full blur-3xl opacity-30" />
              
              <div className="h-14 w-14 bg-mint-100 border-2 border-choco-800 rounded-full flex items-center justify-center text-choco-800 mx-auto mb-4 shadow">
                <Info className="h-7 w-7" />
              </div>
 
              <h2 className="text-xl font-black text-choco-900 mb-3">{t("announcementTitle")}</h2>
              <p className="text-choco-850 text-sm leading-relaxed mb-8 px-2 font-semibold">
                {t("announcementText")}
              </p>
 
              <div className="flex justify-between items-center border-t-2 border-choco-100 pt-5">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex items-center gap-1.5 text-xs text-choco-600 hover:text-choco-800 font-bold py-1.5 px-3 rounded-lg hover:bg-mint-50 transition-all cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  {t("back")}
                </button>
 
                <button
                  onClick={() => setStep(4)}
                  className="bg-choco-800 hover:bg-choco-900 text-white border-2 border-choco-950 font-black text-xs px-6 py-2 rounded-lg shadow-[2px_2px_0px_0px_rgba(74,39,23,0.15)] transition-all cursor-pointer"
                  id="confirm-announcement-btn"
                >
                  {t("confirm")}
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: SCHEDULE CALENDAR */}
          {step === 4 && (
            <motion.div
              key="step-4"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full flex flex-col gap-6"
              id="view-step-4"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b-2 border-choco-800/10 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-6 w-6 text-choco-800" />
                    <h2 className="text-xl sm:text-2xl font-black text-choco-900 tracking-tight">
                      {t("scheduleTitle")}
                    </h2>
                  </div>
                  <p className="text-xs text-choco-600 mt-1 font-medium">
                    哈囉 <strong className="text-choco-900 font-black">{nickname}</strong>！請點擊下方一個有空（ Available ）且能預約的日期：
                  </p>
                </div>
                
                <button
                  onClick={() => setStep(2)}
                  className="text-xs text-choco-700 hover:text-choco-900 font-bold flex items-center gap-1.5 bg-white px-3.5 py-1.5 rounded-full hover:bg-mint-50 border-2 border-choco-800/10 transition-all cursor-pointer"
                >
                  <ArrowLeft className="h-3 w-3 text-choco-700" />
                  修改暱稱
                </button>
              </div>

              {loading ? (
                /* Loading State */
                <div className="py-20 text-center flex flex-col items-center justify-center gap-2">
                  <div className="h-10 w-10 border-4 border-choco-100 border-t-choco-800 rounded-full animate-spin" />
                  <p className="text-xs text-choco-600 font-bold">讀取行程表中，請稍候...</p>
                </div>
              ) : (
                /* Calendar Grid & List view */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Calendar Widget */}
                  <div className="lg:col-span-8 bg-white p-5 rounded-3xl shadow-[4px_4px_0px_0px_rgba(74,39,23,0.15)] border-4 border-choco-800 flex flex-col gap-4">
                    {/* Month / Year selector header */}
                    <div className="flex items-center justify-between pb-2 border-b-2 border-choco-100">
                      <span className="font-extrabold text-choco-900 text-sm flex items-center gap-1">
                        📅 {calendarYear} 年 {calendarMonth} 月
                      </span>
                      <div className="flex gap-1.5">
                        <button
                          onClick={handlePrevMonth}
                          className="p-1 px-3 bg-mint-50 hover:bg-mint-100 border-2 border-choco-800 rounded-xl text-choco-850 text-xs font-black transition-all cursor-pointer hover:scale-105 active:scale-95"
                          title="上個月"
                        >
                          &lt;
                        </button>
                        <button
                          onClick={handleNextMonth}
                          className="p-1 px-3 bg-mint-50 hover:bg-mint-100 border-2 border-choco-800 rounded-xl text-choco-850 text-xs font-black transition-all cursor-pointer hover:scale-105 active:scale-95"
                          title="下個月"
                        >
                          &gt;
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center font-extrabold text-xs text-choco-800 bg-mint-100 border-2 border-choco-800/10 py-2 rounded-xl">
                      {weekDays.map((w) => (
                        <div key={w} className="py-1">{w}</div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-2">
                      {calendarDays.map((day, idx) => {
                        if (day.blank) {
                          return <div key={day.dateStr} className="aspect-square bg-mint-50/10 rounded-2xl" />;
                        }

                        const s = day.schedule;
                        const isSelectable = s && s.isAvailable;

                        return (
                          <button
                            key={day.dateStr}
                            onClick={() => isSelectable && handleSelectDate(day.dateStr)}
                            disabled={!isSelectable}
                            className={`aspect-square rounded-2xl p-1.5 flex flex-col justify-between text-left border-2 relative transition-all group overflow-hidden ${
                              isSelectable
                                ? "bg-white hover:bg-mint-100/50 border-choco-100 hover:border-choco-800 shadow-xs hover:shadow-sm cursor-pointer hover:scale-[1.03]"
                                : s
                                ? "bg-choco-50 border-choco-100 opacity-60 cursor-not-allowed"
                                : "bg-mint-50/50 border-choco-100/10 opacity-30 cursor-not-allowed"
                            }`}
                          >
                            <span className={`text-xs font-black ${s ? "text-choco-900" : "text-choco-400"}`}>
                              {day.dayNum}
                            </span>

                            {s && (
                              <div className="w-full flex flex-col gap-0.5 mt-auto">
                                <span className={`text-[9px] font-black truncate leading-none px-1 py-0.5 rounded ${
                                  s.isAvailable 
                                    ? "bg-mint-200 text-choco-900 border border-mint-300" 
                                    : "bg-choco-100 text-choco-600 line-through"
                                }`}>
                                  📍 {s.city.split(" ")[0]}
                                </span>
                                <span className="text-[7px] text-choco-600 truncate font-mono tracking-tighter block font-bold">
                                  {s.startTime}-{s.endTime}
                                </span>
                              </div>
                            )}

                            {/* Hover effect micro-light */}
                            {isSelectable && (
                              <div className="absolute top-1.5 right-1.5 h-1.5 w-1.5 bg-teal-500 rounded-full shadow-lg" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Legend */}
                    <div className="flex items-center gap-4 text-[10px] text-choco-700 font-bold border-t-2 border-choco-100 pt-3">
                      <div className="flex items-center gap-1.5">
                        <div className="h-3.5 w-3.5 bg-white border-2 border-choco-200 rounded" />
                        <span>可選擇 / 有開放</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="h-3.5 w-3.5 bg-choco-50 border-2 border-choco-100 rounded" />
                        <span>已被約 / 沒開放</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="h-3.5 w-3.5 bg-mint-50/20 border border-choco-100/20 rounded opacity-30" />
                        <span>未排程時段</span>
                      </div>
                    </div>
                  </div>

                  {/* Right side card showing List of schedules */}
                  <div className="lg:col-span-4 flex flex-col gap-4">
                    <div className="bg-choco-800 border-4 border-choco-950 p-5 rounded-3xl text-mint-50 shadow-[4px_4px_0px_0px_rgba(74,39,23,0.15)] flex flex-col justify-between">
                      <div>
                        <h3 className="font-extrabold text-sm tracking-wide uppercase opacity-90 text-mint-200">Olivia Open Hours</h3>
                        <p className="text-xl font-black mt-1 leading-tight text-white">目前開放預約日</p>
                      </div>
                      <p className="text-xs mt-6 opacity-90 font-medium">
                        點擊月曆上有空的方格，或是下方清單中按鈕，即可快速填寫與 Olivia 出門的預約喔！
                      </p>
                    </div>

                    <div className="bg-white p-4 rounded-3xl shadow-[4px_4px_0px_0px_rgba(74,39,23,0.15)] border-4 border-choco-800 flex-1 flex flex-col gap-2 max-h-72 lg:max-h-[300px] overflow-y-auto">
                      {schedules.filter(s => s.isAvailable).map((s) => (
                        <button
                          key={s.date}
                          onClick={() => handleSelectDate(s.date)}
                          className="w-full text-left p-2.5 rounded-2xl hover:bg-mint-50 border-2 border-choco-100 hover:border-choco-800 flex items-center justify-between transition-all group cursor-pointer"
                        >
                          <div>
                            <p className="text-xs font-black text-choco-900">{s.date}</p>
                            <p className="text-[10px] text-choco-600 font-bold mt-0.5">
                              📍 {s.city} | ⏰ {s.startTime} - {s.endTime}
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-choco-300 group-hover:text-choco-800 group-hover:translate-x-0.5 transition-all" />
                        </button>
                      ))}
                      {schedules.filter(s => s.isAvailable).length === 0 && (
                        <p className="text-xs text-choco-400 text-center py-10 font-bold">目前所有開放時段都已被預約囉！</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 5: BOOKING DETAILS (左右二分欄) */}
          {step === 5 && activeSchedule && (
            <motion.div
              key="step-5"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full max-w-3xl mx-auto bg-white rounded-3xl shadow-[6px_6px_0px_0px_rgba(74,39,23,0.15)] border-4 border-choco-800 overflow-hidden"
              id="view-step-5"
            >
              <div className="grid grid-cols-1 md:grid-cols-12">
                
                {/* Left side: Available limits */}
                <div className="md:col-span-5 bg-mint-50/70 p-6 flex flex-col justify-between border-b-2 md:border-b-0 md:border-r-2 border-choco-100">
                  <div>
                    <span className="text-[10px] font-black text-choco-800 bg-mint-100 border border-mint-300 px-2.5 py-1 rounded-full inline-block mb-3 uppercase tracking-wider">
                      Date Selected
                    </span>
                    <h3 className="text-2xl font-black text-choco-900 leading-none mb-1">
                      {activeSchedule.date}
                    </h3>
                    <p className="text-sm font-extrabold text-choco-700 flex items-center gap-1 mb-6">
                      <MapPin className="h-4 w-4 text-choco-800" /> {activeSchedule.city}
                    </p>

                    <div className="bg-white border-2 border-choco-800 rounded-2xl p-4 flex flex-col gap-1 shadow-sm">
                      <p className="text-xs font-black text-choco-750 flex items-center gap-1">
                        <Clock className="h-4 w-4 text-choco-800" />
                        {t("bookingRange")}
                      </p>
                      <p className="text-lg font-black text-choco-900 tracking-tight font-mono">
                        {activeSchedule.startTime} - {activeSchedule.endTime}
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 text-[11px] text-choco-600 font-bold leading-relaxed">
                    * 預約送出後，系統會發送通知至 Olivia 信箱。經由 Olivia 審查確認後，會透過你留下的聯絡方式聯繫你喔！
                  </div>
                </div>

                {/* Right side: Form */}
                <div className="md:col-span-7 p-6 sm:p-8 flex flex-col gap-4 bg-white">
                  <div>
                    <h2 className="text-xl font-black text-choco-900">{t("bookingTitle")}</h2>
                    <p className="text-xs text-choco-600 mt-1 font-medium">Hello {nickname}！請提供你想安排的完美約會行程：</p>
                  </div>

                  <div className="flex flex-col gap-4">
                    {/* Location Field */}
                    <div>
                      <label className="text-xs font-black text-choco-750 block mb-1">
                        1. {t("whereToMeet")} <span className="text-red-500 font-bold">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder={t("wherePlaceholder")}
                        value={bookingLocation}
                        onChange={(e) => setBookingLocation(e.target.value)}
                        className="w-full border-2 border-choco-200 focus:border-choco-500 bg-mint-50/10 rounded-xl px-3 py-2 text-sm outline-none transition-all text-choco-900 font-medium placeholder-choco-300"
                        required
                      />
                    </div>

                    {/* Time Field */}
                    <div>
                      <label className="text-xs font-black text-choco-750 block mb-1">
                        2. {t("whatTime")} <span className="text-red-500 font-bold">*</span>
                      </label>
                      <input
                        type="time"
                        value={bookingTime}
                        onChange={(e) => setBookingTime(e.target.value)}
                        className={`w-full border-2 rounded-xl px-3 py-2 text-sm outline-none transition-all font-medium text-choco-900 ${
                          timeError 
                            ? "border-red-500 focus:border-red-600 bg-red-50/30" 
                            : "border-choco-200 focus:border-choco-500 bg-mint-50/10"
                        }`}
                        required
                      />
                      
                      {/* Anti-fooling validation error display (防呆機制) */}
                      {timeError && (
                        <p className="text-xs font-extrabold text-red-600 mt-1.5 flex items-center gap-1.5 animate-pulse" id="time-error-msg">
                          <AlertCircle className="h-4 w-4 shrink-0" />
                          {t("errorTimeOut")}
                        </p>
                      )}
                    </div>

                    {/* Activity Field */}
                    <div>
                      <label className="text-xs font-black text-choco-750 block mb-1">
                        3. {t("whatToDo")} <span className="text-red-500 font-bold">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder={t("doPlaceholder")}
                        value={bookingActivity}
                        onChange={(e) => setBookingActivity(e.target.value)}
                        className="w-full border-2 border-choco-200 focus:border-choco-500 bg-mint-50/10 rounded-xl px-3 py-2 text-sm outline-none transition-all text-choco-900 font-medium placeholder-choco-300"
                        required
                      />
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex items-center justify-between border-t-2 border-choco-100 pt-5 mt-4">
                    <button
                      type="button"
                      onClick={() => setStep(4)}
                      className="flex items-center gap-1.5 text-xs text-choco-500 hover:text-choco-800 font-black py-2 px-3 rounded-lg hover:bg-mint-50 transition-all cursor-pointer"
                    >
                      <ArrowLeft className="h-3.5 w-3.5 text-choco-500" />
                      {t("back")}
                    </button>

                    <button
                      type="button"
                      onClick={handleConfirmBooking}
                      disabled={timeError || !bookingLocation.trim() || !bookingActivity.trim() || bookingSubmitting}
                      className={`flex items-center gap-1.5 text-xs font-bold px-6 py-2.5 rounded-xl shadow-md transition-all border-2 ${
                        timeError || !bookingLocation.trim() || !bookingActivity.trim() || bookingSubmitting
                          ? "bg-choco-100 text-choco-400 border-choco-200 cursor-not-allowed shadow-none"
                          : "bg-choco-800 hover:bg-choco-900 text-white border-choco-950 hover:shadow-none shadow-[2px_2px_0px_0px_rgba(74,39,23,0.15)] cursor-pointer"
                      }`}
                      id="confirm-booking-btn"
                    >
                      <Send className="h-3.5 w-3.5" />
                      {bookingSubmitting ? t("submitting") : t("confirmBooking")}
                    </button>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* STEP 6: END / THANK YOU */}
          {step === 6 && (
            <motion.div
              key="step-6"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md w-full mx-auto bg-white p-8 rounded-3xl shadow-[6px_6px_0px_0px_rgba(74,39,23,0.15)] border-4 border-choco-800 text-center relative overflow-hidden"
              id="view-step-6"
            >
              {/* Backlight Decoration */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-mint-100 rounded-full blur-3xl opacity-40 animate-pulse" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-mint-200 rounded-full blur-3xl opacity-30 animate-pulse" />

              <div className="h-16 w-16 bg-mint-100 border-4 border-choco-800 rounded-full flex items-center justify-center text-choco-800 mx-auto mb-4 shadow animate-bounce">
                <CheckCircle className="h-8 w-8" />
              </div>

              <h2 className="text-2xl font-black text-choco-900 tracking-tight mb-2">
                {t("successTitle")}
              </h2>
              
              <p className="text-choco-600 text-sm mb-8 font-medium leading-relaxed">
                {t("successSubtitle")}
              </p>

              <button
                onClick={() => {
                  setStep(1);
                  setBookingLocation("");
                  setBookingTime("");
                  setBookingActivity("");
                }}
                className="bg-choco-800 hover:bg-choco-900 text-white border-2 border-choco-950 font-black text-sm px-8 py-3.5 rounded-full shadow-[4px_4px_0px_0px_rgba(74,39,23,0.15)] hover:shadow-none transition-all cursor-pointer"
                id="back-to-home-btn"
              >
                {t("backToHome")}
              </button>
            </motion.div>
          )}

        </AnimatePresence>

      </main>

      {/* FOOTER */}
      <footer className="py-4 border-t-2 border-choco-800/10 bg-white/60 text-center text-[10px] text-choco-500 font-mono tracking-wide font-bold">
        &copy; 2026 和 Olivia 一起出門吧！ • Created with Passion & Precision
      </footer>
    </div>
  );
}
