
"use client";

import { useState, useRef, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Bot, Loader2, Send } from 'lucide-react';
import { answerMedicationQuestions } from '@/ai/flows/answer-medication-questions';
import { placeholderImages } from '@/lib/placeholder-images';
import { useCollection, useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
}

export function ChatClient() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! I'm your AI Medication Assistant. How can I help you with your health today?",
      sender: 'ai',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Fetch real medication list for context
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
      });
      const aiMessage: Message = {
        id: Date.now() + 1,
        text: result.answer,
        sender: 'ai',
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: Date.now() + 1,
        text: 'Sorry, I encountered an error. Please try again.',
        sender: 'ai',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] bg-muted/40">
      <header className="p-4 border-b bg-background shadow-sm">
        <h1 className="text-xl font-semibold font-headline flex items-center gap-2">
          <Bot className="text-primary" />
          Medication Chat Assistant
        </h1>
      </header>
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-6 max-w-4xl mx-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex items-start gap-3',
                message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
              )}
            >
              <Avatar className="h-8 w-8 border shrink-0">
                {message.sender === 'ai' ? (
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot className='h-5 w-5' />
                  </AvatarFallback>
                ) : (
                  <>
                    <AvatarImage src={user?.photoURL || placeholderImages.find(i => i.id === 'user-avatar-1')?.imageUrl} />
                    <AvatarFallback className="bg-accent text-accent-foreground text-[10px]">
                      {user?.displayName?.substring(0,2) || 'U'}
                    </AvatarFallback>
                  </>
                )}
              </Avatar>
              <div
                className={cn(
                  'max-w-[80%] rounded-2xl p-4 shadow-sm text-sm leading-relaxed',
                  message.sender === 'user'
                    ? 'bg-primary text-primary-foreground rounded-tr-none'
                    : 'bg-card border rounded-tl-none'
                )}
              >
                {message.text}
              </div>
            </div>
          ))}
          {isLoading && (
             <div className="flex items-start gap-3 justify-start">
                <Avatar className="h-8 w-8 border shrink-0">
                   <AvatarFallback className="bg-primary text-primary-foreground">
                        <Bot className='h-5 w-5' />
                    </AvatarFallback>
                </Avatar>
                <div className="bg-card border rounded-2xl p-4 rounded-tl-none shadow-sm">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="p-4 border-t bg-background">
        <form onSubmit={handleSubmit} className="flex items-center gap-2 max-w-4xl mx-auto">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your meds, dosage, or side effects..."
            className="flex-1 rounded-full h-12 px-6"
            disabled={isLoading}
            suppressHydrationWarning
          />
          <Button type="submit" size="icon" className="h-12 w-12 rounded-full" disabled={isLoading || !input.trim()} suppressHydrationWarning>
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
