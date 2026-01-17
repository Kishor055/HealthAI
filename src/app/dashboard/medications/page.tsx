import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

const medications = [
  { name: "Lisinopril", dose: "10mg", frequency: "Once a day", status: "Active" },
  { name: "Metformin", dose: "500mg", frequency: "Twice a day", status: "Active" },
  { name: "Atorvastatin", dose: "20mg", frequency: "Once a day", status: "Active" },
  { name: "Sertraline", dose: "50mg", frequency: "Once a day", status: "Active" },
  { name: "Amoxicillin", dose: "500mg", frequency: "Three times a day", status: "Finished" },
];

export default function MedicationsPage() {
  return (
    <div className="p-4 sm:p-6">
      <Card>
        <CardHeader>
          <CardTitle>My Medications</CardTitle>
          <CardDescription>
            A complete list of your current and past medications.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medication</TableHead>
                <TableHead>Dose</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {medications.map((med) => (
                <TableRow key={med.name}>
                  <TableCell className="font-medium">{med.name}</TableCell>
                  <TableCell>{med.dose}</TableCell>
                  <TableCell>{med.frequency}</TableCell>
                  <TableCell>
                    <Badge variant={med.status === "Active" ? "default" : "secondary"} className={med.status === "Active" ? 'bg-accent text-accent-foreground' : ''}>
                      {med.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
