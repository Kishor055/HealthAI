import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Pill, CalendarCheck, Target, TrendingUp, Activity, ShieldCheck } from "lucide-react"
import { motion } from "framer-motion"

const kpiData = [
  { 
    title: "Active Regimen", 
    value: "4", 
    label: "Items Tracked",
    icon: Pill, 
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    change: "+1 new entry" 
  },
  { 
    title: "Adherence Rate", 
    value: "92%", 
    label: "Precision Score",
    icon: ShieldCheck, 
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    change: "High stability" 
  },
  { 
    title: "Consultations", 
    value: "2", 
    label: "Scheduled",
    icon: CalendarCheck, 
    color: "text-primary",
    bg: "bg-primary/10",
    change: "Next: Thu 10 AM" 
  },
]

export function KpiCards() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
      {kpiData.map((kpi, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="border-none shadow-[0_15px_40px_rgba(0,0,0,0.03)] bg-white rounded-[2rem] overflow-hidden group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground group-hover:text-primary transition-colors">
                {kpi.title}
              </CardTitle>
              <div className={`p-2.5 rounded-xl ${kpi.bg} ${kpi.color} shadow-sm group-hover:scale-110 transition-transform`}>
                <kpi.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2 mb-1">
                <div className="text-3xl font-black tracking-tighter text-foreground">{kpi.value}</div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase">{kpi.label}</div>
              </div>
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 opacity-60">
                <Activity className="size-2.5" /> {kpi.change}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
