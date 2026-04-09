import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { FloatingWhatsApp } from "@/components/common/FloatingWhatsApp";
import { ScrollToTop } from "@/components/common/ScrollToTop";

import Home from "@/pages/Home";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import Book from "@/pages/Book";
import ManageBooking from "@/pages/ManageBooking";
import DoctorLogin from "@/pages/DoctorLogin";
import AdminBookings from "@/pages/AdminBookings";
import CalendarView from "@/pages/CalendarView";
import FAQ from "@/pages/FAQ";
import { Privacy, Terms, Disclaimer } from "@/pages/Legal";
import NotFound from "@/pages/not-found";
import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { ThemeProvider } from "@/hooks/use-theme";

const HIDE_CTA_PATHS = ["/book", "/manage-booking", "/doctor-login", "/doctor-dashboard", "/calendar"];

function StickyBookCTA() {
  const [pathname] = useLocation();
  if (HIDE_CTA_PATHS.some(p => pathname.startsWith(p))) return null;
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 sm:hidden bg-background/95 backdrop-blur-md border-t border-border p-3 flex gap-3">
      <Link href="/book" className="flex-1">
        <button
          className="w-full bg-primary text-black font-bold rounded-full py-3 text-sm tracking-wide hover:bg-primary/90 transition-all"
          data-testid="button-mobile-book-now"
        >
          Book a Session
        </button>
      </Link>
      <a
        href="https://wa.me/917025398998"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center w-12 h-12 bg-green-500/15 border border-green-500/30 rounded-full text-green-400 hover:bg-green-500/25 transition-all"
        data-testid="link-mobile-whatsapp"
        aria-label="WhatsApp"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
      </a>
    </div>
  );
}

// Scroll to top on route change component
function ScrollToTopWrapper() {
  const [pathname] = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function Router() {
  return (
    <div className="flex flex-col min-h-screen">
      <ScrollToTopWrapper />
      <Navbar />
      <main className="flex-grow">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/about" component={About} />
          <Route path="/faq" component={FAQ} />
          <Route path="/contact" component={Contact} />
          <Route path="/book" component={Book} />
          <Route path="/manage-booking" component={ManageBooking} />
          <Route path="/doctor-login" component={DoctorLogin} />
          <Route path="/doctor-dashboard" component={AdminBookings} />
          <Route path="/calendar" component={CalendarView} />
          <Route path="/privacy" component={Privacy} />
          <Route path="/terms" component={Terms} />
          <Route path="/disclaimer" component={Disclaimer} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
      <FloatingWhatsApp />
      <StickyBookCTA />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
