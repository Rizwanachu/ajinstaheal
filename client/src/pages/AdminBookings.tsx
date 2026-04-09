import { useEffect, useState, useMemo } from "react";
import { format, isToday, isFuture, isPast, parseISO } from "date-fns";
import {
  Loader2, LogOut, RefreshCw, Search, Download, Calendar,
  Phone, User, Mail, MessageSquare, X, ChevronDown, BarChart3,
  Clock, CheckCircle2, XCircle, Trash2
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
type StatusFilter = "all" | "confirmed" | "cancelled";
type DateFilter = "all" | "today" | "upcoming" | "past";

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("bookings");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [search, setSearch] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const token = () => localStorage.getItem("doctorToken") ?? "";

  useEffect(() => {
    if (!token()) { setLocation("/doctor-login"); return; }
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setIsLoading(true);
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
    } catch {
      toast({ variant: "destructive", title: "Failed to load data" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async (booking: Booking) => {
    if (!confirm(`Cancel booking for ${booking.customerName}?`)) return;
    setCancellingId(booking.id);
    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}/cancel`, {
        method: "PATCH",
        headers: { "x-doctor-token": token(), "Content-Type": "application/json" },
      });
      if (res.ok) {
        setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, status: "cancelled" } : b));
        toast({ title: "Booking cancelled" });
      }
    } catch {
      toast({ variant: "destructive", title: "Failed to cancel" });
    } finally {
      setCancellingId(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("doctorToken");
    setLocation("/");
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const matchStatus = statusFilter === "all" || b.status === statusFilter;
      const date = parseISO(b.date);
      const matchDate =
        dateFilter === "all" ? true :
        dateFilter === "today" ? isToday(date) :
        dateFilter === "upcoming" ? isFuture(date) || isToday(date) :
        isPast(date) && !isToday(date);
      const q = search.toLowerCase();
      const matchSearch = !q ||
        b.customerName.toLowerCase().includes(q) ||
        b.customerEmail.toLowerCase().includes(q) ||
        b.customerPhone.toLowerCase().includes(q) ||
        b.bookingId.toLowerCase().includes(q);
      return matchStatus && matchDate && matchSearch;
    });
  }, [bookings, statusFilter, dateFilter, search]);

  const analytics = useMemo(() => ({
    today: bookings.filter(b => isToday(parseISO(b.date)) && b.status === "confirmed").length,
    upcoming: bookings.filter(b => isFuture(parseISO(b.date)) && b.status === "confirmed").length,
    cancelled: bookings.filter(b => b.status === "cancelled").length,
    total: bookings.length,
  }), [bookings]);

  const statusBadge = (status: string) =>
    status === "confirmed"
      ? "bg-green-500/15 text-green-400 border border-green-500/20"
      : "bg-red-500/15 text-red-400 border border-red-500/20";

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="pt-8 pb-24 min-h-screen bg-background text-white">
      <div className="container mx-auto px-4 max-w-6xl">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold">Healer Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage bookings and enquiries</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchAll}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />Logout
            </Button>
          </div>
        </div>

        {/* Analytics cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Today", value: analytics.today, icon: <Clock className="w-5 h-5" />, color: "text-primary" },
            { label: "Upcoming", value: analytics.upcoming, icon: <Calendar className="w-5 h-5" />, color: "text-blue-400" },
            { label: "Cancelled", value: analytics.cancelled, icon: <XCircle className="w-5 h-5" />, color: "text-red-400" },
            { label: "Total", value: analytics.total, icon: <BarChart3 className="w-5 h-5" />, color: "text-muted-foreground" },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className="bg-card border border-white/10 rounded-xl p-4">
              <div className={`${color} mb-2`}>{icon}</div>
              <p className="text-2xl font-bold font-display">{value}</p>
              <p className="text-muted-foreground text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-white/10 pb-0">
          {(["bookings", "enquiries"] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium capitalize transition-all border-b-2 -mb-px ${
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-white"
              }`}
            >
              {tab}
              <span className="ml-2 text-xs bg-white/10 rounded-full px-2 py-0.5">
                {tab === "bookings" ? bookings.length : enquiries.length}
              </span>
            </button>
          ))}
        </div>

        {/* Bookings Tab */}
        {activeTab === "bookings" && (
          <div>
            {/* Search + Filters + Export */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, phone or booking ID..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 bg-card border-white/10 h-10"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                    <X className="w-4 h-4 text-muted-foreground hover:text-white" />
                  </button>
                )}
              </div>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as StatusFilter)}
                className="bg-card border border-white/10 text-sm rounded-lg px-3 h-10 text-white focus:outline-none focus:border-primary"
              >
                <option value="all">All Status</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <select
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value as DateFilter)}
                className="bg-card border border-white/10 text-sm rounded-lg px-3 h-10 text-white focus:outline-none focus:border-primary"
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
              >
                <Download className="w-4 h-4" /> Export CSV
              </Button>
            </div>

            {/* Results count */}
            <p className="text-muted-foreground text-sm mb-4">
              Showing {filteredBookings.length} of {bookings.length} bookings
            </p>

            {/* Booking cards */}
            {filteredBookings.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>No bookings match your filters.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredBookings.map(booking => (
                  <div
                    key={booking.id}
                    className="bg-card border border-white/10 rounded-xl p-5 hover:border-white/20 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      {/* Left: Patient info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <p className="font-bold text-white">{booking.customerName}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge(booking.status)}`}>
                            {booking.status}
                          </span>
                          <span className="font-mono text-xs text-primary bg-primary/10 px-2 py-0.5 rounded">
                            {booking.bookingId}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{booking.customerEmail}</span>
                          <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{booking.customerPhone}</span>
                        </div>
                        {booking.comments && (
                          <p className="mt-2 text-sm text-muted-foreground italic border-l-2 border-white/10 pl-3">
                            {booking.comments}
                          </p>
                        )}
                      </div>

                      {/* Right: Date/time + actions */}
                      <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
                        <div className="text-right">
                          <p className="font-medium text-white flex items-center gap-1.5 sm:justify-end">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            {format(parseISO(booking.date), "d MMM yyyy")}
                          </p>
                          <p className="text-muted-foreground text-sm flex items-center gap-1.5 sm:justify-end">
                            <Clock className="w-3.5 h-3.5" />
                            {format12Hour(booking.time)}
                          </p>
                        </div>
                        {booking.status === "confirmed" && (
                          <button
                            onClick={() => handleCancel(booking)}
                            disabled={cancellingId === booking.id}
                            className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors disabled:opacity-50"
                          >
                            {cancellingId === booking.id
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : <XCircle className="w-3 h-3" />
                            }
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
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
                <p>No enquiries yet.</p>
              </div>
            ) : (
              enquiries.slice().reverse().map(enquiry => (
                <div key={enquiry.id} className="bg-card border border-white/10 rounded-xl p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <p className="font-bold text-white flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          {enquiry.name}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mb-3">
                        <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{enquiry.email}</span>
                        {enquiry.phone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{enquiry.phone}</span>}
                      </div>
                      <p className="text-sm text-white/80 leading-relaxed bg-white/5 rounded-lg p-3">
                        {enquiry.message}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground shrink-0">
                      {enquiry.createdAt
                        ? format(new Date(enquiry.createdAt), "d MMM yyyy, h:mm a")
                        : ""}
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
