import { Link } from "wouter";
import { Facebook, Instagram, MapPin, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#111] border-t border-white/5 pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="AJ Insta Heal Logo" className="h-40 object-contain" />
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Experience holistic healing and spiritual growth. We are dedicated to restoring balance to your mind, body, and soul.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-display font-bold text-lg mb-4 text-white">Quick Links</h3>
            <ul className="space-y-2">
              {[
                { label: "Home", href: "/" },
                { label: "About Us", href: "/about" },
                { label: "Our Services", href: "/services" },
                { label: "FAQ", href: "/faq" },
                { label: "Book Now", href: "/book" },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-muted-foreground hover:text-primary transition-colors text-sm">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-display font-bold text-lg mb-4 text-white">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-muted-foreground text-sm">
                <MapPin className="w-4 h-4 text-primary mt-1 shrink-0" />
                <span>Mattancherry, Ernakulam,<br />Kerala, India</span>
              </li>
              <li className="flex items-center gap-3 text-muted-foreground text-sm">
                <Phone className="w-4 h-4 text-primary shrink-0" />
                <span>+91 70253 98998</span>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="font-display font-bold text-lg mb-4 text-white">Follow Us</h3>
            <div className="flex gap-4">
              <a href="https://www.instagram.com/aj_instaheal_/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-primary hover:text-black transition-all" data-testid="link-instagram">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://www.facebook.com/jinas.nazar.9/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-primary hover:text-black transition-all" data-testid="link-facebook">
                <Facebook className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} AJ Insta Heal. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-primary">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-primary">Terms of Service</Link>
            <Link href="/disclaimer" className="hover:text-primary">Medical Disclaimer</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
