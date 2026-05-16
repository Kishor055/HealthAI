"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUser, useFirestore, addDocumentNonBlocking } from "@/firebase";
import { collection, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Activity } from "lucide-react";

const formSchema = z.object({
  type: z.enum(['Blood Pressure', 'Heart Rate', 'Blood Sugar', 'Temperature', 'Weight']),
  value: z.string().min(1, "Value is required"),
  unit: z.string().min(1, "Unit is required"),
  date: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
});

interface AddRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddRecordDialog({ open, onOpenChange }: AddRecordDialogProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "Blood Pressure",
      value: "",
      unit: "mmHg",
      date: new Date().toISOString().split('T')[0],
      notes: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user || !firestore) return;
    setIsSubmitting(true);
    
    try {
      addDocumentNonBlocking(collection(firestore, "users", user.uid, "healthRecords"), {
        ...values,
        userId: user.uid,
        createdAt: serverTimestamp(),
      });

      toast({
        title: "Vital Recorded",
        description: `Successfully logged ${values.type}: ${values.value} ${values.unit}.`,
      });
      onOpenChange(false);
      form.reset();
    } catch (error) {
      toast({ variant: "destructive", title: "Sync Failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTypeChange = (type: string) => {
    form.setValue('type', type as any);
    // Auto-set units
    if (type === 'Blood Pressure') form.setValue('unit', 'mmHg');
    if (type === 'Heart Rate') form.setValue('unit', 'bpm');
    if (type === 'Blood Sugar') form.setValue('unit', 'mg/dL');
    if (type === 'Temperature') form.setValue('unit', '°C');
    if (type === 'Weight') form.setValue('unit', 'kg');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-[2rem] border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Log Biometric Vital</DialogTitle>
          <DialogDescription>
            Enter your current vitals to track your health trends.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest opacity-60">Record Type</FormLabel>
                  <Select onValueChange={(v) => { field.onChange(v); handleTypeChange(v); }} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12 rounded-xl bg-muted/50 border-none px-4">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Blood Pressure">Blood Pressure</SelectItem>
                      <SelectItem value="Heart Rate">Heart Rate</SelectItem>
                      <SelectItem value="Blood Sugar">Blood Sugar</SelectItem>
                      <SelectItem value="Temperature">Temperature</SelectItem>
                      <SelectItem value="Weight">Weight</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest opacity-60">Value</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 120/80" className="h-12 rounded-xl bg-muted/50 border-none px-4" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest opacity-60">Unit</FormLabel>
                    <FormControl>
                      <Input placeholder="mmHg" className="h-12 rounded-xl bg-muted/50 border-none px-4" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest opacity-60">Reading Date</FormLabel>
                  <FormControl>
                    <Input type="date" className="h-12 rounded-xl bg-muted/50 border-none px-4" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button type="submit" className="w-full h-14 text-lg font-black rounded-2xl shadow-xl shadow-accent/20 bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin" /> : <><Activity className="mr-2 h-5 w-5" /> Save Health Record</>}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}