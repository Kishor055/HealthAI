"use client";

import * as React from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  ClipboardType, 
  FileText, 
  Plus, 
  TrendingUp, 
  Heart, 
  Droplet, 
  Thermometer,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { query, collection, orderBy } from 'firebase/firestore';
import { AddRecordDialog } from '@/components/health-records/add-record-dialog';

export default function HealthRecordsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isAddOpen, setIsAddOpen] = React.useState(false);

  // Manual Records (Vitals, etc)
  const recordsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, "users", user.uid, "healthRecords"),
      orderBy("date", "desc")
    );
  }, [firestore, user?.uid]);

  // Clinical Records (Prescription Based)
  const prescriptionsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, "users", user.uid, "medicines"),
      orderBy("startDate", "desc")
    );
  }, [firestore, user?.uid]);

  const { data: records, isLoading: recordsLoading } = useCollection(recordsQuery);
  const { data: clinicalHistory, isLoading: clinicalLoading } = useCollection(prescriptionsQuery);

  return (
    <div className="p-4 sm:p-8 space-y-8 pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black font-headline tracking-tighter text-foreground">Health Records</h1>
          <p className="text-muted-foreground font-medium">Your unified clinical and personal health history.</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="rounded-2xl font-black h-12 px-6 shadow-lg shadow-primary/20">
          <Plus className="size-5 mr-2" /> Add Vital / Record
        </Button>
      </div>

      <Tabs defaultValue="clinical" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mb-8 h-12 p-1 bg-muted rounded-xl">
          <TabsTrigger value="clinical" className="rounded-lg font-black uppercase tracking-tighter">Clinical History</TabsTrigger>
          <TabsTrigger value="personal" className="rounded-lg font-black uppercase tracking-tighter">Personal Biometrics</TabsTrigger>
        </TabsList>

        <TabsContent value="clinical" className="space-y-6">
          <Card className="border-none shadow-xl glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="size-5 text-primary" /> Clinical Timeline
              </CardTitle>
              <CardDescription>Records extracted from your prescription history.</CardDescription>
            </CardHeader>
            <CardContent>
              {clinicalLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary/30" /></div>
              ) : !clinicalHistory || clinicalHistory.length === 0 ? (
                <div className="text-center py-12 opacity-30">No clinical data available.</div>
              ) : (
                <div className="space-y-4">
                  {clinicalHistory.map((item, idx) => (
                    <div key={item.id} className="p-5 rounded-2xl border-2 bg-card flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="size-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center font-black">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-black text-sm uppercase tracking-tighter">{item.name}</p>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold">{item.category} • Start: {item.startDate}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-black">{item.dosage}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="personal" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 space-y-6">
              <Card className="border-none shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="size-5 text-accent" /> Biometric Logs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recordsLoading ? (
                    <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary/30" /></div>
                  ) : !records || records.length === 0 ? (
                    <div className="text-center py-12 opacity-30">No biometric data recorded.</div>
                  ) : (
                    <div className="space-y-4">
                      {records.map((record) => (
                        <div key={record.id} className="p-4 rounded-2xl border-2 flex items-center justify-between group hover:border-accent/30 transition-all">
                          <div className="flex items-center gap-4">
                             <div className="size-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                                {record.type === 'Blood Pressure' ? <Activity className="size-5" /> : 
                                 record.type === 'Heart Rate' ? <Heart className="size-5" /> : 
                                 record.type === 'Blood Sugar' ? <Droplet className="size-5" /> : 
                                 <Thermometer className="size-5" />}
                             </div>
                             <div>
                                <p className="font-black text-sm uppercase">{record.type}</p>
                                <p className="text-[10px] text-muted-foreground font-bold">{record.date}</p>
                             </div>
                          </div>
                          <div className="text-right">
                             <p className="text-lg font-black tracking-tighter text-accent">{record.value} <span className="text-[10px] opacity-60 uppercase">{record.unit}</span></p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
           </div>

           <div className="space-y-6">
              <Card className="border-none bg-accent text-accent-foreground shadow-2xl overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Activity className="size-32 rotate-12" />
                </div>
                <CardHeader>
                  <CardTitle className="text-xl font-black tracking-tighter uppercase">Health Score</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 relative z-10">
                   <div className="text-4xl font-black">92/100</div>
                   <p className="text-xs font-medium leading-relaxed opacity-80">
                      "Your vitals are exceptionally stable this month. Keep up the active lifestyle."
                   </p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-xl border-destructive/20">
                <CardHeader>
                  <CardTitle className="text-sm font-black uppercase text-destructive flex items-center gap-2">
                    <AlertCircle className="size-4" /> Safety Note
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-[10px] font-medium italic opacity-60">
                    Always consult your doctor before making decisions based on self-logged data.
                  </p>
                </CardContent>
              </Card>
           </div>
        </TabsContent>
      </Tabs>

      <AddRecordDialog open={isAddOpen} onOpenChange={setIsAddOpen} />
    </div>
  );
}