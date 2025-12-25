import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertEnquirySchema, type InsertEnquiry } from "@shared/schema";
import { useCreateEnquiry } from "@/hooks/use-enquiries";
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
import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";
import { motion } from "framer-motion";

export default function Contact() {
  const { toast } = useToast();
  const mutation = useCreateEnquiry();

  const form = useForm<InsertEnquiry>({
    resolver: zodResolver(insertEnquirySchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      message: "",
    },
  });

  const onSubmit = (data: InsertEnquiry) => {
    mutation.mutate(data, {
      onSuccess: () => {
        toast({
          title: "Message Sent!",
          description: "We will get back to you shortly.",
        });
        form.reset();
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to send message. Please try again.",
        });
      },
    });
  };

  return (
    <div className="pt-12 pb-24">
      <div className="container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-6">Get in Touch</h1>
          <p className="text-base md:text-lg lg:text-xl text-muted-foreground">
            Have questions? We're here to help you on your journey.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Contact Info */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-8"
          >
            <div className="bg-card border border-white/5 rounded-2xl p-8 space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Visit Us</h3>
                  <p className="text-muted-foreground">
                    Mattancherry, Ernakulam<br />
                    Kerala, India
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Call Us</h3>
                  <p className="text-muted-foreground">+91 70253 98998</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Opening Hours</h3>
                  <p className="text-muted-foreground">Mon - Sat: 9:00 AM - 6:00 PM</p>
                  <p className="text-muted-foreground">Sun: Closed</p>
                </div>
              </div>
            </div>

            {/* Location Map */}
            <a href="https://maps.app.goo.gl/fEgjpBbdRPoLiPTWA" target="_blank" rel="noopener noreferrer" className="block rounded-2xl overflow-hidden border border-white/5 h-48 sm:h-64 bg-secondary hover:opacity-80 transition-opacity">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3051.278457940428!2d76.25275243705494!3d9.960170502935783!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3b08730039543d5d%3A0xc098983c7d8bcb2f!2sAJ%20INSTA%20HEAL%2C%20ACUPUNCTURE%20AND%20HOLISTIC%20WELLNESS%20CENTRE!5e0!3m2!1sen!2sin!4v1766343989436!5m2!1sen!2sin" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen={true}
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
              />
            </a>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="bg-card border border-white/5 rounded-2xl p-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your full name" {...field} className="bg-secondary/50 border-white/10" />
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
                          <Input placeholder="your@email.com" {...field} className="bg-secondary/50 border-white/10" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="+91 000 000 0000" {...field} className="bg-secondary/50 border-white/10" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message</FormLabel>
                        <FormControl>
                          <Textarea placeholder="How can we help you?" className="min-h-[120px] bg-secondary/50 border-white/10" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" variant="gold" className="w-full" disabled={mutation.isPending}>
                    {mutation.isPending ? "Sending..." : "Send Message"}
                    {!mutation.isPending && <Send className="w-4 h-4 ml-2" />}
                  </Button>
                </form>
              </Form>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
