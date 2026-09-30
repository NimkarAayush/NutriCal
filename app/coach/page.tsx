'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { AppHeader, MobileNav } from '@/components/nav';
import { Button, Badge, Alert, LoadingState } from '@/components/ui';
import { Chat, ArrowLeft } from '@/components/icons';

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

export default function CoachPage() {
  const router = useRouter();
  const supabase = createClient();

  const [, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState('');
  const [insight, setInsight] = useState('');
  const [pendingAction, setPendingAction] = useState<Message['action'] | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

      setMessages([
        {
          role: 'assistant',
          content:
            "Hi! I'm your NutriCal coach. I can see your nutrition data and goals. How can I help you today?",
        },
      ]);
      setLoading(false);
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
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
    <div className="flex min-h-screen flex-col bg-paper font-sans text-ink antialiased">
      <AppHeader active="coach" onSignOut={handleLogout} />

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pb-28 pt-6 sm:px-6 md:pb-10">
        <div className="anim-rise mb-5 flex items-center gap-3.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-panel bg-brand text-white">
            <Chat className="h-5 w-5" />
          </span>
          <div>
            <p className="eyebrow text-faint">Personalized guidance</p>
            <h1 className="display text-[26px]">Your AI coach</h1>
          </div>
        </div>

        {/* Today's insight */}
        {insight && (
          <div className="anim-rise mb-5 rounded-panel border border-brand/20 bg-brand-mist px-4 py-3.5" style={{ '--d': '60ms' } as React.CSSProperties}>
            <p className="eyebrow mb-1 text-brand-deep">Today&apos;s insight</p>
            <p className="text-sm leading-relaxed text-brand-ink">{insight}</p>
          </div>
        )}

        {/* Quick actions */}
        <div className="anim-rise mb-5" style={{ '--d': '100ms' } as React.CSSProperties}>
          <p className="eyebrow mb-2 text-faint">Quick actions</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action}
                onClick={() => sendMessage(action)}
                className="pressable rounded-pill border border-line bg-surface px-3.5 py-2 text-[13px] font-semibold text-ink-soft shadow-card transition hover:border-muted"
              >
                {action}
              </button>
            ))}
          </div>
        </div>

        {/* Chat */}
        <div className="thin-scroll flex-1 space-y-3 overflow-y-auto pb-4">
          {messages.map((msg, idx) => (
            <div key={idx} className="anim-row-in">
              <div
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
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

              {/* Action confirmation */}
              {msg.action && pendingAction?.type === msg.action.type && (
                <div className="anim-pop mt-2 flex justify-start">
                  <div className="max-w-[86%] rounded-panel border border-ember/30 bg-ember-soft/50 p-4">
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
                      <Button
                        size="sm"
                        loading={actionLoading}
                        onClick={handleConfirmAction}
                      >
                        Confirm
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={actionLoading}
                        onClick={handleCancelAction}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}
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
              placeholder="Ask about your nutrition…"
              disabled={isTyping}
              aria-label="Ask about your nutrition"
              className="flex-1 rounded-pill border border-line bg-surface px-5 py-3.5 text-[15px] text-ink placeholder:text-faint hover:border-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:opacity-50"
            />
            <Button
              onClick={() => sendMessage(input)}
              disabled={isTyping || !input.trim()}
              className="h-[52px] w-[52px] !px-0"
              aria-label="Send message"
            >
              <ArrowLeft className="h-5 w-5 rotate-180" />
            </Button>
          </div>
          <p className="mt-2 text-center text-[11px] leading-relaxed text-faint">
            NutriCal provides general nutrition guidance and estimates and is
            not a substitute for professional medical advice.
          </p>
        </div>
      </main>

      <MobileNav active="coach" />
    </div>
  );
}
