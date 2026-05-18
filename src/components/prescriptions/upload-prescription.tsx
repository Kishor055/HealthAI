
"use client";

import { useState, useRef } from 'react';
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
import { Camera, FileText, Loader2, PlusCircle, Sparkles, Upload, CheckCircle2, Pill, Type, History, ChevronRight } from 'lucide-react';
import { analyzePrescription } from '@/ai/flows/analyze-prescription-flow';
import { parsePrescriptionText } from '@/ai/flows/parse-prescription-text-flow';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '../ui/badge';
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, limit } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';

export function UploadPrescription() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [manualText, setManualText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Fetch recent digitized records
  const recentRecordsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, "users", user.uid, "prescriptions"),
      orderBy("createdAt", "desc"),
      limit(5)
    );
  }, [firestore, user?.uid]);

  const { data: recentRecords, isLoading: recordsLoading } = useCollection(recentRecordsQuery);

  const savePrescriptionRecord = (result: any, source: 'file' | 'text') => {
    if (!user || !firestore) return;
    
    addDocumentNonBlocking(collection(firestore, "users", user.uid, "prescriptions"), {
      userId: user.uid,
      diagnosis: result.diagnosis,
      medications: result.medications,
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

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-headline">Prescriptions</h1>
          <p className="text-muted-foreground">Digitize and manage your medical records.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-none shadow-xl bg-gradient-to-br from-primary/5 to-background overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Sparkles className="size-24" />
          </div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-5 text-primary" />
              Smart AI Digitizer
            </CardTitle>
            <CardDescription>
              Convert paper or notes into digital schedules instantly.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="w-full rounded-2xl h-14 text-lg font-black shadow-lg shadow-primary/20">
                  <PlusCircle className="mr-2 h-6 w-6" />
                  Start Digitizing
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto border-none shadow-2xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black font-headline tracking-tight">INTELLIGENT MEDICAL OCR</DialogTitle>
                  <DialogDescription>
                    Provide clinical documents or paste clinical text for AI structure.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="py-6">
                  {!analysis && !isLoading && (
                    <Tabs defaultValue="upload" className="w-full">
                      <TabsList className="grid w-full grid-cols-2 mb-8 h-12 p-1 bg-muted rounded-xl">
                        <TabsTrigger value="upload" className="flex items-center gap-2 rounded-lg font-bold">
                          <Upload className="size-4" /> File Upload
                        </TabsTrigger>
                        <TabsTrigger value="text" className="flex items-center gap-2 rounded-lg font-bold">
                          <Type className="size-4" /> Paste Notes
                        </TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="upload">
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          className="hidden" 
                          accept="image/*,.pdf"
                          onChange={handleFileChange}
                        />
                        <motion.div 
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          className="flex flex-col items-center justify-center gap-6 rounded-[2rem] border-4 border-dashed border-primary/20 p-12 bg-primary/5 hover:bg-primary/10 transition-all cursor-pointer group"
                          onClick={triggerUpload}
                        >
                          <div className="bg-primary text-primary-foreground p-5 rounded-3xl shadow-xl shadow-primary/20 group-hover:rotate-6 transition-transform">
                            <Upload className="h-10 w-10" />
                          </div>
                          <div className="text-center space-y-2">
                            <h3 className="text-xl font-black uppercase tracking-tight">Drop medical record</h3>
                            <p className="text-sm text-muted-foreground font-medium">
                              Supports JPG, PNG, PDF Scans.
                            </p>
                          </div>
                          <Button variant="outline" className="mt-2 font-bold rounded-xl border-2">Browse Gallery</Button>
                        </motion.div>
                      </TabsContent>

                      <TabsContent value="text" className="space-y-4">
                        <div className="space-y-2 text-left">
                          <Label className="text-xs font-black uppercase tracking-widest ml-1 text-primary">Clinical Text Input</Label>
                          <Textarea 
                            placeholder="e.g. Rx: Amoxicillin 500mg, 1 tab TID for 7 days. Patient has acute sinusitis."
                            className="min-h-[250px] rounded-[2rem] p-6 border-2 focus-visible:ring-primary/20 text-base leading-relaxed"
                            value={manualText}
                            onChange={(e) => setManualText(e.target.value)}
                          />
                        </div>
                        <Button 
                          className="w-full h-14 text-xl font-black rounded-2xl shadow-xl shadow-primary/20" 
                          onClick={handleTextAnalysis}
                          disabled={!manualText.trim()}
                        >
                          <Sparkles className="mr-2 h-5 w-5" />
                          Analyze Text with AI
                        </Button>
                      </TabsContent>
                    </Tabs>
                  )}

                  {isLoading && (
                    <div className="flex flex-col items-center justify-center gap-8 p-20">
                      <div className="relative">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        >
                          <Loader2 className="h-20 w-20 text-primary opacity-20" />
                        </motion.div>
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          <Sparkles className="h-10 w-10 text-primary" />
                        </motion.div>
                      </div>
                      <div className="text-center space-y-2">
                        <p className="text-2xl font-black uppercase tracking-tighter">AI Processing...</p>
                        <p className="text-sm text-muted-foreground font-bold italic">Extracting pharmaceutical structure...</p>
                      </div>
                    </div>
                  )}

                  <AnimatePresence>
                    {analysis && (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                      >
                        <div className="flex items-center justify-between p-6 bg-accent/5 rounded-3xl border-2 border-accent/20">
                          <div className="flex items-center gap-4">
                            <div className="bg-accent text-accent-foreground p-3 rounded-2xl">
                              <CheckCircle2 className="h-6 w-6" />
                            </div>
                            <div>
                              <h4 className="font-black uppercase text-sm leading-none mb-1">Digitization Active</h4>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                Source: {analysis.source === 'text' ? 'Clinical Notes' : 'Visual Scan'}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className="border-accent text-accent font-black py-1 px-4">{analysis.diagnosis}</Badge>
                        </div>

                        <div className="space-y-4">
                          <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                            <Pill className="h-4 w-4" />
                            Extracted Medications
                          </h3>

                          <div className="grid gap-4">
                            {analysis.medications.map((med: any, idx: number) => (
                              <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                key={idx}
                              >
                                <Card className="overflow-hidden border-2 hover:border-primary/40 transition-all group">
                                  <div className="h-1.5 w-full bg-primary/10 group-hover:bg-primary transition-colors" />
                                  <CardHeader className="p-5 pb-2">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <CardTitle className="text-lg font-black text-foreground uppercase tracking-tighter">{med.name}</CardTitle>
                                        <div className="flex items-center gap-2 mt-1">
                                           <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none font-bold text-[10px] uppercase">
                                              {med.dosage}
                                           </Badge>
                                           <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{med.frequency}</span>
                                        </div>
                                      </div>
                                      <Badge variant="outline" className="border-muted-foreground/20 text-muted-foreground font-bold text-[9px] uppercase tracking-widest">
                                        {med.category}
                                      </Badge>
                                    </div>
                                  </CardHeader>
                                  <CardContent className="p-5 pt-0">
                                    <p className="text-xs text-muted-foreground font-medium italic mb-4 p-3 bg-muted/30 rounded-xl">
                                      "{med.instructions}"
                                    </p>
                                    <Button 
                                      size="sm" 
                                      className="w-full h-10 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl shadow-lg shadow-primary/5"
                                      onClick={() => handleAddToSchedule(med)}
                                      disabled={isAdding === med.name}
                                    >
                                      {isAdding === med.name ? (
                                        <Loader2 className="animate-spin h-4 w-4" />
                                      ) : (
                                        <>
                                          <PlusCircle className="mr-2 h-4 w-4" />
                                          Add to My Schedule
                                        </>
                                      )}
                                    </Button>
                                  </CardContent>
                                </Card>
                              </motion.div>
                            ))}
                          </div>
                        </div>

                        <Button 
                          variant="ghost" 
                          className="w-full font-black text-xs uppercase tracking-[0.3em] opacity-40 hover:opacity-100" 
                          onClick={() => { setAnalysis(null); setManualText(""); }}
                        >
                          Reset & Digitization New Record
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <History className="size-5 text-muted-foreground" />
              Recent Records
            </CardTitle>
            <CardDescription>
              Your history of processed medical documents.
            </CardDescription>
          </CardHeader>
          <CardContent>
             {recordsLoading ? (
               <div className="flex justify-center py-10 opacity-20"><Loader2 className="animate-spin" /></div>
             ) : !recentRecords || recentRecords.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-10 opacity-20 grayscale">
                  <FileText className="size-16 mb-4" />
                  <p className="text-sm font-bold uppercase tracking-widest">No Recent Records</p>
                  <p className="text-[10px] mt-1">Digitized files will appear here.</p>
               </div>
             ) : (
               <div className="space-y-3">
                 {recentRecords.map((record) => (
                   <div key={record.id} className="p-4 rounded-2xl border-2 bg-muted/20 hover:bg-muted/40 transition-all cursor-pointer group">
                     <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                         <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                           {record.source === 'file' ? <FileText className="size-5" /> : <Type className="size-5" />}
                         </div>
                         <div>
                           <p className="text-xs font-black uppercase tracking-tighter">{record.diagnosis || 'General Record'}</p>
                           <p className="text-[9px] font-bold text-muted-foreground uppercase">{record.medications?.length || 0} Medications</p>
                         </div>
                       </div>
                       <ChevronRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                     </div>
                   </div>
                 ))}
               </div>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
