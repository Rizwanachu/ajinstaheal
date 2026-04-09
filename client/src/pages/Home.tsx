import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Star, Sparkles, Heart, Shield, Leaf, CheckCircle2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.12, duration: 0.7, ease: "easeOut" } }),
};

const healers = [
  { name: "HR Jinas T N", title: "Certified Acupuncture Healer", initials: "JN" },
  { name: "HR Aasiya Mansoor", title: "Certified Acupuncture Healer", initials: "AM" },
];

const programPhases = [
  { phase: "Phase 1", duration: "11 Days", detail: "Continuous daily treatment sessions", color: "from-primary/30 to-primary/5" },
  { phase: "Break", duration: "6 Days", detail: "Rest & recovery period", color: "", isBreak: true },
  { phase: "Phase 2", duration: "5 Days", detail: "Continued targeted treatment", color: "from-primary/30 to-primary/5" },
  { phase: "Break", duration: "6 Days", detail: "Rest & recovery period", color: "", isBreak: true },
  { phase: "Phase 3", duration: "5 Days", detail: "Final consolidation treatment", color: "from-primary/30 to-primary/5" },
];

const whyUs = [
  { icon: <Shield className="w-6 h-6" />, title: "Root-Cause Healing", desc: "We go beyond symptoms to find and treat the source of your condition for real, lasting relief." },
  { icon: <Heart className="w-6 h-6" />, title: "Personalized Care", desc: "Every session is designed around you. Your body, your history, your goals." },
  { icon: <Leaf className="w-6 h-6" />, title: "Natural & Non-Invasive", desc: "Drug-free acupuncture that works with your body's own healing intelligence." },
];

const services = [
  {
    title: "Pain Management",
    desc: "Targeted acupuncture for chronic and acute pain. Whether it's joints, spine or headaches, we work to remove the source of pain rather than mask it.",
    icon: "🩺",
  },
  {
    title: "Acupuncture for All Conditions",
    desc: "From stress and digestion to hormonal health and immunity, acupuncture addresses the whole body. Every session is tailored to your specific condition.",
    icon: "✦",
  },
];

