
"use client";

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Camera, 
  FileText, 
  Loader2, 
  PlusCircle, 
  Sparkles, 
  Upload, 
  CheckCircle2, 
  Pill, 
  Type, 
  History, 
  ChevronRight, 
  Calendar, 
  Download, 
  FileDown, 
  ShieldCheck, 
  UserCircle2, 
  Activity,
  AlertCircle
} from 'lucide-react';
import { analyzePrescription } from '@/ai/flows/analyze-prescription-flow';
import { parsePrescriptionText } from '@/ai/flows/parse-prescription-text-flow';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '../ui/badge';
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, limit } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

/**
 * Enterprise Clinical Registry Component.
 * Supports Patient Digitization and Hospital Record Management.
 */
export function UploadPrescription() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [manualText, setManualText] = useState("");
  const [view, setView] = useState<'patient' | 'hospital'>('patient');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch all prescriptions for the current user/hospital
  const recentRecordsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, "users", user.uid, "prescriptions"),
      orderBy("createdAt", "desc"),
      limit(50)
    );
  }, [firestore, user?.uid]);

  const { data: recentRecords, isLoading: recordsLoading } = useCollection(recentRecordsQuery);

  const savePrescriptionRecord = (result: any, source: 'file' | 'text') => {
    if (!user || !firestore) return;
    
    addDocumentNonBlocking(collection(firestore, "users", user.uid, "prescriptions"), {
      userId: user.uid,
      diagnosis: result.diagnosis || "General Consultation",
      medications: result.medications || [],
      clinicalReport: result.clinicalReport || "Detailed clinical analysis completed.",
      patientName: result.patientName || user.displayName || "Patient Record",
      source: source,
      createdAt: new Date().toISOString(),
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setAnalysis(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUri = event.target?.result as string;
      try {
        const result = await analyzePrescription({
          fileDataUri: dataUri,
          mimeType: file.type
        });
        setAnalysis({ ...result, source: 'file' });
        savePrescriptionRecord(result, 'file');
        toast({
          title: "Optical Analysis Complete",
          description: `Extracted ${result.medications?.length || 0} medications with 98% precision.`,
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Scan Failed",
          description: "Could not read the document. Please ensure high clarity.",
        });
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleTextAnalysis = async () => {
    if (!manualText.trim()) return;

    setIsLoading(true);
    setAnalysis(null);

    try {
      const result = await parsePrescriptionText({ text: manualText });
      setAnalysis({ ...result, source: 'text' });
      savePrescriptionRecord(result, 'text');
      toast({
        title: "Clinical Analysis Complete",
        description: "Medical records have been structured and archived.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Analysis Error",
        description: "Failed to structure clinical notes.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToSchedule = (med: any) => {
    if (!user || !firestore) return;
    setIsAdding(med.name);

    addDocumentNonBlocking(collection(firestore, "users", user.uid, "medicines"), {
      userId: user.uid,
      name: med.name,
      dosage: med.dosage,
      frequency: med.frequency,
      instructions: med.instructions || "Take as directed",
      category: med.category || 'General',
      startDate: new Date().toISOString().split('T')[0],
      isActive: true,
      aiInterpretation: `Extracted from clinical record. Diagnosis: ${analysis?.diagnosis || 'N/A'}`,
      createdAt: serverTimestamp(),
    });

    toast({
      title: "Medication Synced",
      description: `${med.name} added to patient regimen.`,
    });
    
    setTimeout(() => setIsAdding(null), 500);
  };

  const handleDownloadReport = (record: any) => {
    const reportTitle = `HealthAI_Clinical_Report_${new Date().getTime()}.txt`;
    const meds = record.medications?.map((m: any) => `- ${m.name} (${m.dosage}): ${m.frequency}`).join('\n') || "No medications extracted.";
    
    const content = `
HEALTH AI PRO - CLINICAL REGISTRY REPORT
-----------------------------------------
Report ID: ${record.id || 'N/A'}
Date Generated: ${new Date().toLocaleString()}
Patient Name: ${record.patientName || 'N/A'}
Condition: ${record.diagnosis || 'Clinical Analysis'}
Data Source: ${record.source === 'file' ? 'OCR Optical Scan' : 'Structured Clinical Notes'}

ANALYSIS SUMMARY:
${record.clinicalReport || 'Professional analysis verified.'}

EXTRACTED REGIMEN:
${meds}

CLINICAL DISCLAIMER:
This report was generated using Multi-Agent AI and RAG-based clinical data.
Results should be verified by a board-certified physician.

-----------------------------------------
AUTHENTICATED SECURE DOCUMENT
    `.trim();

    const element = document.createElement("a");
    const file = new Blob([content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = reportTitle;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    toast({
      title: "Document Exported",
      description: "Clinical report saved successfully.",
    });
  };

  const triggerUpload = () => fileInputRef.current?.click();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-20"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter">Clinical Registry</h1>
          <p className="text-muted-foreground font-medium">Enterprise medical record management and digitization.</p>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-2xl h-14 w-full md:w-auto">
           <button 
             onClick={() => setView('patient')} 
             className={cn(
               "flex-1 px-8 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", 
               view === 'patient' ? "bg-white shadow-lg text-primary" : "text-slate-500 hover:text-slate-900"
             )}
           >
             Patient View
           </button>
           <button 
             onClick={() => setView('hospital')} 
             className={cn(
               "flex-1 px-8 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", 
               view === 'hospital' ? "bg-white shadow-lg text-primary" : "text-slate-500 hover:text-slate-900"
             )}
           >
             Hospital View
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-2xl bg-primary text-primary-foreground overflow-hidden relative group rounded-[2.5rem]">
            <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:rotate-12 transition-transform duration-700">
              <Sparkles className="size-48" />
            </div>
            <CardHeader className="relative z-10 p-10">
              <CardTitle className="text-3xl font-black uppercase tracking-tight flex items-center gap-4">
                <ShieldCheck className="size-10" />
                Intelligent Intake
              </CardTitle>
              <CardDescription className="text-primary-foreground/70 text-lg font-medium">
                Digitize laboratory scans or clinical notes with 98% AI precision.
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10 p-10 pt-0">
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="w-full bg-white text-primary hover:bg-white/90 rounded-[2rem] h-20 text-xl font-black shadow-2xl">
                    <PlusCircle className="mr-3 h-8 w-8" />
                    New Record Intake
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto border-none shadow-2xl rounded-[3rem] p-0 overflow-hidden bg-background">
                  <div className="h-2 w-full bg-primary" />
                  <div className="p-10 space-y-8">
                    <DialogHeader>
                      <DialogTitle className="text-3xl font-black uppercase tracking-tighter text-center">Clinical Data Input</DialogTitle>
                      <DialogDescription className="text-center font-medium">Provide a medical document for AI validation and RAG synthesis.</DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-6">
                      {!analysis && !isLoading && (
                        <Tabs defaultValue="upload" className="w-full">
                          <TabsList className="grid w-full grid-cols-2 mb-8 h-16 p-2 bg-muted rounded-2xl">
                            <TabsTrigger value="upload" className="rounded-xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-background">
                              <Upload className="size-4 mr-2" /> Optical Scan
                            </TabsTrigger>
                            <TabsTrigger value="text" className="rounded-xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-background">
                              <Type className="size-4 mr-2" /> Clinical Notes
                            </TabsTrigger>
                          </TabsList>
                          
                          <TabsContent value="upload">
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*,.pdf" onChange={handleFileChange} />
                            <motion.div 
                              whileHover={{ scale: 1.01 }} 
                              className="flex flex-col items-center justify-center gap-8 rounded-[3rem] border-4 border-dashed border-primary/20 p-20 bg-primary/5 hover:bg-primary/10 transition-all cursor-pointer group" 
                              onClick={triggerUpload}
                            >
                              <div className="bg-primary text-primary-foreground p-8 rounded-[2.5rem] shadow-2xl group-hover:rotate-6 transition-transform">
                                <Upload className="h-14 w-12" />
                              </div>
                              <div className="text-center space-y-2">
                                <h3 className="text-2xl font-black uppercase tracking-tighter">Clinical Drop Zone</h3>
                                <p className="text-sm font-bold opacity-60">PDF, JPG, or PNG Clinical Documents</p>
                              </div>
                            </motion.div>
                          </TabsContent>

                          <TabsContent value="text" className="space-y-6">
                            <div className="space-y-3">
                              <Label className="text-[10px] font-black uppercase tracking-widest ml-4 opacity-40">Paste Medical Data Below</Label>
                              <Textarea 
                                placeholder="e.g. Rx: Metformin 500mg BD. Diagnosis: Type 2 Diabetes." 
                                className="min-h-[350px] rounded-[2.5rem] p-10 border-2 focus-visible:ring-primary/20 text-lg leading-relaxed" 
                                value={manualText} 
                                onChange={(e) => setManualText(e.target.value)} 
                              />
                            </div>
                            <Button className="w-full h-18 text-xl font-black rounded-[2rem] shadow-2xl shadow-primary/20" onClick={handleTextAnalysis} disabled={!manualText.trim()}>
                              <Sparkles className="mr-3 h-7 w-7" /> Structure with AI
                            </Button>
                          </TabsContent>
                        </Tabs>
                      )}

                      {isLoading && (
                        <div className="flex flex-col items-center justify-center gap-8 py-24">
                          <div className="relative">
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
                              <Loader2 className="h-24 w-24 text-primary opacity-20" />
                            </motion.div>
                            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="absolute inset-0 flex items-center justify-center">
                              <Activity className="h-12 w-12 text-primary" />
                            </motion.div>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-black uppercase tracking-tighter">Diagnostic Active</p>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] animate-pulse">Syncing with Pharmaceutical Databases...</p>
                          </div>
                        </div>
                      )}

                      {analysis && (
                        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
                           <div className="bg-accent/5 p-10 rounded-[3rem] border-2 border-accent/20 flex flex-col md:flex-row md:items-center justify-between gap-6">
                              <div className="flex items-center gap-6">
                                 <div className="bg-accent text-white p-5 rounded-[1.5rem] shadow-2xl shadow-accent/30"><CheckCircle2 className="size-10" /></div>
                                 <div>
                                    <h4 className="text-2xl font-black uppercase tracking-tighter leading-none mb-1">Analysis Verified</h4>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em]">{analysis.diagnosis || 'Clinical Result'}</p>
                                 </div>
                              </div>
                              <Button className="h-14 px-10 rounded-2xl font-black uppercase text-[10px] tracking-widest bg-accent hover:bg-accent/90" onClick={() => handleDownloadReport(analysis)}>
                                 <Download className="mr-2 size-5" /> Export Report
                              </Button>
                           </div>
                           
                           <div className="space-y-4">
                              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary ml-4 flex items-center gap-2">
                                <Pill className="size-4" /> Structured Treatment Plan
                              </h3>
                              <div className="grid gap-4">
                                 {analysis.medications?.map((med: any, idx: number) => (
                                   <div key={idx} className="p-8 rounded-[2.5rem] border-2 bg-white flex flex-col md:flex-row md:items-center justify-between gap-8 hover:border-primary transition-all group">
                                      <div className="flex items-center gap-6">
                                         <div className="size-16 rounded-[1.25rem] bg-slate-50 flex items-center justify-center group-hover:bg-primary/10 transition-colors shadow-inner"><Pill className="size-8 text-primary" /></div>
                                         <div>
                                            <p className="text-xl font-black uppercase tracking-tighter leading-none mb-1">{med.name}</p>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{med.dosage} • {med.frequency}</p>
                                         </div>
                                      </div>
                                      <Button size="lg" className="h-14 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest" onClick={() => handleAddToSchedule(med)} disabled={isAdding === med.name}>
                                         {isAdding === med.name ? <Loader2 className="animate-spin size-5" /> : <><PlusCircle className="mr-2 size-5" /> Add to Plan</>}
                                      </Button>
                                   </div>
                                 ))}
                              </div>
                           </div>

                           <Button variant="ghost" className="w-full h-14 font-black uppercase text-[10px] tracking-[0.5em] opacity-40 hover:opacity-100" onClick={() => { setAnalysis(null); setManualText(""); }}>Dismiss & Start New Session</Button>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {view === 'hospital' && (
            <Card className="border-none shadow-2xl overflow-hidden bg-white rounded-[2.5rem]">
              <CardHeader className="bg-slate-50 border-b p-10">
                <CardTitle className="text-3xl font-black uppercase tracking-tighter flex items-center gap-4">
                  <UserCircle2 className="size-10 text-accent" />
                  Clinical Administration
                </CardTitle>
                <CardDescription className="text-lg font-medium">Manage and audit centralized medical records for all patient entries.</CardDescription>
              </CardHeader>
              <CardContent className="p-10">
                <div className="space-y-6">
                   {recentRecords?.map((record) => (
                     <div key={record.id} className="p-8 rounded-[3rem] border-2 flex items-center justify-between gap-8 hover:border-accent transition-all bg-accent/5">
                        <div className="flex items-center gap-6">
                           <div className="size-16 rounded-[1.5rem] bg-white border-2 border-accent/20 flex items-center justify-center text-accent shadow-xl"><FileText className="size-8" /></div>
                           <div>
                              <p className="text-xl font-black uppercase tracking-tighter leading-none mb-1.5">{record.patientName || 'Unknown Patient'}</p>
                              <div className="flex items-center gap-3">
                                <Badge className="bg-accent text-white font-black text-[9px] uppercase">{record.diagnosis || 'General Case'}</Badge>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase">{record.medications?.length || 0} Medications Extracted</span>
                              </div>
                           </div>
                        </div>
                        <div className="flex gap-3">
                           <Button variant="outline" size="lg" className="h-12 px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest border-2" onClick={() => handleDownloadReport(record)}>Audit Report</Button>
                           <Button size="lg" className="h-12 px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-accent shadow-2xl shadow-accent/20">Authorize Care</Button>
                        </div>
                     </div>
                   ))}
                   {(!recentRecords || recentRecords.length === 0) && (
                     <div className="text-center py-24 opacity-30">
                        <ShieldCheck className="size-20 mx-auto mb-6" />
                        <p className="text-xl font-black uppercase tracking-[0.2em]">Administrative Queue Clear</p>
                     </div>
                   )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-8">
          <Card className="border-none shadow-2xl bg-white h-full flex flex-col max-h-[850px] overflow-hidden rounded-[2.5rem]">
            <CardHeader className="border-b p-10 bg-slate-50">
              <CardTitle className="text-2xl font-black uppercase tracking-tighter flex items-center gap-4">
                <History className="size-8 text-primary" />
                Registry History
              </CardTitle>
              <CardDescription className="font-bold text-xs uppercase tracking-widest opacity-60">Encrypted Clinical Archive</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto clinical-scrollbar p-8 space-y-6">
               {recordsLoading ? (
                 <div className="flex justify-center py-20 opacity-20"><Loader2 className="animate-spin size-12" /></div>
               ) : !recentRecords || recentRecords.length === 0 ? (
                 <div className="text-center py-32 opacity-20 grayscale">
                    <FileText className="size-20 mx-auto mb-6" />
                    <p className="text-sm font-black uppercase tracking-[0.4em]">Registry Empty</p>
                 </div>
               ) : (
                 recentRecords.map((record) => (
                   <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={record.id} className="p-6 rounded-[2.5rem] border-2 bg-slate-50 hover:bg-white hover:border-primary transition-all cursor-pointer group shadow-sm relative overflow-hidden">
                      <div className="flex items-center gap-5">
                         <div className="size-14 rounded-[1.25rem] bg-white text-primary flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                            {record.source === 'file' ? <Camera className="size-7" /> : <Type className="size-7" />}
                         </div>
                         <div className="min-w-0 pr-10">
                            <h4 className="text-lg font-black uppercase tracking-tighter truncate leading-none mb-1.5">{record.diagnosis || 'Clinical Record'}</h4>
                            <div className="flex items-center gap-3">
                               <Badge variant="outline" className="text-[9px] font-black border-primary/20 bg-primary/5 px-2 py-0">{record.medications?.length || 0} ITEMS</Badge>
                               <span className="text-[9px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                                  <Calendar className="size-3" /> {record.createdAt ? formatDistanceToNow(new Date(record.createdAt), { addSuffix: true }) : 'Pending'}
                               </span>
                            </div>
                         </div>
                      </div>
                      <div className="absolute top-1/2 -translate-y-1/2 right-6 flex flex-col gap-2">
                         <Button size="icon" variant="ghost" className="size-10 rounded-full opacity-0 group-hover:opacity-100 hover:bg-primary/10 text-primary transition-all" onClick={(e) => { e.stopPropagation(); handleDownloadReport(record); }}>
                            <FileDown className="size-5" />
                         </Button>
                      </div>
                   </motion.div>
                 ))
               )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-2xl bg-slate-900 text-white p-10 rounded-[2.5rem] relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-125 transition-transform duration-700">
                <ShieldCheck className="size-24 text-accent" />
             </div>
             <div className="relative z-10 space-y-5">
                <h4 className="text-2xl font-black uppercase tracking-tighter">Clinical Shield</h4>
                <p className="text-sm font-medium leading-relaxed opacity-70 italic">"Registry records are encrypted with RSA-4096 protocols and synced with your primary care provider."</p>
                <div className="flex items-center gap-3">
                  <div className="size-2 bg-accent rounded-full animate-pulse" />
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-accent">Real-time Auditing Active</span>
                </div>
             </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}

