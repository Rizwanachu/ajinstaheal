import { useEffect, useState, useMemo, type ReactNode } from "react";
import {
  format, isToday, parseISO, addDays, subDays,
  isBefore, getDay
} from "date-fns";
import {
  Loader2, LogOut, ChevronLeft, ChevronRight, Calendar,
  Clock, CheckCheck, XCircle, CheckCircle2, ArrowLeft,
  Plus, RefreshCw, MessageCircle, Phone
} from "lucide-react";
import { useLocation } from "wouter";
import { api } from "@shared/routes";
import type { Booking } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

/* ─── Clinic schedule ─── */
function getClinicSlots(date: Date): string[] {
  const day = getDay(date); // 0=Sun … 6=Sat
  const slots: string[] = [];

  const addSlots = (sh: number, sm: number, eh: number, em: number) => {
    let h = sh, m = sm;
    while (h * 60 + m < eh * 60 + em) {
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
      m += 30;
      if (m >= 60) { h++; m = 0; }
    }
  };

  if (day === 0) {                       // Sunday
    addSlots(8, 0, 10, 0);
  } else if (day === 4) {                // Thursday
    addSlots(7, 30, 10, 0);
    addSlots(16, 0, 18, 0);
  } else {                               // Mon / Tue / Wed / Fri / Sat
    addSlots(7, 30, 10, 0);
    addSlots(16, 30, 19, 30);
  }

  return slots;
}

function format12Hour(time24: string): string {
  const [hours, minutes] = time24.split(":");
  const hour = parseInt(hours, 10);
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minutes} ${period}`;
}

function isSlotPast(date: Date, slot: string): boolean {
  const [h, m] = slot.split(":").map(Number);
  const dt = new Date(date);
  dt.setHours(h, m, 0, 0);
  return isBefore(dt, new Date());
}

function currentSlotStr(): string {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes() < 30 ? 0 : 30;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function buildWhatsAppUrl(phone: string, name: string, date: Date, time: string): string {
  const cleanPhone = phone.replace(/\D/g, "");
  const ph = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
  const dateStr = format(date, "d MMM yyyy");
  const msg = encodeURIComponent(
    `Hello ${name},\n\nThis is a reminder from AJ Insta Heal regarding your appointment on ${dateStr} at ${format12Hour(time)}.\n\nPlease confirm your attendance. We look forward to seeing you!\n\n– AJ Insta Heal, Mattancherry`
  );
  return `https://wa.me/${ph}?text=${msg}`;
}

function statusBadge(status: string) {
  switch (status) {
    case "confirmed":   return "bg-green-500/15 text-green-600 dark:text-green-400 border border-green-500/25";
    case "cancelled":   return "bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/25";
    case "completed":   return "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25";
    case "rescheduled": return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25";
    default:            return "bg-muted text-muted-foreground border border-border";
  }
}

/* ─── Tooltip ─── */
function Tooltip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="relative group/tip">
      {children}
      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150">
        <div className="bg-popover text-popover-foreground text-xs font-medium px-2.5 py-1 rounded-md shadow-lg whitespace-nowrap border border-border">
          {label}
        </div>
        <div className="w-2 h-2 bg-popover border-r border-b border-border rotate-45 mx-auto -mt-1" />
      </div>
    </div>
  );
}

