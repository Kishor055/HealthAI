
"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Pill, Clock, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ReminderAlarm() {
  const { toast } = useToast();
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        setHasPermission(true);
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") setHasPermission(true);
        });
      }
    }
  }, []);

  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const minutes = now.getMinutes();

      // Trigger a simulated reminder every 5 minutes for demonstration
      if (minutes % 5 === 0 && now.getSeconds() === 0) {
        showNotification("Lisinopril 10mg", "Time for your scheduled morning dose.");
      }
    };

    const interval = setInterval(checkReminders, 1000);
    return () => clearInterval(interval);
  }, [hasPermission]);

  const showNotification = (medicine: string, message: string) => {
    if (hasPermission) {
      new Notification(`HealthAI Reminder`, {
        body: `${medicine}: ${message}`,
        icon: "/bot-icon.png",
      });
      
      // Play a soft medical chime if possible
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch(() => {/* Blocked by browser policy */});
    }

    toast({
      title: `Medication Reminder`,
      description: `${medicine} - ${message}`,
      action: (
        <Button variant="default" size="sm" className="bg-accent text-accent-foreground">
          Confirm Taken
        </Button>
      ),
    });
  };

  return null;
}
