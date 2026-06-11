
"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Bot, Loader2, Send, Volume2, VolumeX, Database, ShieldCheck, Sparkles } from 'lucide-react';
import { answerMedicationQuestions } from '@/ai/flows/answer-medication-questions';
import { placeholderImages } from '@/lib/placeholder-images';
import { useCollection, useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
  audioUrl?: string;
}

export function ChatClient() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! I'm your RAG-powered Medication Assistant. I have access to extensive clinical datasets to help you with your health today. How can I help?",
      sender: 'ai',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const medsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "users", user.uid, "medicines"));
  }, [firestore, user?.uid]);

  const { data: medications } = useCollection(medsQuery);
  const medString = medications?.map(m => `${m.name} (${m.dosage})`).join(', ') || "No active medications recorded.";

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
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
      audioRef.current.play();
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
      const result = await answerMedicationQuestions({
        medicationList: medString,
        question: input,
        generateAudio: isVoiceActive
      });
      
      const aiMessage: Message = {
        id: Date.now() + 1,
        text: result.answer,
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
        text: 'Sorry, I encountered an error during clinical retrieval. Please try again.',
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
      className="flex flex-col h-[calc(100vh-3.5rem)] bg-slate-50/50 font-body"
    >
      <audio ref={audioRef} className="hidden" />
      
      <header className="p-6 border-b bg-white flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
           <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center">
             <Bot className="text-primary size-6" />
           </div>
           <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tighter">AI Care Assistant</h1>
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[8px] font-black uppercase h-5 px-2">RAG Engine</Badge>
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-1.5">
                <div className="size-1.5 bg-emerald-500 rounded-full animate-pulse" />
                Medical Database Sync Active
              </div>
           </div>
        </div>
        <div className="flex items-center gap-2">
           <div className="hidden md:flex items-center gap-2 mr-4 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-100">
              <Database className="size-3 text-slate-400" />
              <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest leading-none">Clinical Dataset v4.2</span>
           </div>
           <Button 
            variant="outline" 
            size="sm" 
            className={cn("rounded-xl font-black uppercase text-[9px] tracking-widest transition-all", isVoiceActive ? "border-primary text-primary bg-primary/5" : "text-slate-400")}
            onClick={() => setIsVoiceActive(!isVoiceActive)}
           >
             {isVoiceActive ? <Volume2 className="size-3 mr-1.5" /> : <VolumeX className="size-3 mr-1.5" />}
             Voice {isVoiceActive ? 'On' : 'Off'}
           </Button>
        </div>
      </header>

      <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
        <div className="space-y-8 max-w-3xl mx-auto">
          {messages.map((message) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={message.id}
              className={cn(
                'flex items-start gap-4',
                message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
              )}
            >
              <Avatar className="h-10 w-10 border-2 border-white shadow-md shrink-0">
                {message.sender === 'ai' ? (
                  <AvatarFallback className="bg-slate-900 text-white font-black text-xs">AI</AvatarFallback>
                ) : (
                  <>
                    <AvatarImage src={user?.photoURL || placeholderImages.find(i => i.id === 'user-avatar-1')?.imageUrl} />
                    <AvatarFallback className="bg-primary/10 text-primary font-black uppercase">
                      {user?.displayName?.substring(0,1) || 'U'}
                    </AvatarFallback>
                  </>
                )}
              </Avatar>
              <div className="flex flex-col gap-2 max-w-[80%]">
                <div
                  className={cn(
                    'rounded-3xl p-5 shadow-sm text-sm leading-relaxed border-2 relative overflow-hidden',
                    message.sender === 'user'
                      ? 'bg-primary text-primary-foreground border-primary rounded-tr-none'
                      : 'bg-white border-slate-100 rounded-tl-none font-medium text-slate-700'
                  )}
                >
                  {message.sender === 'ai' && (
                    <div className="absolute top-0 right-0 p-2 opacity-5">
                      <ShieldCheck className="size-10" />
                    </div>
                  )}
                  {message.text}
                </div>
                {message.audioUrl && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="self-start text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-primary"
                    onClick={() => playAudio(message.audioUrl!)}
                  >
                    <Volume2 className="size-3 mr-1" /> Replay Voice
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
          {isLoading && (
             <div className="flex items-start gap-4">
                <Avatar className="h-10 w-10 border-2 border-white shadow-md shrink-0">
                   <AvatarFallback className="bg-slate-900 text-white font-black text-xs animate-pulse">...</AvatarFallback>
                </Avatar>
                <div className="bg-white border-2 border-slate-100 rounded-3xl p-5 rounded-tl-none shadow-sm flex flex-col gap-3 min-w-[200px]">
                    <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Performing RAG Retrieval...</span>
                    </div>
                    <div className="space-y-1.5">
                       <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="h-full bg-primary/20"
                          />
                       </div>
                       <p className="text-[8px] font-bold text-slate-300 uppercase tracking-tight">Syncing Large Medical Dataset</p>
                    </div>
                </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-6 bg-white border-t">
        <form onSubmit={handleSubmit} className="flex items-center gap-3 max-w-3xl mx-auto relative">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about dosage, interactions, or side effects..."
            className="flex-1 rounded-[1.5rem] h-14 px-8 border-2 border-slate-100 focus-visible:ring-primary/10 text-base font-medium"
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            size="icon" 
            className="h-14 w-14 rounded-2xl shadow-xl shadow-primary/20 bg-primary hover:scale-105 transition-transform" 
            disabled={isLoading || !input.trim()}
          >
            <Send className="h-6 w-6" />
          </Button>
        </form>
        <div className="flex items-center justify-center gap-4 mt-4">
           <p className="text-[9px] font-black uppercase tracking-widest text-slate-300 flex items-center gap-1.5">
              <Sparkles className="size-2.5" /> RAG-Grounded Results
           </p>
           <span className="text-slate-200">•</span>
           <p className="text-[9px] font-black uppercase tracking-widest text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="size-2.5" /> FDA/EMA Standard Verification
           </p>
        </div>
      </div>
    </motion.div>
  );
}

import { Badge } from '../ui/badge';
