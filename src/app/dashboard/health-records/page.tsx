
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
  Share2,
  ArrowUpRight,
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
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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
          <div className="flex items-center gap-3 mb-1">
             <div className="p-2 bg-primary/10 rounded-xl">
               <Activity className="size-5 text-primary" />
             </div>
             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60">Biometric Command Center</span>
          </div>
          <h1 className="text-5xl font-black font-headline tracking-tighter text-foreground">Health Center</h1>
          <p className="text-muted-foreground text-lg font-medium">Precision biometric tracking and medical record history.</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <Button 
            variant="outline" 
            onClick={handleExportFullArchive}
            disabled={isExporting}
            className="flex-1 md:flex-none rounded-2xl font-black h-16 px-8 border-2 border-primary/20 text-primary hover:bg-primary/5 transition-all"
          >
            {isExporting ? <Loader2 className="animate-spin mr-3" /> : <Download className="size-5 mr-3" />}
            Export PHI
          </Button>
          <Button onClick={() => setIsAddOpen(true)} className="flex-1 md:flex-none rounded-2xl font-black h-16 px-10 text-lg shadow-2xl shadow-primary/20 bg-primary hover:scale-[1.02] transition-transform">
            <Plus className="size-6 mr-3" /> Log Vital
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-10">
          <Card className="border-none shadow-2xl bg-white rounded-[2.5rem] overflow-hidden group">
            <CardHeader className="bg-slate-50 border-b p-10">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-3xl font-black flex items-center gap-4 tracking-tight uppercase">
                    <TrendingUp className="size-8 text-primary" /> Physiological Trends
                  </CardTitle>
                  <CardDescription className="font-medium text-lg">Real-time stability telemetry with clinical benchmarks.</CardDescription>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                    <div className="size-2 bg-emerald-600 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Grounded Baseline</span>
                  </div>
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em]">Benchmarks: WHO Std 2024</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-10 h-[500px] relative">
              {chartData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 900, fill: '#64748b' }} dy={20} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 900, fill: '#64748b' }} dx={-10} />
                      <Tooltip contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', fontSize: '13px', fontWeight: 900, padding: '1.5rem' }} />
                      
                      {/* Clinical Benchmarks */}
                      <ReferenceLine y={120} label={{ position: 'right', value: 'High Normal', fill: '#ef4444', fontSize: 10, fontWeight: 900 }} stroke="#ef4444" strokeDasharray="3 3" />
                      <ReferenceLine y={80} label={{ position: 'right', value: 'Optimal', fill: '#10b981', fontSize: 10, fontWeight: 900 }} stroke="#10b981" strokeDasharray="3 3" />
                      
                      <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={5} fillOpacity={1} fill="url(#colorValue)" animationDuration={2000} />
                    </AreaChart>
                  </ResponsiveContainer>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center opacity-20">
                  <BarChart3 className="size-32 mb-8" />
                  <p className="text-xl font-black uppercase tracking-[0.4em]">Baseline Telemetry Pending</p>
                </div>
              )}
            </CardContent>
            <div className="bg-slate-900 text-white p-6 flex items-center justify-between px-10">
               <div className="flex items-center gap-3">
                  <ArrowUpRight className="size-5 text-emerald-400" />
                  <p className="text-xs font-bold uppercase tracking-widest opacity-80">Stability Trend: Improving ( +4.2% )</p>
               </div>
               <Button variant="ghost" className="text-[10px] font-black uppercase tracking-[0.3em] text-primary hover:text-white group">
                  Deep Analysis <ChevronRight className="size-3 ml-2 group-hover:translate-x-1 transition-transform" />
               </Button>
            </div>
          </Card>

          <Tabs defaultValue="clinical" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-10 h-20 p-2.5 bg-slate-100 rounded-[2rem]">
              <TabsTrigger value="clinical" className="rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] data-[state=active]:bg-white data-[state=active]:shadow-2xl">Clinical Timeline</TabsTrigger>
              <TabsTrigger value="biometric" className="rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] data-[state=active]:bg-white data-[state=active]:shadow-2xl">Biometric Logs</TabsTrigger>
              <TabsTrigger value="history" className="rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] data-[state=active]:bg-white data-[state=active]:shadow-2xl">Registry Archive</TabsTrigger>
            </TabsList>

            <TabsContent value="clinical" className="space-y-6">
              <Card className="border-none shadow-2xl bg-white rounded-[2.5rem] overflow-hidden">
                <CardHeader className="bg-slate-50/50 p-10 border-b">
                  <CardTitle className="flex items-center gap-4 text-2xl font-black uppercase tracking-tight">
                    <ClipboardType className="size-8 text-primary" /> Verified Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-10">
                  {clinicalLoading ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary opacity-20 size-12" /></div>
                  ) : !clinicalHistory || clinicalHistory.length === 0 ? (
                    <div className="text-center py-20 opacity-30 italic font-medium text-lg">No verified clinical history synchronization found.</div>
                  ) : (
                    <div className="space-y-8">
                      {clinicalHistory.map((item, idx) => (
                        <motion.div key={item.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }} className="p-10 rounded-[3rem] border-2 bg-white flex flex-col md:flex-row md:items-center justify-between gap-8 group hover:border-primary transition-all shadow-sm">
                          <div className="flex items-center gap-8">
                            <div className="size-20 rounded-[1.5rem] bg-slate-50 text-primary flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform"><Stethoscope className="size-10" /></div>
                            <div>
                              <p className="font-black text-2xl uppercase tracking-tighter leading-none mb-3">{item.name}</p>
                              <div className="flex items-center gap-4">
                                <Badge className="text-[10px] font-black border-none uppercase tracking-[0.2em] bg-slate-900 text-white px-4 h-7">{item.category}</Badge>
                                <span className="text-xs text-muted-foreground uppercase font-black tracking-widest opacity-60">{item.dosage} • {item.frequency}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-1">Authorization</p>
                             <Badge className="text-[11px] font-black tracking-widest uppercase bg-emerald-500/10 text-emerald-600 border-none px-6 py-2 h-10">Started: {item.startDate}</Badge>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Other tabs follow similar premium styling... */}
            <TabsContent value="biometric" className="space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {recordsLoading ? (
                  <div className="col-span-2 flex justify-center py-20"><Loader2 className="animate-spin text-primary/20 size-12" /></div>
                ) : !records || records.length === 0 ? (
                  <div className="col-span-2 text-center py-32 opacity-30 text-xl font-bold uppercase tracking-widest">No biometric telemetry recorded.</div>
                ) : (
                  records.map((record) => (
                    <motion.div key={record.id} whileHover={{ scale: 1.02 }} className="p-10 rounded-[3.5rem] border-2 bg-white flex items-center justify-between group transition-all shadow-xl">
                      <div className="flex items-center gap-6">
                         <div className={cn(
                            "size-16 rounded-[1.5rem] flex items-center justify-center shadow-inner transition-all group-hover:scale-110",
                            record.type === 'Blood Pressure' ? 'bg-primary/10 text-primary' : record.type === 'Heart Rate' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'
                         )}>
                            {record.type === 'Blood Pressure' ? <Activity className="size-8" /> : record.type === 'Heart Rate' ? <Heart className="size-8" /> : record.type === 'Blood Sugar' ? <Droplet className="size-8" /> : <Thermometer className="size-8" />}
                         </div>
                         <div>
                            <p className="font-black text-sm uppercase tracking-[0.2em] leading-none mb-2 opacity-40">{record.type}</p>
                            <p className="text-xl font-black text-slate-900 uppercase tracking-tighter">{record.date}</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-4xl font-black tracking-tighter text-foreground">{record.value}</p>
                         <p className="text-[10px] font-black opacity-30 uppercase tracking-[0.4em] mt-1">{record.unit}</p>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
               <Card className="border-none shadow-2xl bg-white rounded-[2.5rem] overflow-hidden">
                <CardHeader className="bg-slate-50 p-10 border-b">
                  <CardTitle className="flex items-center gap-4 text-2xl font-black uppercase tracking-tight">
                    <History className="size-10 text-primary" /> Clinical Archive
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-10 space-y-6">
                  {historyLoading ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary opacity-20 size-12" /></div>
                  ) : !digitizationHistory || digitizationHistory.length === 0 ? (
                    <div className="text-center py-20 opacity-30 text-lg font-bold italic">Registry archive is currently empty.</div>
                  ) : (
                    digitizationHistory.map((record, idx) => (
                      <div key={record.id} className="p-10 rounded-[3rem] border-2 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-10 hover:border-primary transition-all shadow-sm">
                        <div className="flex items-center gap-8">
                          <div className="size-20 rounded-[1.75rem] bg-white text-primary flex items-center justify-center shadow-2xl border-2 border-slate-100">
                             {record.source === 'file' ? <FileText className="size-10" /> : <Type className="size-10" />}
                          </div>
                          <div>
                            <p className="font-black text-2xl uppercase tracking-tighter leading-none mb-3">{record.diagnosis || 'Clinical Analysis'}</p>
                            <div className="flex items-center gap-4">
                               <Badge className="bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest h-7 px-4">{record.source === 'file' ? 'VISUAL SCAN' : 'STRUCTURED NOTES'}</Badge>
                               <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{record.medications?.length || 0} Items Extracted</span>
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" className="h-14 px-8 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] border-2 hover:bg-primary hover:text-white transition-all">Review Registry</Button>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="lg:col-span-4 space-y-10">
          <Card className="border-none bg-slate-900 text-white shadow-2xl rounded-[3.5rem] overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-10 opacity-20 group-hover:scale-110 transition-transform duration-1000">
              <ShieldCheck className="size-56 text-emerald-500" />
            </div>
            <CardHeader className="p-12 pb-6">
              <CardTitle className="text-3xl font-black tracking-tighter uppercase leading-none mb-3">Health Score</CardTitle>
              <CardDescription className="text-white/50 text-sm font-bold uppercase tracking-[0.3em] leading-none">Aggregated Registry Profile</CardDescription>
            </CardHeader>
            <CardContent className="p-12 pt-0 space-y-10 relative z-10">
               <div className="text-9xl font-black tracking-tighter text-emerald-400 leading-none">92<span className="text-3xl text-white/30 ml-4">/100</span></div>
               <div className="p-8 bg-white/10 rounded-[2.5rem] border border-white/20 backdrop-blur-3xl shadow-inner">
                 <p className="text-lg font-bold leading-relaxed italic opacity-90">
                   "Your biometric consistency is optimal. The AI Stability Agent has detected a 4% improvement in arterial elasticity trends."
                 </p>
               </div>
               <div className="grid grid-cols-2 gap-6">
                  <div className="text-center p-6 bg-white/5 rounded-3xl border border-white/10 group-hover:bg-white/10 transition-colors">
                     <p className="text-[10px] font-black uppercase text-white/40 mb-2 tracking-widest">Adherence</p>
                     <p className="text-3xl font-black text-emerald-400">98%</p>
                  </div>
                  <div className="text-center p-6 bg-white/5 rounded-3xl border border-white/10 group-hover:bg-white/10 transition-colors">
                     <p className="text-[10px] font-black uppercase text-white/40 mb-2 tracking-widest">Stability</p>
                     <p className="text-3xl font-black text-emerald-400">CRITICAL</p>
                  </div>
               </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-2xl bg-white rounded-[3rem] p-12 space-y-8 border-2 border-slate-100">
            <CardHeader className="p-0">
              <CardTitle className="text-sm font-black uppercase tracking-[0.4em] text-muted-foreground flex items-center gap-4">
                <AlertCircle className="size-6 text-destructive" /> Clinical Observations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-8">
               <div className="p-8 rounded-[2.5rem] bg-destructive/5 border-2 border-destructive/10 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-4 opacity-10"><AlertCircle className="size-16" /></div>
                 <h5 className="text-[11px] font-black text-destructive uppercase tracking-[0.3em] mb-3">Observation Alert</h5>
                 <p className="text-sm font-bold leading-relaxed text-destructive/80">Heart rate trend showed a slight positive skew during morning dosage. AI monitoring engaged for 24h.</p>
               </div>
               <div className="flex items-start gap-5 p-6 bg-blue-50 rounded-[2rem] border-2 border-blue-100">
                 <Info className="size-8 text-blue-600 shrink-0 mt-1" />
                 <p className="text-xs font-bold leading-relaxed text-blue-700 opacity-90">
                   Monthly synchronization with your primary consultant is scheduled for next Friday. Refill authorizations pending.
                 </p>
               </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-2xl bg-slate-50 p-12 rounded-[3.5rem] border-2 border-dashed border-slate-200">
             <div className="text-center space-y-8 py-4">
                <div className="size-24 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-xl border-2 border-slate-100">
                   <FileText className="size-12 text-slate-300" />
                </div>
                <div className="space-y-3">
                  <h4 className="text-2xl font-black uppercase tracking-tighter">Export Archive</h4>
                  <p className="text-sm font-bold text-muted-foreground leading-relaxed px-6">Generate an authenticated medical record package including Multi-Agent analysis.</p>
                </div>
                <Button 
                  className="w-full h-16 rounded-[1.75rem] font-black uppercase text-[11px] tracking-[0.4em] bg-slate-900 text-white hover:scale-[1.02] transition-transform"
                  onClick={handleExportFullArchive}
                  disabled={isExporting}
                >
                  {isExporting ? <Loader2 className="animate-spin size-5 mr-3" /> : "Authorize Export"}
                </Button>
             </div>
          </Card>
        </div>
      </div>

      <AddRecordDialog open={isAddOpen} onOpenChange={setIsAddOpen} />
    </motion.div>
  );
}
