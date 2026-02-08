import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Star, Sparkles, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[#0a0a0a]">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-primary/5 to-transparent opacity-50" />
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[128px]" />
          <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-[128px]" />
          <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] mix-blend-overlay" />
        </div>

        <div className="container relative z-10 px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-4xl mx-auto space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-primary text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              <span>Holistic Healing & Spiritual Growth</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-display font-bold leading-tight">
              Restore Balance to <br />
              <span className="text-gold-gradient">Your Soul</span>
            </h1>
            
            <p className="text-base md:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Experience profound healing and transformation at AJ Insta Heal. 
              We guide you on a journey to inner peace, wellness, and spiritual awakening.
            </p>
            
            <div className="text-white italic text-base sm:text-lg md:text-xl border-l-4 border-primary pl-4 sm:pl-6 py-3 sm:py-4 bg-white/5 rounded-r-lg">
              "We treat people, not diseases."
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Link href="/book">
                <Button variant="gold" size="lg" className="rounded-full">
                  Begin Your Journey
                </Button>
              </Link>
              <Link href="/about">
                <Button variant="outline" size="lg" className="rounded-full border-white/10 hover:bg-white/5 text-white">
                  Learn More
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Intro / About Teaser */}
      <section className="py-24 bg-card/30 relative">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-white/5 border border-white/10 group">
                <img 
                  src="/healing.png" 
                  alt="Acupuncture healing therapy"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-6 left-6 text-white font-display text-2xl">
                  Experience Holistic Healing
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="space-y-6"
            >
              <h2 className="text-4xl font-display font-bold text-white">Why Choose AJ Insta Heal?</h2>
              <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 mb-4">
                <p className="text-primary text-lg font-medium italic">
                  "We treat people, not diseases."
                </p>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Located in the historic town of Mattancherry, our sanctuary offers a unique blend of traditional healing practices and modern spiritual guidance. We believe that true healing comes from aligning the mind, body, and spirit.
              </p>
              
              <ul className="space-y-4 pt-4">
                {[
                  "Personalized healing sessions",
                  "Expert spiritual guidance",
                  "Peaceful and safe environment",
                  "Holistic approach to wellness"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-white/90">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                      <Heart className="w-3 h-3 text-primary fill-current" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>

              <Link href="/about">
                <Button variant="link" className="px-0 text-primary mt-4">
                  Learn more about us <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-card border-y border-white/5">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-display font-bold text-center text-white mb-16">Healing Stories</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah M.",
                text: "The healing session was transformative. I felt a weight lift off my shoulders that I didn't know I was carrying.",
                stars: 5
              },
              {
                name: "Rahul K.",
                text: "A truly peaceful experience. The guidance I received gave me clarity on my life path.",
                stars: 5
              },
              {
                name: "Emily R.",
                text: "Professional, kind, and deeply intuitive. I highly recommend AJ Insta Heal to anyone seeking balance.",
                stars: 5
              }
            ].map((review, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="bg-background/50 p-8 rounded-2xl border border-white/5"
              >
                <div className="flex gap-1 text-primary mb-4">
                  {[...Array(review.stars)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-muted-foreground italic mb-6">"{review.text}"</p>
                <p className="text-white font-medium">— {review.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/10" />
        <div className="container mx-auto px-4 relative text-center">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">Ready to Transform Your Life?</h2>
          <p className="text-xl text-white/80 max-w-2xl mx-auto mb-10">
            Take the first step towards a balanced, peaceful, and empowered future.
          </p>
          <Link href="/book">
            <Button variant="gold" size="lg" className="text-lg px-12 rounded-full shadow-2xl shadow-primary/20">
              Book Your Appointment Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
