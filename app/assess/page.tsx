'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { AppHeader, MobileNav } from '@/components/nav';
import { Card, Badge, Alert, LoadingState } from '@/components/ui';
import { Plan, LogoMark, ArrowRight, Trash } from '@/components/icons';

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

interface StoredChat {
  messages: Message[];
  result: AssessmentResult | null;
}

const INITIAL_MESSAGE: Message = {
  role: 'assistant',
  content:
    "Hi! I'm here to help you build your personalized nutrition plan. Let's start with the basics — what's your main goal? For example: lose weight, gain muscle, or just eat healthier.",
};

const STORAGE_PREFIX = 'nutrical:assess:chat:v1';
const MAX_STORED_MESSAGES = 60;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isStoredMessage(value: unknown): value is Message {
  return (
    isRecord(value) &&
    (value.role === 'user' || value.role === 'assistant') &&
    typeof value.content === 'string'
  );
}

function isStoredResult(value: unknown): value is AssessmentResult {
  if (!isRecord(value)) return false;
  if (value.type !== 'question' && value.type !== 'summary') return false;
  if (typeof value.message !== 'string') return false;

  if (value.collected !== null) {
    if (!isRecord(value.collected)) return false;
  }

  if (value.goals !== null) {
    if (!isRecord(value.goals)) return false;
    for (const key of ['calories', 'protein', 'carbs', 'fats']) {
      if (typeof value.goals[key] !== 'number') return false;
    }
  }

  return true;
}

function loadStoredChat(key: string): StoredChat | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return null;
    if (!Array.isArray(parsed.messages)) return null;

    const messages = parsed.messages.filter(isStoredMessage);
    if (messages.length === 0) return null;

    const result =
      parsed.result === null || isStoredResult(parsed.result)
        ? (parsed.result as AssessmentResult | null)
        : null;

    return { messages: messages.slice(-MAX_STORED_MESSAGES), result };
  } catch {
    return null;
  }
}

