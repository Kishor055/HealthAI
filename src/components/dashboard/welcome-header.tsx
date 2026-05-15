
"use client";

import { useUser } from "@/firebase";

export function WelcomeHeader() {
  const { user } = useUser();
  const firstName = user?.displayName?.split(' ')[0] || "there";

  return (
    <div className="space-y-2">
      <h1 className="text-3xl font-bold tracking-tight font-headline">
        Welcome back, <span className="text-primary">{firstName}</span>!
      </h1>
      <p className="text-muted-foreground">
        Here's a look at your medication schedule and health alerts for today.
      </p>
    </div>
  );
}
