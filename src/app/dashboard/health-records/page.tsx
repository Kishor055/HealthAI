
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
  AlertCircle,
  BarChart3,
  Stethoscope,
  Info,
  History,
  Type,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { query, collection, orderBy, limit } from 'firebase/firestore';
import { AddRecordDialog } from '@/components/health-records/add-record-dialog';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { formatDistanceToNow } from 'date-fns';

export default function HealthRecordsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isAddOpen, setIsAddOpen] = React.useState(false);

  // Manual Records (Vitals, etc)
  const recordsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, "users", user.uid, "healthRecords"),
      orderBy("date", "desc"),
      limit(20)
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

  // Digitization History
  const historyQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, "users", user.uid, "prescriptions"),
      orderBy("createdAt", "desc"),
      limit(10)
    );
  }, [firestore, user?.uid]);

  const { data: records, isLoading: recordsLoading } = useCollection(recordsQuery);
  const { data: clinicalHistory, isLoading: clinicalLoading } = useCollection(prescriptionsQuery);
  const { data: digitizationHistory, isLoading: historyLoading } = useCollection(historyQuery);

  // Prepare chart data (reversed to show chronological order)
  const chartData = React.useMemo(() => {
    if (!records) return [];
    return [...records]
      .reverse()
      .filter(r => r.type === 'Blood Pressure' || r.type === 'Blood Sugar' || r.type === 'Heart Rate')
      .map(r => ({
        date: new Date(r.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        value: parseFloat(r.value.split('/')[0]) || 0,
        type: r.type
      }));
  }, [records]);

  return (
    <div className="p-4 sm:p-8 space-y-8 pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black font-headline tracking-tighter text-foreground">Health Center</h1>
          <p className="text-muted-foreground font-medium">Advanced clinical oversight and biometric tracking.</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="rounded-2xl font-black h-12 px-6 shadow-lg shadow-primary/20">
          <Plus className="size-5 mr-2" /> Log New Vital
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Trends Visualization */}
          <Card className="border-none shadow-xl glass-card overflow-hidden">
            <CardHeader className="bg-muted/30 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-black flex items-center gap-2 tracking-tighter uppercase">
                    <TrendingUp className="size-5 text-primary" /> Vitality Trends
                  </CardTitle>
                  <CardDescription>Real-time visualization of your biometric stability.</CardDescription>
                </div>
                <Badge className="bg-primary/10 text-primary border-none">Live Analysis</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6 h-[300px]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 700 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 700 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '1rem', 
                        border: 'none', 
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                        fontSize: '12px',
                        fontWeight: 900
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorValue)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center opacity-30">
                  <BarChart3 className="size-12 mb-4" />
                  <p className="text-xs font-black uppercase tracking-widest">Insufficient data for trends</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="clinical" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8 h-12 p-1 bg-muted rounded-xl">
              <TabsTrigger value="clinical" className="rounded-lg font-black uppercase tracking-tighter">Clinical</TabsTrigger>
              <TabsTrigger value="biometric" className="rounded-lg font-black uppercase tracking-tighter">Biometric</TabsTrigger>
              <TabsTrigger value="history" className="rounded-lg font-black uppercase tracking-tighter">History</TabsTrigger>
            </TabsList>

            <TabsContent value="clinical" className="space-y-6">
              <Card className="border-none shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ClipboardType className="size-5 text-primary" /> Clinical Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {clinicalLoading ? (
                    <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary/30" /></div>
                  ) : !clinicalHistory || clinicalHistory.length === 0 ? (
                    <div className="text-center py-12 opacity-30">No clinical data available.</div>
                  ) : (
                    <div className="space-y-4">
                      {clinicalHistory.map((item, idx) => (
                        <motion.div 
                          key={item.id} 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="p-5 rounded-2xl border-2 bg-card flex items-center justify-between group hover:border-primary/30 transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <div className="size-12 rounded-xl bg-primary/5 text-primary flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                              <Stethoscope className="size-6" />
                            </div>
                            <div>
                              <p className="font-black text-sm uppercase tracking-tighter">{item.name}</p>
                              <p className="text-[10px] text-muted-foreground uppercase font-bold">{item.category} • {item.dosage}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className="text-[9px] font-black tracking-widest uppercase">Start: {item.startDate}</Badge>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="biometric" className="space-y-6">
              <div className="space-y-4">
                {recordsLoading ? (
                  <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary/30" /></div>
                ) : !records || records.length === 0 ? (
                  <div className="text-center py-12 opacity-30">No biometric data recorded.</div>
                ) : (
                  records.map((record) => (
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
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <Card className="border-none shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <History className="size-5 text-primary" /> Digitized Records
                  </CardTitle>
                  <CardDescription>Comprehensive history of AI-processed documents.</CardDescription>
                </CardHeader>
                <CardContent>
                  {historyLoading ? (
                    <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary/30" /></div>
                  ) : !digitizationHistory || digitizationHistory.length === 0 ? (
                    <div className="text-center py-12 opacity-30">No digitization history found.</div>
                  ) : (
                    <div className="space-y-4">
                      {digitizationHistory.map((record, idx) => (
                        <div key={record.id} className="p-5 rounded-2xl border-2 bg-card flex items-center justify-between group hover:border-primary/30 transition-all">
                          <div className="flex items-center gap-4">
                            <div className="size-12 rounded-xl bg-muted text-muted-foreground flex items-center justify-center">
                               {record.source === 'file' ? <FileText className="size-6" /> : <Type className="size-6" />}
                            </div>
                            <div>
                              <p className="font-black text-sm uppercase tracking-tighter">{record.diagnosis || 'Clinical Analysis'}</p>
                              <p className="text-[10px] text-muted-foreground font-bold uppercase">{record.medications?.length || 0} Medications Extracted</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-black uppercase text-muted-foreground opacity-50">
                               {record.createdAt ? formatDistanceToNow(new Date(record.createdAt), { addSuffix: true }) : 'Recently'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-8">
          <Card className="border-none bg-primary text-primary-foreground shadow-2xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-45 transition-transform duration-700">
              <Activity className="size-32" />
            </div>
            <CardHeader>
              <CardTitle className="text-xl font-black tracking-tighter uppercase">Health Score</CardTitle>
              <CardDescription className="text-primary-foreground/60">Combined clinical assessment.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
               <div className="text-5xl font-black tracking-tighter mb-4">92/100</div>
               <div className="p-4 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-sm">
                 <p className="text-[11px] font-bold leading-relaxed">
                   "Your biometric stability is in the top 5% for your age group. Continue monitoring morning BP."
                 </p>
               </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl bg-card">
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <AlertCircle className="size-4" /> Clinical Shield
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="p-4 rounded-2xl bg-destructive/5 border-2 border-destructive/10">
                 <h5 className="text-[10px] font-black text-destructive uppercase tracking-widest mb-1">Observation Required</h5>
                 <p className="text-xs font-medium">Your heart rate showed a slight spike last Tuesday after dosage.</p>
               </div>
               <div className="flex items-start gap-3 p-3 bg-blue-500/5 rounded-xl border border-blue-500/10">
                 <Info className="size-4 text-blue-500 shrink-0 mt-0.5" />
                 <p className="text-[10px] font-medium leading-relaxed opacity-70">
                   Automated reports are sent to your primary doctor every 30 days.
                 </p>
               </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AddRecordDialog open={isAddOpen} onOpenChange={setIsAddOpen} />
    </div>
  );
}
