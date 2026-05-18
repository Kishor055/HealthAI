
"use client";

import { useUser } from "@/firebase";
import { useLanguage } from "@/context/language-context";

export function WelcomeHeader() {
  const { user } = useUser();
  const { t } = useLanguage();
  const firstName = user?.displayName?.split(' ')[0] || "there";

  return (
    <div className="space-y-2">
      <h1 className="text-3xl font-bold tracking-tight font-headline">
        {t.welcomeBack}, <span className="text-primary">{firstName}</span>!
      </h1>
      <p className="text-muted-foreground italic">
        {t.healthCheckIn} - Intelligence in your care.
      </p>
    </div>
  );
}