export default function AssessPage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<{ id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [error, setError] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const storageKey = user ? `${STORAGE_PREFIX}:${user.id}` : null;

  // Auth check + restore the saved conversation
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

      const saved = loadStoredChat(`${STORAGE_PREFIX}:${user.id}`);
      if (saved) {
        setMessages(saved.messages);
        setResult(saved.result);
      } else {
        setMessages([INITIAL_MESSAGE]);
      }

      setHydrated(true);
      setLoading(false);
    };

    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist the conversation (and the generated plan card) for this user.
  useEffect(() => {
    if (!hydrated || !storageKey) return;
    try {
      const payload: StoredChat = {
        messages: messages.slice(-MAX_STORED_MESSAGES),
        result,
      };
      window.localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch {
      // Storage full or blocked — the chat still works in memory.
    }
  }, [messages, result, hydrated, storageKey]);

  // Auto-scroll to bottom inside the chat container
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping, result]);

  // Grow the composer with its content, up to a comfortable maximum.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, [input]);

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
    setError('');
    setMessages([
      {
        role: 'assistant',
        content:
          "No problem! Let's start over. What's your main goal? For example: lose weight, gain muscle, or just eat healthier.",
      },
    ]);
  };

  const handleClearChat = () => {
    setResult(null);
    setError('');
    setMessages([INITIAL_MESSAGE]);

    if (storageKey) {
      try {
        window.localStorage.removeItem(storageKey);
      } catch {
        // Ignore storage failures; the in-memory chat is already reset.
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return <LoadingState label="Loading assessment..." />;
  }

  const isComplete = result?.type === 'summary';

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-paper font-sans text-ink antialiased">
      <AppHeader active="assess" onSignOut={handleLogout} />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col overflow-hidden px-3 pb-[calc(74px+env(safe-area-inset-bottom))] pt-4 sm:px-6 md:pb-6">
        {/* Chat header */}
        <div className="anim-rise flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-ink text-white shadow-lift">
              <Plan className="h-5 w-5" />
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-paper bg-leaf" />
            </span>
            <div className="min-w-0">
              <p className="eyebrow text-faint">Guided setup</p>
              <h1 className="display text-[22px] leading-tight sm:text-[26px]">Build my nutrition plan</h1>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClearChat}
            disabled={messages.length <= 1 && !isTyping}
            title="Clear this conversation"
            aria-label="Clear chat"
            className="pressable flex shrink-0 items-center gap-1.5 rounded-pill border border-line bg-surface px-3 py-2 text-[12px] font-semibold text-muted shadow-card transition hover:border-ember/40 hover:text-ember disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Trash className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Clear chat</span>
          </button>
        </div>

        {/* Chat panel */}
        <div
          className="anim-rise mt-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[22px] border border-line bg-surface-soft/40 shadow-card"
          style={{ '--d': '60ms' } as React.CSSProperties}
        >
          {/* Messages */}
          <div
            ref={scrollRef}
            className="thin-scroll flex-1 space-y-4 overflow-y-auto px-3 py-5 sm:px-5"
            aria-live="polite"
            aria-label="Conversation"
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`anim-row-in flex items-end gap-2.5 ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role === 'assistant' && (
                  <span className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink/[0.06] text-ink-soft ring-1 ring-ink/10">
                    <LogoMark className="h-4 w-4" />
                  </span>
                )}

                <div
                  className={`max-w-[80%] px-4 py-3 text-[14.5px] leading-relaxed ${
                    msg.role === 'user'
                      ? 'rounded-2xl rounded-br-md bg-gradient-to-br from-brand to-brand-deep text-white shadow-lift'
                      : 'rounded-2xl rounded-bl-md border border-line-soft bg-surface text-ink-soft shadow-card'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-end gap-2.5">
                <span className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink/[0.06] text-ink-soft ring-1 ring-ink/10">
                  <LogoMark className="h-4 w-4" />
                </span>
                <div className="rounded-2xl rounded-bl-md border border-line-soft bg-surface px-4 py-3.5 shadow-card">
                  <div className="flex items-center gap-1.5" aria-label="Thinking">
                    <span className="typing-dot h-1.5 w-1.5 rounded-full bg-faint" />
                    <span
                      className="typing-dot h-1.5 w-1.5 rounded-full bg-faint"
                      style={{ animationDelay: '0.15s' }}
                    />
                    <span
                      className="typing-dot h-1.5 w-1.5 rounded-full bg-faint"
                      style={{ animationDelay: '0.3s' }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Summary */}
            {result?.type === 'summary' && result.goals && (
              <div className="anim-pop flex justify-start md:ml-[42px]">
                <Card className="w-full overflow-hidden rounded-2xl p-5 sm:p-6">
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
                    <button
                      type="button"
                      onClick={handleUseGoals}
                      disabled={saving}
                      className="pressable rounded-pill bg-brand px-4 py-2.5 text-[13px] font-semibold text-white shadow-card transition hover:bg-brand-deep disabled:opacity-60"
                    >
                      {saving ? 'Saving…' : 'Use these goals'}
                    </button>
                    <button
                      type="button"
                      onClick={handleEditInfo}
                      disabled={saving}
                      className="pressable rounded-pill border border-line bg-surface px-4 py-2.5 text-[13px] font-semibold text-ink-soft transition hover:border-muted disabled:opacity-60"
                    >
                      Edit information
                    </button>
                  </div>
                </Card>
              </div>
            )}
          </div>

          {error && (
            <div className="px-3 pb-2 sm:px-4">
              <Alert tone="danger">{error}</Alert>
            </div>
          )}

          {/* Composer */}
          <div className="border-t border-line bg-surface px-3 py-3 sm:px-4">
            <div className="flex items-end gap-2 rounded-2xl border border-line bg-paper p-1.5 transition focus-within:border-brand/50 focus-within:ring-2 focus-within:ring-brand/15">
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  isComplete ? 'Your plan is ready above' : 'Type your answer…'
                }
                disabled={isTyping || isComplete}
                aria-label="Type your answer"
                className="thin-scroll max-h-32 min-h-[40px] flex-1 resize-none bg-transparent px-2.5 py-2 text-[15px] leading-relaxed text-ink outline-none placeholder:text-faint disabled:opacity-60"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={isTyping || !input.trim() || isComplete}
                aria-label="Send answer"
                className="pressable flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-white shadow-card transition hover:bg-brand-deep disabled:cursor-not-allowed disabled:bg-line disabled:text-faint disabled:shadow-none"
              >
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-2 text-center text-[11px] leading-relaxed text-faint">
              NutriCal provides general nutrition guidance and estimates. It is
              not a substitute for professional medical advice.
            </p>
          </div>
        </div>
      </main>

      <MobileNav active="assess" />
    </div>
  );
}
