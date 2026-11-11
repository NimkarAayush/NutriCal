'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { AppHeader, MobileNav } from '@/components/nav';
import { Badge, Alert, LoadingState } from '@/components/ui';
import { Chat, LogoMark, ArrowRight, Trash, Spark } from '@/components/icons';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  action?: {
    type: 'log_meal' | 'change_goals';
    data: {
      meal_name?: string;
      calories?: number;
      protein?: number;
      carbs?: number;
      fats?: number;
      calorie_target?: number;
      protein_target?: number;
      carbs_target?: number;
      fats_target?: number;
    };
    message: string;
  };
}

const QUICK_ACTIONS = [
  'What should I eat?',
  "Analyze today's nutrition",
  'Suggest a post-workout meal',
  'Why do I need more protein?',
];

const GREETING: Message = {
  role: 'assistant',
  content:
    "Hi! I'm your NutriCal coach. I can see your nutrition data and goals. How can I help you today?",
};

const STORAGE_PREFIX = 'nutrical:coach:chat:v1';
const MAX_STORED_MESSAGES = 60;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isStoredMessage(value: unknown): value is Message {
  if (!isRecord(value)) return false;
  if (value.role !== 'user' && value.role !== 'assistant') return false;
  if (typeof value.content !== 'string') return false;

  if (value.action !== undefined) {
    const action = value.action;
    if (!isRecord(action)) return false;
    if (action.type !== 'log_meal' && action.type !== 'change_goals') {
      return false;
    }
    if (typeof action.message !== 'string') return false;
    if (!isRecord(action.data)) return false;
  }

  return true;
}

function loadStoredMessages(key: string): Message[] | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;

    const valid = parsed.filter(isStoredMessage);
    return valid.length > 0 ? valid.slice(-MAX_STORED_MESSAGES) : null;
  } catch {
    return null;
  }
}

