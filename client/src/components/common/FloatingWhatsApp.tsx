import { MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

export function FloatingWhatsApp() {
  return (
    <motion.a
      href="https://wa.me/917025398998"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 group"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1 }}
    >
      <div className="bg-[#25D366] text-white p-4 rounded-full shadow-lg shadow-green-900/30 group-hover:scale-110 transition-transform duration-300">
        <MessageCircle className="w-6 h-6 fill-current" />
      </div>
    </motion.a>
  );
}
