import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Check, SkipForward, Clock } from "lucide-react"

const reminders = [
  { time: "8:00 AM", medicine: "Lisinopril", dose: "10mg" },
  { time: "9:00 AM", medicine: "Metformin", dose: "500mg" },
  { time: "8:00 PM", medicine: "Atorvastatin", dose: "20mg" },
  { time: "9:00 PM", medicine: "Metformin", dose: "500mg" },
]

export function Reminders() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Reminders</CardTitle>
        <CardDescription>
          Don't forget to take your medication on time.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {reminders.map((reminder, index) => (
            <div key={index} className="flex items-center space-x-4 p-2 rounded-lg hover:bg-muted">
              <div className="flex items-center justify-center bg-primary/10 text-primary rounded-full size-10">
                <Clock className="h-5 w-5" />
              </div>
              <div className="flex-grow">
                <p className="font-semibold">{reminder.time}</p>
                <p className="text-sm text-muted-foreground">
                  {reminder.medicine} - {reminder.dose}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="text-muted-foreground">
                  <SkipForward className="h-4 w-4 mr-1" />
                  Skip
                </Button>
                <Button size="sm" variant="default" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  <Check className="h-4 w-4 mr-1" />
                  Take
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