export default function CoachPage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState('');
  const [insight, setInsight] = useState('');
  const [pendingAction, setPendingAction] = useState<Message['action'] | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const storageKey = user ? `${STORAGE_PREFIX}:${user.id}` : null;

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);

      // Load today's data for insight
      const today = new Date().toISOString().split('T')[0];
      const [{ data: goals }, { data: meals }] = await Promise.all([
        supabase.from('nutrition_goals').select('*').eq('user_id', user.id).single(),
        supabase
          .from('meal_logs')
          .select('*')
          .eq('user_id', user.id)
          .eq('logged_date', today),
      ]);

      const totals = (meals || []).reduce(
        (acc, m) => ({
          calories: acc.calories + (Number(m.calories) || 0),
          protein: acc.protein + (Number(m.protein) || 0),
        }),
        { calories: 0, protein: 0 }
      );

      if (goals) {
        const proteinRemaining = Number(goals.protein_target) - totals.protein;
        if (proteinRemaining > 0) {
          setInsight(
            `You are ${Math.round(proteinRemaining)}g away from your protein target today. Consider adding a protein-rich snack to your evening meal.`
          );
        } else {
          setInsight(
            `Great job! You have hit your protein target for today. Keep up the consistent nutrition.`
          );
        }
      }

      // Restore the saved conversation for this user, if any.
      const saved = loadStoredMessages(`${STORAGE_PREFIX}:${user.id}`);
      setMessages(saved ?? [GREETING]);
      setHydrated(true);
      setLoading(false);
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist the conversation whenever it changes (after hydration, so we
  // never overwrite a stored chat with the initial empty state).
  useEffect(() => {
    if (!hydrated || !storageKey) return;
    try {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify(messages.slice(-MAX_STORED_MESSAGES))
      );
    } catch {
      // Storage full or blocked — the chat still works in memory.
    }
  }, [messages, hydrated, storageKey]);

  // Keep the newest message in view inside the scrollable chat area.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  // Grow the composer with its content, up to a comfortable maximum.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, [input]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;

    const userMsg: Message = { role: 'user', content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);
    setError('');
    setPendingAction(null);

    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim(), history: messages }),
      });

      const data = await res.json();
      if (res.ok) {
        const assistantMsg: Message = {
          role: 'assistant',
          content: data.response || data.action?.message || 'Done',
          action: data.action,
        };
        setMessages([...newMessages, assistantMsg]);

        // If there's an action, show confirmation
        if (data.action) {
          setPendingAction(data.action);
        }
      } else {
        setError(data.error || 'Failed to get response');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to get response');
    } finally {
      setIsTyping(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!pendingAction) return;
    setActionLoading(true);
    setError('');

    try {
      const res = await fetch('/api/coach/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: pendingAction.type,
          data: pendingAction.data,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: data.message || 'Action completed successfully',
          },
        ]);
        setPendingAction(null);
      } else {
        setError(data.error || 'Failed to execute action');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to execute action');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelAction = () => {
    setPendingAction(null);
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: 'No problem. I have cancelled that action. Let me know if you need anything else.',
      },
    ]);
  };

  const handleClearChat = () => {
    setPendingAction(null);
    setError('');
    setMessages([GREETING]);

    if (storageKey) {
      try {
        window.localStorage.removeItem(storageKey);
      } catch {
        // Ignore storage failures; the in-memory chat is already reset.
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return <LoadingState label="Loading coach..." />;
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-paper font-sans text-ink antialiased">
      <AppHeader active="coach" onSignOut={handleLogout} />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col overflow-hidden px-3 pb-[calc(74px+env(safe-area-inset-bottom))] pt-4 sm:px-6 md:pb-6">
        {/* Chat header */}
        <div className="anim-rise flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand text-white shadow-lift">
              <Chat className="h-5 w-5" />
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-paper bg-leaf" />
            </span>
            <div className="min-w-0">
              <p className="eyebrow text-faint">Personalized guidance</p>
              <h1 className="display truncate text-[24px] sm:text-[26px]">Your AI coach</h1>
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
          {/* Today's insight */}
          {insight && (
            <div className="flex items-start gap-2.5 border-b border-line-soft bg-brand-mist px-4 py-3">
              <Spark className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              <p className="text-[12.5px] leading-relaxed text-brand-ink">
                <span className="font-semibold text-brand-deep">
                  Today&apos;s insight —{' '}
                </span>
                {insight}
              </p>
            </div>
          )}

          {/* Quick actions */}
          <div className="border-b border-line-soft px-3 py-2.5 sm:px-4">
            <div className="thin-scroll flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none]">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action}
                  onClick={() => sendMessage(action)}
                  disabled={isTyping}
                  className="pressable shrink-0 rounded-pill border border-line bg-surface px-3.5 py-1.5 text-[12.5px] font-semibold text-ink-soft shadow-card transition hover:border-brand/40 hover:text-ink disabled:opacity-50"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="thin-scroll flex-1 space-y-4 overflow-y-auto px-3 py-5 sm:px-5"
            aria-live="polite"
            aria-label="Conversation"
          >
            {messages.map((msg, idx) => (
              <div key={idx} className="anim-row-in">
                <div
                  className={`flex items-end gap-2.5 ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.role === 'assistant' && (
                    <span className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-deep ring-1 ring-brand/10">
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

                {/* Action confirmation */}
                {msg.action && pendingAction?.type === msg.action.type && (
                  <div className="anim-pop mt-3 flex justify-start md:ml-[42px]">
                    <div className="max-w-[80%] rounded-2xl border border-ember/30 bg-ember-soft/50 p-4 shadow-card">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <span className="eyebrow text-ember">Confirm action</span>
                        <Badge tone="ember">Review first</Badge>
                      </div>

                      {msg.action.type === 'log_meal' && (
                        <div className="mb-3">
                          <p className="mb-2 text-sm text-ink-soft">
                            {msg.action.message}
                          </p>
                          <div className="rounded-control border border-line bg-surface px-3.5 py-3">
                            <p className="text-sm font-semibold">
                              {msg.action.data.meal_name}
                            </p>
                            <p className="nums mt-1 text-[13px] text-muted">
                              {msg.action.data.calories} kcal · P:{' '}
                              {msg.action.data.protein}g · C:{' '}
                              {msg.action.data.carbs}g · F:{' '}
                              {msg.action.data.fats}g
                            </p>
                          </div>
                        </div>
                      )}

                      {msg.action.type === 'change_goals' && (
                        <div className="mb-3">
                          <p className="mb-2 text-sm text-ink-soft">
                            {msg.action.message}
                          </p>
                          <dl className="grid grid-cols-2 gap-2 rounded-control border border-line bg-surface p-3.5 text-sm">
                            <div>
                              <dt className="text-xs text-faint">Calories</dt>
                              <dd className="nums font-semibold">
                                {msg.action.data.calorie_target} kcal
                              </dd>
                            </div>
                            <div>
                              <dt className="text-xs text-faint">Protein</dt>
                              <dd className="nums font-semibold">
                                {msg.action.data.protein_target}g
                              </dd>
                            </div>
                            <div>
                              <dt className="text-xs text-faint">Carbs</dt>
                              <dd className="nums font-semibold">
                                {msg.action.data.carbs_target}g
                              </dd>
                            </div>
                            <div>
                              <dt className="text-xs text-faint">Fats</dt>
                              <dd className="nums font-semibold">
                                {msg.action.data.fats_target}g
                              </dd>
                            </div>
                          </dl>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleConfirmAction}
                          disabled={actionLoading}
                          className="pressable rounded-pill bg-brand px-3.5 py-2 text-[13px] font-semibold text-white shadow-card transition hover:bg-brand-deep disabled:opacity-60"
                        >
                          {actionLoading ? 'Saving…' : 'Confirm'}
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelAction}
                          disabled={actionLoading}
                          className="pressable rounded-pill border border-line bg-surface px-3.5 py-2 text-[13px] font-semibold text-ink-soft transition hover:border-muted disabled:opacity-60"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-end gap-2.5">
                <span className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-deep ring-1 ring-brand/10">
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
                placeholder="Ask about your nutrition…"
                disabled={isTyping}
                aria-label="Ask about your nutrition"
                className="thin-scroll max-h-32 min-h-[40px] flex-1 resize-none bg-transparent px-2.5 py-2 text-[15px] leading-relaxed text-ink outline-none placeholder:text-faint disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => sendMessage(input)}
                disabled={isTyping || !input.trim()}
                aria-label="Send message"
                className="pressable flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-white shadow-card transition hover:bg-brand-deep disabled:cursor-not-allowed disabled:bg-line disabled:text-faint disabled:shadow-none"
              >
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-2 text-center text-[11px] leading-relaxed text-faint">
              NutriCal provides general nutrition guidance and estimates and is
              not a substitute for professional medical advice.
            </p>
          </div>
        </div>
      </main>

      <MobileNav active="coach" />
    </div>
  );
}
