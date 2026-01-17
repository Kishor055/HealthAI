import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Pill, CalendarCheck, Target } from "lucide-react"

const kpiData = [
  { title: "Active Medications", value: "4", icon: Pill, change: "+1 from last month" },
  { title: "Adherence Rate", value: "92%", icon: Target, change: "-2% from last week" },
  { title: "Appointments", value: "2", icon: CalendarCheck, change: "1 this week" },
]

export function KpiCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
      {kpiData.map((kpi, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {kpi.title}
            </CardTitle>
            <kpi.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpi.value}</div>
            <p className="text-xs text-muted-foreground">
              {kpi.change}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
