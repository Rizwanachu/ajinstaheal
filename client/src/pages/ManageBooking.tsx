import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, AlertCircle, CheckCircle2, Loader2, ArrowLeft } from "lucide-react";
import { format, parse, addDays } from "date-fns";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { useAvailability } from "@/hooks/use-bookings";

const lookupSchema = z.object({
  bookingId: z.string().min(1, "Booking ID required"),
  email: z.string().email("Valid email required"),
});

export default function ManageBooking() {
  const [booking, setBooking] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showRescheduleForm, setShowRescheduleForm] = useState(false);
  const [rescheduledDate, setRescheduledDate] = useState<Date | undefined>(undefined);
  const [rescheduledTime, setRescheduledTime] = useState<string | undefined>(undefined);
  const { toast } = useToast();
  const { data: availability } = useAvailability(
    rescheduledDate ? format(rescheduledDate, "yyyy-MM-dd") : undefined,
    booking?.serviceId
  );

  const formatTimeDisplay = (time24: string): string => {
    const [hours, minutes] = time24.split(":");
    const hour = parseInt(hours, 10);
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${period}`;
  };

  const form = useForm({
    resolver: zodResolver(lookupSchema),
    defaultValues: {
      bookingId: "",
      email: "",
    },
  });

  const onLookup = async (data: z.infer<typeof lookupSchema>) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/bookings/${data.bookingId}?email=${encodeURIComponent(data.email)}`
      );
      if (!response.ok) {
        throw new Error("Booking not found");
      }
      const bookingData = await response.json();
      setBooking(bookingData);
      toast({
        title: "Booking Found",
        description: "Your booking details are displayed below.",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Not Found",
        description: "Invalid Booking ID or email. Please check and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onCancel = async () => {
    if (!booking) return;
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/bookings/${booking.id}/cancel`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.getValues("email") }),
      });
      if (!response.ok) throw new Error("Failed to cancel");
      
      toast({
        title: "Cancelled",
        description: "Your booking has been cancelled. A confirmation email has been sent.",
      });
      
      setTimeout(() => {
        setBooking(null);
        form.reset();
        setRescheduledDate(undefined);
        setRescheduledTime(undefined);
        setShowRescheduleForm(false);
      }, 1500);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to cancel booking. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onReschedule = async () => {
    if (!booking || !rescheduledDate || !rescheduledTime) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/bookings/${booking.id}/reschedule`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.getValues("email"),
          newDate: format(rescheduledDate, "yyyy-MM-dd"),
          newTime: rescheduledTime,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to reschedule");
      }
      const updated = await response.json();
      setBooking(updated);
      setShowRescheduleForm(false);
      setRescheduledDate(undefined);
      setRescheduledTime(undefined);
      toast({
        title: "Rescheduled",
        description: "Your booking has been rescheduled. A confirmation email has been sent.",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to reschedule booking. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pt-12 pb-24 min-h-screen bg-background">
      <div className="container mx-auto px-4 max-w-2xl">
        <h1 className="text-4xl font-display font-bold text-center text-white mb-12">Manage Your Booking</h1>

        {!booking ? (
          <div className="bg-card border border-white/5 rounded-2xl p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onLookup)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="bookingId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Booking ID</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter your booking ID" className="bg-background border-white/10" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="Your email address" className="bg-background border-white/10" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" variant="gold" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Find Booking
                </Button>
              </form>
            </Form>
          </div>
        ) : (
          <div className="space-y-6">
            {booking.status === "cancelled" && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex gap-3 items-start">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-red-500">This booking is cancelled</p>
                  <p className="text-sm text-red-500/80">You cannot reschedule a cancelled booking.</p>
                </div>
              </div>
            )}

            <div className="bg-card border border-white/5 rounded-2xl p-8">
              <h2 className="text-2xl font-display font-bold text-white mb-6">Booking Details</h2>
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg">
                  <Calendar className="w-5 h-5 text-primary" />
                  <div>
                    <span className="text-xs text-muted-foreground">Date</span>
                    <p className="text-white font-medium">{booking.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg">
                  <Clock className="w-5 h-5 text-primary" />
                  <div>
                    <span className="text-xs text-muted-foreground">Time</span>
                    <p className="text-white font-medium">{formatTimeDisplay(booking.time)}</p>
                  </div>
                </div>
                <div className="p-3 bg-background/50 rounded-lg">
                  <span className="text-xs text-muted-foreground">Customer</span>
                  <p className="text-white font-medium">{booking.customerName}</p>
                </div>
                <div className="p-3 bg-background/50 rounded-lg">
                  <span className="text-xs text-muted-foreground">Booking ID</span>
                  <p className="text-white font-medium font-mono">{booking.bookingId}</p>
                </div>
                <div className="p-3 bg-background/50 rounded-lg">
                  <span className="text-xs text-muted-foreground">Status</span>
                  <p className={`text-white font-medium capitalize ${booking.status === 'cancelled' ? 'text-red-400' : 'text-green-400'}`}>{booking.status}</p>
                </div>
              </div>

              {booking.status !== "cancelled" && !showRescheduleForm && (
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setShowRescheduleForm(true)} disabled={isLoading}>
                    Reschedule
                  </Button>
                  <Button variant="destructive" onClick={onCancel} disabled={isLoading}>
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Cancel Booking
                  </Button>
                </div>
              )}

              {showRescheduleForm && booking.status !== "cancelled" && (
                <div className="space-y-6 mt-8 pt-6 border-t border-white/5">
                  <h3 className="font-bold text-white">Select New Date & Time</h3>
                  <div className="bg-background rounded-xl p-4 border border-white/10">
                    <DayPicker
                      mode="single"
                      selected={rescheduledDate}
                      onSelect={setRescheduledDate}
                      fromDate={addDays(new Date(), 1)}
                      className="m-0"
                      modifiersClassNames={{
                        selected: "bg-primary text-black hover:bg-primary/90 rounded-md",
                      }}
                      disabled={(date) => {
                        const tomorrow = addDays(new Date(), 1);
                        tomorrow.setHours(0, 0, 0, 0);
                        const checkDate = new Date(date);
                        checkDate.setHours(0, 0, 0, 0);
                        return checkDate < tomorrow;
                      }}
                    />
                  </div>

                  {rescheduledDate && (
                    <div className="space-y-3">
                      <label className="text-sm text-muted-foreground">Select Time</label>
                      <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                        {availability?.slots.map((slot) => (
                          <button
                            key={slot}
                            onClick={() => setRescheduledTime(slot)}
                            className={`py-2 px-2 rounded-lg border text-sm font-medium transition-all ${
                              rescheduledTime === slot
                                ? "border-primary bg-primary text-black"
                                : "border-white/10 hover:border-primary/50 text-white"
                            }`}
                          >
                            {formatTimeDisplay(slot)}
                          </button>
                        ))}
                      </div>
                      {availability?.slots.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">No available slots for this date.</p>
                      )}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setShowRescheduleForm(false)}>
                      Cancel
                    </Button>
                    <Button
                      variant="gold"
                      onClick={onReschedule}
                      disabled={isLoading || !rescheduledDate || !rescheduledTime}
                    >
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Confirm Reschedule
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <Button variant="outline" onClick={() => { setBooking(null); form.reset(); setRescheduledDate(undefined); setRescheduledTime(undefined); setShowRescheduleForm(false); }} className="w-full flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Search Another Booking
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
