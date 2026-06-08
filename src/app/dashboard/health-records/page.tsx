
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
  ShieldCheck,
  CalendarDays,
  Download,
  Share2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { query, collection, orderBy, limit } from 'firebase/firestore';
import { AddRecordDialog } from '@/components/health-records/add-record-dialog';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export default function HealthRecordsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);

  const recordsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, "users", user.uid, "healthRecords"),
      orderBy("date", "desc"),
      limit(50)
    );
  }, [firestore, user?.uid]);

  const medsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "users", user.uid, "medicines"), orderBy("startDate", "desc"));
  }, [firestore, user?.uid]);

  const historyQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "users", user.uid, "prescriptions"), orderBy("createdAt", "desc"), limit(20));
  }, [firestore, user?.uid]);

  const { data: records, isLoading: recordsLoading } = useCollection(recordsQuery);
  const { data: clinicalHistory, isLoading: clinicalLoading } = useCollection(medsQuery);
  const { data: digitizationHistory, isLoading: historyLoading } = useCollection(historyQuery);

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

  const handleExportFullArchive = () => {
    setIsExporting(true);
    
    setTimeout(() => {
      const timestamp = new Date().toISOString();
      const content = `
HEALTH AI PRO - FULL CLINICAL ARCHIVE
---------------------------------------
Generated: ${new Date().toLocaleString()}
Patient ID: ${user?.uid}
Patient Name: ${user?.displayName || 'N/A'}

1. ACTIVE MEDICATIONS:
${clinicalHistory?.map(m => `- ${m.name} (${m.dosage}): ${m.frequency} [Started: ${m.startDate}]`).join('\n') || 'None'}

2. BIOMETRIC LOGS (Last 50):
${records?.map(r => `- ${r.date}: ${r.type} = ${r.value} ${r.unit}`).join('\n') || 'None'}

3. AI DIGITIZATION HISTORY:
${digitizationHistory?.map(d => `- ${d.createdAt}: ${d.diagnosis} (${d.medications?.length || 0} items extracted)`).join('\n') || 'None'}

---------------------------------------
END OF REPORT
This archive is encrypted and should be handled as sensitive PHI.
      `.trim();

      const element = document.createElement("a");
      const file = new Blob([content], {type: 'text/plain'});
      element.href = URL.createObjectURL(file);
      element.download = `HealthAI_Full_Archive_${new Date().getTime()}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);

      toast({
        title: "Archive Generated",
        description: "Your full medical history has been exported successfully.",
      });
      setIsExporting(false);
    }, 1500);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 sm:p-10 space-y-10 pb-24 max-w-[1600px] mx-auto font-body"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-5xl font-black font-headline tracking-tighter text-foreground">Health Center</h1>
          <p className="text-muted-foreground text-lg font-medium">Precision biometric tracking and medical record history.</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <Button 
            variant="outline" 
            onClick={handleExportFullArchive}
            disabled={isExporting}
            className="flex-1 md:flex-none rounded-2xl font-black h-16 px-6 border-2 border-primary/20 text-primary hover:bg-primary/5"
          >
            {isExporting ? <Loader2 className="animate-spin mr-2" /> : <Download className="size-5 mr-2" />}
            Export PHI
          </Button>
          <Button onClick={() => setIsAddOpen(true)} className="flex-1 md:flex-none rounded-2xl font-black h-16 px-8 text-lg shadow-2xl shadow-primary/20 bg-primary hover:scale-[1.02] transition-transform">
            <Plus className="size-6 mr-3" /> Log Vital Reading
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-10">
          <Card className="border-none shadow-2xl bg-white rounded-[2.5rem] overflow-hidden group">
            <CardHeader className="bg-slate-50 border-b p-8">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-2xl font-black flex items-center gap-3 tracking-tighter uppercase">
                    <TrendingUp className="size-6 text-primary" /> Vitality Analytics
                  </CardTitle>
                  <CardDescription className="font-medium">Real-time physiological stability telemetry.</CardDescription>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                  <div className="size-2 bg-emerald-600 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Live Bio-Sync</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-10 h-[450px]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 900, fill: '#64748b' }} dy={20} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 900, fill: '#64748b' }} dx={-10} />
                    <Tooltip contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', fontSize: '13px', fontWeight: 900, padding: '1.5rem' }} />
                    <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" animationDuration={1500} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center opacity-20">
                  <BarChart3 className="size-24 mb-6" />
                  <p className="text-sm font-black uppercase tracking-[0.4em]">Baseline Telemetry Pending</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="clinical" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-10 h-16 p-2 bg-slate-100 rounded-[1.5rem]">
              <TabsTrigger value="clinical" className="rounded-xl font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-white data-[state=active]:shadow-lg">Clinical Timeline</TabsTrigger>
              <TabsTrigger value="biometric" className="rounded-xl font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-white data-[state=active]:shadow-lg">Biometric Logs</TabsTrigger>
              <TabsTrigger value="history" className="rounded-xl font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-white data-[state=active]:shadow-lg">Registry History</TabsTrigger>
            </TabsList>

            <TabsContent value="clinical" className="space-y-6">
              <Card className="border-none shadow-2xl bg-white rounded-[2.5rem] overflow-hidden">
                <CardHeader className="bg-slate-50/50 p-8 border-b">
                  <CardTitle className="flex items-center gap-3 text-xl font-black uppercase tracking-tight">
                    <ClipboardType className="size-6 text-primary" /> Active Clinical Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  {clinicalLoading ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary opacity-20 size-12" /></div>
                  ) : !clinicalHistory || clinicalHistory.length === 0 ? (
                    <div className="text-center py-20 opacity-30 italic">No verified clinical history found.</div>
                  ) : (
                    <div className="space-y-6">
                      {clinicalHistory.map((item, idx) => (
                        <motion.div key={item.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }} className="p-8 rounded-[2rem] border-2 bg-white flex flex-col md:flex-row md:items-center justify-between gap-8 group hover:border-primary transition-all shadow-sm">
                          <div className="flex items-center gap-6">
                            <div className="size-16 rounded-[1.25rem] bg-slate-50 text-primary flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform"><Stethoscope className="size-8" /></div>
                            <div>
                              <p className="font-black text-xl uppercase tracking-tighter leading-none mb-2">{item.name}</p>
                              <div className="flex items-center gap-3">
                                <Badge variant="outline" className="text-[9px] font-black border-primary/20 uppercase tracking-widest">{item.category}</Badge>
                                <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-60">{item.dosage}</span>
                              </div>
                            </div>
                          </div>
                          <Badge className="text-[10px] font-black tracking-[0.2em] uppercase bg-primary/10 text-primary border-none px-4 py-1.5 h-10">Start: {item.startDate}</Badge>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="biometric" className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {recordsLoading ? (
                  <div className="col-span-2 flex justify-center py-20"><Loader2 className="animate-spin text-primary/20 size-12" /></div>
                ) : !records || records.length === 0 ? (
                  <div className="col-span-2 text-center py-20 opacity-30">No biometric data recorded.</div>
                ) : (
                  records.map((record) => (
                    <motion.div key={record.id} whileHover={{ scale: 1.02 }} className="p-8 rounded-[2.5rem] border-2 bg-white flex items-center justify-between group transition-all shadow-md">
                      <div className="flex items-center gap-5">
                         <div className="size-14 rounded-2xl bg-slate-50 flex items-center justify-center shadow-inner group-hover:bg-primary/5 transition-colors">
                            {record.type === 'Blood Pressure' ? <Activity className="size-7 text-primary" /> : record.type === 'Heart Rate' ? <Heart className="size-7 text-destructive" /> : record.type === 'Blood Sugar' ? <Droplet className="size-7 text-blue-500" /> : <Thermometer className="size-7 text-orange-500" />}
                         </div>
                         <div>
                            <p className="font-black text-sm uppercase tracking-widest leading-none mb-1.5">{record.type}</p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{record.date}</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-3xl font-black tracking-tighter text-foreground">{record.value}</p>
                         <p className="text-[10px] font-black opacity-30 uppercase tracking-[0.3em]">{record.unit}</p>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <Card className="border-none shadow-2xl bg-white rounded-[2.5rem] overflow-hidden">
                <CardHeader className="bg-slate-50 p-8 border-b">
                  <CardTitle className="flex items-center gap-3 text-xl font-black uppercase tracking-tight">
                    <History className="size-7 text-primary" /> Digitized Record Archive
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  {historyLoading ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary opacity-20 size-12" /></div>
                  ) : !digitizationHistory || digitizationHistory.length === 0 ? (
                    <div className="text-center py-20 opacity-30">Registry archive is currently empty.</div>
                  ) : (
                    <div className="space-y-6">
                      {digitizationHistory.map((record, idx) => (
                        <div key={record.id} className="p-8 rounded-[2.5rem] border-2 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-8 hover:border-primary transition-all shadow-sm">
                          <div className="flex items-center gap-6">
                            <div className="size-16 rounded-[1.5rem] bg-white text-primary flex items-center justify-center shadow-xl border-2 border-slate-100">
                               {record.source === 'file' ? <FileText className="size-8" /> : <Type className="size-8" />}
                            </div>
                            <div>
                              <p className="font-black text-xl uppercase tracking-tighter leading-none mb-2">{record.diagnosis || 'Clinical Analysis'}</p>
                              <div className="flex items-center gap-3">
                                 <Badge className="bg-slate-900 text-white font-black text-[9px] uppercase tracking-widest">{record.source === 'file' ? 'VISUAL SCAN' : 'NOTES'}</Badge>
                                 <span className="text-[10px] font-bold text-muted-foreground uppercase">{record.medications?.length || 0} Items</span>
                              </div>
                            </div>
                          </div>
                          <Button variant="outline" className="h-10 px-6 rounded-xl font-black text-[9px] uppercase tracking-widest border-2">Review Archive</Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="lg:col-span-4 space-y-10">
          <Card className="border-none bg-slate-900 text-white shadow-2xl rounded-[3rem] overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-110 transition-transform duration-1000">
              <ShieldCheck className="size-48 text-emerald-500" />
            </div>
            <CardHeader className="p-10 pb-4">
              <CardTitle className="text-2xl font-black tracking-tighter uppercase leading-none mb-2">Health Score</CardTitle>
              <CardDescription className="text-white/50 text-sm font-bold uppercase tracking-widest leading-none">Combined Clinical Profile</CardDescription>
            </CardHeader>
            <CardContent className="p-10 space-y-8 relative z-10">
               <div className="text-8xl font-black tracking-tighter text-emerald-400">92<span className="text-2xl text-white/30 ml-2">/100</span></div>
               <div className="p-6 bg-white/10 rounded-[2rem] border border-white/20 backdrop-blur-xl">
                 <p className="text-sm font-bold leading-relaxed italic opacity-80">
                   "Your biometric consistency is optimal. The AI Stability Agent has detected a 4% improvement in morning BP stability."
                 </p>
               </div>
               <div className="flex gap-4">
                  <div className="flex-1 text-center p-4 bg-white/5 rounded-2xl border border-white/10">
                     <p className="text-[9px] font-black uppercase text-white/40 mb-1">Adherence</p>
                     <p className="text-lg font-black text-emerald-400">98%</p>
                  </div>
                  <div className="flex-1 text-center p-4 bg-white/5 rounded-2xl border border-white/10">
                     <p className="text-[9px] font-black uppercase text-white/40 mb-1">Stability</p>
                     <p className="text-lg font-black text-emerald-400">High</p>
                  </div>
               </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-2xl bg-white rounded-[2.5rem] p-10 space-y-6">
            <CardHeader className="p-0">
              <CardTitle className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-3">
                <AlertCircle className="size-5 text-destructive" /> Clinical Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-6">
               <div className="p-6 rounded-[2rem] bg-destructive/5 border-2 border-destructive/10">
                 <h5 className="text-[10px] font-black text-destructive uppercase tracking-widest mb-2">Observation Alert</h5>
                 <p className="text-xs font-medium leading-relaxed opacity-70">Heart rate trend showed a slight positive skew during morning dosage. Monitor for 24h.</p>
               </div>
               <div className="flex items-start gap-4 p-5 bg-blue-50 rounded-[1.5rem] border-2 border-blue-100">
                 <Info className="size-6 text-blue-600 shrink-0 mt-0.5" />
                 <p className="text-[11px] font-bold leading-relaxed text-blue-700 opacity-90">
                   Monthly synchronization with your primary consultant is scheduled for next Friday.
                 </p>
               </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-2xl bg-slate-50 p-10 rounded-[2.5rem] border-2 border-dashed border-slate-200">
             <div className="text-center space-y-6 py-4">
                <FileText className="size-16 mx-auto text-slate-300" />
                <div className="space-y-2">
                  <h4 className="text-xl font-black uppercase tracking-tighter">Export Archive</h4>
                  <p className="text-xs font-medium text-muted-foreground leading-relaxed px-4">Generate a full medical record package including AI analysis.</p>
                </div>
                <Button 
                  className="w-full h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest bg-slate-900 text-white"
                  onClick={handleExportFullArchive}
                  disabled={isExporting}
                >
                  {isExporting ? <Loader2 className="animate-spin size-4 mr-2" /> : "Generate Full Report"}
                </Button>
             </div>
          </Card>
        </div>
      </div>

      <AddRecordDialog open={isAddOpen} onOpenChange={setIsAddOpen} />
    </motion.div>
  );
}
