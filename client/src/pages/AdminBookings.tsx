import { useEffect, useState, useMemo, type ReactNode } from "react";
import { format, isToday, isFuture, isPast, parseISO, isBefore, isAfter } from "date-fns";
import {
  Loader2, LogOut, RefreshCw, Search, Download, Calendar,
  Phone, Mail, MessageSquare, X, BarChart3,
  Clock, XCircle, CheckCircle2, ChevronDown, ChevronUp,
  User, CheckCheck, MessageCircle, Sparkles, Plus, CalendarDays
} from "lucide-react";
import { useLocation } from "wouter";
import { api } from "@shared/routes";
import type { Booking } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

type Enquiry = {
  id: number;
  name: string;
  email: string;
  phone?: string;
  message: string;
  createdAt: string;
};

function format12Hour(time24: string): string {
  const [hours, minutes] = time24.split(":");
  const hour = parseInt(hours, 10);
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minutes} ${period}`;
}

function isBookingPast(booking: Booking): boolean {
  const [h, m] = booking.time.split(":").map(Number);
  const dt = parseISO(booking.date);
  dt.setHours(h, m, 0, 0);
  return isBefore(dt, new Date());
}

function isBookingUpcoming(booking: Booking): boolean {
  const [h, m] = booking.time.split(":").map(Number);
  const dt = parseISO(booking.date);
  dt.setHours(h, m, 0, 0);
  return isAfter(dt, new Date());
}

function buildWhatsAppUrl(phone: string, name: string, date: string, time: string): string {
  const cleanPhone = phone.replace(/\D/g, "");
  const ph = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
  const dateStr = format(parseISO(date), "d MMM yyyy");
  const msg = encodeURIComponent(
    `Hello ${name},\n\nThis is a reminder from AJ Insta Heal regarding your appointment on ${dateStr} at ${format12Hour(time)}.\n\nPlease confirm your attendance. We look forward to seeing you!\n\n– AJ Insta Heal, Mattancherry`
  );
  return `https://wa.me/${ph}?text=${msg}`;
}

