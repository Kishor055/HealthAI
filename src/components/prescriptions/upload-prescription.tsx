
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, FileText, Loader2, PlusCircle, Sparkles, Upload, CheckCircle2, Pill } from 'lucide-react';
import { analyzePrescription, AnalyzePrescriptionOutput } from '@/ai/flows/analyze-prescription-flow';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '../ui/badge';
import { useUser, useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export function UploadPrescription() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalyzePrescriptionOutput | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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
        setAnalysis(result);
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

  const handleAddToSchedule = async (med: any) => {
    if (!user || !firestore) return;
    setIsAdding(med.name);

    try {
      await addDoc(collection(firestore, "users", user.uid, "medicines"), {
        userId: user.uid,
        name: med.name,
        dosage: med.dosage,
        frequency: med.frequency,
        instructions: med.instructions,
        category: med.category || 'General',
        startDate: new Date().toISOString().split('T')[0],
        isActive: true,
        aiInterpretation: `Extracted from prescription. Diagnosis: ${analysis?.diagnosis}`,
        safetyNotes: "Extracted by AI. Please verify with your pharmacist.",
        createdAt: serverTimestamp(),
      });

      toast({
        title: "Added to Schedule",
        description: `${med.name} has been added to your medications.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not add medication to schedule.",
      });
    } finally {
      setIsAdding(null);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Prescriptions</CardTitle>
        <CardDescription>
          Upload, digitize, and understand your medical reports with AI.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="rounded-full px-8 shadow-lg hover:shadow-primary/20 transition-all" suppressHydrationWarning>
              <PlusCircle className="mr-2 h-5 w-5" />
              Digitize New Record
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold font-headline">Smart AI Digitizer</DialogTitle>
              <DialogDescription>
                Our AI analyzes images, PDFs, and medical reports to organize your care.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*,.pdf,.docx,.txt"
                onChange={handleFileChange}
              />
              
              {!analysis && !isLoading && (
                <div 
                  className="flex flex-col items-center justify-center gap-6 rounded-2xl border-2 border-dashed border-muted-foreground/30 p-16 bg-muted/10 hover:bg-muted/20 transition-all cursor-pointer group"
                  onClick={triggerUpload}
                >
                  <div className="bg-primary/10 p-4 rounded-full group-hover:scale-110 transition-transform">
                    <Upload className="h-10 w-10 text-primary" />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-bold tracking-tight">Drop medical record here</h3>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                      Supports JPG, PNG, PDF, and Scanned Documents up to 10MB.
                    </p>
                  </div>
                  <Button variant="outline" className="mt-2" suppressHydrationWarning>Browse Files</Button>
                </div>
              )}

              {isLoading && (
                <div className="flex flex-col items-center justify-center gap-6 p-16">
                  <div className="relative">
                    <Loader2 className="h-16 w-16 animate-spin text-primary" />
                    <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-accent animate-pulse" />
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold">Processing with AI...</p>
                    <p className="text-sm text-muted-foreground italic">Extracting handwriting and terminology...</p>
                  </div>
                </div>
              )}

              {analysis && (
                <div className="space-y-6 animate-in fade-in zoom-in duration-300">
                  <div className="flex items-center justify-between p-4 bg-accent/10 rounded-xl border border-accent/20">
                    <div className="flex items-center gap-3 text-accent-foreground">
                      <CheckCircle2 className="h-6 w-6 text-accent" />
                      <div>
                        <h4 className="font-bold">Record Digitized</h4>
                        <p className="text-xs">Successfully analyzed {analysis.patientName || "Patient Record"}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-accent text-accent">{analysis.diagnosis}</Badge>
                  </div>

                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Pill className="h-5 w-5 text-primary" />
                    Detected Medications
                  </h3>

                  <div className="grid gap-4">
                    {analysis.medications.map((med, idx) => (
                      <Card key={idx} className="overflow-hidden border-l-4 border-l-primary">
                        <CardHeader className="p-4 pb-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-md font-bold text-primary">{med.name}</CardTitle>
                              <CardDescription>{med.dosage} • {med.frequency}</CardDescription>
                            </div>
                            <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none">{med.category}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <p className="text-xs text-muted-foreground italic mb-2">"{med.instructions}"</p>
                          <Button 
                            size="sm" 
                            className="w-full h-8 text-[10px] font-bold uppercase tracking-wider"
                            onClick={() => handleAddToSchedule(med)}
                            disabled={isAdding === med.name}
                            suppressHydrationWarning
                          >
                            {isAdding === med.name ? <Loader2 className="animate-spin h-3 w-3" /> : "Add to My Schedule"}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="raw">
                      <AccordionTrigger className="text-sm text-muted-foreground">View Raw OCR Text</AccordionTrigger>
                      <AccordionContent className="text-[10px] font-mono whitespace-pre-wrap bg-muted p-4 rounded-lg">
                        {analysis.rawExtractedText}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                  
                  <Button variant="outline" className="w-full" onClick={() => setAnalysis(null)} suppressHydrationWarning>
                    Upload Another
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
