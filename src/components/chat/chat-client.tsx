"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Bot, Loader2, Send, Volume2, VolumeX, Database, ShieldCheck, Sparkles, Brain, Apple, Activity, Info } from 'lucide-react';
import { healthCopilot, HealthCopilotOutput } from '@/ai/flows/health-copilot-flow';
import { placeholderImages } from '@/lib/placeholder-images';
import { useCollection, useUser, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, doc, orderBy, limit } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';

interface Message {
  id: number;
  text?: string;
  structured?: HealthCopilotOutput;
  sender: 'user' | 'ai';
  audioUrl?: string;
}

export function ChatClient() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! I'm your HealthAI Copilot. I'm here to help you understand your reports, manage your lifestyle, and answer any health questions with grounded clinical data. How can I assist you today?",
      sender: 'ai',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(true);
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

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const playAudio = (dataUri: string) => {
    if (audioRef.current) {
      audioRef.current.src = dataUri;
      audioRef.current.play().catch(e => console.warn("Audio play blocked", e));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now(), text: input, sender: 'user' };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const context = {
        age: profile?.age || 30,
        gender: profile?.gender || "Not specified",
        medicalHistory: profile?.medicalHistory || "Standard Baseline",
        medicationList: medications?.map(m => `${m.name} (${m.dosage})`).join(', ') || "None recorded",
        recentVitals: vitals?.map(v => `${v.type}: ${v.value}`).join(', ') || "No recent telemetry",
        goals: "Improve overall wellness and adherence."
      };

      const result = await healthCopilot({
        question: input,
        userContext: context,
        generateAudio: isVoiceActive
      });
      
      const aiMessage: Message = {
        id: Date.now() + 1,
        structured: result,
        sender: 'ai',
        audioUrl: result.audioDataUri
      };
      
      setMessages((prev) => [...prev, aiMessage]);
      
      if (result.audioDataUri && isVoiceActive) {
        playAudio(result.audioDataUri);
      }
    } catch (error) {
      setMessages((prev) => [...prev, {
        id: Date.now() + 1,
        text: 'I encountered an error during clinical synthesis. Please try again.',
        sender: 'ai',
      }]);
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
      
      <header className="p-6 border-b bg-white flex items-center justify-between shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-4">
           <div className="size-12 bg-primary/10 rounded-2xl flex items-center justify-center shadow-inner">
             <Brain className="text-primary size-7" />
           </div>
           <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tighter">HealthAI Copilot</h1>
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[8px] font-black uppercase h-5 px-2">RAG Intelligence</Badge>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="size-1.5 bg-emerald-500 rounded-full animate-pulse shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Personalized Context Sync Active</span>
              </div>
           </div>
        </div>
        <div className="flex items-center gap-3">
           <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full border border-slate-200">
              <Database className="size-3 text-slate-500" />
              <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest leading-none">Clinical Dataset v5.1</span>
           </div>
           <Button 
            variant="outline" 
            size="sm" 
            className={cn("rounded-xl h-10 font-black uppercase text-[9px] tracking-widest transition-all", isVoiceActive ? "border-primary text-primary bg-primary/5" : "text-slate-400")}
            onClick={() => setIsVoiceActive(!isVoiceActive)}
           >
             {isVoiceActive ? <Volume2 className="size-4 mr-2" /> : <VolumeX className="size-4 mr-2" />}
             Voice {isVoiceActive ? 'On' : 'Off'}
           </Button>
        </div>
      </header>

      <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
        <div className="space-y-10 max-w-4xl mx-auto py-6">
          {messages.map((message) => (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              key={message.id}
              className={cn(
                'flex items-start gap-5',
                message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
              )}
            >
              <Avatar className="h-12 w-12 border-2 border-white shadow-xl shrink-0">
                {message.sender === 'ai' ? (
                  <AvatarFallback className="bg-slate-900 text-white font-black text-sm">CO</AvatarFallback>
                ) : (
                  <>
                    <AvatarImage src={user?.photoURL || placeholderImages.find(i => i.id === 'user-avatar-1')?.imageUrl} />
                    <AvatarFallback className="bg-primary text-white font-black uppercase">
                      {user?.displayName?.substring(0,1) || 'U'}
                    </AvatarFallback>
                  </>
                )}
              </Avatar>
              <div className="flex flex-col gap-3 max-w-[85%]">
                {message.structured ? (
                  <div className="space-y-6">
                    <div className="rounded-[2.5rem] p-8 shadow-2xl bg-white border-2 border-slate-100 rounded-tl-none relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                         <ShieldCheck className="size-24" />
                      </div>
                      <div className="space-y-6 relative z-10">
                        <div className="space-y-2">
                           <div className="text-[10px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2">
                             <Bot className="size-3" /> Health Insight
                           </div>
                           <p className="text-lg font-medium text-slate-700 leading-relaxed italic">"{message.structured.insight}"</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-50">
                           <div className="space-y-3">
                              <div className="text-[9px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-2">
                                <Sparkles className="size-3" /> Recommendations
                              </div>
                              <ul className="space-y-2">
                                 {message.structured.recommendations.map((r, i) => (
                                   <li key={i} className="text-xs font-bold text-slate-600 flex gap-2">
                                      <div className="size-1.5 bg-emerald-500 rounded-full mt-1.5 shrink-0" /> {r}
                                   </li>
                                 ))}
                              </ul>
                           </div>
                           <div className="space-y-3">
                              <div className="text-[9px] font-black uppercase tracking-widest text-blue-600 flex items-center gap-2">
                                <Apple className="size-3" /> Lifestyle
                              </div>
                              <ul className="space-y-2">
                                 {message.structured.lifestyleSuggestions.map((s, i) => (
                                   <li key={i} className="text-xs font-bold text-slate-600 flex gap-2">
                                      <div className="size-1.5 bg-blue-500 rounded-full mt-1.5 shrink-0" /> {s}
                                   </li>
                                 ))}
                              </ul>
                           </div>
                        </div>

                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                           <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                             <Activity className="size-3" /> Next Steps
                           </div>
                           <div className="flex flex-wrap gap-2">
                              {message.structured.followUpActions.map((a, i) => (
                                <Badge key={i} variant="outline" className="bg-white text-[9px] font-black uppercase tracking-tighter py-1 px-3 border-slate-200">{a}</Badge>
                              ))}
                           </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-destructive/5 border border-destructive/10 p-4 rounded-2xl flex items-start gap-3">
                       <Info className="size-4 text-destructive shrink-0 mt-0.5" />
                       <p className="text-[9px] font-bold text-destructive/80 leading-relaxed uppercase tracking-tight">
                         Educational guidance only. Does not replace professional medical advice or treatment.
                       </p>
                    </div>
                  </div>
                ) : (
                  <div
                    className={cn(
                      'rounded-[2rem] p-6 shadow-xl text-base leading-relaxed border-2 relative overflow-hidden',
                      message.sender === 'user'
                        ? 'bg-primary text-primary-foreground border-primary rounded-tr-none'
                        : 'bg-white border-slate-100 rounded-tl-none font-medium text-slate-700 shadow-slate-200/50'
                    )}
                  >
                    {message.sender === 'ai' && (
                      <div className="absolute top-0 right-0 p-2 opacity-5">
                        <ShieldCheck className="size-12" />
                      </div>
                    )}
                    {message.text}
                  </div>
                )}
                
                {message.audioUrl && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="self-start h-8 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-all bg-white shadow-sm border border-slate-100"
                    onClick={() => playAudio(message.audioUrl!)}
                  >
                    <Volume2 className="size-3 mr-2" /> Replay Response
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
          {isLoading && (
             <div className="flex items-start gap-5">
                <Avatar className="h-12 w-12 border-2 border-white shadow-xl shrink-0">
                   <AvatarFallback className="bg-slate-900 text-white font-black text-sm animate-pulse">...</AvatarFallback>
                </Avatar>
                <div className="bg-white border-2 border-slate-100 rounded-[2.5rem] p-8 rounded-tl-none shadow-2xl flex flex-col gap-5 min-w-[300px]">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                           <Loader2 className="h-5 w-5 animate-spin text-primary" />
                           <span className="text-sm font-black uppercase tracking-widest text-slate-400">Synthesizing Context...</span>
                        </div>
                        <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest animate-pulse border-emerald-500/20 text-emerald-500">RAG Active</Badge>
                    </div>
                    <div className="space-y-2">
                       <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="h-full bg-primary/30 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                          />
                       </div>
                       <div className="flex justify-between">
                          <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Polling Medical Registry</span>
                          <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Applying Personalized Filter</span>
                       </div>
                    </div>
                </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-8 bg-white border-t border-slate-100 shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
        <form onSubmit={handleSubmit} className="flex items-center gap-4 max-w-4xl mx-auto relative group">
          <div className="absolute inset-0 bg-primary/5 rounded-[2rem] scale-105 opacity-0 group-focus-within:opacity-100 transition-all duration-500" />
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Copilot about lifestyle, diet, or reports..."
            className="flex-1 rounded-[2rem] h-14 px-10 border-2 border-slate-100 focus-visible:ring-primary/20 text-lg font-medium bg-white relative z-10 transition-all"
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            size="icon" 
            className="h-14 w-14 rounded-[1.5rem] shadow-2xl shadow-primary/20 bg-primary hover:scale-105 active:scale-95 transition-all relative z-10" 
            disabled={isLoading || !input.trim()}
          >
            <Send className="h-6 w-6" />
          </Button>
        </form>
        <div className="flex items-center justify-center gap-6 mt-6">
           <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 flex items-center gap-2">
              <Sparkles className="size-3 text-primary/40" /> RAG Grounded Intelligence
           </div>
           <span className="text-slate-200">|</span>
           <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 flex items-center gap-2">
              <ShieldCheck className="size-3 text-emerald-500/40" /> Personalized Context Active
           </div>
        </div>
      </div>
    </motion.div>
  );
}
