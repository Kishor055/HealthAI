"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Pill, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ReminderAlarm() {
  const { toast } = useToast();
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        setHasPermission(true);
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") setHasPermission(true);
        });
      }
    }
  }, []);

  // Mock interval to check for "upcoming" reminders every 30 seconds
  useEffect(() => {
    const checkReminders = () => {
      // In a real app, this would query Firestore for the next scheduled dose
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();

      // Mock trigger for demonstration at specific minutes
      if (minutes % 10 === 0) {
        showNotification("Lisinopril 10mg", "It's time for your morning dose.");
      }
    };

    const interval = setInterval(checkReminders, 60000);
    return () => clearInterval(interval);
  }, [hasPermission]);

  const showNotification = (medicine: string, message: string) => {
    if (hasPermission) {
      new Notification(`Medication Reminder: ${medicine}`, {
        body: message,
        icon: "/bot-icon.png",
      });
    }

    toast({
      title: `Medication Reminder: ${medicine}`,
      description: message,
      action: (
        <Button variant="outline" size="sm" onClick={() => console.log("Medication logged")}>
          Logged
        </Button>
      ),
    });
  };

  return null;
}
