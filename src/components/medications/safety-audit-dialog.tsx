
"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Loader2, AlertTriangle, ShieldAlert, CheckCircle2, Pill } from "lucide-react";
import { detectDrugInteractions, DetectDrugInteractionsOutput } from "@/ai/flows/detect-drug-interactions";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface SafetyAuditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medications: any[];
}

export function SafetyAuditDialog({ open, onOpenChange, medications }: SafetyAuditDialogProps) {
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [results, setResults] = React.useState<DetectDrugInteractionsOutput | null>(null);

  const runAudit = async () => {
    if (medications.length === 0) return;
    setIsAnalyzing(true);
    setResults(null);

    try {
      const activeMeds = medications.filter(m => m.isActive).map(m => m.name);
      // For the audit, we treat all current meds as "new" or check them against each other
      const result = await detectDrugInteractions({
        currentMedications: activeMeds.slice(0, Math.floor(activeMeds.length / 2)),
        newMedications: activeMeds.slice(Math.floor(activeMeds.length / 2))
      });
      setResults(result);
    } catch (error) {
      console.error("Safety Audit failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  React.useEffect(() => {
    if (open && !results && !isAnalyzing) {
      runAudit();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
        <div className="h-2 w-full bg-primary" />
        <div className="p-8 space-y-6">
          <DialogHeader>
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
              <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-black text-center uppercase tracking-tighter">Clinical Safety Audit</DialogTitle>
            <DialogDescription className="text-center font-medium">
              AI-powered interaction check for your active medication plan.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-[200px] flex flex-col justify-center">
            {isAnalyzing ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse">Scanning Drug database...</p>
              </div>
            ) : results ? (
              <ScrollResults results={results} />
            ) : (
              <div className="text-center py-10 opacity-30">
                <ShieldAlert className="size-12 mx-auto mb-4" />
                <p className="text-xs font-black uppercase tracking-widest">No audit data available</p>
              </div>
            )}
          </div>

          <DialogFooter className="pt-4">
            <Button variant="outline" className="flex-1 rounded-xl h-12 font-bold" onClick={() => onOpenChange(false)}>Close</Button>
            <Button className="flex-2 rounded-xl h-12 font-black shadow-lg shadow-primary/20" onClick={runAudit} disabled={isAnalyzing}>
              {isAnalyzing ? <Loader2 className="animate-spin mr-2" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Re-Run Audit
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ScrollResults({ results }: { results: DetectDrugInteractionsOutput }) {
  if (results.alerts.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-accent/10 border-2 border-accent/20 rounded-2xl p-6 text-center space-y-3"
      >
        <CheckCircle2 className="size-10 text-accent mx-auto" />
        <h4 className="font-black uppercase text-accent">Safe Combination</h4>
        <p className="text-xs font-medium text-accent/80">No significant drug-to-drug interactions detected among your active medications.</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
      {results.alerts.map((alert, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.1 }}
          className={cn(
            "p-4 rounded-2xl border-2 flex gap-4 items-start",
            alert.priority === 'high' ? "bg-destructive/5 border-destructive/20 text-destructive" :
            alert.priority === 'medium' ? "bg-orange-500/5 border-orange-500/20 text-orange-600" :
            "bg-blue-500/5 border-blue-500/20 text-blue-600"
          )}
        >
          <div className="mt-0.5">
            {alert.priority === 'high' ? <ShieldAlert className="size-5" /> : 
             alert.priority === 'medium' ? <AlertTriangle className="size-5" /> : 
             <Pill className="size-5" />}
          </div>
          <div>
            <h5 className="font-black text-[10px] uppercase tracking-widest mb-1">{alert.priority} Priority</h5>
            <p className="text-xs font-medium leading-relaxed">{alert.message}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

import { RefreshCw } from "lucide-react";
