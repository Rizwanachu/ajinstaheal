import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { format, addDays } from "date-fns";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { bookingFormSchema, type BookingFormData } from "@shared/schema";
import { useServices } from "@/hooks/use-services";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Calendar, Clock, CheckCircle2, ChevronRight, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const STEPS = ["Service", "Date", "Time", "Details"];

export default function Book() {
  const [location, setLocation] = useLocation();
  // Get serviceId from URL params (simple parsing)
  const queryParams = new URLSearchParams(window.location.search);
  const initialServiceId = queryParams.get("service") ? Number(queryParams.get("service")) : undefined;

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedServiceId, setSelectedServiceId] = useState<number | undefined>(initialServiceId);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | undefined>(undefined);
  
  const { data: services, isLoading: isLoadingServices } = useServices();
  const { data: availability, isLoading: isLoadingAvailability } = useAvailability(
    selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined,
    selectedServiceId
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

  // Auto-advance if service pre-selected
  useEffect(() => {
    if (initialServiceId && services) {
      setCurrentStep(1);
    }
  }, [initialServiceId, services]);

  const handleServiceSelect = (id: string) => {
    setSelectedServiceId(Number(id));
    setCurrentStep(1);
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) setCurrentStep(2);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setCurrentStep(3);
  };

  const onSubmit = (data: BookingFormData) => {
    if (!selectedServiceId || !selectedDate || !selectedTime) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please complete all steps before booking.",
      });
      return;
    }

    const bookingData = {
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      comments: data.comments || null,
      serviceId: selectedServiceId,
      date: format(selectedDate, "yyyy-MM-dd"),
      time: selectedTime,
    };
    
    createBooking.mutate(bookingData, {
      onSuccess: (booking) => {
        setBookingId(booking.bookingId);
        setCurrentStep(4); // Success step
        toast({
          title: "Booking Confirmed!",
          description: "Your appointment has been booked successfully.",
        });
      },
      onError: (err: any) => {
        toast({
          variant: "destructive",
          title: "Booking Failed",
          description: err?.message || "Failed to create booking. Please try again.",
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

  const selectedService = services?.find(s => s.id === selectedServiceId);

  return (
    <div className="pt-12 pb-24 min-h-screen bg-background">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-center text-white mb-6 sm:mb-8">Book Appointment</h1>
        
        {/* Steps Indicator */}
        <div className="flex justify-between mb-8 sm:mb-12 relative overflow-x-auto pb-2">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/10 -z-10 -translate-y-1/2" />
          {STEPS.map((step, idx) => (
            <div key={idx} className="flex flex-col items-center gap-1 sm:gap-2 bg-background px-1 sm:px-2 flex-shrink-0">
              <div className={`w-7 sm:w-8 h-7 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold border-2 transition-colors ${
                currentStep > idx ? "bg-primary border-primary text-black" :
                currentStep === idx ? "bg-background border-primary text-primary" :
                "bg-background border-white/20 text-muted-foreground"
              }`}>
                {currentStep > idx ? <CheckCircle2 className="w-4 sm:w-5 h-4 sm:h-5" /> : idx + 1}
              </div>
              <span className={`text-xs uppercase font-medium tracking-wider whitespace-nowrap ${
                currentStep >= idx ? "text-white" : "text-muted-foreground"
              }`}>{step}</span>
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="bg-card border border-white/5 rounded-2xl p-4 sm:p-6 md:p-8 min-h-[400px]">
          <AnimatePresence mode="wait">
            {/* STEP 1: SERVICE */}
            {currentStep === 0 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h2 className="text-2xl font-display font-bold text-white mb-6">Select a Service</h2>
                {isLoadingServices ? (
                  <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {services?.map((service) => (
                      <button
                        key={service.id}
                        onClick={() => handleServiceSelect(String(service.id))}
                        className="text-left p-6 rounded-xl border border-white/10 hover:border-primary/50 hover:bg-white/5 transition-all group"
                      >
                        <h3 className="text-lg font-bold text-white group-hover:text-primary mb-2">{service.name}</h3>
                        <p className="text-sm text-muted-foreground mb-4">{service.duration} mins • {service.price}</p>
                        <p className="text-sm text-muted-foreground/80 line-clamp-2">{service.description}</p>
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 2: DATE */}
            {currentStep === 1 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col items-center"
              >
                <div className="flex items-center gap-4 mb-6 w-full">
                  <Button variant="ghost" size="icon" onClick={() => setCurrentStep(0)}>
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <h2 className="text-2xl font-display font-bold text-white">Select Date</h2>
                </div>

                <div className="bg-background rounded-xl p-4 border border-white/10">
                  <DayPicker
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    fromDate={addDays(new Date(), 1)}
                    className="m-0"
                    modifiersClassNames={{
                      selected: "bg-primary text-black hover:bg-primary/90 rounded-md",
                    }}
                    disabled={(date) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const checkDate = new Date(date);
                      checkDate.setHours(0, 0, 0, 0);
                      return checkDate <= today;
                    }}
                  />
                </div>
              </motion.div>
            )}

            {/* STEP 3: TIME */}
            {currentStep === 2 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                 <div className="flex items-center gap-4 mb-6">
                  <Button variant="ghost" size="icon" onClick={() => setCurrentStep(1)}>
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <h2 className="text-2xl font-display font-bold text-white">Select Time</h2>
                </div>

                <div className="mb-6 p-4 bg-background/50 rounded-lg border border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-muted-foreground block text-sm">Service</span>
                    <span className="text-white font-medium">{selectedService?.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-muted-foreground block text-sm">Date</span>
                    <span className="text-white font-medium">
                      {selectedDate ? format(selectedDate, "MMM d, yyyy") : ""}
                    </span>
                  </div>
                </div>

                {isLoadingAvailability ? (
                  <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {availability?.slots.map((slot) => (
                      <button
                        key={slot.time}
                        onClick={() => slot.available && handleTimeSelect(slot.time)}
                        disabled={!slot.available}
                        className={`py-3 px-2 rounded-lg border transition-all text-sm font-medium ${
                          slot.available
                            ? "border-white/10 hover:border-primary hover:bg-primary/10 hover:text-primary cursor-pointer"
                            : "border-red-500/30 bg-red-500/5 text-muted-foreground cursor-not-allowed opacity-50"
                        }`}
                      >
                        {formatTimeDisplay(slot.time)}
                      </button>
                    ))}
                    {availability?.slots.length === 0 && (
                      <div className="col-span-full text-center py-8 text-muted-foreground">
                        No slots available for this date.
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 4: FORM */}
            {currentStep === 3 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="flex items-center gap-4 mb-6">
                  <Button variant="ghost" size="icon" onClick={() => setCurrentStep(2)}>
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <h2 className="text-2xl font-display font-bold text-white">Your Details</h2>
                </div>

                <div className="bg-background/30 p-4 rounded-lg border border-white/5 mb-8 text-sm">
                  <div className="flex items-center gap-6 text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {selectedDate && format(selectedDate, "MMM d, yyyy")}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {selectedTime && formatTimeDisplay(selectedTime)}
                    </div>
                  </div>
                  <div className="mt-2 font-medium text-white">{selectedService?.name}</div>
                </div>

                <Form {...form}>
                  <form onSubmit={(e) => {
                    console.log("Form submit event triggered");
                    console.log("Form errors:", form.formState.errors);
                    console.log("Form values:", form.getValues());
                    form.handleSubmit(onSubmit)(e);
                  }} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <FormField
                        control={form.control}
                        name="customerName"
                        render={({ field, fieldState }) => (
                          <FormItem>
                            <FormLabel>Name *</FormLabel>
                            <FormControl>
                              <Input {...field} className="bg-background border-white/10" />
                            </FormControl>
                            {fieldState.error && <p className="text-red-500 text-sm mt-1">{fieldState.error.message}</p>}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="customerEmail"
                        render={({ field, fieldState }) => (
                          <FormItem>
                            <FormLabel>Email *</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" className="bg-background border-white/10" />
                            </FormControl>
                            {fieldState.error && <p className="text-red-500 text-sm mt-1">{fieldState.error.message}</p>}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="customerPhone"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel>Phone *</FormLabel>
                          <FormControl>
                            <Input {...field} className="bg-background border-white/10" />
                          </FormControl>
                          {fieldState.error && <p className="text-red-500 text-sm mt-1">{fieldState.error.message}</p>}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="comments"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Comments (Optional)</FormLabel>
                          <FormControl>
                            <Textarea {...field} value={field.value || ""} className="bg-background border-white/10" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="pt-4">
                      <Button type="submit" variant="gold" className="w-full" size="lg" disabled={createBooking.isPending}>
                        {createBooking.isPending ? "Confirming..." : "Confirm Booking"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </motion.div>
            )}

            {/* SUCCESS */}
            {currentStep === 4 && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-display font-bold text-white mb-2">Booking Confirmed!</h2>
                
                {bookingId && (
                  <div className="my-6 p-4 bg-primary/20 border border-primary/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Your Booking ID</p>
                    <p className="text-2xl font-bold text-primary font-mono">{bookingId}</p>
                    <p className="text-xs text-muted-foreground mt-2">Please save this ID for reference</p>
                  </div>
                )}
                
                <p className="text-muted-foreground mb-8">
                  Thank you for booking with AJ Insta Heal. We have sent a confirmation email to you with all your appointment details.
                </p>
                <Button variant="outline" onClick={() => setLocation("/")}>
                  Back to Home
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