function exportToCSV(bookings: Booking[]) {
  const headers = ["Booking ID", "Name", "Email", "Phone", "Date", "Time", "Status", "Comments"];
  const rows = bookings.map(b => [
    b.bookingId, b.customerName, b.customerEmail, b.customerPhone,
    b.date, format12Hour(b.time), b.status, b.comments ?? ""
  ]);
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `aj-instaheal-bookings-${format(new Date(), "yyyy-MM-dd")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

type Tab = "bookings" | "enquiries";
type StatusFilter = "all" | "confirmed" | "cancelled" | "completed";
type DateFilter = "all" | "today" | "upcoming" | "past";

function statusBadge(status: string) {
  switch (status) {
    case "confirmed": return "bg-green-500/15 text-green-600 dark:text-green-400 border border-green-500/25";
    case "cancelled": return "bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/25";
    case "completed": return "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25";
    case "rescheduled": return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25";
    default: return "bg-muted text-muted-foreground border border-border";
  }
}

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

function SmartSuggestion({ booking }: { booking: Booking }) {
  if (booking.status === "cancelled" || booking.status === "completed") return null;
  if (isBookingPast(booking)) {
    return (
      <span className="flex items-center gap-1 text-xs text-blue-500 dark:text-blue-400 font-medium">
        <Sparkles className="w-3 h-3" /> Suggest: Mark Complete
      </span>
    );
  }
  if (isBookingUpcoming(booking) && booking.status !== "confirmed") {
    return (
      <span className="flex items-center gap-1 text-xs text-green-500 dark:text-green-400 font-medium">
        <Sparkles className="w-3 h-3" /> Suggest: Confirm
      </span>
    );
  }
  return null;
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("bookings");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [search, setSearch] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [actionLoading, setActionLoading] = useState<{ id: number; action: string } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const token = () => localStorage.getItem("doctorToken") ?? "";

  useEffect(() => {
    if (!token()) { setLocation("/doctor-login"); return; }
    fetchAll();
  }, []);

  const fetchAll = async (silent = false) => {
    if (!silent) setIsLoading(true);
    setIsRefreshing(true);
    try {
      const [bRes, eRes] = await Promise.all([
        fetch(api.bookings.list.path, { headers: { "x-doctor-token": token() } }),
        fetch("/api/admin/enquiries", { headers: { "x-doctor-token": token() } }),
      ]);
      if (bRes.status === 401 || eRes.status === 401) {
        localStorage.removeItem("doctorToken");
        setLocation("/doctor-login");
        return;
      }
      if (bRes.ok) setBookings(await bRes.json());
      if (eRes.ok) setEnquiries(await eRes.json());
      if (silent) toast({ title: "Data refreshed" });
    } catch {
      toast({ variant: "destructive", title: "Failed to load data" });
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
        toast({
          title: action === "cancel" ? "Booking cancelled" : action === "complete" ? "Marked as completed" : "Booking confirmed",
        });
      } else {
        toast({ variant: "destructive", title: "Action failed. Please try again." });
      }
    } catch {
      toast({ variant: "destructive", title: "Network error" });
    } finally {
      setActionLoading(null);
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("doctorToken");
    setLocation("/");
  };

  const todayBookings = useMemo(() =>
    bookings
      .filter(b => isToday(parseISO(b.date)) && b.status !== "cancelled")
      .sort((a, b) => a.time.localeCompare(b.time)),
    [bookings]
  );

  const analytics = useMemo(() => ({
    todaySessions: bookings.filter(b => isToday(parseISO(b.date)) && b.status !== "cancelled").length,
    pendingConfirm: bookings.filter(b => b.status === "confirmed" && isFuture(parseISO(b.date))).length,
    completedToday: bookings.filter(b => isToday(parseISO(b.date)) && b.status === "completed").length,
    total: bookings.length,
  }), [bookings]);

  const filteredBookings = useMemo(() => {
    return bookings
      .filter(b => {
        const matchStatus = statusFilter === "all" || b.status === statusFilter;
        const date = parseISO(b.date);
        const matchDate =
          dateFilter === "all" ? true :
          dateFilter === "today" ? isToday(date) :
          dateFilter === "upcoming" ? (isFuture(date) || isToday(date)) :
          isPast(date) && !isToday(date);
        const q = search.toLowerCase();
        const matchSearch = !q ||
          b.customerName.toLowerCase().includes(q) ||
          b.customerEmail.toLowerCase().includes(q) ||
          b.customerPhone.toLowerCase().includes(q) ||
          b.bookingId.toLowerCase().includes(q);
        return matchStatus && matchDate && matchSearch;
      })
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.time.localeCompare(b.time);
      });
  }, [bookings, statusFilter, dateFilter, search]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="pt-8 pb-24 min-h-screen bg-background">
      <div className="container mx-auto px-4 max-w-6xl">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">Healer Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">{format(new Date(), "EEEE, d MMMM yyyy")}</p>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex items-center gap-2">

            {/* New Booking */}
            <Tooltip label="New Booking">
              <Button
                size="sm"
                onClick={() => setLocation("/book")}
                data-testid="button-new-booking"
                className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/20 transition-all duration-200 hover:shadow-primary/40 hover:shadow-md hover:-translate-y-px active:translate-y-0"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New Booking</span>
              </Button>
            </Tooltip>

            <div className="w-px h-6 bg-border mx-0.5 hidden sm:block" />

            {/* Refresh */}
            <Tooltip label="Refresh data">
              <button
                onClick={() => fetchAll(true)}
                disabled={isRefreshing}
                data-testid="button-refresh"
                className="h-8 w-8 flex items-center justify-center rounded-lg border border-border bg-card hover:bg-muted hover:border-primary/40 text-muted-foreground hover:text-foreground transition-all duration-200 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 transition-transform duration-500 ${isRefreshing ? "animate-spin" : "hover:rotate-180"}`} />
              </button>
            </Tooltip>

            {/* Calendar (placeholder) */}
            <Tooltip label="Calendar view (coming soon)">
              <button
                onClick={() => toast({ title: "Calendar view coming soon" })}
                data-testid="button-calendar"
                className="h-8 w-8 flex items-center justify-center rounded-lg border border-border bg-card hover:bg-muted hover:border-primary/40 text-muted-foreground hover:text-foreground transition-all duration-200"
              >
                <CalendarDays className="h-4 w-4" />
              </button>
            </Tooltip>

            <div className="w-px h-6 bg-border mx-0.5 hidden sm:block" />

            {/* Logout */}
            <Tooltip label="Logout">
              <button
                onClick={handleLogout}
                data-testid="button-logout"
                className="h-8 w-8 flex items-center justify-center rounded-lg border border-border bg-card hover:bg-red-500/10 hover:border-red-500/30 text-muted-foreground hover:text-red-500 transition-all duration-200"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            {
              label: "Today's Sessions",
              value: analytics.todaySessions,
              icon: <Clock className="w-5 h-5" />,
              color: "text-primary",
              empty: "No sessions today",
            },
            {
              label: "Upcoming Confirmed",
              value: analytics.pendingConfirm,
              icon: <Calendar className="w-5 h-5" />,
              color: "text-blue-500",
              empty: "No upcoming bookings",
            },
            {
              label: "Completed Today",
              value: analytics.completedToday,
              icon: <CheckCheck className="w-5 h-5" />,
              color: "text-emerald-500",
              empty: "None completed yet",
            },
            {
              label: "Total Bookings",
              value: analytics.total,
              icon: <BarChart3 className="w-5 h-5" />,
              color: "text-muted-foreground",
              empty: "No bookings yet",
            },
          ].map(({ label, value, icon, color, empty }) => (
            <div key={label} className="bg-card border border-border rounded-xl p-4 flex flex-col gap-1">
              <div className={`${color} mb-1`}>{icon}</div>
              {value > 0
                ? <p className="text-2xl font-bold font-display text-foreground">{value}</p>
                : <p className="text-sm text-muted-foreground italic leading-snug">{empty}</p>
              }
              <p className="text-muted-foreground text-xs">{label}</p>
            </div>
          ))}
        </div>

        {/* Today's Schedule */}
        {todayBookings.length > 0 && (
          <div className="mb-8">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-primary" />
              Today's Schedule
              <span className="text-xs font-normal text-muted-foreground ml-1">({todayBookings.length} session{todayBookings.length !== 1 ? "s" : ""})</span>
            </h2>
            <div className="space-y-2">
              {todayBookings.map(booking => (
                <TodayCard
                  key={booking.id}
                  booking={booking}
                  actionLoading={actionLoading}
                  onAction={doAction}
                />
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-border pb-0">
          {(["bookings", "enquiries"] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              data-testid={`tab-${tab}`}
              className={`px-4 py-2 text-sm font-medium capitalize transition-all border-b-2 -mb-px ${
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
              <span className="ml-2 text-xs bg-muted rounded-full px-2 py-0.5">
                {tab === "bookings" ? bookings.length : enquiries.length}
              </span>
            </button>
          ))}
        </div>

        {/* Bookings Tab */}
        {activeTab === "bookings" && (
          <div>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, phone or ID..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 bg-card border-border h-10"
                  data-testid="input-search-bookings"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                    <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as StatusFilter)}
                data-testid="select-status-filter"
                className="bg-card border border-border text-sm rounded-lg px-3 h-10 text-foreground focus:outline-none focus:border-primary"
              >
                <option value="all">All Status</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <select
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value as DateFilter)}
                data-testid="select-date-filter"
                className="bg-card border border-border text-sm rounded-lg px-3 h-10 text-foreground focus:outline-none focus:border-primary"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="upcoming">Upcoming</option>
                <option value="past">Past</option>
              </select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => exportToCSV(filteredBookings)}
                className="h-10 gap-2 whitespace-nowrap"
                data-testid="button-export-csv"
              >
                <Download className="w-4 h-4" /> Export CSV
              </Button>
            </div>

            <p className="text-muted-foreground text-sm mb-4">
              Showing {filteredBookings.length} of {bookings.length} bookings
            </p>

            {filteredBookings.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No bookings match your filters.</p>
                <p className="text-sm mt-1 opacity-70">Try adjusting the search or filter options above.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredBookings.map(booking => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    expanded={expandedIds.has(booking.id)}
                    onToggle={() => toggleExpand(booking.id)}
                    actionLoading={actionLoading}
                    onAction={doAction}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Enquiries Tab */}
        {activeTab === "enquiries" && (
          <div className="space-y-3">
            {enquiries.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No enquiries yet.</p>
                <p className="text-sm mt-1 opacity-70">When patients send a message, they'll appear here.</p>
              </div>
            ) : (
              enquiries.slice().reverse().map(enquiry => (
                <div key={enquiry.id} className="bg-card border border-border rounded-xl p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <p className="font-bold text-foreground flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          {enquiry.name}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mb-3">
                        <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{enquiry.email}</span>
                        {enquiry.phone && (
                          <span className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5" />
                            <a href={`tel:${enquiry.phone}`} className="hover:text-foreground transition-colors">{enquiry.phone}</a>
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-foreground/80 leading-relaxed bg-muted/50 rounded-lg p-3">
                        {enquiry.message}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground shrink-0">
                      {enquiry.createdAt ? format(new Date(enquiry.createdAt), "d MMM yyyy, h:mm a") : ""}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Today's Schedule card (compact) ─── */
function TodayCard({
  booking,
  actionLoading,
  onAction,
}: {
  booking: Booking;
  actionLoading: { id: number; action: string } | null;
  onAction: (b: Booking, a: "cancel" | "complete" | "confirm") => void;
}) {
  const past = isBookingPast(booking);
  const isLoading = (a: string) => actionLoading?.id === booking.id && actionLoading.action === a;

  return (
    <div className={`bg-card rounded-xl border-2 ${booking.status === "completed" ? "border-blue-500/30" : "border-primary/40"} p-4 flex flex-col sm:flex-row sm:items-center gap-3`}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="text-center shrink-0 w-14">
          <p className="text-lg font-bold text-primary leading-none">{format12Hour(booking.time).split(" ")[0]}</p>
          <p className="text-xs text-muted-foreground">{format12Hour(booking.time).split(" ")[1]}</p>
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-foreground truncate">{booking.customerName}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge(booking.status)}`}>
              {booking.status}
            </span>
            <SmartSuggestion booking={booking} />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        <a
          href={`tel:${booking.customerPhone}`}
          className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground transition-colors"
          title="Call patient"
          data-testid={`button-call-today-${booking.id}`}
        >
          <Phone className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Call</span>
        </a>
        <a
          href={buildWhatsAppUrl(booking.customerPhone, booking.customerName, booking.date, booking.time)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400 transition-colors"
          title="WhatsApp patient"
          data-testid={`button-whatsapp-today-${booking.id}`}
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">WhatsApp</span>
        </a>
        {booking.status !== "completed" && booking.status !== "cancelled" && past && (
          <button
            onClick={() => onAction(booking, "complete")}
            disabled={actionLoading?.id === booking.id}
            className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 transition-colors disabled:opacity-50"
            data-testid={`button-complete-today-${booking.id}`}
          >
            {isLoading("complete") ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCheck className="w-3.5 h-3.5" />}
            Complete
          </button>
        )}
        {booking.status === "confirmed" && !past && (
          <button
            onClick={() => onAction(booking, "cancel")}
            disabled={actionLoading?.id === booking.id}
            className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 transition-colors disabled:opacity-50"
            data-testid={`button-cancel-today-${booking.id}`}
          >
            {isLoading("cancel") ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Full booking card ─── */
function BookingCard({
  booking,
  expanded,
  onToggle,
  actionLoading,
  onAction,
}: {
  booking: Booking;
  expanded: boolean;
  onToggle: () => void;
  actionLoading: { id: number; action: string } | null;
  onAction: (b: Booking, a: "cancel" | "complete" | "confirm") => void;
}) {
  const today = isToday(parseISO(booking.date));
  const past = isBookingPast(booking);
  const isLoading = (a: string) => actionLoading?.id === booking.id && actionLoading.action === a;
  const isActing = actionLoading?.id === booking.id;

  return (
    <div
      className={`bg-card rounded-xl border-2 transition-colors ${
        today && booking.status !== "cancelled"
          ? "border-primary/50 hover:border-primary/70"
          : "border-border hover:border-primary/30"
      }`}
      data-testid={`card-booking-${booking.id}`}
    >
      {/* Main row */}
      <div className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">

          {/* Left: patient info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <p className="font-bold text-foreground text-base">{booking.customerName}</p>
              {today && booking.status !== "cancelled" && (
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-primary/15 text-primary border border-primary/30">
                  Today
                </span>
              )}
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge(booking.status)}`}>
                {booking.status}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate max-w-[180px]">{booking.customerEmail}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 shrink-0" />
                {booking.customerPhone}
              </span>
            </div>
            <SmartSuggestion booking={booking} />
          </div>

          {/* Right: date/time */}
          <div className="flex flex-col items-start sm:items-end gap-1 shrink-0">
            <p className="font-semibold text-foreground text-base flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-primary shrink-0" />
              {format12Hour(booking.time)}
            </p>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 sm:justify-end">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              {format(parseISO(booking.date), "d MMM yyyy")}
            </p>
            <p className="text-xs text-muted-foreground/50 font-mono">{booking.bookingId}</p>
          </div>
        </div>

        {/* Action row */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Call */}
            <a
              href={`tel:${booking.customerPhone}`}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground transition-colors font-medium"
              data-testid={`button-call-${booking.id}`}
            >
              <Phone className="w-3.5 h-3.5" /> Call
            </a>

            {/* WhatsApp */}
            <a
              href={buildWhatsAppUrl(booking.customerPhone, booking.customerName, booking.date, booking.time)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400 transition-colors font-medium"
              data-testid={`button-whatsapp-${booking.id}`}
            >
              <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
            </a>

            {/* Confirm */}
            {(booking.status === "cancelled" || booking.status === "rescheduled") && (
              <button
                onClick={() => onAction(booking, "confirm")}
                disabled={isActing}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400 transition-colors font-medium disabled:opacity-50"
                data-testid={`button-confirm-${booking.id}`}
              >
                {isLoading("confirm") ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Confirm
              </button>
            )}

            {/* Complete */}
            {booking.status !== "cancelled" && booking.status !== "completed" && (
              <button
                onClick={() => onAction(booking, "complete")}
                disabled={isActing}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 transition-colors font-medium disabled:opacity-50"
                data-testid={`button-complete-${booking.id}`}
              >
                {isLoading("complete") ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCheck className="w-3.5 h-3.5" />}
                Complete
              </button>
            )}

            {/* Cancel */}
            {booking.status === "confirmed" && (
              <button
                onClick={() => onAction(booking, "cancel")}
                disabled={isActing}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 transition-colors font-medium disabled:opacity-50"
                data-testid={`button-cancel-${booking.id}`}
              >
                {isLoading("cancel") ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                Cancel
              </button>
            )}
          </div>

          {/* Expand toggle */}
          <button
            onClick={onToggle}
            className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors ml-2 shrink-0"
            data-testid={`button-toggle-${booking.id}`}
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {expanded ? "Less" : "More"}
          </button>
        </div>

        {/* Expanded details */}
        {expanded && (
          <div className="mt-4 pt-3 border-t border-border space-y-2">
            {booking.comments ? (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Patient Notes</p>
                <p className="text-sm text-foreground/80 leading-relaxed bg-muted/40 rounded-lg p-3 border-l-2 border-primary/40 italic">
                  {booking.comments}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No notes provided by patient.</p>
            )}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground pt-1">
              <span><span className="text-foreground/60 font-medium">Booked on:</span> {booking.createdAt ? format(new Date(booking.createdAt), "d MMM yyyy, h:mm a") : "—"}</span>
              <span><span className="text-foreground/60 font-medium">Service:</span> Acupuncture &amp; Holistic Wellness</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
