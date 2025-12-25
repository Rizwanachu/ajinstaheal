import { motion } from "framer-motion";
import { MapPin, Award, Users } from "lucide-react";

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
            <p>
              At AJ Insta Heal, we understand that true health is not merely the absence of disease, but a state of complete physical, mental, and social well-being. Our approach integrates ancient wisdom with modern understanding to treat the whole person.
            </p>
            <p>
              We believe that every individual has an innate capacity for healing. Our role is to facilitate this process, removing blockages and empowering you with the tools needed for sustainable wellness.
            </p>

            <h3 className="text-primary font-display text-2xl mt-8 mb-4">Our Location</h3>
            <p>
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
              {/* meditation room incense */}
              <img 
                src="https://images.unsplash.com/photo-1600618528240-fb9fc964b853?q=80&w=2070&auto=format&fit=crop" 
                alt="Healing Space"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-card p-6 rounded-xl border border-white/5 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                  <Award className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-white mb-2">Certified Experts</h4>
                <p className="text-sm text-muted-foreground">Professional guidance from experienced healers</p>
              </div>

              <div className="bg-card p-6 rounded-xl border border-white/5 flex flex-col items-center text-center">
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
    </div>
  );
}
