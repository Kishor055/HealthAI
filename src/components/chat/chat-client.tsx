"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  Bot,
  Loader2,
  Send,
  Volume2,
  VolumeX,
  Database,
  ShieldCheck,
  Sparkles,
  Brain,
  Apple,
  Activity,
  Info,
  AlertTriangle,
  PhoneCall,
  FileText,
  HelpCircle,
  Stethoscope
} from 'lucide-react';
import { healthCopilot, HealthCopilotOutput } from '@/ai/flows/health-copilot-flow';
import { placeholderImages } from '@/lib/placeholder-images';
import { useCollection, useUser, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, doc, orderBy, limit } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { detectPromptInjection, scanForMedicalEmergency, EmergencySafetyResult } from '@/lib/ai-guardrails';
import { hybridSearchRAG } from '@/lib/rag-engine';
import { logAuditEvent } from '@/lib/audit-logger';

interface Message {
  id: number;
  text?: string;
  structured?: HealthCopilotOutput;
  emergencyAlert?: EmergencySafetyResult;
  sender: 'user' | 'ai' | 'emergency';
  audioUrl?: string;
}

export function ChatClient() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! I am your HealthAI Copilot. I can analyze your uploaded medical records, explain lab reports with verified citations, and suggest lifestyle steps. What health query can I assist you with today?",
      sender: 'ai',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user?.uid]);
  const { data: profile } = useDoc(profileRef);

  const medsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "users", user.uid, "medicines"));
  }, [firestore, user?.uid]);
  const { data: medications } = useCollection(medsQuery);

  const vitalsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "users", user.uid, "healthRecords"), orderBy("date", "desc"), limit(5));
  }, [firestore, user?.uid]);
  const { data: vitals } = useCollection(vitalsQuery);

  const scrollToBottom = useCallback(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  const playAudio = useCallback((dataUri: string) => {
    if (audioRef.current) {
      audioRef.current.src = dataUri;
      audioRef.current.play().catch(e => console.warn("Audio play blocked", e));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userInput = input.trim();
    const userMessage: Message = { id: Date.now(), text: userInput, sender: 'user' };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // ── 1. Prompt Injection Filter ───────────────────────────────────────────
    const injectionCheck = detectPromptInjection(userInput);
    if (injectionCheck.isMalicious) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: `Medical Safety Gate Alert: ${injectionCheck.reason}`,
          sender: 'ai',
        },
      ]);
      setIsLoading(false);
      return;
    }

    // ── 2. Deterministic Emergency Detection Engine ──────────────────────────
    const emergencyScan = scanForMedicalEmergency(userInput);
    if (emergencyScan.isEmergency) {
      logAuditEvent({
        userId: user?.uid || "anonymous",
        action: "EMERGENCY_TRIGGER",
        details: { category: emergencyScan.category, triggers: emergencyScan.matchedKeywords },
      });

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          emergencyAlert: emergencyScan,
          sender: 'emergency',
        },
      ]);
      setIsLoading(false);
      return;
    }

    // ── 3. Grounded Medical Document RAG Retrieval ───────────────────────────
    const ragResult = hybridSearchRAG(user?.uid || "guest", userInput, 3);

    try {
      const context = {
        age: profile?.age || 30,
        gender: profile?.gender || "Not specified",
        medicalHistory: profile?.medicalHistory || "Standard Baseline",
        medicationList: medications?.map(m => `${m.name} (${m.dosage})`).join(', ') || "None recorded",
        recentVitals: vitals?.map(v => `${v.type}: ${v.value}`).join(', ') || "No recent telemetry",
        goals: "Maintain physiological stability and treatment compliance."
      };

      const result = await healthCopilot({
        question: userInput,
        userContext: context,
        documentContext: ragResult.hasSufficientContext ? ragResult.formattedContext : undefined,
        generateAudio: isVoiceActive
      });

      // Merge client RAG citations if model didn't provide specific ones
      const combinedCitations = (result.citations && result.citations.length > 0)
        ? result.citations
        : ragResult.citations;

      const aiMessage: Message = {
        id: Date.now() + 1,
        structured: {
          ...result,
          citations: combinedCitations,
          hasSufficientContext: ragResult.hasSufficientContext,
        },
        sender: 'ai',
        audioUrl: result.audioDataUri
      };

      setMessages((prev) => [...prev, aiMessage]);

      logAuditEvent({
        userId: user?.uid || "guest",
        action: "AI_QUERY",
        details: { queryLength: userInput.length, citationsCount: combinedCitations.length }
      });

      if (result.audioDataUri && isVoiceActive) {
        playAudio(result.audioDataUri);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: "I encountered a clinical connection issue. Please verify your connection or ask again.",
          sender: 'ai',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-[calc(100vh-4rem)] bg-slate-50/50 font-body"
    >
      <audio ref={audioRef} className="hidden" />

      <header className="p-5 sm:p-6 border-b bg-white flex items-center justify-between shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="size-11 sm:size-12 bg-primary/10 rounded-2xl flex items-center justify-center shadow-inner">
            <Brain className="text-primary size-6 sm:size-7" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">HealthAI Copilot</h2>
              <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 text-[9px] font-black uppercase h-5 px-2">
                Grounded RAG v2.0
              </Badge>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="size-1.5 bg-emerald-500 rounded-full animate-pulse shrink-0" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Deterministic Safety Gate Active
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full border border-slate-200">
            <Database className="size-3 text-slate-500" />
            <span className="text-[9px] font-black uppercase text-slate-600 tracking-widest leading-none">
              WHO & Mayo Guidelines
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "rounded-xl h-9 font-bold uppercase text-[9px] tracking-wider transition-all",
              isVoiceActive ? "border-primary text-primary bg-primary/5" : "text-slate-400"
            )}
            onClick={() => setIsVoiceActive(!isVoiceActive)}
          >
            {isVoiceActive ? <Volume2 className="size-3.5 mr-1.5" /> : <VolumeX className="size-3.5 mr-1.5" />}
            Voice {isVoiceActive ? 'On' : 'Off'}
          </Button>
        </div>
      </header>

      <ScrollArea className="flex-1 p-4 sm:p-6" ref={scrollAreaRef}>
        <div className="space-y-8 max-w-4xl mx-auto py-4">
          {messages.map((message) => (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              key={message.id}
              className={cn(
                'flex items-start gap-4',
                message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
              )}
            >
              <Avatar className="h-10 w-10 border-2 border-white shadow-md shrink-0">
                {message.sender === 'user' ? (
                  <>
                    <AvatarImage src={user?.photoURL || placeholderImages[0]?.imageUrl} />
                    <AvatarFallback className="bg-primary text-white font-bold text-xs">ME</AvatarFallback>
                  </>
                ) : message.sender === 'emergency' ? (
                  <AvatarFallback className="bg-red-600 text-white font-bold text-xs">
                    <AlertTriangle className="size-5" />
                  </AvatarFallback>
                ) : (
                  <>
                    <AvatarFallback className="bg-slate-900 text-white font-bold text-xs">
                      <Bot className="size-5" />
                    </AvatarFallback>
                  </>
                )}
              </Avatar>

              <div className="flex flex-col gap-3 max-w-[85%] sm:max-w-[78%]">
                {/* ── Emergency Card ── */}
                {message.sender === 'emergency' && message.emergencyAlert && (
                  <div className="rounded-[2rem] p-6 bg-red-50 border-2 border-red-300 shadow-2xl space-y-4">
                    <div className="flex items-center gap-3 text-red-700">
                      <div className="p-2.5 bg-red-600 text-white rounded-xl">
                        <AlertTriangle className="size-6 animate-pulse" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black tracking-tight text-red-900">
                          CRITICAL MEDICAL SAFETY INTERVENTION
                        </h3>
                        <p className="text-xs font-bold text-red-700 uppercase tracking-widest">
                          Category: {message.emergencyAlert.category}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-white/90 rounded-2xl border border-red-200">
                      <p className="text-sm font-semibold text-red-950 leading-relaxed">
                        {message.emergencyAlert.recommendedAction}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {message.emergencyAlert.emergencyNumbers.map((num, i) => (
                        <a
                          key={i}
                          href={`tel:${num.number.split(" ")[0]}`}
                          className="flex items-center justify-between p-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors shadow-md"
                        >
                          <span className="truncate">{num.country}</span>
                          <span className="flex items-center gap-1 text-sm font-black">
                            <PhoneCall className="size-3.5" /> {num.number}
                          </span>
                        </a>
                      ))}
                    </div>

                    <p className="text-[10px] text-red-600/80 uppercase tracking-wider font-bold text-center">
                      {message.emergencyAlert.clinicalDisclaimer}
                    </p>
                  </div>
                )}

                {/* ── Structured AI RAG Response ── */}
                {message.structured ? (
                  <div className="bg-white border-2 border-slate-200/70 rounded-[2rem] p-6 sm:p-8 rounded-tl-none shadow-xl space-y-6">
                    {/* Insight Header */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-primary/10 text-primary text-[9px] font-black uppercase px-2.5 py-0.5">
                            Clinical Assessment
                          </Badge>
                          {message.structured.hasSufficientContext === false && (
                            <Badge variant="outline" className="text-amber-700 bg-amber-50 border-amber-200 text-[9px] font-bold">
                              Limited Document Context
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-base font-medium text-slate-800 leading-relaxed">
                        {message.structured.insight}
                      </p>
                    </div>

                    {/* Source Citations */}
                    {message.structured.citations && message.structured.citations.length > 0 && (
                      <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                          <FileText className="size-3 text-emerald-600" /> Grounded Source Citations
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {message.structured.citations.map((cite, i) => (
                            <Badge
                              key={i}
                              variant="outline"
                              className="bg-white text-slate-700 border-slate-300 font-semibold text-[10px] py-1 px-2.5"
                            >
                              {cite}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recommendations & Lifestyle */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                        <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                          <Activity className="size-3.5 text-emerald-600" /> Recommendations
                        </span>
                        <ul className="space-y-1.5">
                          {message.structured.recommendations.map((rec, i) => (
                            <li key={i} className="text-xs text-emerald-950 font-medium leading-relaxed">
                              • {rec}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100">
                        <span className="text-[10px] font-black text-blue-800 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                          <Apple className="size-3.5 text-blue-600" /> Lifestyle Guidance
                        </span>
                        <ul className="space-y-1.5">
                          {message.structured.lifestyleSuggestions.map((sug, i) => (
                            <li key={i} className="text-xs text-blue-950 font-medium leading-relaxed">
                              • {sug}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Questions to Ask Doctor */}
                    {message.structured.doctorQuestions && message.structured.doctorQuestions.length > 0 && (
                      <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100">
                        <span className="text-[10px] font-black text-indigo-800 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                          <Stethoscope className="size-3.5 text-indigo-600" /> Questions to Ask Your Doctor
                        </span>
                        <ul className="space-y-1.5">
                          {message.structured.doctorQuestions.map((q, i) => (
                            <li key={i} className="text-xs text-indigo-950 font-medium leading-relaxed">
                              • &quot;{q}&quot;
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="bg-slate-50 border border-slate-200/60 p-3.5 rounded-xl flex items-start gap-2.5">
                      <Info className="size-4 text-slate-400 shrink-0 mt-0.5" />
                      <p className="text-[10px] font-medium text-slate-500 leading-relaxed">
                        Important: HealthAI Copilot is an assistive informational tool and does not replace evaluation by a qualified medical professional.
                      </p>
                    </div>
                  </div>
                ) : message.text ? (
                  <div
                    className={cn(
                      'rounded-[2rem] p-5 shadow-sm text-sm leading-relaxed border',
                      message.sender === 'user'
                        ? 'bg-primary text-primary-foreground border-primary rounded-tr-none'
                        : 'bg-white border-slate-200 rounded-tl-none font-medium text-slate-700'
                    )}
                  >
                    {message.text}
                  </div>
                ) : null}

                {message.audioUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="self-start h-8 px-3 rounded-xl text-[9px] font-bold uppercase tracking-wider text-slate-400 hover:text-primary transition-all bg-white border border-slate-200"
                    onClick={() => playAudio(message.audioUrl!)}
                  >
                    <Volume2 className="size-3 mr-1.5" /> Replay Voice
                  </Button>
                )}
              </div>
            </motion.div>
          ))}

          {isLoading && (
            <div className="flex items-start gap-4">
              <Avatar className="h-10 w-10 border-2 border-white shadow-md shrink-0">
                <AvatarFallback className="bg-slate-900 text-white font-bold text-xs animate-pulse">...</AvatarFallback>
              </Avatar>
              <div className="bg-white border-2 border-slate-200 rounded-[2rem] p-6 rounded-tl-none shadow-md flex flex-col gap-3 min-w-[280px]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin text-primary" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Grounded Synthesis...</span>
                  </div>
                  <Badge variant="outline" className="text-[8px] font-bold uppercase text-emerald-600 border-emerald-200">
                    RAG Active
                  </Badge>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 1.8, repeat: Infinity }}
                    className="h-full bg-primary"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 sm:p-6 bg-white border-t border-slate-200/80">
        <form onSubmit={handleSubmit} className="flex items-center gap-3 max-w-4xl mx-auto">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your lab report, medication timing, or diet..."
            className="flex-1 rounded-2xl h-12 px-5 border-slate-200 focus-visible:ring-primary/20 text-sm font-medium bg-white"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            className="h-12 w-12 rounded-2xl bg-primary hover:bg-primary/90 text-white shadow-md"
            disabled={isLoading || !input.trim()}
          >
            <Send className="size-5" />
          </Button>
        </form>
        <div className="flex items-center justify-center gap-4 mt-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          <span className="flex items-center gap-1">
            <Sparkles className="size-3 text-primary" /> Evidence-Grounded
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="size-3 text-emerald-600" /> Deterministic Emergency Gate
          </span>
        </div>
      </div>
    </motion.div>
  );
}