export default function Home() {
  return (
    <div className="overflow-hidden">
      {/* ─── Hero ─────────────────────────────────────────────── */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          {/* Hero photo */}
          <img
            src="/healing.png"
            alt="Acupuncture healing session"
            className="absolute inset-0 w-full h-full object-cover object-center"
            loading="eager"
          />
          {/* Dark overlay — preserves theme while letting the image breathe */}
          <div className="absolute inset-0 bg-background/80 dark:bg-[#0d0d0d]/88" />
          {/* Gradient fade at the bottom so the next section blends in */}
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background dark:from-[#0d0d0d] to-transparent" />
          {/* Existing ambient glows on top */}
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-primary/5 to-transparent opacity-60 pointer-events-none" />
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[128px] pointer-events-none" />
          <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-[128px] pointer-events-none" />
        </div>

        <div className="container relative z-10 px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-4xl mx-auto space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/60 border border-border text-primary text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              <span>Holistic Healing & Spiritual Growth</span>
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold leading-tight">
              Restore Balance to <br />
              <span className="text-gold-gradient">Your Soul</span>
            </h1>

            <p className="text-base md:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Experience profound healing and transformation at AJ Insta Heal.
              We guide you toward inner peace, wellness and spiritual awakening.
            </p>

            <div className="text-foreground italic text-base sm:text-lg border-l-4 border-primary pl-5 py-3 bg-muted/40 rounded-r-lg text-left max-w-xl mx-auto">
              "We treat people, not diseases."
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/book">
                <Button variant="gold" size="lg" className="rounded-full min-w-[180px] shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.03] transition-all duration-300">
                  Begin Your Journey
                </Button>
              </Link>
              <Link href="/about">
                <Button variant="outline" size="lg" className="rounded-full border-border hover:bg-muted/50 hover:border-primary/40 min-w-[160px] transition-all duration-300">
                  Learn More
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Philosophy ───────────────────────────────────────── */}
      <section className="py-20 bg-card relative">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted border border-border group">
                <img
                  src="/healing.png"
                  alt="Acupuncture healing therapy"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
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
              <h2 className="text-4xl font-display font-bold text-foreground">Our Philosophy</h2>
              <p className="text-muted-foreground leading-relaxed text-lg">
                The best treatment addresses the root cause of a disease. Treating symptoms may offer temporary relief. Focusing on the underlying reason leads to a more complete cure.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Acupuncture targets the source, restoring balance to mind, body and spirit. Located in the historic town of Mattancherry, our sanctuary blends ancient wisdom with compassionate, personalized care.
              </p>

              <ul className="space-y-3 pt-2">
                {[
                  "Personalized healing sessions",
                  "Root-cause focused treatment",
                  "Peaceful and safe environment",
                  "Holistic approach to wellness",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-foreground/90">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <Heart className="w-3 h-3 text-primary fill-current" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>

              <Link href="/about">
                <Button variant="link" className="px-0 text-primary mt-4 hover:gap-3 transition-all">
                  Learn more about us <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Why Choose Us ────────────────────────────────────── */}
      <section className="py-20 border-y border-border">
        <div className="container mx-auto px-4">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">Why Choose AJ Insta Heal</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Time-tested healing practices paired with a genuine commitment to your well-being.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {whyUs.map((item, i) => (
              <motion.div
                key={i}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="bg-card border border-border rounded-2xl p-8 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-5 group-hover:bg-primary/20 transition-colors">
                  {item.icon}
                </div>
                <h3 className="text-xl font-display font-bold text-foreground mb-3">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Services ─────────────────────────────────────────── */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">Our Services</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Focused treatments designed to restore your body's natural balance.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {services.map((svc, i) => (
              <motion.div
                key={i}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="bg-card border border-border rounded-2xl p-8 hover:border-primary/40 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
              >
                <div className="text-3xl mb-4">{svc.icon}</div>
                <h3 className="text-2xl font-display font-bold text-foreground mb-3">{svc.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{svc.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Our Healers ──────────────────────────────────────── */}
      <section className="py-20 border-y border-border">
        <div className="container mx-auto px-4">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">Our Healers</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Certified practitioners devoted to your healing and well-being.
            </p>
          </motion.div>

          <div className="flex flex-col sm:flex-row gap-8 justify-center max-w-2xl mx-auto">
            {healers.map((healer, i) => (
              <motion.div
                key={i}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="flex-1 bg-card border border-border rounded-2xl p-8 text-center hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/30 to-primary/5 border border-primary/20 flex items-center justify-center mx-auto mb-5 text-2xl font-display font-bold text-primary group-hover:from-primary/40 transition-all">
                  {healer.initials}
                </div>
                <h3 className="text-xl font-display font-bold text-foreground mb-1">{healer.name}</h3>
                <p className="text-primary text-sm font-medium">{healer.title}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Structured Healing Program ───────────────────────── */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">Structured Healing Program</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A proven three-phase approach that gives your body the space to heal deeply and restore lasting balance.
            </p>
          </motion.div>

          <div className="max-w-3xl mx-auto">
            <div className="space-y-4">
              {programPhases.map((phase, i) => (
                <motion.div
                  key={i}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className={`relative flex items-center gap-6 p-6 rounded-2xl border transition-all duration-300 ${
                    phase.isBreak
                      ? "border-border bg-muted/40"
                      : "border-primary/20 bg-gradient-to-r from-primary/10 to-transparent hover:border-primary/40"
                  }`}
                >
                  <div className={`w-16 h-16 rounded-xl flex flex-col items-center justify-center shrink-0 text-center ${
                    phase.isBreak ? "bg-muted" : "bg-primary/20"
                  }`}>
                    <span className={`text-xs font-bold uppercase tracking-wider ${phase.isBreak ? "text-muted-foreground" : "text-primary"}`}>
                      {phase.phase}
                    </span>
                  </div>
                  <div>
                    <p className={`text-xl font-display font-bold ${phase.isBreak ? "text-muted-foreground" : "text-foreground"}`}>
                      {phase.duration}
                    </p>
                    <p className="text-muted-foreground text-sm mt-0.5">{phase.detail}</p>
                  </div>
                  {!phase.isBreak && (
                    <div className="ml-auto">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="mt-8 p-6 bg-primary/10 border border-primary/20 rounded-2xl text-center"
            >
              <p className="text-foreground/80 text-sm leading-relaxed">
                Total Program: <span className="text-primary font-bold">21 treatment days</span> across 3 phases, with built-in rest periods so your body can absorb and integrate each stage of healing.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─────────────────────────────────────── */}
      <section className="py-20 border-y border-border">
        <div className="container mx-auto px-4">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl font-display font-bold text-foreground mb-4">Healing Stories</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Real words from people whose lives have been transformed.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Sarah M.", text: "The healing session was transformative. I felt a weight lift off my shoulders that I didn't know I was carrying.", stars: 5 },
              { name: "Rahul K.", text: "A truly peaceful experience. The guidance I received gave me clarity on my life path.", stars: 5 },
              { name: "Emily R.", text: "Professional, kind, and deeply intuitive. I highly recommend AJ Insta Heal to anyone seeking balance.", stars: 5 },
            ].map((review, i) => (
              <motion.div
                key={i}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="bg-card p-8 rounded-2xl border border-border hover:border-primary/20 hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex gap-1 text-primary mb-4">
                  {[...Array(review.stars)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-muted-foreground italic mb-6 leading-relaxed">"{review.text}"</p>
                <p className="text-foreground font-medium">{review.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────────── */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px]" />
        <div className="container mx-auto px-4 relative text-center">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground">Ready to Begin?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Take the first step toward a more balanced, peaceful life.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/book">
                <Button variant="gold" size="lg" className="text-lg px-12 rounded-full shadow-2xl shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.03] transition-all duration-300">
                  Book Now
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline" size="lg" className="rounded-full border-border hover:bg-muted/50 px-10">
                  Contact Us <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
