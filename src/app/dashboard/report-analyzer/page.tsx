"use client";

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileSearch, 
  Upload, 
  Loader2, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  History, 
  FileText, 
  ArrowRight,
  ShieldCheck,
  Stethoscope,
  ChevronDown,
  Info,
  Calendar,
  Sparkles,
  Download,
  Dna,
  RefreshCw,
  Globe
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { query, collection, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { analyzeLabReport, AnalyzeLabReportOutput } from '@/ai/flows/analyze-lab-report';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { SoapClient } from '@/lib/soap-service';

export default function ReportAnalyzerPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [analysis, setAnalysis] = React.useState<AnalyzeLabReportOutput | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const reportsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, "users", user.uid, "labReports"),
      orderBy("createdAt", "desc"),
      limit(20)
    );
  }, [firestore, user?.uid]);

  const { data: reports, isLoading: reportsLoading } = useCollection(reportsQuery);

  const handleRegistrySync = async () => {
    if (!analysis) return;
    setIsSyncing(true);
    try {
      // ENTERPRISE SOAP SYNC
      await SoapClient.call('https://api.national-health-registry.internal/sync', {
        method: 'SyncClinicalRecord',
        namespace: 'http://nationalregistry.org/ClinicalSync',
        parameters: {
          patientId: user?.uid,
          healthScore: analysis.healthScore,
          biomarkerCount: analysis.biomarkers.length,
          diagnosis: analysis.healthStatus
        },
        security: { username: 'HEALTHAI_PRO', token: 'AUTH_001' }
      });

      toast({
        title: "National Registry Synced",
        description: "Your lab results have been verified with the Central Health Repository via Secure SOAP API.",
      });
    } catch (e) {
      toast({ variant: "destructive", title: "Sync Failed", description: "Global registry node unreachable." });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setAnalysis(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUri = event.target?.result as string;
      try {
        const result = await analyzeLabReport({
          fileDataUri: dataUri,
          mimeType: file.type
        });
        
        setAnalysis(result);
        
        if (user && firestore) {
          addDocumentNonBlocking(collection(firestore, "users", user.uid, "labReports"), {
            ...result,
            userId: user.uid,
            createdAt: new Date().toISOString(),
          });
        }

        toast({
          title: "Analysis Verified",
          description: "Medical report interpreted with clinical precision.",
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Interpretation Error",
          description: "AI failed to parse the document structure.",
        });
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Excellent': return 'text-emerald-500 bg-emerald-50';
      case 'Good': return 'text-blue-500 bg-blue-50';
      case 'Needs Attention': return 'text-orange-500 bg-orange-50';
      case 'High Risk': return 'text-red-500 bg-red-50';
      default: return 'text-slate-500 bg-slate-50';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 sm:p-10 space-y-10 pb-24 max-w-[1400px] mx-auto font-body"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
           <div className="flex items-center gap-3 mb-1">
             <div className="p-2 bg-primary/10 rounded-xl">
               <FileSearch className="size-5 text-primary" />
             </div>
             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60">Institutional Diagnostic Lab</span>
           </div>
           <h1 className="text-4xl font-black tracking-tighter text-foreground">Report Analyzer</h1>
           <p className="text-muted-foreground font-medium">SOAP-enabled clinical interpretation for verified biometric reports.</p>
        </div>
        <div className="flex gap-3">
          {analysis && (
            <Button 
              variant="outline"
              onClick={handleRegistrySync}
              disabled={isSyncing}
              className="rounded-2xl font-black h-14 px-8 border-2 border-primary/20 text-primary hover:bg-primary/5 group"
            >
              {isSyncing ? <Loader2 className="animate-spin mr-2" /> : <Globe className="size-5 mr-2 group-hover:rotate-90 transition-transform" />}
              Registry Sync
            </Button>
          )}
          <Button 
            onClick={() => fileInputRef.current?.click()} 
            disabled={isAnalyzing}
            className="rounded-2xl font-black h-14 px-8 shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform"
          >
            {isAnalyzing ? <Loader2 className="animate-spin mr-2" /> : <Upload className="size-5 mr-2" />}
            Upload Medical Report
          </Button>
        </div>
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*,.pdf" onChange={handleFileChange} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
           <AnimatePresence mode="wait">
             {isAnalyzing && (
               <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="p-20 bg-white border-2 border-dashed border-primary/20 rounded-[3rem] text-center space-y-8 shadow-2xl">
                  <div className="relative mx-auto size-32">
                     <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full opacity-20" />
                     <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="absolute inset-0 flex items-center justify-center">
                        <Dna className="size-16 text-primary" />
                     </motion.div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-3xl font-black uppercase tracking-tighter">AI Diagnostic Node Active</h3>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.3em] animate-pulse">Extracting Biomarkers & Analyzing Ranges...</p>
                  </div>
               </motion.div>
             )}

             {analysis && !isAnalyzing && (
               <motion.div key="analysis-view" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                 <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white">
                    <CardHeader className="bg-slate-900 text-white p-10 relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-10 opacity-10"><ShieldCheck className="size-48" /></div>
                       <div className="relative z-10 space-y-4">
                          <div className="flex items-center justify-between">
                             <Badge className={cn("font-black text-[10px] tracking-widest border-none px-4 py-1.5 rounded-full", getStatusColor(analysis.healthStatus))}>
                                {analysis.healthStatus.toUpperCase()}
                             </Badge>
                             <div className="text-right">
                               <p className="text-[10px] font-black uppercase opacity-60">Clinical Health Score</p>
                               <p className="text-5xl font-black text-emerald-400 tracking-tighter">{analysis.healthScore}<span className="text-lg opacity-30">/100</span></p>
                             </div>
                          </div>
                          <div className="max-w-2xl">
                             <h2 className="text-3xl font-black tracking-tighter mb-2">Automated Interpretation</h2>
                             <p className="text-lg font-medium text-white/70 leading-relaxed italic">"{analysis.reportSummary}"</p>
                          </div>
                       </div>
                    </CardHeader>
                    <CardContent className="p-10 space-y-10">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-4">
                             <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2">
                               <AlertTriangle className="size-4 text-orange-500" /> Abnormal Observations
                             </h4>
                             <div className="space-y-3">
                                {analysis.abnormalFindings.map((finding, i) => (
                                  <div key={i} className="p-4 rounded-2xl bg-orange-50 border-2 border-orange-100 flex items-start gap-3">
                                     <div className="size-2 bg-orange-500 rounded-full mt-1.5 shrink-0" />
                                     <p className="text-sm font-bold text-orange-800 leading-relaxed">{finding}</p>
                                  </div>
                                ))}
                             </div>
                          </div>
                          <div className="space-y-4">
                             <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2">
                               <CheckCircle2 className="size-4 text-emerald-500" /> Recommendations
                             </h4>
                             <div className="space-y-3">
                                {analysis.recommendations.map((rec, i) => (
                                  <div key={i} className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-100 flex items-start gap-3">
                                     <ArrowRight className="size-4 text-emerald-600 mt-0.5 shrink-0" />
                                     <p className="text-sm font-medium text-emerald-800 leading-relaxed">{rec}</p>
                                  </div>
                                ))}
                             </div>
                          </div>
                       </div>

                       <div className="space-y-6">
                          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Extracted Biomarker Matrix</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                             {analysis.biomarkers.map((bio, i) => (
                               <div key={i} className={cn(
                                 "p-6 rounded-[2rem] border-2 transition-all group",
                                 bio.isAbnormal ? "bg-red-50 border-red-100" : "bg-slate-50 border-slate-100 hover:border-primary/20"
                               )}>
                                  <div className="flex justify-between items-start mb-4">
                                     <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{bio.name}</p>
                                     {bio.isAbnormal && <AlertTriangle className="size-3 text-red-500" />}
                                  </div>
                                  <div className="flex items-baseline gap-1">
                                     <span className={cn("text-2xl font-black tracking-tighter", bio.isAbnormal ? "text-red-600" : "text-slate-900")}>{bio.value}</span>
                                     <span className="text-[10px] font-bold opacity-30 uppercase">{bio.unit}</span>
                                  </div>
                                  <p className="text-[8px] font-black uppercase tracking-widest mt-2 opacity-40">Ref: {bio.referenceRange}</p>
                               </div>
                             ))}
                          </div>
                       </div>

                       <div className="p-8 rounded-[2.5rem] bg-slate-50 border-2 border-dashed border-slate-200">
                          <div className="flex items-center gap-3 mb-4">
                             <Stethoscope className="size-6 text-primary" />
                             <h4 className="text-xl font-black uppercase tracking-tighter">Doctor Ready Summary</h4>
                          </div>
                          <p className="text-sm font-medium text-slate-600 leading-relaxed whitespace-pre-wrap">{analysis.doctorSummary}</p>
                       </div>

                       <div className="bg-destructive/5 border-2 border-destructive/10 p-6 rounded-2xl flex items-start gap-4">
                          <Info className="size-6 text-destructive shrink-0" />
                          <p className="text-xs font-medium text-destructive leading-relaxed italic">
                            Disclaimer: HealthAI is an advanced interpretation engine powered by Google Genkit and Secure SOAP institutional sync. It does not provide definitive medical diagnoses. Always consult your clinical consultant.
                          </p>
                       </div>
                    </CardContent>
                 </Card>
               </motion.div>
             )}

             {!analysis && !isAnalyzing && (
               <div className="flex flex-col items-center justify-center py-32 text-center opacity-20 grayscale cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
                  <div className="relative mb-8">
                     <FileSearch className="size-32 group-hover:scale-110 transition-transform duration-500" />
                     <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute -top-4 -right-4 size-12 bg-primary rounded-full flex items-center justify-center text-white">
                        <Plus className="size-6" />
                     </motion.div>
                  </div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter">Awaiting Clinical Data</h3>
                  <p className="text-xs font-bold uppercase tracking-[0.4em] mt-2">Upload any medical report for institutional AI analysis</p>
               </div>
             )}
           </AnimatePresence>
        </div>

        <div className="lg:col-span-4 space-y-8">
           <Card className="border-none shadow-2xl bg-white rounded-[2.5rem] overflow-hidden flex flex-col max-h-[850px]">
              <CardHeader className="p-8 border-b bg-slate-50">
                 <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-black uppercase tracking-tighter flex items-center gap-3">
                       <History className="size-6 text-primary" /> Analysis History
                    </CardTitle>
                    <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest">{reports?.length || 0} Saved</Badge>
                 </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-8 space-y-4 clinical-scrollbar">
                 {reportsLoading ? (
                   <div className="flex justify-center py-10 opacity-20"><Loader2 className="animate-spin" /></div>
                 ) : !reports || reports.length === 0 ? (
                   <div className="text-center py-20 opacity-30 italic">No historical nodes found.</div>
                 ) : (
                   reports.map((report) => (
                     <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        key={report.id} 
                        onClick={() => setAnalysis(report as any)}
                        className="p-5 rounded-[2rem] border-2 bg-slate-50 hover:bg-white hover:border-primary transition-all cursor-pointer group shadow-sm"
                     >
                        <div className="flex items-center gap-4 mb-3">
                           <div className={cn("size-10 rounded-xl flex items-center justify-center text-white shadow-lg", report.riskAssessment === 'High' ? 'bg-red-500' : 'bg-primary')}>
                              <FileText className="size-4" />
                           </div>
                           <div className="min-w-0 pr-4">
                              <h4 className="text-sm font-black uppercase tracking-tighter truncate leading-none mb-1">{report.reportSummary.substring(0, 40)}...</h4>
                              <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                                <Calendar className="size-2.5" /> {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                              </p>
                           </div>
                        </div>
                        <div className="flex items-center justify-between">
                           <div className="flex gap-2">
                              <Badge className="bg-slate-900 text-white font-black text-[7px] uppercase tracking-widest h-5">SCORE {report.healthScore}</Badge>
                              <Badge className={cn("font-black text-[7px] uppercase tracking-widest h-5", getStatusColor(report.healthStatus))}>{report.healthStatus}</Badge>
                           </div>
                           <ChevronDown className="size-3 text-slate-300 group-hover:text-primary transition-colors" />
                        </div>
                     </motion.div>
                   ))
                 )}
              </CardContent>
           </Card>

           <Card className="border-none bg-slate-900 text-white rounded-[2.5rem] p-10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-125 transition-transform duration-1000">
                 <RefreshCw className="size-32 text-primary" />
              </div>
              <div className="relative z-10 space-y-6">
                 <h4 className="text-2xl font-black uppercase tracking-tighter">Clinical Sync Active</h4>
                 <p className="text-sm font-medium text-white/70 leading-relaxed">
                    Our platform uses Secure SOAP protocols to synchronize your reports with authorized healthcare registries, ensuring a unified clinical profile.
                 </p>
                 <div className="p-5 bg-white/5 rounded-2xl border border-dashed border-white/20">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2 flex items-center gap-2">
                       <ShieldCheck className="size-3" /> RSA-Encrypted SOAP
                    </p>
                    <p className="text-[11px] leading-relaxed opacity-60">
                       All clinical data exchange is audited and secured via WS-Security standards.
                    </p>
                 </div>
              </div>
           </Card>
        </div>
      </div>
    </motion.div>
  );
}
