'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { AppHeader, MobileNav } from '@/components/nav';
import {
  Button,
  Card,
  Badge,
  Alert,
  LoadingState,
} from '@/components/ui';
import { Plan, ArrowLeft } from '@/components/icons';

// --- TYPES ---
interface Message {
  role: 'assistant' | 'user';
  content: string;
}

interface AssessmentResult {
  type: 'question' | 'summary';
  message: string;
  collected: {
    primary_goal?: string;
    age?: number;
    height_cm?: number;
    weight_kg?: number;
    activity_level?: string;
    diet_type?: string;
    meals_per_day?: number;
    foods_to_avoid?: string;
  } | null;
  goals: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  } | null;
}

export default function AssessPage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<{ id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auth check
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);
      setLoading(false);

      // Start the assessment with an initial message
      const initialMessage: Message = {
        role: 'assistant',
        content:
          "Hi! I'm here to help you build your personalized nutrition plan. Let's start with the basics — what's your main goal? For example: lose weight, gain muscle, or just eat healthier.",
      };
      setMessages([initialMessage]);
    };

    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);
    setError('');

    try {
      const res = await fetch('/api/assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await res.json();
      if (res.ok) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.message,
        };
        setMessages([...newMessages, assistantMessage]);
        setResult(data);
      } else {
        setError(data.error || 'Failed to get response');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to get response');
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleUseGoals = async () => {
    if (!user || !result?.goals) return;
    setSaving(true);

    try {
      const { error } = await supabase.from('nutrition_goals').upsert(
        {
          user_id: user.id,
          calorie_target: result.goals.calories,
          protein_target: result.goals.protein,
          carbs_target: result.goals.carbs,
          fats_target: result.goals.fats,
          goal_type: 'calculated',
          source: 'calculated',
        },
        { onConflict: 'user_id' }
      );

      if (error) throw error;

      // Also update profile with collected data
      if (result.collected) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert(
            {
              user_id: user.id,
              primary_goal: result.collected.primary_goal || null,
              age: result.collected.age || null,
              height_cm: result.collected.height_cm || null,
              weight_kg: result.collected.weight_kg || null,
              activity_level: result.collected.activity_level || null,
              diet_type: result.collected.diet_type || null,
              meals_per_day: result.collected.meals_per_day || null,
              foods_to_avoid: result.collected.foods_to_avoid || null,
            },
            { onConflict: 'user_id' }
          );
        if (profileError) console.error('Profile update error:', profileError);
      }

      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save goals');
    } finally {
      setSaving(false);
    }
  };

  const handleEditInfo = () => {
    // Reset the conversation to start over
    setResult(null);
    setMessages([
      {
        role: 'assistant',
        content:
          "No problem! Let's start over. What's your main goal? For example: lose weight, gain muscle, or just eat healthier.",
      },
    ]);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return <LoadingState label="Loading assessment..." />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-paper font-sans text-ink antialiased">
      <AppHeader active="assess" onSignOut={handleLogout} />

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pb-28 pt-6 sm:px-6 md:pb-10">
        <div className="anim-rise mb-5 flex items-center gap-3.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-panel bg-ink text-white">
            <Plan className="h-5 w-5" />
          </span>
          <div>
            <p className="eyebrow text-faint">Guided setup</p>
            <h1 className="display text-[26px]">Build my nutrition plan</h1>
          </div>
        </div>

        {/* Conversation */}
        <div className="thin-scroll flex-1 space-y-3 overflow-y-auto pb-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`anim-row-in flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[86%] px-4 py-3 text-[14.5px] leading-relaxed ${
                  msg.role === 'user'
                    ? 'rounded-[20px] rounded-br-md bg-brand text-white'
                    : 'rounded-[20px] rounded-bl-md border border-line bg-surface text-ink-soft shadow-card'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="rounded-[20px] rounded-bl-md border border-line bg-surface px-4 py-3.5 shadow-card">
                <div className="flex items-center gap-1.5" aria-label="Thinking">
                  <span className="typing-dot h-1.5 w-1.5 rounded-full bg-faint" />
                  <span className="typing-dot h-1.5 w-1.5 rounded-full bg-faint" style={{ animationDelay: '0.15s' }} />
                  <span className="typing-dot h-1.5 w-1.5 rounded-full bg-faint" style={{ animationDelay: '0.3s' }} />
                </div>
              </div>
            </div>
          )}

          {/* Summary */}
          {result?.type === 'summary' && result.goals && (
            <Card className="anim-pop mt-2 overflow-hidden p-6 sm:p-7">
              <div className="mb-1 flex items-center justify-between gap-2">
                <h2 className="display text-[22px]">Your nutrition profile</h2>
                <Badge tone="brand">Personalized</Badge>
              </div>
              <p className="text-[13px] text-muted">
                Starting targets based on our conversation.
              </p>

              {result.collected && (
                <div className="mt-4 rounded-panel bg-brand-mist px-4 py-3.5">
                  <p className="eyebrow mb-2 text-brand-deep">
                    What you told us
                  </p>
                  <ul className="flex flex-wrap gap-x-5 gap-y-1.5 text-[13px] text-brand-ink">
                    {result.collected.primary_goal && (
                      <li>
                        <span className="text-brand-deep/70">Goal — </span>
                        <span className="font-semibold">
                          {result.collected.primary_goal}
                        </span>
                      </li>
                    )}
                    {result.collected.activity_level && (
                      <li>
                        <span className="text-brand-deep/70">Activity — </span>
                        <span className="font-semibold">
                          {result.collected.activity_level}
                        </span>
                      </li>
                    )}
                    {result.collected.diet_type && (
                      <li>
                        <span className="text-brand-deep/70">Diet — </span>
                        <span className="font-semibold">
                          {result.collected.diet_type}
                        </span>
                      </li>
                    )}
                    {result.collected.meals_per_day != null && (
                      <li>
                        <span className="text-brand-deep/70">Meals — </span>
                        <span className="font-semibold">
                          {result.collected.meals_per_day}/day
                        </span>
                      </li>
                    )}
                  </ul>
                </div>
              )}

              <dl className="mt-4 grid grid-cols-2 gap-3">
                {[
                  { label: 'Daily energy', value: result.goals.calories.toLocaleString(), unit: 'kcal' },
                  { label: 'Protein', value: result.goals.protein, unit: 'g' },
                  { label: 'Carbohydrates', value: result.goals.carbs, unit: 'g' },
                  { label: 'Fats', value: result.goals.fats, unit: 'g' },
                ].map((g) => (
                  <div key={g.label} className="rounded-panel bg-paper px-4 py-3.5">
                    <dt className="eyebrow text-faint">{g.label}</dt>
                    <dd className="nums mt-1 text-2xl font-semibold tracking-tight">
                      {g.value}
                      <span className="ml-1 text-xs font-medium text-faint">{g.unit}</span>
                    </dd>
                  </div>
                ))}
              </dl>

              <p className="mt-4 text-xs leading-relaxed text-faint">
                Starting estimates — you can adjust them anytime in your
                dashboard.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button size="sm" loading={saving} onClick={handleUseGoals}>
                  Use these goals
                </Button>
                <Button variant="outline" size="sm" onClick={handleEditInfo}>
                  Edit information
                </Button>
              </div>
            </Card>
          )}

          <div ref={messagesEndRef} />
        </div>

        {error && (
          <div className="mb-3">
            <Alert tone="danger">{error}</Alert>
          </div>
        )}

        {/* Input */}
        <div className="sticky bottom-[72px] border-t border-line bg-paper pt-3 md:static md:bg-transparent">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your answer…"
              disabled={isTyping || result?.type === 'summary'}
              aria-label="Type your answer"
              className="flex-1 rounded-pill border border-line bg-surface px-5 py-3.5 text-[15px] text-ink placeholder:text-faint hover:border-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:opacity-50"
            />
            <Button
              onClick={handleSend}
              disabled={isTyping || !input.trim() || result?.type === 'summary'}
              className="h-[52px] w-[52px] !px-0"
              aria-label="Send answer"
            >
              <ArrowLeft className="h-5 w-5 rotate-180" />
            </Button>
          </div>
          <p className="mt-2 text-center text-[11px] leading-relaxed text-faint">
            NutriCal provides general nutrition guidance and estimates. It is
            not a substitute for professional medical advice.
          </p>
        </div>
      </main>

      <MobileNav active="assess" />
    </div>
  );
}
