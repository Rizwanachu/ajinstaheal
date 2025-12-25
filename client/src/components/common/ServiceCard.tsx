import { motion } from "framer-motion";
import { Clock, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import type { Service } from "@shared/schema";

interface ServiceCardProps {
  service: Service;
  index: number;
}

export function ServiceCard({ service, index }: ServiceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      viewport={{ once: true }}
      className="group relative bg-card hover:bg-card/80 border border-white/5 hover:border-primary/30 rounded-2xl p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 flex flex-col h-full"
    >
      <div className="mb-4">
        <h3 className="text-xl font-display font-bold text-white mb-2 group-hover:text-primary transition-colors">
          {service.name}
        </h3>
        <div className="flex items-center gap-2 text-primary/80 text-sm font-medium">
          <Clock className="w-4 h-4" />
          <span>{service.duration} mins</span>
        </div>
      </div>
      
      <p className="text-muted-foreground text-sm leading-relaxed mb-6 flex-grow">
        {service.description}
      </p>

      <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
        <span className="font-semibold text-white">{service.price}</span>
        <Link href={`/book?service=${service.id}`}>
          <Button variant="default" size="sm" className="group-hover:bg-primary group-hover:text-black transition-all p-1 px-3 text-sm font-medium gap-1" data-testid={`button-book-${service.id}`}>
            Book <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}
