import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Loader2, Calendar, Clock, Phone, User, LogOut, RefreshCw, Trash2, X, Download } from "lucide-react";
import { useLocation } from "wouter";
import { api } from "@shared/routes";
import type { Booking, BlockedDate } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

function format12Hour(time24: string): string {
  const [hours, minutes] = time24.split(":");
  const hour = parseInt(hours, 10);
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minutes} ${period}`;
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"bookings" | "blocked">("bookings");
  const [filter, setFilter] = useState<"all" | "confirmed" | "cancelled">("all");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [rescheduleDialog, setRescheduleDialog] = useState<{ booking: Booking; newDate: string; newTime: string } | null>(null);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [newBlock, setNewBlock] = useState({ date: "", startTime: "", endTime: "", reason: "" });
  const [isAddingBlock, setIsAddingBlock] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("doctorToken");
    if (!token) {
      setLocation("/doctor-login");
      return;
    }
    fetchBookings();
    fetchBlockedDates();
  }, [setLocation]);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem("doctorToken");
      const res = await fetch(api.bookings.list.path, {
        headers: { "x-doctor-token": token || "" },
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
    }
  };

  const fetchBlockedDates = async () => {
    try {
      const token = localStorage.getItem("doctorToken");
      const res = await fetch("/api/admin/blocked-dates", {
        headers: { "x-doctor-token": token || "" },
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

  const handleLogout = () => {
    localStorage.removeItem("doctorToken");
    setLocation("/");
  };

  const filteredBookings = bookings.filter(booking => 
    filter === "all" ? true : booking.status === filter
  );

  return (
    <div className="pt-12 pb-24 min-h-screen bg-background text-white">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-display font-bold">Doctor Dashboard</h1>
          <Button variant="outline" size="sm" onClick={handleLogout}><LogOut className="mr-2 h-4 w-4" />Logout</Button>
        </div>

        <div className="flex gap-4 mb-8">
          <Button variant={activeTab === "bookings" ? "default" : "outline"} onClick={() => setActiveTab("bookings")}>Bookings</Button>
          <Button variant={activeTab === "blocked" ? "default" : "outline"} onClick={() => setActiveTab("blocked")}>Blocked Dates</Button>
        </div>

        {activeTab === "bookings" && (
          <div className="space-y-4">
            {filteredBookings.map(booking => (
              <div key={booking.id} className="p-6 border border-white/10 rounded-xl bg-card">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Booking ID</p>
                    <p className="font-mono font-bold text-primary">{booking.bookingId}</p>
                    <p className="mt-2 font-medium">{booking.customerName}</p>
                    <p className="text-sm text-muted-foreground">{booking.customerEmail}</p>
                    <p className="text-sm">{booking.customerPhone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Appointment</p>
                    <p className="font-medium">{booking.date}</p>
                    <p className="font-medium">{format12Hour(booking.time)}</p>
                    <p className={`mt-2 text-sm font-bold ${booking.status === "confirmed" ? "text-green-500" : "text-red-500"}`}>
                      {booking.status?.toUpperCase()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
