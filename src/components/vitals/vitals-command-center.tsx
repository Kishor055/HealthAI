"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  HeartPulse,
  Activity,
  Wind,
  Thermometer,
  Scale,
  Gauge,
  Plus,
  FileDown,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { VitalsEntry } from "@/types/medical";
import { openPrintableClinicalReport } from "@/lib/export-phi";
import { logAuditEvent } from "@/lib/audit-logger";

interface VitalsCommandCenterProps {
  initialVitals?: VitalsEntry[];
  patientName?: string;
  patientId?: string;
}

export function VitalsCommandCenter({
  initialVitals,
  patientName = "Alex Mercer",
  patientId = "pat-003",
}: VitalsCommandCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [timeRange, setTimeRange] = useState<"7d" | "30d">("30d");

  // Sample 30-day historical vitals series
  const [vitalsList, setVitalsList] = useState<VitalsEntry[]>(() => {
    if (initialVitals && initialVitals.length > 0) return initialVitals;
    
    // Generate realistic 30-day telemetry curve
    const history: VitalsEntry[] = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      
      history.push({
        userId: patientId,
        date: dateStr,
        timestamp: d.toISOString(),
        heartRate: Math.floor(70 + Math.sin(i * 0.5) * 6 + (Math.random() * 4)),
        systolicBp: Math.floor(118 + Math.cos(i * 0.4) * 8 + (Math.random() * 4)),
        diastolicBp: Math.floor(76 + Math.cos(i * 0.4) * 4 + (Math.random() * 3)),
        spo2: Math.floor(98 + (i % 2 === 0 ? 0 : -1)),
        temperature: 36.7,
        bloodGlucose: Math.floor(92 + Math.sin(i * 0.3) * 8),
        weight: 71.4,
        bmi: 23.4,
        respiratoryRate: 16,
        clinicalStabilityScore: Math.floor(88 + Math.sin(i * 0.4) * 6),
      });
    }
    return history;
  });

  const latest = vitalsList[vitalsList.length - 1] || {
    heartRate: 72,
    systolicBp: 120,
    diastolicBp: 80,
    spo2: 98,
    temperature: 36.7,
    bloodGlucose: 94,
    weight: 71.4,
    bmi: 23.4,
    respiratoryRate: 16,
    clinicalStabilityScore: 92,
  };

  const chartData = useMemo(() => {
    if (timeRange === "7d") return vitalsList.slice(-7);
    return vitalsList;
  }, [vitalsList, timeRange]);

  const [formData, setFormData] = useState({
    heartRate: 72,
    systolicBp: 120,
    diastolicBp: 80,
    spo2: 98,
    temperature: 36.7,
    bloodGlucose: 95,
    weight: 71.4,
  });

  const handleLogVitals = (e: React.FormEvent) => {
    e.preventDefault();
    const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const newEntry: VitalsEntry = {
      userId: patientId,
      date: today,
      timestamp: new Date().toISOString(),
      heartRate: Number(formData.heartRate),
      systolicBp: Number(formData.systolicBp),
      diastolicBp: Number(formData.diastolicBp),
      spo2: Number(formData.spo2),
      temperature: Number(formData.temperature),
      bloodGlucose: Number(formData.bloodGlucose),
      weight: Number(formData.weight),
      bmi: +(Number(formData.weight) / (1.75 * 1.75)).toFixed(1),
      respiratoryRate: 16,
      clinicalStabilityScore: 90,
    };

    setVitalsList(prev => [...prev, newEntry]);
    setIsOpen(false);
    logAuditEvent({
      userId: patientId,
      action: "VITALS_RECORDED",
      details: { hr: formData.heartRate, bp: `${formData.systolicBp}/${formData.diastolicBp}`, spo2: formData.spo2 }
    });
  };

  const handleExportPDF = () => {
    openPrintableClinicalReport({
      patient: { id: patientId, name: patientName, bloodType: "O+", allergies: "None recorded" },
      medications: [
        { name: "Metformin", dosage: "500 mg", frequency: "Twice daily", status: "Active" },
        { name: "Amlodipine", dosage: "5 mg", frequency: "Once daily", status: "Active" }
      ],
      vitals: vitalsList.slice(-5).map(v => ({
        date: v.date,
        heartRate: v.heartRate,
        bp: `${v.systolicBp}/${v.diastolicBp}`,
        spo2: v.spo2,
        stabilityScore: v.clinicalStabilityScore
      })),
      documents: []
    });
  };

  return (
    <div className="space-y-8 font-body">
      {/* Overview Title & Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900">
            Biometric Telemetry Command Center
          </h2>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-0.5">
            Real-Time Hemodynamic Monitoring • WHO Benchmarking
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="rounded-xl h-10 text-xs font-bold gap-2 border-slate-200"
            onClick={handleExportPDF}
          >
            <FileDown className="size-4 text-primary" />
            Printable PHI Report
          </Button>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl h-10 text-xs font-black uppercase tracking-wider gap-2 bg-slate-900 hover:bg-slate-800 text-white">
                <Plus className="size-4" /> Log Telemetry
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px] rounded-[2rem] p-6">
              <DialogHeader>
                <DialogTitle className="text-xl font-black text-slate-900">Record Vitals Reading</DialogTitle>
                <DialogDescription className="text-xs text-slate-400">
                  Log biometric parameters to recalculate your real-time Clinical Stability Index.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleLogVitals} className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold uppercase text-slate-400">Heart Rate (BPM)</Label>
                    <Input
                      type="number"
                      value={formData.heartRate}
                      onChange={e => setFormData({ ...formData, heartRate: +e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold uppercase text-slate-400">Oxygen SpO2 (%)</Label>
                    <Input
                      type="number"
                      value={formData.spo2}
                      onChange={e => setFormData({ ...formData, spo2: +e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold uppercase text-slate-400">Systolic BP (mmHg)</Label>
                    <Input
                      type="number"
                      value={formData.systolicBp}
                      onChange={e => setFormData({ ...formData, systolicBp: +e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold uppercase text-slate-400">Diastolic BP (mmHg)</Label>
                    <Input
                      type="number"
                      value={formData.diastolicBp}
                      onChange={e => setFormData({ ...formData, diastolicBp: +e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold uppercase text-slate-400">Temperature (°C)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.temperature}
                      onChange={e => setFormData({ ...formData, temperature: +e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold uppercase text-slate-400">Blood Glucose (mg/dL)</Label>
                    <Input
                      type="number"
                      value={formData.bloodGlucose}
                      onChange={e => setFormData({ ...formData, bloodGlucose: +e.target.value })}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full h-11 rounded-xl font-bold uppercase text-xs tracking-wider bg-slate-900 text-white">
                  Save Reading
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 8 Core Parameter Telemetry Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Heart Rate */}
        <Card className="rounded-2xl border-slate-200/80 shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest">Heart Rate</span>
              <HeartPulse className="size-4 text-red-500" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black tracking-tight text-slate-900">{latest.heartRate}</span>
              <span className="text-xs font-bold text-slate-400">BPM</span>
            </div>
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px] font-bold mt-2">
              WHO Normal (60-100)
            </Badge>
          </CardContent>
        </Card>

        {/* Blood Pressure */}
        <Card className="rounded-2xl border-slate-200/80 shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest">Blood Pressure</span>
              <Activity className="size-4 text-blue-500" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black tracking-tight text-slate-900">
                {latest.systolicBp} / {latest.diastolicBp}
              </span>
              <span className="text-xs font-bold text-slate-400">mmHg</span>
            </div>
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px] font-bold mt-2">
              AHA Normotensive
            </Badge>
          </CardContent>
        </Card>

        {/* Oxygen Saturation */}
        <Card className="rounded-2xl border-slate-200/80 shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest">SpO2 Oxygen</span>
              <Wind className="size-4 text-teal-500" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black tracking-tight text-slate-900">{latest.spo2}</span>
              <span className="text-xs font-bold text-slate-400">%</span>
            </div>
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px] font-bold mt-2">
              Optimal (&gt;95%)
            </Badge>
          </CardContent>
        </Card>

        {/* Body Temperature */}
        <Card className="rounded-2xl border-slate-200/80 shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest">Temperature</span>
              <Thermometer className="size-4 text-amber-500" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black tracking-tight text-slate-900">{latest.temperature}</span>
              <span className="text-xs font-bold text-slate-400">°C</span>
            </div>
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px] font-bold mt-2">
              Afebrile (Normal)
            </Badge>
          </CardContent>
        </Card>

        {/* Fasting Glucose */}
        <Card className="rounded-2xl border-slate-200/80 shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest">Blood Glucose</span>
              <Gauge className="size-4 text-purple-500" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black tracking-tight text-slate-900">{latest.bloodGlucose || 94}</span>
              <span className="text-xs font-bold text-slate-400">mg/dL</span>
            </div>
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px] font-bold mt-2">
              Normal Fasting
            </Badge>
          </CardContent>
        </Card>

        {/* Weight & BMI */}
        <Card className="rounded-2xl border-slate-200/80 shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest">Weight & BMI</span>
              <Scale className="size-4 text-indigo-500" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black tracking-tight text-slate-900">{latest.weight || 71.4}</span>
              <span className="text-xs font-bold text-slate-400">KG (BMI {latest.bmi || 23.4})</span>
            </div>
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px] font-bold mt-2">
              Healthy BMI (18.5-24.9)
            </Badge>
          </CardContent>
        </Card>

        {/* Respiratory Rate */}
        <Card className="rounded-2xl border-slate-200/80 shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest">Resp. Rate</span>
              <Wind className="size-4 text-sky-500" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black tracking-tight text-slate-900">{latest.respiratoryRate || 16}</span>
              <span className="text-xs font-bold text-slate-400">BPM</span>
            </div>
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px] font-bold mt-2">
              Normal (12-20)
            </Badge>
          </CardContent>
        </Card>

        {/* Stability Index */}
        <Card className="rounded-2xl border-slate-200/80 shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest">Stability Index</span>
              <ShieldCheck className="size-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black tracking-tight text-slate-900">
                {latest.clinicalStabilityScore || 92}
              </span>
              <span className="text-xs font-bold text-slate-400">/ 100</span>
            </div>
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[9px] font-bold mt-2">
              Optimal Stability
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* ── 30-Day Longitudinal Charts (Recharts) ── */}
      <Card className="rounded-3xl border-slate-200/80 shadow-sm bg-white overflow-hidden">
        <CardHeader className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-black tracking-tight text-slate-900">
              Longitudinal Hemodynamic Trends
            </CardTitle>
            <CardDescription className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-0.5">
              Systolic/Diastolic Blood Pressure & Heart Rate vs Adherence
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200">
            <Button
              size="sm"
              variant={timeRange === "7d" ? "default" : "ghost"}
              className="h-8 rounded-lg text-xs font-bold px-3"
              onClick={() => setTimeRange("7d")}
            >
              7 Days
            </Button>
            <Button
              size="sm"
              variant={timeRange === "30d" ? "default" : "ghost"}
              className="h-8 rounded-lg text-xs font-bold px-3"
              onClick={() => setTimeRange("30d")}
            >
              30 Days
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 30, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} domain={[50, 160]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderRadius: "1rem",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
                    fontSize: "12px",
                    fontWeight: 600
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                <Line
                  type="monotone"
                  dataKey="systolicBp"
                  name="Systolic BP (mmHg)"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="diastolicBp"
                  name="Diastolic BP (mmHg)"
                  stroke="#93c5fd"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="heartRate"
                  name="Heart Rate (BPM)"
                  stroke="#ef4444"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="clinicalStabilityScore"
                  name="Stability Index"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
