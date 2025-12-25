import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function DoctorLogin() {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/doctor/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("doctorToken", data.token);
        setLocation("/doctor-dashboard");
      } else {
        toast({
          variant: "destructive",
          title: "Incorrect Password",
          description: "Please try again.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to verify password.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pt-12 pb-24 min-h-screen bg-background flex items-center justify-center">
      <div className="w-full max-w-md px-4">
        <div className="bg-card border border-white/5 rounded-2xl p-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-primary" />
            </div>
          </div>

          <h1 className="text-3xl font-display font-bold text-center text-white mb-2">Doctor Portal</h1>
          <p className="text-center text-muted-foreground mb-8">Enter your password to access the dashboard</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="bg-background border-white/10"
              />
            </div>

            <Button
              type="submit"
              variant="gold"
              className="w-full"
              size="lg"
              disabled={isLoading || !password}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Access Dashboard"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
