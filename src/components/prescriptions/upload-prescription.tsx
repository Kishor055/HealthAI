"use client";

import { useState } from 'react';
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
} from "@/components/ui/accordion"
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, FileText, Loader2, PlusCircle, Sparkles, Upload } from 'lucide-react';
import { simplifyMedicalTerminology, SimplifyMedicalTerminologyOutput } from '@/ai/flows/simplify-medical-terminology';
import { generateSafetyNotes, GenerateSafetyNotesOutput } from '@/ai/flows/generate-safety-notes';

const mockMedicalText = "Take Lisinopril 10mg once daily in the morning. May be taken with or without food. Monitor for dry cough. Avoid potassium supplements.";

export function UploadPrescription() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [simplified, setSimplified] = useState<SimplifyMedicalTerminologyOutput | null>(null);
  const [safetyNotes, setSafetyNotes] = useState<GenerateSafetyNotesOutput | null>(null);

  const handleDigitize = async () => {
    setIsLoading(true);
    try {
      const [simplifiedRes, safetyNotesRes] = await Promise.all([
        simplifyMedicalTerminology({ medicalText: mockMedicalText, activeMedicines: ['Metformin'] }),
        generateSafetyNotes({ medicationName: 'Lisinopril', additionalInformation: 'Patient is also taking Metformin' })
      ]);
      setSimplified(simplifiedRes);
      setSafetyNotes(safetyNotesRes);
    } catch (error) {
      console.error("AI processing failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Prescriptions</CardTitle>
        <CardDescription>
          Upload, digitize, and understand your prescriptions with AI.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="lg">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New Prescription
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
              <DialogTitle>Digitize Prescription</DialogTitle>
              <DialogDescription>
                Upload an image of your prescription to have AI simplify it for you.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              {!simplified && !isLoading && (
                <div className="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-muted-foreground/30 p-12">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <Upload className="h-12 w-12 text-muted-foreground" />
                    <h3 className="text-lg font-bold tracking-tight">
                      Upload your prescription
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      You can take a photo or upload a file.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline"><Camera className="mr-2 h-4 w-4" /> Take Photo</Button>
                    <Button onClick={handleDigitize}>
                      <FileText className="mr-2 h-4 w-4" /> Upload File
                    </Button>
                  </div>
                </div>
              )}
              {isLoading && (
                <div className="flex flex-col items-center justify-center gap-4 p-12">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <p className="text-muted-foreground">AI is analyzing your prescription...</p>
                </div>
              )}
              {simplified && safetyNotes && (
                <div>
                   <h3 className="text-lg font-semibold mb-2 flex items-center"><Sparkles className="h-5 w-5 mr-2 text-primary" />AI Interpretation</h3>
                  <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
                    <AccordionItem value="item-1">
                      <AccordionTrigger>Dosage & Timing</AccordionTrigger>
                      <AccordionContent>{simplified.dosageTiming}</AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                      <AccordionTrigger>Food Instructions</AccordionTrigger>
                      <AccordionContent>{simplified.foodInstructions}</AccordionContent>
                    </AccordionItem>
                     <AccordionItem value="item-3">
                      <AccordionTrigger>Precautions</AccordionTrigger>
                      <AccordionContent>{simplified.precautions}</AccordionContent>
                    </AccordionItem>
                     <AccordionItem value="item-4">
                      <AccordionTrigger>AI-Generated Safety Notes</AccordionTrigger>
                      <AccordionContent>{safetyNotes.safetyNotes}</AccordionContent>
                    </AccordionItem>
                  </Accordion>
                   <Button className="w-full mt-6">Add Lisinopril to My Medications</Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
