import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Loader2, Calendar, Clock, Phone, User, LogOut, RefreshCw, Trash2, X, Download } from "lucide-react";
import { useLocation } from "wouter";
import { api } from "@shared/routes";
import type { Booking, BlockedDate, Service } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { format12Hour } from "@/lib/utils";

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"bookings" | "completed" | "blocked">("bookings");
  const [filter, setFilter] = useState<"all" | "confirmed" | "cancelled">("all");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [rescheduleDialog, setRescheduleDialog] = useState<{ booking: Booking; newDate: string; newTime: string } | null>(null);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [newBlock, setNewBlock] = useState({ date: "", startTime: "", endTime: "", reason: "" });
  const [isAddingBlock, setIsAddingBlock] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Helper to check if appointment is completed
  const isAppointmentCompleted = (booking: Booking): boolean => {
    const service = services.find(s => s.id === booking.serviceId);
    if (!service) return false;
    const bookingDateTime = new Date(`${booking.date}T${booking.time}:00`);
    const endTime = new Date(bookingDateTime.getTime() + service.duration * 60000);
    return endTime < new Date();
  };

  useEffect(() => {
    const token = localStorage.getItem("doctorToken");
    if (!token) {
      setLocation("/doctor-login");
      return;
    }
    fetchBookings();
    fetchServices();
    fetchBlockedDates();
  }, [setLocation]);

  const fetchServices = async () => {
    try {
      const res = await fetch(api.services.list.path);
      if (res.ok) {
        const data = await res.json();
        setServices(data);
      }
    } catch (err) {
      console.error("Failed to fetch services:", err);
    }
  };

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem("doctorToken");
      const res = await fetch(api.bookings.list.path, {
        headers: { "X-Doctor-Token": token || "" },
      });
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      } else if (res.status === 401) {
        localStorage.removeItem("doctorToken");
        setLocation("/doctor-login");
      }
    } catch (err) {
      console.error("Failed to fetch bookings:", err);
      toast({ variant: "destructive", title: "Error", description: "Failed to load bookings" });
    }
  };

  const fetchBlockedDates = async () => {
    try {
      const token = localStorage.getItem("doctorToken");
      const res = await fetch("/api/admin/blocked-dates", {
        headers: { "X-Doctor-Token": token || "" },
      });
      if (res.ok) {
        const data = await res.json();
        setBlockedDates(data);
      }
    } catch (err) {
      console.error("Failed to fetch blocked dates:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBlockedDate = async () => {
    if (!newBlock.date) {
      toast({ variant: "destructive", title: "Error", description: "Date is required" });
      return;
    }

    setIsAddingBlock(true);
    try {
      const token = localStorage.getItem("doctorToken");
      const res = await fetch("/api/admin/blocked-dates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Doctor-Token": token || "",
        },
        body: JSON.stringify({
          date: newBlock.date,
          startTime: newBlock.startTime || null,
          endTime: newBlock.endTime || null,
          reason: newBlock.reason || null,
        }),
      });

      if (res.ok) {
        toast({ title: "Success", description: "Date/time blocked successfully" });
        setNewBlock({ date: "", startTime: "", endTime: "", reason: "" });
        fetchBlockedDates();
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to block date" });
    } finally {
      setIsAddingBlock(false);
    }
  };

  const handleDeleteBlockedDate = async (id: number) => {
    if (!window.confirm("Are you sure you want to unblock this date?")) return;

    try {
      const token = localStorage.getItem("doctorToken");
      const res = await fetch(`/api/admin/blocked-dates/${id}`, {
        method: "DELETE",
        headers: { "X-Doctor-Token": token || "" },
      });

      if (res.ok) {
        toast({ title: "Success", description: "Date unblocked" });
        fetchBlockedDates();
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to unblock date" });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("doctorToken");
    setLocation("/");
  };

  const handleCancelBooking = async (bookingId: number, customerEmail: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    try {
      const token = localStorage.getItem("doctorToken");
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Doctor-Token": token || "",
        },
        body: JSON.stringify({ email: customerEmail }),
      });
      if (res.ok) {
        toast({ title: "Booking cancelled", description: "The customer has been notified." });
        fetchBookings();
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to cancel booking" });
    }
  };

  const handleReschedule = async () => {
    if (!rescheduleDialog) return;
    setIsRescheduling(true);
    try {
      const token = localStorage.getItem("doctorToken");
      const res = await fetch(`/api/bookings/${rescheduleDialog.booking.id}/reschedule`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Doctor-Token": token || "",
        },
        body: JSON.stringify({
          email: rescheduleDialog.booking.customerEmail,
          newDate: rescheduleDialog.newDate,
          newTime: rescheduleDialog.newTime,
        }),
      });
      if (res.ok) {
        toast({ title: "Booking rescheduled", description: "The customer has been notified." });
        setRescheduleDialog(null);
        fetchBookings();
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to reschedule" });
    } finally {
      setIsRescheduling(false);
    }
  };

  const getCountByStatus = (status: string) => {
    if (status === "all") return bookings.length;
    return bookings.filter(b => b.status === status).length;
  };

  const completedBookings = bookings.filter(b => b.status === "confirmed" && isAppointmentCompleted(b));
  const upcomingBookings = bookings.filter(b => b.status === "confirmed" && !isAppointmentCompleted(b));

  const filteredBookings = bookings.filter(booking => 
    filter === "all" ? true : booking.status === filter
  );

  const handleDownloadPdf = async (type: "all" | "completed") => {
    setIsDownloadingPdf(true);
    try {
      const token = localStorage.getItem("doctorToken");
      const url = `/api/admin/appointments-pdf?type=${type}`;
      const res = await fetch(url, {
        headers: { "X-Doctor-Token": token || "" },
      });
      if (!res.ok) throw new Error("Failed to download PDF");
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `appointments-${type}-${format(new Date(), "yyyy-MM-dd")}.pdf`;
      link.click();
      toast({ title: "Success", description: "PDF downloaded successfully" });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to download PDF" });
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="pt-12 pb-24 min-h-screen bg-background">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-white">Doctor Dashboard</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { fetchBookings(); fetchBlockedDates(); }} disabled={isLoading}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-white/10 flex-wrap">
          <button
            onClick={() => setActiveTab("bookings")}
            className={`px-4 py-3 font-medium transition-colors border-b-2 ${
              activeTab === "bookings"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-white"
            }`}
          >
            Upcoming ({upcomingBookings.length})
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={`px-4 py-3 font-medium transition-colors border-b-2 ${
              activeTab === "completed"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-white"
            }`}
          >
            Completed ({completedBookings.length})
          </button>
          <button
            onClick={() => setActiveTab("blocked")}
            className={`px-4 py-3 font-medium transition-colors border-b-2 ${
              activeTab === "blocked"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-white"
            }`}
          >
            Block Dates/Times
          </button>
        </div>

        {activeTab === "bookings" && (
          <>
        {/* PDF Download Section */}
        <div className="mb-6 flex gap-2 flex-wrap">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => handleDownloadPdf("all")}
            disabled={isDownloadingPdf || bookings.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Download All PDF
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => handleDownloadPdf("completed")}
            disabled={isDownloadingPdf || completedBookings.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Download Completed PDF
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-4 mb-8 flex-wrap">
          {["all", "confirmed", "cancelled"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === status
                  ? "bg-primary text-black"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)} ({getCountByStatus(status)})
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-primary w-8 h-8" />
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No {filter} bookings found
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <div
                key={booking.id}
                className={`p-6 rounded-lg border ${
                  booking.status === "confirmed"
                    ? "border-green-500/30 bg-green-500/5"
                    : "border-red-500/30 bg-red-500/5"
                }`}
              >
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div>
                      <p className="text-muted-foreground text-sm">Booking ID</p>
                      <p className="text-white font-mono text-lg font-bold">{booking.bookingId}</p>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <User className="w-4 h-4 text-primary mt-1" />
                      <div>
                        <p className="text-white font-medium">{booking.customerName}</p>
                        <p className="text-muted-foreground text-sm">{booking.customerEmail}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-primary" />
                      <p className="text-white">{booking.customerPhone}</p>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      <div>
                        <p className="text-muted-foreground text-sm">Date</p>
                        <p className="text-white font-medium">
                          {format(new Date(booking.date + "T00:00:00"), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      <div>
                        <p className="text-muted-foreground text-sm">Time</p>
                        <p className="text-white font-medium">{format12Hour(booking.time)}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-muted-foreground text-sm">Service ID</p>
                      <p className="text-white font-medium">Service #{booking.serviceId}</p>
                    </div>
                  </div>
                </div>

                {/* Comments */}
                {booking.comments && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-muted-foreground text-sm mb-2">Comments</p>
                    <p className="text-white">{booking.comments}</p>
                  </div>
                )}

                {/* Status Badge & Actions */}
                <div className="mt-4 flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    booking.status === "confirmed"
                      ? "bg-green-500/30 text-green-300"
                      : "bg-red-500/30 text-red-300"
                  }`}>
                    {(booking.status || "confirmed").toUpperCase()}
                  </span>
                  <div className="flex gap-2">
                    {booking.status === "confirmed" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setRescheduleDialog({ booking, newDate: "", newTime: "" })}
                        >
                          Reschedule
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleCancelBooking(booking.id, booking.customerEmail)}
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
          </>
        )}

        {activeTab === "completed" && (
          <>
          <div className="mb-6 flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleDownloadPdf("completed")}
              disabled={isDownloadingPdf || completedBookings.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-primary w-8 h-8" />
            </div>
          ) : completedBookings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No completed appointments yet
            </div>
          ) : (
            <div className="space-y-4">
              {completedBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="p-6 rounded-lg border border-blue-500/30 bg-blue-500/5"
                >
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <p className="text-muted-foreground text-sm">Booking ID</p>
                        <p className="text-white font-mono text-lg font-bold">{booking.bookingId}</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <User className="w-4 h-4 text-primary mt-1" />
                        <div>
                          <p className="text-white font-medium">{booking.customerName}</p>
                          <p className="text-muted-foreground text-sm">{booking.customerEmail}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-primary" />
                        <p className="text-white">{booking.customerPhone}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        <div>
                          <p className="text-muted-foreground text-sm">Date</p>
                          <p className="text-white font-medium">
                            {format(new Date(booking.date + "T00:00:00"), "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" />
                        <div>
                          <p className="text-muted-foreground text-sm">Time</p>
                          <p className="text-white font-medium">{format12Hour(booking.time)}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-muted-foreground text-sm">Service ID</p>
                        <p className="text-white font-medium">Service #{booking.serviceId}</p>
                      </div>
                    </div>
                  </div>

                  {booking.comments && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <p className="text-muted-foreground text-sm mb-2">Comments</p>
                      <p className="text-white">{booking.comments}</p>
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-500/30 text-blue-300">
                      COMPLETED
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          </>
        )}

        {activeTab === "blocked" && (
          <div className="space-y-6">
            <div className="bg-card border border-white/5 rounded-2xl p-6">
              <h2 className="text-2xl font-display font-bold text-white mb-6">Block Date or Time</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Date *</label>
                  <Input
                    type="date"
                    value={newBlock.date}
                    onChange={(e) => setNewBlock({ ...newBlock, date: e.target.value })}
                    className="bg-background border-white/10"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Start Time (optional)</label>
                  <Input
                    type="time"
                    value={newBlock.startTime}
                    onChange={(e) => setNewBlock({ ...newBlock, startTime: e.target.value })}
                    className="bg-background border-white/10"
                    placeholder="HH:mm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">End Time (optional)</label>
                  <Input
                    type="time"
                    value={newBlock.endTime}
                    onChange={(e) => setNewBlock({ ...newBlock, endTime: e.target.value })}
                    className="bg-background border-white/10"
                    placeholder="HH:mm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Reason (optional)</label>
                  <Input
                    value={newBlock.reason}
                    onChange={(e) => setNewBlock({ ...newBlock, reason: e.target.value })}
                    className="bg-background border-white/10"
                    placeholder="e.g., On leave"
                  />
                </div>
              </div>
              <div className="mt-4 text-xs text-muted-foreground">
                Leave start/end times empty to block the entire day. Fill them in to block specific time slots.
              </div>
              <Button
                onClick={handleAddBlockedDate}
                disabled={isAddingBlock || !newBlock.date}
                variant="gold"
                className="w-full mt-4"
              >
                {isAddingBlock ? "Adding..." : "Add Block"}
              </Button>
            </div>

            <div className="bg-card border border-white/5 rounded-2xl p-6">
              <h2 className="text-2xl font-display font-bold text-white mb-6">Blocked Dates & Times</h2>
              {blockedDates.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No dates or times blocked yet</p>
              ) : (
                <div className="space-y-3">
                  {blockedDates.map((block) => (
                    <div
                      key={block.id}
                      className="flex items-center justify-between p-4 bg-background border border-white/5 rounded-lg hover:border-primary/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex flex-wrap gap-2">
                          <span className="font-mono font-bold text-white">
                            {format(new Date(block.date + "T00:00:00"), "MMM d, yyyy")}
                          </span>
                          {block.startTime && block.endTime && (
                            <span className="text-primary text-sm">
                              {format12Hour(block.startTime)} - {format12Hour(block.endTime)}
                            </span>
                          )}
                          {!block.startTime && (
                            <span className="text-muted-foreground text-sm">(Full day)</span>
                          )}
                        </div>
                        {block.reason && (
                          <p className="text-muted-foreground text-sm mt-1">{block.reason}</p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteBlockedDate(block.id)}
                        className="ml-4 flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reschedule Dialog */}
        <Dialog open={!!rescheduleDialog} onOpenChange={(open) => !open && setRescheduleDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reschedule Booking</DialogTitle>
              <DialogDescription>
                {rescheduleDialog?.booking.customerName} - {rescheduleDialog?.booking.bookingId}
              </DialogDescription>
            </DialogHeader>
            {rescheduleDialog && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">New Date</label>
                  <Input
                    type="date"
                    value={rescheduleDialog.newDate}
                    onChange={(e) => setRescheduleDialog({ ...rescheduleDialog, newDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">New Time</label>
                  <Input
                    type="time"
                    value={rescheduleDialog.newTime}
                    onChange={(e) => setRescheduleDialog({ ...rescheduleDialog, newTime: e.target.value })}
                  />
                </div>
                <Button
                  onClick={handleReschedule}
                  disabled={isRescheduling || !rescheduleDialog.newDate || !rescheduleDialog.newTime}
                  variant="gold"
                  className="w-full"
                >
                  {isRescheduling ? "Rescheduling..." : "Confirm"}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
