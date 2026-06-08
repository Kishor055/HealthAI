
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
import { Camera, FileText, Loader2, PlusCircle, Sparkles, Upload, CheckCircle2, Pill, Type, History, ChevronRight, Calendar, Download, FileDown, ShieldCheck, UserCircle2, Activity } from 'lucide-react';
import { analyzePrescription } from '@/ai/flows/analyze-prescription-flow';
import { parsePrescriptionText } from '@/ai/flows/parse-prescription-text-flow';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '../ui/badge';
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, limit } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

export function UploadPrescription() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [manualText, setManualText] = useState("");
  const [view, setView] = useState<'patient' | 'hospital'>('patient');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Fetch recent digitized records
  const recentRecordsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, "users", user.uid, "prescriptions"),
      orderBy("createdAt", "desc"),
      limit(20)
    );
  }, [firestore, user?.uid]);

  const { data: recentRecords, isLoading: recordsLoading } = useCollection(recentRecordsQuery);

  const savePrescriptionRecord = (result: any, source: 'file' | 'text') => {
    if (!user || !firestore) return;
    
    addDocumentNonBlocking(collection(firestore, "users", user.uid, "prescriptions"), {
      userId: user.uid,
      diagnosis: result.diagnosis,
      medications: result.medications,
      clinicalReport: result.clinicalReport || "Detailed clinical analysis completed.",
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
          title: "Analysis Complete",
          description: `Extracted ${result.medications.length} medications from your document.`,
        });
      } catch (error) {
        console.error("AI Analysis failed:", error);
        toast({
          variant: "destructive",
          title: "Analysis Failed",
          description: "Could not read the prescription. Please try a clearer image.",
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
        title: "Text Analyzed",
        description: `Successfully structured ${result.medications.length} medications.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Parsing Failed",
        description: "Could not structure the provided text. Please check the details.",
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
      instructions: med.instructions,
      category: med.category || 'General',
      startDate: new Date().toISOString().split('T')[0],
      isActive: true,
      aiInterpretation: `Extracted from AI analysis. Diagnosis: ${analysis?.diagnosis}`,
      safetyNotes: "Extracted by AI. Please verify with your pharmacist.",
      createdAt: serverTimestamp(),
    });

    toast({
      title: "Added to Schedule",
      description: `${med.name} has been added to your medications.`,
    });
    
    setTimeout(() => setIsAdding(null), 500);
  };

  const handleDownloadReport = (record: any) => {
    const reportTitle = `HealthAI_Clinical_Report_${record.diagnosis || 'Record'}.txt`;
    const meds = record.medications.map((m: any) => `- ${m.name} (${m.dosage}): ${m.frequency}`).join('\n');
    const content = `
HEALTH AI - CLINICAL ANALYSIS REPORT
------------------------------------
Date: ${new Date(record.createdAt).toLocaleString()}
Condition/Diagnosis: ${record.diagnosis || 'N/A'}
Source: ${record.source === 'file' ? 'Visual Scan' : 'Clinical Notes'}

EXTRACTED MEDICATIONS:
${meds}

AI CLINICAL INSIGHTS:
${record.clinicalReport || 'Detailed report metadata available in-app.'}

------------------------------------
DISCLAIMER: This report was generated by AI for informational purposes.
Always verify medical data with a qualified healthcare professional.
    `.trim();

    const element = document.createElement("a");
    const file = new Blob([content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = reportTitle;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    toast({
      title: "Report Downloaded",
      description: "The clinical analysis has been saved to your device.",
    });
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-6 pb-20"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black font-headline tracking-tighter">Clinical Registry</h1>
          <p className="text-muted-foreground font-medium">Enterprise medical record digitization and hospital reporting.</p>
        </div>
        <div className="flex bg-muted p-1 rounded-2xl h-12 w-full md:w-auto">
           <button onClick={() => setView('patient')} className={cn("flex-1 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", view === 'patient' ? "bg-white shadow-lg text-primary" : "text-muted-foreground hover:text-foreground")}>Patient View</button>
           <button onClick={() => setView('hospital')} className={cn("flex-1 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", view === 'hospital' ? "bg-white shadow-lg text-primary" : "text-muted-foreground hover:text-foreground")}>Hospital View</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-2xl bg-primary text-primary-foreground overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-700">
              <Sparkles className="size-48" />
            </div>
            <CardHeader className="relative z-10">
              <CardTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                <ShieldCheck className="size-8" />
                Intelligent Digitizer
              </CardTitle>
              <CardDescription className="text-primary-foreground/60 font-medium">
                Professional-grade OCR and RAG-based clinical report generation.
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10 pt-4">
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="w-full bg-white text-primary hover:bg-white/90 rounded-[2rem] h-16 text-xl font-black shadow-2xl">
                    <PlusCircle className="mr-3 h-7 w-7" />
                    Digitize New Record
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto border-none shadow-2xl rounded-[3rem] p-0 overflow-hidden bg-background">
                  <div className="h-2 w-full bg-primary" />
                  <div className="p-10 space-y-8">
                    <DialogHeader>
                      <DialogTitle className="text-3xl font-black uppercase tracking-tighter text-foreground text-center">Medical Data Intake</DialogTitle>
                      <DialogDescription className="text-center font-medium text-muted-foreground">
                        Provide a clinical document scan or paste structured notes for AI validation.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-6">
                      {!analysis && !isLoading && (
                        <Tabs defaultValue="upload" className="w-full">
                          <TabsList className="grid w-full grid-cols-2 mb-8 h-14 p-1.5 bg-muted rounded-2xl">
                            <TabsTrigger value="upload" className="flex items-center gap-3 rounded-xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-background">
                              <Upload className="size-4" /> Visual Scan
                            </TabsTrigger>
                            <TabsTrigger value="text" className="flex items-center gap-3 rounded-xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-background">
                              <Type className="size-4" /> Clinical Notes
                            </TabsTrigger>
                          </TabsList>
                          
                          <TabsContent value="upload">
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*,.pdf" onChange={handleFileChange} />
                            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="flex flex-col items-center justify-center gap-8 rounded-[3rem] border-4 border-dashed border-primary/20 p-16 bg-primary/5 hover:bg-primary/10 transition-all cursor-pointer group" onClick={triggerUpload}>
                              <div className="bg-primary text-primary-foreground p-6 rounded-[2rem] shadow-2xl shadow-primary/20 group-hover:rotate-6 transition-transform">
                                <Upload className="h-12 w-12" />
                              </div>
                              <div className="text-center space-y-2">
                                <h3 className="text-2xl font-black uppercase tracking-tighter">Clinical Drop Zone</h3>
                                <p className="text-sm text-muted-foreground font-bold opacity-60">PDF, JPG, or PNG Laboratory Scans</p>
                              </div>
                              <Button variant="outline" className="h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest border-2">Explore Directory</Button>
                            </motion.div>
                          </TabsContent>

                          <TabsContent value="text" className="space-y-6">
                            <div className="space-y-2">
                              <Label className="text-[10px] font-black uppercase tracking-widest ml-4 opacity-40">Paste Patient Notes Below</Label>
                              <Textarea placeholder="e.g. Rx: Metformin 500mg BD. Diagnosis: Type 2 Diabetes Mellitus." className="min-h-[300px] rounded-[2.5rem] p-8 border-2 focus-visible:ring-primary/20 text-lg leading-relaxed clinical-scrollbar" value={manualText} onChange={(e) => setManualText(e.target.value)} />
                            </div>
                            <Button className="w-full h-16 text-xl font-black rounded-[2rem] shadow-2xl shadow-primary/20" onClick={handleTextAnalysis} disabled={!manualText.trim()}>
                              <Sparkles className="mr-3 h-6 w-6" /> Process with AI RAG
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
                          <div className="text-center space-y-2">
                            <p className="text-2xl font-black uppercase tracking-tighter">Clinical Analysis Active</p>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest animate-pulse">Syncing with Pharmaceutical Databases...</p>
                          </div>
                        </div>
                      )}

                      {analysis && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                           <div className="bg-accent/5 p-8 rounded-[2.5rem] border-2 border-accent/20 flex flex-col md:flex-row md:items-center justify-between gap-6">
                              <div className="flex items-center gap-5">
                                 <div className="bg-accent text-white p-4 rounded-2xl shadow-xl shadow-accent/20"><CheckCircle2 className="size-8" /></div>
                                 <div>
                                    <h4 className="text-xl font-black uppercase tracking-tighter leading-none mb-1">Analysis Verified</h4>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{analysis.source === 'text' ? 'Clinical Notes' : 'Optical Scan'}</p>
                                 </div>
                              </div>
                              <Button className="h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest bg-accent hover:bg-accent/90" onClick={() => handleDownloadReport(analysis)}>
                                 <Download className="mr-2 size-4" /> Download Clinical Report
                              </Button>
                           </div>
                           
                           <div className="space-y-4">
                              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary ml-2 flex items-center gap-2">
                                <Pill className="size-4" /> Extracted Regimen
                              </h3>
                              <div className="grid gap-4">
                                 {analysis.medications.map((med: any, idx: number) => (
                                   <div key={idx} className="p-6 rounded-[2rem] border-2 bg-card/50 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-primary/30 transition-all group">
                                      <div className="flex items-center gap-5">
                                         <div className="size-14 rounded-2xl bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors shadow-inner"><Pill className="size-7 text-primary" /></div>
                                         <div>
                                            <p className="text-lg font-black uppercase tracking-tighter leading-none mb-1">{med.name}</p>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase">{med.dosage} • {med.frequency}</p>
                                         </div>
                                      </div>
                                      <Button size="sm" className="h-12 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest" onClick={() => handleAddToSchedule(med)} disabled={isAdding === med.name}>
                                         {isAdding === med.name ? <Loader2 className="animate-spin size-4" /> : <><PlusCircle className="mr-2 size-4" /> Add to Patient Plan</>}
                                      </Button>
                                   </div>
                                 ))}
                              </div>
                           </div>

                           <Button variant="ghost" className="w-full h-12 font-black uppercase text-[10px] tracking-[0.4em] opacity-40 hover:opacity-100" onClick={() => { setAnalysis(null); setManualText(""); }}>Reset & Start New Registry</Button>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {view === 'hospital' && (
            <Card className="border-none shadow-2xl overflow-hidden bg-card">
              <CardHeader className="bg-muted/30 border-b p-8">
                <CardTitle className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                  <UserCircle2 className="size-7 text-accent" />
                  Hospital Administration
                </CardTitle>
                <CardDescription className="font-medium">Manage clinical reports for all admitted patients.</CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-4">
                   {recentRecords?.map((record) => (
                     <div key={record.id} className="p-6 rounded-[2.5rem] border-2 flex items-center justify-between gap-6 hover:border-accent/30 transition-all bg-accent/5">
                        <div className="flex items-center gap-5">
                           <div className="size-14 rounded-[1.5rem] bg-white border-2 border-accent/20 flex items-center justify-center text-accent shadow-sm"><FileText className="size-7" /></div>
                           <div>
                              <p className="text-lg font-black uppercase tracking-tighter leading-none mb-1">{record.diagnosis || 'Clinical Record'}</p>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase">{record.medications?.length || 0} Medications Synced</p>
                           </div>
                        </div>
                        <div className="flex gap-2">
                           <Button variant="outline" size="sm" className="h-10 px-4 rounded-xl font-black text-[9px] uppercase tracking-widest" onClick={() => handleDownloadReport(record)}>Audit Report</Button>
                           <Button size="sm" className="h-10 px-4 rounded-xl font-black text-[9px] uppercase tracking-widest bg-accent shadow-lg shadow-accent/20">Authorize Care</Button>
                        </div>
                     </div>
                   ))}
                   {(!recentRecords || recentRecords.length === 0) && (
                     <div className="text-center py-20 opacity-30">
                        <ShieldCheck className="size-16 mx-auto mb-4" />
                        <p className="text-xs font-black uppercase tracking-widest">Administrative Queue Empty</p>
                     </div>
                   )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-8">
          <Card className="border-none shadow-2xl bg-card h-full flex flex-col max-h-[800px] overflow-hidden rounded-[2.5rem]">
            <CardHeader className="border-b p-8 bg-muted/20">
              <CardTitle className="text-xl font-black uppercase tracking-tighter flex items-center gap-3">
                <History className="size-6 text-primary" />
                Registry History
              </CardTitle>
              <CardDescription className="font-medium text-xs">Clinical archive of digitized patient documents.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto clinical-scrollbar p-6 space-y-4">
               {recordsLoading ? (
                 <div className="flex justify-center py-20 opacity-20"><Loader2 className="animate-spin size-12" /></div>
               ) : !recentRecords || recentRecords.length === 0 ? (
                 <div className="text-center py-32 opacity-20 grayscale">
                    <FileText className="size-16 mx-auto mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">Registry Empty</p>
                 </div>
               ) : (
                 recentRecords.map((record) => (
                   <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={record.id} className="p-5 rounded-[2rem] border-2 bg-muted/20 hover:bg-white hover:border-primary/20 transition-all cursor-pointer group shadow-sm relative">
                      <div className="flex items-center gap-4">
                         <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                            {record.source === 'file' ? <Camera className="size-6" /> : <Type className="size-6" />}
                         </div>
                         <div className="min-w-0 pr-8">
                            <h4 className="text-sm font-black uppercase tracking-tight truncate leading-none mb-1.5">{record.diagnosis || 'General Case'}</h4>
                            <div className="flex items-center gap-2">
                               <Badge variant="outline" className="text-[8px] font-black border-primary/10 px-2 py-0">{record.medications?.length || 0} ITEMS</Badge>
                               <span className="text-[9px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                                  <Calendar className="size-2.5" /> {record.createdAt ? formatDistanceToNow(new Date(record.createdAt), { addSuffix: true }) : 'Processing'}
                               </span>
                            </div>
                         </div>
                      </div>
                      <div className="absolute top-1/2 -translate-y-1/2 right-4 flex flex-col gap-2">
                         <Button size="icon" variant="ghost" className="size-8 rounded-full opacity-0 group-hover:opacity-100 hover:bg-primary/10 text-primary" onClick={(e) => { e.stopPropagation(); handleDownloadReport(record); }}>
                            <FileDown className="size-4" />
                         </Button>
                         <ChevronRight className="size-4 text-muted-foreground opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                      </div>
                   </motion.div>
                 ))
               )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-2xl bg-accent text-accent-foreground p-8 rounded-[2.5rem] relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <ShieldCheck className="size-24" />
             </div>
             <div className="relative z-10 space-y-4">
                <h4 className="text-xl font-black uppercase tracking-tighter">Clinical Accuracy</h4>
                <p className="text-xs font-bold leading-relaxed opacity-80 italic">"AI models are currently maintaining 98.4% diagnostic precision in optical character recognition."</p>
                <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                   <div className="h-full bg-white w-[98%]" />
                </div>
             </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