/* ─── Day labels ─── */
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/* ══════════════════════════════════════════════
   Main Page
══════════════════════════════════════════════ */
export default function CalendarView() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<{ id: number; action: string } | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const token = () => localStorage.getItem("doctorToken") ?? "";

  useEffect(() => {
    if (!token()) { setLocation("/doctor-login"); return; }
    fetchBookings();
  }, []);

  const fetchBookings = async (silent = false) => {
    if (!silent) setIsLoading(true);
    setIsRefreshing(true);
    try {
      const res = await fetch(api.bookings.list.path, {
        headers: { "x-doctor-token": token() },
      });
      if (res.status === 401) {
        localStorage.removeItem("doctorToken");
        setLocation("/doctor-login");
        return;
      }
      if (res.ok) setBookings(await res.json());
      if (silent) toast({ title: "Refreshed" });
    } catch {
      toast({ variant: "destructive", title: "Failed to load bookings" });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const doAction = async (booking: Booking, action: "cancel" | "complete" | "confirm") => {
    if (action === "cancel" && !confirm(`Cancel booking for ${booking.customerName}?`)) return;
    setActionLoading({ id: booking.id, action });
    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}/${action}`, {
        method: "PATCH",
        headers: { "x-doctor-token": token(), "Content-Type": "application/json" },
      });
      if (res.ok) {
        const updated = await res.json();
        setBookings(prev => prev.map(b => b.id === booking.id ? updated : b));
        toast({ title: action === "cancel" ? "Booking cancelled" : action === "complete" ? "Marked complete" : "Booking confirmed" });
      } else {
        toast({ variant: "destructive", title: "Action failed" });
      }
    } catch {
      toast({ variant: "destructive", title: "Network error" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("doctorToken");
    setLocation("/");
  };

  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const dayBookings = useMemo(
    () => bookings.filter(b => b.date === dateStr),
    [bookings, dateStr]
  );

  const slots = useMemo(() => getClinicSlots(selectedDate), [selectedDate]);
  const nowSlot = currentSlotStr();
  const isSelectedToday = isToday(selectedDate);

  /* Group bookings by time slot */
  const bookingsBySlot = useMemo(() => {
    const map: Record<string, Booking[]> = {};
    for (const b of dayBookings) {
      if (!map[b.time]) map[b.time] = [];
      map[b.time].push(b);
    }
    return map;
  }, [dayBookings]);

  /* Summary counts for the selected day */
  const daySummary = useMemo(() => ({
    total: dayBookings.filter(b => b.status !== "cancelled").length,
    confirmed: dayBookings.filter(b => b.status === "confirmed").length,
    completed: dayBookings.filter(b => b.status === "completed").length,
  }), [dayBookings]);

  /* ── Loading ── */
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="pt-8 pb-24 min-h-screen bg-background">
      <div className="container mx-auto px-4 max-w-4xl">

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Tooltip label="Back to Dashboard">
              <button
                onClick={() => setLocation("/doctor-dashboard")}
                className="h-8 w-8 flex items-center justify-center rounded-lg border border-border bg-card hover:bg-muted hover:border-primary/40 text-muted-foreground hover:text-foreground transition-all"
                data-testid="button-back-dashboard"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            </Tooltip>
            <div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground flex items-center gap-2">
                <Calendar className="h-6 w-6 text-primary" />
                Calendar
              </h1>
              <p className="text-muted-foreground text-sm mt-0.5">Day view · {DAY_NAMES[getDay(selectedDate)]}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Tooltip label="New Booking">
              <Button
                size="sm"
                onClick={() => setLocation(`/book`)}
                className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/20 transition-all duration-200 hover:-translate-y-px active:translate-y-0"
                data-testid="button-new-booking"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New Booking</span>
              </Button>
            </Tooltip>

            <div className="w-px h-6 bg-border hidden sm:block" />

            <Tooltip label="Refresh">
              <button
                onClick={() => fetchBookings(true)}
                disabled={isRefreshing}
                className="h-8 w-8 flex items-center justify-center rounded-lg border border-border bg-card hover:bg-muted hover:border-primary/40 text-muted-foreground hover:text-foreground transition-all disabled:opacity-50"
                data-testid="button-refresh"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              </button>
            </Tooltip>

            <Tooltip label="Logout">
              <button
                onClick={handleLogout}
                className="h-8 w-8 flex items-center justify-center rounded-lg border border-border bg-card hover:bg-red-500/10 hover:border-red-500/30 text-muted-foreground hover:text-red-500 transition-all"
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </Tooltip>
          </div>
        </div>

        {/* ── Date Navigator ── */}
        <div className="flex items-center gap-3 mb-6 bg-card border border-border rounded-xl p-3">
          <Tooltip label="Previous day">
            <button
              onClick={() => setSelectedDate(d => subDays(d, 1))}
              className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all border border-transparent hover:border-border"
              data-testid="button-prev-day"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          </Tooltip>

          <div className="flex-1 text-center">
            <p className="font-bold text-foreground text-base sm:text-lg">
              {format(selectedDate, "EEEE, d MMMM yyyy")}
            </p>
            {!isSelectedToday && (
              <button
                onClick={() => setSelectedDate(new Date())}
                className="text-xs text-primary hover:text-primary/80 transition-colors mt-0.5"
                data-testid="button-go-today"
              >
                → Go to today
              </button>
            )}
          </div>

          <Tooltip label="Next day">
            <button
              onClick={() => setSelectedDate(d => addDays(d, 1))}
              className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all border border-transparent hover:border-border"
              data-testid="button-next-day"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </Tooltip>
        </div>

        {/* ── Day Summary Strip ── */}
        <div className="flex gap-3 mb-6">
          {[
            { label: "Total sessions", value: daySummary.total, color: "text-primary" },
            { label: "Confirmed", value: daySummary.confirmed, color: "text-green-500" },
            { label: "Completed", value: daySummary.completed, color: "text-blue-500" },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex-1 bg-card border border-border rounded-xl px-3 py-2.5 text-center">
              <p className={`text-xl font-bold font-display ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* ── No clinic hours indicator ── */}
        {slots.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Clinic is closed on this day.</p>
          </div>
        ) : (
          /* ── Time Slot Grid ── */
          <div className="space-y-2">
            {slots.map(slot => {
              const slotBookings = bookingsBySlot[slot] ?? [];
              const isPast = isSlotPast(selectedDate, slot);
              const isCurrent = isSelectedToday && slot === nowSlot;

              return (
                <TimeSlot
                  key={slot}
                  slot={slot}
                  bookings={slotBookings}
                  isPast={isPast}
                  isCurrent={isCurrent}
                  selectedDate={selectedDate}
                  actionLoading={actionLoading}
                  onAction={doAction}
                  onEmptyClick={() => setLocation("/book")}
                />
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-8 pt-6 border-t border-border text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-primary/20 border border-primary/40 inline-block" /> Current time slot</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-card border border-border inline-block" /> Empty – click to book</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-green-500/15 border border-green-500/30 inline-block" /> Confirmed</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-blue-500/15 border border-blue-500/30 inline-block" /> Completed</span>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   Time Slot Row
════════════════════════════════════════ */
function TimeSlot({
  slot,
  bookings,
  isPast,
  isCurrent,
  selectedDate,
  actionLoading,
  onAction,
  onEmptyClick,
}: {
  slot: string;
  bookings: Booking[];
  isPast: boolean;
  isCurrent: boolean;
  selectedDate: Date;
  actionLoading: { id: number; action: string } | null;
  onAction: (b: Booking, a: "cancel" | "complete" | "confirm") => void;
  onEmptyClick: () => void;
}) {
  const hasBookings = bookings.length > 0;

  return (
    <div
      className={`flex gap-0 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
        isCurrent
          ? "border-primary/60 shadow-sm shadow-primary/10"
          : "border-border hover:border-primary/20"
      }`}
      data-testid={`slot-${slot}`}
    >
      {/* Time label */}
      <div
        className={`flex flex-col items-center justify-center px-3 py-3 min-w-[72px] shrink-0 ${
          isCurrent ? "bg-primary/15" : "bg-card"
        }`}
      >
        <p className={`text-sm font-bold leading-none tabular-nums ${isCurrent ? "text-primary" : "text-foreground"}`}>
          {format12Hour(slot).split(" ")[0]}
        </p>
        <p className={`text-xs mt-0.5 ${isCurrent ? "text-primary/70" : "text-muted-foreground"}`}>
          {format12Hour(slot).split(" ")[1]}
        </p>
        {isCurrent && (
          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        )}
      </div>

      {/* Slot content */}
      <div className={`flex-1 min-w-0 border-l border-border ${hasBookings ? "bg-card" : isCurrent ? "bg-primary/5" : "bg-card"}`}>
        {hasBookings ? (
          <div className="divide-y divide-border">
            {bookings.map(booking => (
              <BookingSlotCard
                key={booking.id}
                booking={booking}
                isPast={isPast}
                selectedDate={selectedDate}
                actionLoading={actionLoading}
                onAction={onAction}
              />
            ))}
          </div>
        ) : (
          <button
            onClick={isPast ? undefined : onEmptyClick}
            disabled={isPast}
            className={`w-full h-full min-h-[56px] flex items-center px-4 text-sm transition-colors ${
              isPast
                ? "text-muted-foreground/30 cursor-default"
                : "text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/30 cursor-pointer"
            }`}
            data-testid={`button-empty-slot-${slot}`}
          >
            {!isPast && (
              <span className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Plus className="w-3.5 h-3.5" />
                Available — click to book
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   Booking card inside a slot
════════════════════════════════════════ */
function BookingSlotCard({
  booking,
  isPast,
  selectedDate,
  actionLoading,
  onAction,
}: {
  booking: Booking;
  isPast: boolean;
  selectedDate: Date;
  actionLoading: { id: number; action: string } | null;
  onAction: (b: Booking, a: "cancel" | "complete" | "confirm") => void;
}) {
  const isActing = actionLoading?.id === booking.id;
  const isLoading = (a: string) => isActing && actionLoading?.action === a;

  return (
    <div
      className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4"
      data-testid={`booking-slot-card-${booking.id}`}
    >
      {/* Patient info */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-foreground text-sm leading-tight">{booking.customerName}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge(booking.status)}`}>
              {booking.status}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{booking.customerPhone}</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex items-center gap-1.5 flex-wrap shrink-0">
        {/* Call */}
        <Tooltip label={`Call ${booking.customerName}`}>
          <a
            href={`tel:${booking.customerPhone}`}
            className="h-7 w-7 flex items-center justify-center rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
            data-testid={`button-call-slot-${booking.id}`}
          >
            <Phone className="w-3.5 h-3.5" />
          </a>
        </Tooltip>

        {/* WhatsApp */}
        <Tooltip label="Send WhatsApp reminder">
          <a
            href={buildWhatsAppUrl(booking.customerPhone, booking.customerName, selectedDate, booking.time)}
            target="_blank"
            rel="noopener noreferrer"
            className="h-7 w-7 flex items-center justify-center rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400 transition-colors"
            data-testid={`button-whatsapp-slot-${booking.id}`}
          >
            <MessageCircle className="w-3.5 h-3.5" />
          </a>
        </Tooltip>

        {/* Confirm */}
        {(booking.status === "cancelled" || booking.status === "rescheduled") && (
          <Tooltip label="Confirm booking">
            <button
              onClick={() => onAction(booking, "confirm")}
              disabled={isActing}
              className="h-7 w-7 flex items-center justify-center rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400 transition-colors disabled:opacity-50"
              data-testid={`button-confirm-slot-${booking.id}`}
            >
              {isLoading("confirm") ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            </button>
          </Tooltip>
        )}

        {/* Complete */}
        {booking.status !== "completed" && booking.status !== "cancelled" && (
          <Tooltip label="Mark as completed">
            <button
              onClick={() => onAction(booking, "complete")}
              disabled={isActing}
              className="h-7 w-7 flex items-center justify-center rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 transition-colors disabled:opacity-50"
              data-testid={`button-complete-slot-${booking.id}`}
            >
              {isLoading("complete") ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCheck className="w-3.5 h-3.5" />}
            </button>
          </Tooltip>
        )}

        {/* Cancel */}
        {booking.status === "confirmed" && (
          <Tooltip label="Cancel booking">
            <button
              onClick={() => onAction(booking, "cancel")}
              disabled={isActing}
              className="h-7 w-7 flex items-center justify-center rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 transition-colors disabled:opacity-50"
              data-testid={`button-cancel-slot-${booking.id}`}
            >
              {isLoading("cancel") ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
            </button>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
