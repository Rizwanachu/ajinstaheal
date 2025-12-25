import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      category: "General Questions",
      items: [
        {
          q: "What is AJ Insta Heal's philosophy?",
          a: "At AJ Insta Heal, we believe in a holistic approach to wellness. Our core philosophy is: 'We treat people, not diseases.' This means we focus on understanding and healing the whole person—mind, body, and spirit—rather than just treating symptoms. Every session is personalized to your unique needs and journey."
        },
        {
          q: "Where is AJ Insta Heal located?",
          a: "We are located in the beautiful and historic town of Mattancherry, Ernakulam, Kerala, India. Our sanctuary provides a peaceful and welcoming environment for healing and spiritual growth."
        },
        {
          q: "Is AJ Insta Heal suitable for beginners?",
          a: "Absolutely! Our services are designed for everyone, regardless of experience level. Whether you're new to holistic healing or have been on this journey for years, we welcome you with open arms and will guide you through every step."
        }
      ]
    },
    {
      category: "Services & Booking",
      items: [
        {
          q: "What services do you offer?",
          a: "We offer a range of services including General Acupuncture, Pain Management, Stress Relief Sessions, and Cupping Therapy. Each service is tailored to support your personal growth and wellbeing. Visit our Services page to learn more about each offering."
        },
        {
          q: "How do I book an appointment?",
          a: "You can easily book an appointment through our online booking system by clicking 'Book Now' on our website. Select your preferred service, date, and time. You'll receive a confirmation email with all the details."
        },
        {
          q: "What is the duration of each session?",
          a: "Session durations vary by service. General Acupuncture and Pain Management sessions are typically 60 minutes, while Stress Relief and Cupping Therapy are 30 minutes. The exact duration will be clear when you book."
        },
        {
          q: "Can I reschedule or cancel my appointment?",
          a: "Yes, you can reschedule or cancel your appointment through our Manage Booking page. We recommend notifying us at least 24 hours before your scheduled appointment for a smooth rescheduling process."
        }
      ]
    },
    {
      category: "Healing & Wellness",
      items: [
        {
          q: "What should I expect during my first session?",
          a: "During your first session, we'll start with a consultation to understand your health history, concerns, and goals. This helps us personalize your treatment. You'll then experience our healing modality in a comfortable, peaceful environment. We encourage you to relax and be open to the healing process."
        },
        {
          q: "Are your treatments scientifically proven?",
          a: "Our services are based on traditional healing practices combined with modern wellness approaches. While our focus is on holistic wellness, we encourage you to discuss any medical concerns with your healthcare provider before booking."
        },
        {
          q: "Is acupuncture painful?",
          a: "Most people find acupuncture to be a gentle and relaxing experience. The needles are very thin, and any sensation is usually minimal. You may feel a slight pressure or warmth at the acupuncture points, which is normal. Our practitioners are trained to ensure your comfort."
        },
        {
          q: "How many sessions will I need?",
          a: "The number of sessions depends on your individual situation and goals. Some people benefit from a single session, while others find that a series of treatments provides more lasting results. We'll discuss the best approach for you during your consultation."
        }
      ]
    },
    {
      category: "Contact & Support",
      items: [
        {
          q: "How can I contact you if I have questions?",
          a: "You can reach us via phone at +91 70253 98998, visit us in person at our Mattancherry location, or use the contact form on our website. You can also message us on Instagram (@aj_instaheal_) or Facebook for quick inquiries."
        },
        {
          q: "Do you offer consultations before booking?",
          a: "Yes! If you'd like to discuss your health concerns or learn more about our services before booking, please contact us. We're happy to answer any questions and help you find the right service for your needs."
        },
        {
          q: "What is your cancellation policy?",
          a: "We understand that life happens! You can cancel or reschedule your appointment anytime through our Manage Booking page. We appreciate at least 24 hours notice to help us serve other clients better."
        }
      ]
    }
  ];

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[50vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[#0a0a0a]">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-primary/5 to-transparent opacity-50" />
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[128px]" />
        </div>

        <div className="container relative z-10 px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold leading-tight mb-6">
              Frequently Asked <span className="text-gold-gradient">Questions</span>
            </h1>
            <p className="text-base md:text-lg lg:text-xl text-muted-foreground">
              Find answers to common questions about our services, philosophy, and healing journey.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Clinic Philosophy Quote */}
      <section className="py-12 sm:py-16 bg-primary/10 border-y border-primary/20">
        <div className="container mx-auto px-4 text-center">
          <p className="text-lg sm:text-2xl md:text-3xl font-display text-primary italic px-2">
            "We treat people, not diseases."
          </p>
          <p className="text-muted-foreground mt-3 sm:mt-4 max-w-2xl mx-auto px-2 text-sm md:text-base">
            This philosophy guides every interaction and treatment at AJ Insta Heal. We believe in holistic healing that addresses the whole person—mind, body, and spirit.
          </p>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            {faqs.map((section, sectionIdx) => (
              <motion.div
                key={sectionIdx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: sectionIdx * 0.1 }}
                className="mb-12"
              >
                <h2 className="text-3xl font-display font-bold text-white mb-8">
                  {section.category}
                </h2>

                <div className="space-y-4">
                  {section.items.map((item, itemIdx) => (
                    <div
                      key={itemIdx}
                      className="border border-white/10 rounded-lg overflow-hidden bg-card/30 hover:border-primary/50 transition-colors"
                    >
                      <button
                        onClick={() =>
                          setOpenIndex(
                            openIndex === sectionIdx * 100 + itemIdx
                              ? null
                              : sectionIdx * 100 + itemIdx
                          )
                        }
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors text-left"
                      >
                        <span className="font-medium text-white text-lg">
                          {item.q}
                        </span>
                        <ChevronDown
                          className={`w-5 h-5 text-primary transition-transform duration-300 shrink-0 ${
                            openIndex === sectionIdx * 100 + itemIdx
                              ? "transform rotate-180"
                              : ""
                          }`}
                        />
                      </button>

                      {openIndex === sectionIdx * 100 + itemIdx && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="border-t border-white/10 px-6 py-4 bg-white/5"
                        >
                          <p className="text-muted-foreground leading-relaxed">
                            {item.a}
                          </p>
                        </motion.div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-card/50 border-t border-white/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-display font-bold text-white mb-6">
            Still Have Questions?
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
            Feel free to reach out to us directly. We're here to help and guide you on your healing journey.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact" asChild>
              <Button variant="gold" size="lg" className="rounded-full">
                Contact Us
              </Button>
            </Link>
            <Link href="/book" asChild>
              <Button
                variant="outline"
                size="lg"
                className="rounded-full border-white/10 hover:bg-white/5"
              >
                Book an Appointment
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
