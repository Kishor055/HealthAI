import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { AlertTriangle, ShieldCheck, Info } from "lucide-react"

const alerts = [
  {
    priority: "high",
    message: "High risk of serotonin syndrome when combining Sertraline with a newly added medication. Consult your doctor immediately.",
  },
  {
    priority: "medium",
    message: "Duplicate therapy detected: You are prescribed two medications from the same class (ACE inhibitors).",
  },
  {
    priority: "low",
    message: "Lisinopril may cause a dry cough. This is a common side effect but report if it becomes severe.",
  },
]

const priorityIcons = {
  high: <AlertTriangle className="h-4 w-4" />,
  medium: <ShieldCheck className="h-4 w-4" />,
  low: <Info className="h-4 w-4" />,
}

const priorityVariants = {
  high: "destructive",
  medium: "default",
  low: "default"
} as const;

const priorityColors = {
    high: 'border-destructive/50 text-destructive [&>svg]:text-destructive',
    medium: 'border-yellow-500/50 text-yellow-600 [&>svg]:text-yellow-600',
    low: 'border-blue-500/50 text-blue-600 [&>svg]:text-blue-600',
}

export function Alerts() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Safety Alerts</CardTitle>
        <CardDescription>
          Potential interactions and important notes.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {alerts.map((alert, index) => (
          <Alert key={index} variant={priorityVariants[alert.priority]}>
            {priorityIcons[alert.priority]}
            <AlertTitle>Priority: {alert.priority.charAt(0).toUpperCase() + alert.priority.slice(1)}</AlertTitle>
            <AlertDescription>
              {alert.message}
            </AlertDescription>
          </Alert>
        ))}
      </CardContent>
    </Card>
  )
}
