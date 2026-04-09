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
          a: "Our core belief is simple: we treat people, not diseases. Rather than chasing symptoms, we take time to understand the whole person. Mind, body and spirit. Every session is personalized to your unique needs and journey."
        },
        {
          q: "Where is AJ Insta Heal located?",
          a: "We are based in the historic town of Mattancherry, Ernakulam, Kerala, India. Our space is calm, welcoming and designed to support your healing from the moment you walk in."
        },
        {
          q: "Is AJ Insta Heal suitable for beginners?",
          a: "Absolutely. Whether this is your first time exploring holistic healing or you have been on this path for years, you are welcome here. We will guide you through every step at your own pace."
        }
      ]
    },
    {
      category: "Services & Booking",
      items: [
        {
          q: "What services do you offer?",
          a: "We offer acupuncture-based treatments covering pain management, stress relief and a wide range of conditions including hormonal, digestive and immunity concerns. Each session is tailored to your specific needs."
        },
        {
          q: "How do I book an appointment?",
          a: "Simply click 'Book Now' on our website. Choose your preferred service, date and time. You will receive a confirmation email with everything you need."
        },
        {
          q: "What is the duration of each session?",
          a: "Session length varies depending on your treatment. We will always be clear about timing when you book, so there are no surprises."
        },
        {
          q: "Can I reschedule or cancel my appointment?",
          a: "Yes. You can reschedule or cancel through our Manage Booking page at any time. We appreciate at least 24 hours notice so we can offer your slot to someone else."
        }
      ]
    },
    {
      category: "Healing & Wellness",
      items: [
        {
          q: "What should I expect during my first session?",
          a: "We begin with a brief consultation to understand your health history, concerns and goals. This helps us plan the right treatment for you. From there, you will experience your session in a calm, comfortable environment. Just relax and let the process work."
        },
        {
          q: "Are your treatments scientifically proven?",
          a: "Our work is rooted in traditional healing practices that have been used for centuries. We also stay informed by current wellness research. If you have specific medical concerns, we always encourage you to speak with your healthcare provider as well."
        },
        {
          q: "Is acupuncture painful?",
          a: "Most people find it surprisingly gentle. The needles are very fine, and any sensation is usually just a light pressure or warmth at the treatment points. Our practitioners are experienced and will ensure you are comfortable throughout."
        },
        {
          q: "How many sessions will I need?",
          a: "It depends on your condition and goals. Some people feel significant improvement after a few sessions, while others benefit from a structured program over time. We will discuss the best approach for you during your first visit."
        }
      ]
    },
    {
      category: "Contact & Support",
      items: [
        {
          q: "How can I contact you if I have questions?",
          a: "You can call us at +91 70253 98998, visit us in Mattancherry, or use the contact form on our website. We are also reachable on Instagram (@aj_instaheal_) and Facebook for quick questions."
        },
        {
          q: "Do you offer consultations before booking?",
          a: "Yes. If you would like to talk through your concerns before committing to a session, just reach out. We are happy to help you figure out the right next step."
        },
        {
          q: "What is your cancellation policy?",
          a: "Life happens, and we understand that. Cancel or reschedule anytime through our Manage Booking page. We just ask for at least 24 hours notice when possible so we can accommodate other patients."
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
            This guides everything we do at AJ Insta Heal. Real healing means caring for the whole person: mind, body and spirit.
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
            Reach out any time. We are always happy to help.
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
                Book Now
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
