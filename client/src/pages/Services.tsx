import { useServices } from "@/hooks/use-services";
import { ServiceCard } from "@/components/common/ServiceCard";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export default function Services() {
  const { data: services, isLoading, error } = useServices();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-red-400">
        Failed to load services. Please try again later.
      </div>
    );
  }

  return (
    <div className="pt-12 pb-24">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-6"
          >
            Our Services
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-base md:text-lg lg:text-xl text-muted-foreground"
          >
            Choose from our specialized healing modalities. Each session is tailored to your unique energy and needs.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services?.map((service, idx) => (
            <ServiceCard key={service.id} service={service} index={idx} />
          ))}
        </div>
      </div>
    </div>
  );
}
