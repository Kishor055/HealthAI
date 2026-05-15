
"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2, Pill, Activity, Heart, Wind, AlertCircle } from "lucide-react";
import { useCollection, useUser, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, doc, deleteDoc } from "firebase/firestore";
import { AddMedicationDialog } from "@/components/medications/add-medication-dialog";

export default function MedicationsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const medsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, "users", user.uid, "medicines"),
      orderBy("startDate", "desc")
    );
  }, [firestore, user?.uid]);

  const { data: medications, isLoading } = useCollection(medsQuery);

  const handleDelete = async (id: string) => {
    if (!user || !firestore) return;
    const docRef = doc(firestore, "users", user.uid, "medicines", id);
    await deleteDoc(docRef);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Asthma': return <Wind className="h-4 w-4 text-blue-500" />;
      case 'BP': return <Activity className="h-4 w-4 text-red-500" />;
      case 'Heart': return <Heart className="h-4 w-4 text-red-600" />;
      case 'Diabetes': return <Pill className="h-4 w-4 text-orange-500" />;
      case 'Allergy': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default: return <Pill className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-headline">Medications</h1>
          <p className="text-muted-foreground">Manage your current and past medication schedule.</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="rounded-full shadow-lg" suppressHydrationWarning>
          <PlusCircle className="mr-2 h-5 w-5" />
          Add Medication
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Medication List</CardTitle>
          <CardDescription>
            AI extraction from prescriptions automatically adds records here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medication</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Dose</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {medications?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      No medications found. Add one or upload a prescription to get started.
                    </TableCell>
                  </TableRow>
                )}
                {medications?.map((med) => (
                  <TableRow key={med.id}>
                    <TableCell className="font-bold">{med.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(med.category)}
                        <span className="text-xs font-medium">{med.category || 'General'}</span>
                      </div>
                    </TableCell>
                    <TableCell>{med.dosage}</TableCell>
                    <TableCell>{med.frequency}</TableCell>
                    <TableCell>{med.startDate}</TableCell>
                    <TableCell>
                      <Badge variant={med.isActive ? "default" : "secondary"} className={med.isActive ? 'bg-accent text-accent-foreground' : ''}>
                        {med.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(med.id)} suppressHydrationWarning>
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AddMedicationDialog open={isAddOpen} onOpenChange={setIsAddOpen} />
    </div>
  );
}
