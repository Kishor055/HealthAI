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
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from "@/firebase";
import { collection, query, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Calendar } from "lucide-react";

const formSchema = z.object({
  providerId: z.string().min(1, "Please select a provider"),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  type: z.string().min(1, "Consultation type is required"),
  notes: z.string().optional(),
});

interface BookAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BookAppointmentDialog({ open, onOpenChange }: BookAppointmentDialogProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const providersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "users", user.uid, "preferredProviders"));
  }, [firestore, user?.uid]);

  const { data: preferredProviders, isLoading: providersLoading } = useCollection(providersQuery);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      providerId: "",
      date: new Date().toISOString().split('T')[0],
      time: "10:00",
      type: "Regular Checkup",
      notes: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user || !firestore) return;
    setIsSubmitting(true);

    const selectedProvider = preferredProviders?.find(p => p.id === values.providerId);
    
    try {
      addDocumentNonBlocking(collection(firestore, "users", user.uid, "appointments"), {
        ...values,
        providerName: selectedProvider?.providerName || "General Practitioner",
        userId: user.uid,
        status: "scheduled",
        createdAt: serverTimestamp(),
      });

      toast({
        title: "Appointment Booked",
        description: `Your visit with ${selectedProvider?.providerName} is scheduled for ${values.date}.`,
      });
      onOpenChange(false);
      form.reset();
    } catch (error) {
      toast({ variant: "destructive", title: "Booking Failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] rounded-[2rem] border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Book Consultation</DialogTitle>
          <DialogDescription>
            Select one of your preferred providers to schedule a visit.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="providerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest opacity-60">Select Doctor</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12 rounded-xl bg-muted/50 border-none px-4">
                        <SelectValue placeholder={providersLoading ? "Loading providers..." : "Choose a doctor"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {preferredProviders?.map((provider) => (
                        <SelectItem key={provider.id} value={provider.id}>
                          {provider.providerName} ({provider.providerSpecialty})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest opacity-60">Date</FormLabel>
                    <FormControl>
                      <Input type="date" className="h-12 rounded-xl bg-muted/50 border-none px-4" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest opacity-60">Time</FormLabel>
                    <FormControl>
                      <Input type="time" className="h-12 rounded-xl bg-muted/50 border-none px-4" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest opacity-60">Consultation Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12 rounded-xl bg-muted/50 border-none px-4">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Regular Checkup">Regular Checkup</SelectItem>
                      <SelectItem value="Follow-up">Follow-up</SelectItem>
                      <SelectItem value="Emergency">Emergency Consultation</SelectItem>
                      <SelectItem value="Vaccination">Vaccination</SelectItem>
                      <SelectItem value="Diagnostics">Diagnostics Results</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button type="submit" className="w-full h-14 text-lg font-black rounded-2xl shadow-xl shadow-primary/20" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin" /> : <><Calendar className="mr-2 h-5 w-5" /> Confirm Appointment</>}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}