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
import { Loader2, Calendar, Clock, CheckCircle2, ChevronLeft } from "lucide-react";
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
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please select a date and time.",
      });
      return;
    }

    const bookingData = {
      ...data,
      date: format(selectedDate, "yyyy-MM-dd"),
      time: selectedTime,
    };
    
    createBooking.mutate(bookingData, {
      onSuccess: (booking) => {
        setBookingId(booking.bookingId);
        setCurrentStep(3); // Success
      },
      onError: (err: any) => {
        toast({
          variant: "destructive",
          title: "Booking Failed",
          description: err?.message || "Please try again.",
        });
      }
    });
  };

  const formatTimeDisplay = (time24: string): string => {
    const [hours, minutes] = time24.split(":");
    const hour = parseInt(hours, 10);
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${period}`;
  };

  return (
    <div className="pt-12 pb-24 min-h-screen bg-background text-white">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-center mb-8">Book Appointment</h1>
        
        <div className="flex justify-between mb-12 relative">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/10 -z-10 -translate-y-1/2" />
          {STEPS.map((step, idx) => (
            <div key={idx} className="flex flex-col items-center gap-2 bg-background px-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                currentStep > idx ? "bg-primary border-primary text-black" :
                currentStep === idx ? "bg-background border-primary text-primary" :
                "bg-background border-white/20 text-muted-foreground"
              }`}>
                {currentStep > idx ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
              </div>
              <span className={`text-xs uppercase font-medium tracking-wider ${
                currentStep >= idx ? "text-white" : "text-muted-foreground"
              }`}>{step}</span>
            </div>
          ))}
        </div>

        <div className="bg-card border border-white/5 rounded-2xl p-8 min-h-[400px]">
          <AnimatePresence mode="wait">
            {currentStep === 0 && (
              <motion.div key="step0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center">
                <h2 className="text-2xl font-display font-bold mb-6">Select Date</h2>
                <div className="bg-background rounded-xl p-4 border border-white/10">
                  <DayPicker
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    fromDate={addDays(new Date(), 1)}
                    modifiersClassNames={{ selected: "bg-primary text-black" }}
                  />
                </div>
              </motion.div>
            )}

            {currentStep === 1 && (
              <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                 <div className="flex items-center gap-4 mb-6">
                  <Button variant="ghost" size="icon" onClick={() => setCurrentStep(0)}><ChevronLeft /></Button>
                  <h2 className="text-2xl font-display font-bold">Select Time</h2>
                </div>
                {isLoadingAvailability ? (
                  <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {availability?.slots.map((slot) => (
                      <button key={slot} onClick={() => handleTimeSelect(slot)} className="py-3 rounded-lg border border-white/10 hover:border-primary hover:bg-primary/10 text-sm">
                        {formatTimeDisplay(slot)}
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="flex items-center gap-4 mb-6">
                  <Button variant="ghost" size="icon" onClick={() => setCurrentStep(1)}><ChevronLeft /></Button>
                  <h2 className="text-2xl font-display font-bold">Your Details</h2>
                </div>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField control={form.control} name="customerName" render={({ field }) => (
                      <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} className="bg-background border-white/10" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="customerEmail" render={({ field }) => (
                      <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} type="email" className="bg-background border-white/10" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="customerPhone" render={({ field }) => (
                      <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} className="bg-background border-white/10" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="comments" render={({ field }) => (
                      <FormItem><FormLabel>Comments</FormLabel><FormControl><Textarea {...field} className="bg-background border-white/10" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <Button type="submit" variant="gold" className="w-full" size="lg" disabled={createBooking.isPending}>
                      {createBooking.isPending ? "Confirming..." : "Confirm Booking"}
                    </Button>
                  </form>
                </Form>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
                <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-6" />
                <h2 className="text-3xl font-display font-bold mb-4">Booking Confirmed!</h2>
                <p className="text-muted-foreground mb-8">Booking ID: <span className="text-primary font-mono">{bookingId}</span></p>
                <Button variant="outline" onClick={() => setLocation("/")}>Back to Home</Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
