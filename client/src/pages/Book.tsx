import { useState } from "react";
import { useLocation } from "wouter";
import { format, addDays } from "date-fns";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { bookingFormSchema, type BookingFormData } from "@shared/schema";
import { useAvailability, useCreateBooking } from "@/hooks/use-bookings";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, ChevronLeft, Clock, Calendar, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const STEPS = ["Date", "Time", "Details"];

export default function Book() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | undefined>(undefined);

  const { data: availability, isLoading: isLoadingAvailability } = useAvailability(
    selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined,
    undefined
  );

  const { toast } = useToast();
  const createBooking = useCreateBooking();
  const [bookingId, setBookingId] = useState<string | null>(null);

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      comments: "",
    },
  });

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) setCurrentStep(1);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setCurrentStep(2);
  };

  const onSubmit = (data: BookingFormData) => {
    if (!selectedDate || !selectedTime) {
      toast({ variant: "destructive", title: "Missing Information", description: "Please select a date and time." });
      return;
    }

    createBooking.mutate(
      { ...data, date: format(selectedDate, "yyyy-MM-dd"), time: selectedTime },
      {
        onSuccess: (booking) => {
          setBookingId(booking.bookingId);
          setCurrentStep(3);
        },
        onError: (err: any) => {
          toast({ variant: "destructive", title: "Booking Failed", description: err?.message || "Please try again." });
        },
      }
    );
  };

  const formatTimeDisplay = (time24: string): string => {
    const [hours, minutes] = time24.split(":");
    const hour = parseInt(hours, 10);
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${period}`;
  };

  const morningSlots = availability?.slots.filter(s => parseInt(s.split(":")[0]) < 12) ?? [];
  const eveningSlots = availability?.slots.filter(s => parseInt(s.split(":")[0]) >= 12) ?? [];

  return (
    <div className="pt-12 pb-24 min-h-screen bg-background">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-2 text-foreground">Book a Session</h1>
          <p className="text-muted-foreground text-sm">Choose a time that feels right for you</p>
        </div>

        {/* Step Indicator */}
        <div className="flex justify-between mb-10 relative">
          <div className="absolute top-4 left-0 w-full h-0.5 bg-border -z-10" />
          {STEPS.map((step, idx) => (
            <div key={idx} className="flex flex-col items-center gap-2 bg-background px-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 ${
                currentStep > idx ? "bg-primary border-primary text-primary-foreground" :
                currentStep === idx ? "bg-background border-primary text-primary shadow-lg shadow-primary/20" :
                "bg-background border-border text-muted-foreground"
              }`}>
                {currentStep > idx ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
              </div>
              <span className={`text-xs uppercase font-medium tracking-wider ${currentStep >= idx ? "text-foreground" : "text-muted-foreground"}`}>
                {step}
              </span>
            </div>
          ))}
        </div>

        {/* Selected summary bar */}
        {(selectedDate || selectedTime) && currentStep < 3 && (
          <div className="flex gap-4 mb-6 px-4 py-3 bg-primary/10 border border-primary/20 rounded-xl text-sm flex-wrap">
            {selectedDate && (
              <span className="flex items-center gap-2 text-primary font-medium">
                <Calendar className="w-4 h-4" />
                {format(selectedDate, "MMMM d, yyyy")}
              </span>
            )}
            {selectedTime && (
              <span className="flex items-center gap-2 text-primary font-medium">
                <Clock className="w-4 h-4" />
                {formatTimeDisplay(selectedTime)}
              </span>
            )}
          </div>
        )}

        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 min-h-[420px]">
          <AnimatePresence mode="wait">
            {/* Step 0 - Date */}
            {currentStep === 0 && (
              <motion.div key="step0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center">
                <h2 className="text-2xl font-display font-bold mb-2 text-foreground">Select Date</h2>
                <p className="text-muted-foreground text-sm mb-6">Clinic is open every day of the week</p>
                <div className="bg-background rounded-xl p-4 border border-border">
                  <DayPicker
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    fromDate={addDays(new Date(), 1)}
                    modifiersClassNames={{ selected: "bg-primary text-primary-foreground" }}
                  />
                </div>
              </motion.div>
            )}

            {/* Step 1 - Time */}
            {currentStep === 1 && (
              <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="flex items-center gap-3 mb-2">
                  <Button variant="ghost" size="icon" onClick={() => setCurrentStep(0)} className="shrink-0">
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <h2 className="text-2xl font-display font-bold text-foreground">Select Time</h2>
                </div>
                <p className="text-muted-foreground text-sm mb-6 ml-12">Choose a time that feels right for you</p>

                {isLoadingAvailability ? (
                  <div className="flex justify-center p-12">
                    <Loader2 className="animate-spin text-primary w-8 h-8" />
                  </div>
                ) : !availability?.slots.length ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Clock className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p>No available slots for this date.</p>
                    <p className="text-sm mt-1">Please select another date.</p>
                    <Button variant="outline" className="mt-4" onClick={() => setCurrentStep(0)}>Choose Another Date</Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {morningSlots.length > 0 && (
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">Morning Session</p>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                          {morningSlots.map((slot) => (
                            <button
                              key={slot}
                              onClick={() => handleTimeSelect(slot)}
                              className="py-4 px-2 rounded-xl border border-border hover:border-primary hover:bg-primary/10 hover:scale-[1.02] text-sm font-medium transition-all duration-200 active:scale-95 text-foreground"
                            >
                              {formatTimeDisplay(slot)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {eveningSlots.length > 0 && (
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">Evening Session</p>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                          {eveningSlots.map((slot) => (
                            <button
                              key={slot}
                              onClick={() => handleTimeSelect(slot)}
                              className="py-4 px-2 rounded-xl border border-border hover:border-primary hover:bg-primary/10 hover:scale-[1.02] text-sm font-medium transition-all duration-200 active:scale-95 text-foreground"
                            >
                              {formatTimeDisplay(slot)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 2 - Details */}
            {currentStep === 2 && (
              <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="flex items-center gap-3 mb-6">
                  <Button variant="ghost" size="icon" onClick={() => setCurrentStep(1)} className="shrink-0">
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <h2 className="text-2xl font-display font-bold text-foreground">Your Details</h2>
                </div>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField control={form.control} name="customerName" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Your full name" className="bg-background border-border h-12" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="customerEmail" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="your@email.com" className="bg-background border-border h-12" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="customerPhone" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="+91 00000 00000" className="bg-background border-border h-12" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="comments" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Health Concern or Notes <span className="text-muted-foreground font-normal">(Optional)</span></FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Briefly describe your concern or any special requirements..." className="bg-background border-border min-h-[100px]" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <Button type="submit" variant="gold" className="w-full h-12 text-base shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.01] transition-all duration-300" size="lg" disabled={createBooking.isPending}>
                      {createBooking.isPending ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Confirming...</>
                      ) : (
                        "Confirm Booking"
                      )}
                    </Button>
                  </form>
                </Form>
              </motion.div>
            )}

            {/* Step 3 - Success */}
            {currentStep === 3 && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="text-center py-10"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 12 }}
                  className="w-24 h-24 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-6"
                >
                  <CheckCircle2 className="w-12 h-12 text-green-500" />
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                  <h2 className="text-3xl font-display font-bold mb-3 text-foreground">Booking Confirmed!</h2>
                  <p className="text-muted-foreground mb-4">A confirmation email has been sent to you.</p>

                  <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-xl px-6 py-3 mb-8">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground text-sm">Booking ID:</span>
                    <span className="text-primary font-mono font-bold">{bookingId}</span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 justify-center flex-wrap">
                    <Button variant="gold" onClick={() => setLocation("/manage-booking")} className="rounded-full px-8">
                      Manage Booking
                    </Button>
                    <a
                      href={`https://wa.me/917025398998?text=Hi%2C%20I%20just%20booked%20an%20appointment%20at%20AJ%20Insta%20Heal%20(ID%3A%20${encodeURIComponent(bookingId ?? "")})`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" className="rounded-full px-8 border-green-500/30 text-green-600 dark:text-green-400 hover:bg-green-500/10 w-full">
                        WhatsApp Us
                      </Button>
                    </a>
                    <a
                      href="https://maps.app.goo.gl/fEgjpBbdRPoLiPTWA"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" className="rounded-full px-8 border-border w-full">
                        Get Directions
                      </Button>
                    </a>
                    <Button variant="ghost" onClick={() => setLocation("/")} className="rounded-full px-8 text-muted-foreground">
                      Back to Home
                    </Button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
