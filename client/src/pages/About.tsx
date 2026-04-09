import { motion } from "framer-motion";
import { Award, Users } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.12, duration: 0.7, ease: "easeOut" } }),
};

const healers = [
  { name: "HR Jinas T N", title: "Certified Acupuncture Healer", initials: "JN" },
  { name: "HR Aasiya Mansoor", title: "Certified Acupuncture Healer", initials: "AM" },
];

export default function About() {
  return (
    <div className="pt-12 pb-24">
      {/* Hero */}
      <div className="container mx-auto px-4 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-3xl mx-auto"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold mb-6 text-white">About AJ Insta Heal</h1>
          <p className="text-base md:text-lg lg:text-xl text-muted-foreground leading-relaxed">
            A sanctuary for healing in the heart of Mattancherry, dedicated to guiding individuals towards spiritual wellness and inner harmony.
          </p>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-16 items-start">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="prose prose-invert prose-lg max-w-none"
          >
            <h3 className="text-primary font-display text-2xl mb-4">Our Philosophy</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              The best treatment addresses the root cause of a disease. Treating symptoms may offer temporary relief, but focusing on the underlying reason leads to a more complete cure.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Acupuncture is a powerful approach that targets the source, restoring balance to mind, body, and spirit. We believe that every individual has an innate capacity for healing — our role is to facilitate that process.
            </p>

            <h3 className="text-primary font-display text-2xl mt-8 mb-4">Our Location</h3>
            <p className="text-muted-foreground leading-relaxed">
              Nestled in the culturally rich town of Mattancherry, our center draws upon the spiritual heritage of the land. The peaceful atmosphere of our space provides the perfect backdrop for introspection and healing.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-8"
          >
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-card border border-white/5">
              <img
                src="https://images.unsplash.com/photo-1600618528240-fb9fc964b853?q=80&w=2070&auto=format&fit=crop"
                alt="Healing Space"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-card/60 backdrop-blur-sm p-6 rounded-xl border border-white/5 hover:border-primary/30 transition-all flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                  <Award className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-white mb-2">Certified Experts</h4>
                <p className="text-sm text-muted-foreground">Professional guidance from experienced healers</p>
              </div>

              <div className="bg-card/60 backdrop-blur-sm p-6 rounded-xl border border-white/5 hover:border-primary/30 transition-all flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                  <Users className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-white mb-2">Personal Care</h4>
                <p className="text-sm text-muted-foreground">Tailored sessions focused entirely on you</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Our Healers */}
      <div className="container mx-auto px-4 mt-24">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">Our Healers</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Guided by dedicated practitioners who bring skill, compassion, and deep commitment to your healing journey.
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
              className="flex-1 bg-card/60 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-300 group"
            >
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/30 to-primary/5 border border-primary/20 flex items-center justify-center mx-auto mb-5 text-2xl font-display font-bold text-primary group-hover:from-primary/40 transition-all">
                {healer.initials}
              </div>
              <h3 className="text-xl font-display font-bold text-white mb-1">{healer.name}</h3>
              <p className="text-primary text-sm font-medium">{healer.title}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
