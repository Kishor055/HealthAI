"use client";

import * as React from 'react';
import { motion } from 'framer-motion';
import { 
  CalendarDays, 
  Clock, 
  User, 
  Plus, 
  MoreVertical, 
  MapPin, 
  CheckCircle2, 
  Calendar,
  Loader2,
  Stethoscope
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { query, collection, orderBy } from 'firebase/firestore';
import { BookAppointmentDialog } from '@/components/appointments/book-appointment-dialog';

export default function AppointmentsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isBookOpen, setIsBookOpen] = React.useState(false);

  const appointmentsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, "users", user.uid, "appointments"),
      orderBy("date", "asc")
    );
  }, [firestore, user?.uid]);

  const { data: appointments, isLoading } = useCollection(appointmentsQuery);

  return (
    <div className="p-4 sm:p-8 space-y-8 pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black font-headline tracking-tighter text-foreground">Appointments</h1>
          <p className="text-muted-foreground font-medium">Manage your consultations and medical visits.</p>
        </div>
        <Button onClick={() => setIsBookOpen(true)} className="rounded-2xl font-black h-12 px-6 shadow-lg shadow-primary/20">
          <Plus className="size-5 mr-2" /> Book Appointment
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-xl glass-card">
            <CardHeader className="border-b bg-card/50">
              <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
                <CalendarDays className="size-5 text-primary" /> Upcoming Visits
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="size-8 animate-spin text-primary/30" />
                </div>
              ) : !appointments || appointments.length === 0 ? (
                <div className="text-center py-20 opacity-30">
                  <Calendar className="size-16 mx-auto mb-4" />
                  <p className="text-sm font-black uppercase tracking-widest">No Appointments Scheduled</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {appointments.map((appt, idx) => (
                    <motion.div
                      key={appt.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="p-5 rounded-[2rem] border-2 bg-background hover:border-primary/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 group"
                    >
                      <div className="flex items-center gap-5">
                        <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                          <Stethoscope className="size-7" />
                        </div>
                        <div>
                          <h4 className="text-lg font-black uppercase tracking-tighter leading-none mb-1">{appt.providerName}</h4>
                          <div className="flex items-center gap-3">
                             <Badge variant="outline" className="text-[10px] font-bold py-0 border-primary/20">{appt.type}</Badge>
                             <span className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                               <Clock className="size-3" /> {appt.date} • {appt.time}
                             </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="rounded-xl font-bold h-10 px-4">Reschedule</Button>
                        <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10">
                          <MoreVertical className="size-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none bg-primary text-primary-foreground shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <CheckCircle2 className="size-32 rotate-12" />
            </div>
            <CardHeader>
              <CardTitle className="text-xl font-black tracking-tighter uppercase">Health Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
              <div className="p-4 bg-white/10 rounded-2xl border border-white/20">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Last Checkup</p>
                <p className="text-lg font-black">12 Days Ago</p>
              </div>
              <div className="p-4 bg-white/10 rounded-2xl border border-white/20">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Next Visit</p>
                <p className="text-lg font-black">{appointments?.[0]?.date || 'None Scheduled'}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl">
             <CardHeader>
               <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                 <MapPin className="size-4" /> Near Doctors
               </CardTitle>
             </CardHeader>
             <CardContent className="p-4 space-y-3">
                <p className="text-xs font-medium text-muted-foreground mb-4">You can book appointments directly with your saved preferred providers.</p>
                <Button variant="outline" className="w-full rounded-xl font-black h-12" asChild>
                  <a href="/dashboard/discover">Open Facility Map</a>
                </Button>
             </CardContent>
          </Card>
        </div>
      </div>

      <BookAppointmentDialog open={isBookOpen} onOpenChange={setIsBookOpen} />
    </div>
  );
}