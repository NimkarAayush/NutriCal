'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase';
import {
  DEFAULT_GOALS,
  calculateGoalsFromProfile,
  type ProfileForGoals,
} from '@/lib/goals';
import { AppHeader, MobileNav } from '@/components/nav';
import {
  Button,
  Card,
  Badge,
  EmptyState,
  Alert,
  LoadingState,
  Modal,
  Field,
  inputClass,
} from '@/components/ui';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Spark,
  Target,
  Trash,
  Bowl,
  Chat,
  ArrowRight,
} from '@/components/icons';

// --- TYPES ---
interface MealLog {
  id: string;
  meal_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  created_at: string;
  logged_date: string;
}

interface Goals {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

type GoalsSource = 'saved' | 'calculated' | 'manual' | 'default';

const GOAL_SOURCE_LABEL: Record<GoalsSource, string> = {
  saved: 'Saved targets',
  calculated: 'Calculated from profile',
  manual: 'Manually set',
  default: 'Default targets',
};

function greetingFor(date: Date): string {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function nameFromEmail(email?: string | null): string | null {
  if (!email) return null;
  const handle = email.split('@')[0].replace(/[._-]+/g, ' ').trim();
  if (!handle) return null;
  return handle.charAt(0).toUpperCase() + handle.slice(1);
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [logs, setLogs] = useState<MealLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Date Navigation State
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Dynamic Goal-Completion Streak State
  const [streak, setStreak] = useState<number>(0);

  // Goals State
  const [goals, setGoals] = useState<Goals>(DEFAULT_GOALS);
  const [tempGoals, setTempGoals] = useState<Goals>(DEFAULT_GOALS);
  const [isEditingGoals, setIsEditingGoals] = useState(false);
  const [goalsSource, setGoalsSource] = useState<GoalsSource>('default');
  const [showRecommendation, setShowRecommendation] = useState(false);
  const [calculatedGoals, setCalculatedGoals] = useState<Goals>(DEFAULT_GOALS);

  // Error State
  const [error, setError] = useState('');

  // Unified Smart Logging State
  const [quickInput, setQuickInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [manualModalOpen, setManualModalOpen] = useState(false);

  // Pending review item from AI or manual entry
  const [draftMeal, setDraftMeal] = useState<{
    meal_name: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  } | null>(null);

  // Manual Form Inputs
  const [manualForm, setManualForm] = useState({
    mealName: '',
    calories: '',
    protein: '',
    carbs: '',
    fats: '',
  });

  const router = useRouter();
  const supabase = createClient();

  // --- STREAK CALCULATION (Based on achieving 90%-110% of target calories) ---
  const calculateTargetStreak = async (userId: string, currentGoals: Goals) => {
    const { data, error } = await supabase
      .from('meal_logs')
      .select('logged_date, calories')
      .eq('user_id', userId);

    if (error || !data || data.length === 0) {
      setStreak(0);
      return;
    }

    // Sum calories per date
    const dailyTotals: Record<string, number> = {};
    data.forEach((row: { logged_date: string; calories: number }) => {
      dailyTotals[row.logged_date] = (dailyTotals[row.logged_date] || 0) + (Number(row.calories) || 0);
    });

    const isTargetMet = (dateStr: string) => {
      const cals = dailyTotals[dateStr] || 0;
      const target = currentGoals.calories || 2200;
      return cals >= target * 0.9 && cals <= target * 1.1;
    };

    const today = new Date().toISOString().split('T')[0];
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().split('T')[0];

    let currentStreak = 0;
    const checkDate = new Date();

    if (isTargetMet(today)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      if (!isTargetMet(yesterday)) {
        setStreak(0);
        return;
      }
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (isTargetMet(dateStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    setStreak(currentStreak);
  };

  const fetchLogsForDate = async (userId: string, dateStr: string) => {
    const { data, error } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('logged_date', dateStr)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setLogs(data);
    }
  };

  // --- INITIAL DATA FETCH ---
  useEffect(() => {
    const fetchUserData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);
      await fetchLogsForDate(user.id, selectedDate);

      // Load saved user goals from nutrition_goals table
      let activeGoals = DEFAULT_GOALS;
      let source: GoalsSource = 'default';

      const { data: savedGoalsData } = await supabase
        .from('nutrition_goals')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (savedGoalsData) {
        activeGoals = {
          calories: Number(savedGoalsData.calorie_target),
          protein: Number(savedGoalsData.protein_target),
          carbs: Number(savedGoalsData.carbs_target),
          fats: Number(savedGoalsData.fats_target),
        };
        source = 'saved';
      } else {
        // No saved goals — try to calculate from profile
        const { data: profileRow } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (profileRow) {
          const profileForGoals: ProfileForGoals = {
            age: profileRow.age,
            gender: profileRow.gender,
            height_cm: profileRow.height_cm,
            weight_kg: profileRow.weight_kg,
            activity_level: profileRow.activity_level,
            primary_goal: profileRow.primary_goal,
          };

          const result = calculateGoalsFromProfile(profileForGoals);
          if (result.canCalculate) {
            setCalculatedGoals(result.goals);
            setShowRecommendation(true);
          }
        }
      }

      setGoals(activeGoals);
      setTempGoals(activeGoals);
      setGoalsSource(source);

      await calculateTargetStreak(user.id, activeGoals);
      setLoading(false);
    };

    fetchUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch logs whenever the selected date changes
  useEffect(() => {
    if (user) {
      const loadLogs = async () => {
        await fetchLogsForDate(user.id, selectedDate);
      };
      void loadLogs();
    }
  }, [selectedDate]);

  // Date Shift (+/- days)
  const shiftDate = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  // Formatted date string (e.g. "Tuesday, Sep 29")
  const formattedDateTitle = useMemo(() => {
    if (selectedDate === todayStr) return 'Today';
    const parts = selectedDate.split('-');
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }, [selectedDate, todayStr]);

  // --- TOTALS COMPUTATION ---
  const totals = useMemo(() => {
    return logs.reduce(
      (acc, item) => ({
        calories: acc.calories + (Number(item.calories) || 0),
        protein: acc.protein + (Number(item.protein) || 0),
        carbs: acc.carbs + (Number(item.carbs) || 0),
        fats: acc.fats + (Number(item.fats) || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );
  }, [logs]);

  const remainingCalories = goals.calories - totals.calories;
  const calPercent = Math.min(Math.round((totals.calories / (goals.calories || 1)) * 100), 100);
  const proteinPercent = Math.min(Math.round((totals.protein / (goals.protein || 1)) * 100), 100);
  const carbsPercent = Math.min(Math.round((totals.carbs / (goals.carbs || 1)) * 100), 100);
  const fatsPercent = Math.min(Math.round((totals.fats / (goals.fats || 1)) * 100), 100);

  // Deterministic daily note, computed from already-loaded numbers.
  const proteinToGo = goals.protein - totals.protein;
  const dailyNote =
    proteinToGo > 0
      ? `${Math.round(proteinToGo)}g of protein to go — a protein-rich dinner would close the gap.`
      : remainingCalories > 0
        ? 'Protein target hit. Stay the course through dinner.'
        : 'Day complete. Review the timeline and plan tomorrow.';

  const displayName = nameFromEmail(user?.email);
  const greeting = useMemo(() => greetingFor(new Date()), []);
  const fullDate = useMemo(
    () =>
      new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }),
    []
  );

  // --- ACTIONS ---
  const handleSaveGoals = async (e: React.FormEvent) => {
    e.preventDefault();
    setGoals(tempGoals);
    setGoalsSource('manual');
    if (user) {
      // Save to nutrition_goals table
      const { error } = await supabase
        .from('nutrition_goals')
        .upsert(
          {
            user_id: user.id,
            calorie_target: tempGoals.calories,
            protein_target: tempGoals.protein,
            carbs_target: tempGoals.carbs,
            fats_target: tempGoals.fats,
            goal_type: 'custom',
            source: 'manual',
          },
          { onConflict: 'user_id' }
        );
      if (error) {
        setError('Error saving goals: ' + error.message);
      } else {
        setError('');
      }
      await calculateTargetStreak(user.id, tempGoals);
    }
    setIsEditingGoals(false);
  };

  // Accept calculated goals
  const handleAcceptCalculated = async () => {
    if (!user) return;
    const newGoals = calculatedGoals;
    setGoals(newGoals);
    setTempGoals(newGoals);
    setGoalsSource('calculated');
    setShowRecommendation(false);

    const { error } = await supabase
      .from('nutrition_goals')
      .upsert(
        {
          user_id: user.id,
          calorie_target: newGoals.calories,
          protein_target: newGoals.protein,
          carbs_target: newGoals.carbs,
          fats_target: newGoals.fats,
          goal_type: 'calculated',
          source: 'calculated',
        },
        { onConflict: 'user_id' }
      );
    if (error) {
      setError('Error saving goals: ' + error.message);
    } else {
      setError('');
    }
    await calculateTargetStreak(user.id, newGoals);
  };

  // Decline calculated goals — use them as starting point for manual editing
  const handleDeclineCalculated = () => {
    setTempGoals(calculatedGoals);
    setShowRecommendation(false);
    setIsEditingGoals(true);
  };

  // AI Natural Language Estimation
  const handleSmartEstimate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;

    setAiLoading(true);
    setDraftMeal(null);
    try {
      const res = await fetch('/api/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: quickInput }),
      });

      const data = await res.json();
      if (res.ok) {
        setDraftMeal({
          meal_name: data.meal_name || quickInput,
          calories: Math.round(data.calories || 0),
          protein: Math.round(data.protein || 0),
          carbs: Math.round(data.carbs || 0),
          fats: Math.round(data.fats || 0),
        });
      } else {
        setError(data.error || 'Failed to estimate');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error contacting AI');
    } finally {
      setAiLoading(false);
    }
  };

  // Confirm and persist meal
  const handleCommitMeal = async (mealToSave = draftMeal) => {
    if (!user || !mealToSave) return;
    setSubmitting(true);

    const { error } = await supabase.from('meal_logs').insert([
      {
        user_id: user.id,
        meal_name: mealToSave.meal_name,
        calories: mealToSave.calories,
        protein: mealToSave.protein,
        carbs: mealToSave.carbs,
        fats: mealToSave.fats,
        logged_date: selectedDate,
      },
    ]);

    if (error) {
      setError('Error saving meal: ' + error.message);
    } else {
      setError('');
      setDraftMeal(null);
      setQuickInput('');
      setManualModalOpen(false);
      setManualForm({ mealName: '', calories: '', protein: '', carbs: '', fats: '' });
      await fetchLogsForDate(user.id, selectedDate);
      await calculateTargetStreak(user.id, goals);
    }
    setSubmitting(false);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.mealName) return;
    handleCommitMeal({
      meal_name: manualForm.mealName,
      calories: Number(manualForm.calories) || 0,
      protein: Number(manualForm.protein) || 0,
      carbs: Number(manualForm.carbs) || 0,
      fats: Number(manualForm.fats) || 0,
    });
  };

  const handleDeleteMeal = async (id: string) => {
    if (!user) return;
    const { error } = await supabase.from('meal_logs').delete().eq('id', id).eq('user_id', user.id);
    if (!error && user) {
      await fetchLogsForDate(user.id, selectedDate);
      await calculateTargetStreak(user.id, goals);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return <LoadingState label="Loading NutriCal..." />;
  }

  const macroRows = [
    {
      label: 'Protein',
      value: totals.protein,
      target: goals.protein,
      unit: 'g',
      percent: proteinPercent,
      bar: 'bg-macro-protein',
      sources: 'eggs · dal · yogurt',
    },
    {
      label: 'Carbs',
      value: totals.carbs,
      target: goals.carbs,
      unit: 'g',
      percent: carbsPercent,
      bar: 'bg-macro-carbs',
      sources: 'oats · rice · roti',
    },
    {
      label: 'Fats',
      value: totals.fats,
      target: goals.fats,
      unit: 'g',
      percent: fatsPercent,
      bar: 'bg-macro-fats',
      sources: 'milk · paneer · nuts',
    },
  ];

  return (
    <div className="min-h-screen bg-paper font-sans text-ink antialiased">
      <AppHeader
        active="dashboard"
        streak={streak}
        email={user?.email}
        onSignOut={handleLogout}
      />

      <main className="mx-auto max-w-5xl px-4 pb-28 pt-8 sm:px-6 sm:pt-10 md:pb-16">
        {error && (
          <div className="mb-6">
            <Alert tone="danger" onDismiss={() => setError('')}>
              {error}
            </Alert>
          </div>
        )}

        {/* Masthead */}
        <div
          className="anim-rise mb-2 flex flex-wrap items-end justify-between gap-4"
          style={{ '--d': '0ms' } as React.CSSProperties}
        >
          <div className="max-w-xl">
            <p className="eyebrow text-faint">
              {selectedDate === todayStr ? 'Today' : formattedDateTitle} · {fullDate}
            </p>
            <h1 className="display mt-2 text-[38px] leading-[1.03] sm:text-[52px]">
              {greeting}
              {displayName ? `, ${displayName}` : ''}.
            </h1>
          </div>

          <div className="flex items-center gap-2 pb-1">
            <div className="flex items-center rounded-pill border border-line bg-surface p-1">
              <button
                onClick={() => shiftDate(-1)}
                className="rounded-full p-2 text-muted transition hover:bg-surface-soft hover:text-ink"
                aria-label="Previous day"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="relative px-3 py-1">
                <span className="cursor-pointer text-sm font-semibold">
                  {formattedDateTitle}
                </span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  title="Pick a date"
                  aria-label="Pick a date"
                />
              </div>
              <button
                onClick={() => shiftDate(1)}
                className="rounded-full p-2 text-muted transition hover:bg-surface-soft hover:text-ink"
                aria-label="Next day"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            {selectedDate !== todayStr && (
              <button
                onClick={() => setSelectedDate(todayStr)}
                className="px-1 text-[13px] font-semibold text-brand-deep hover:underline"
              >
                Back to today
              </button>
            )}
          </div>
        </div>

        {/* 1 · How am I doing — open editorial section */}
        <section
          className="anim-rise border-b border-line py-8 sm:py-10"
          style={{ '--d': '60ms' } as React.CSSProperties}
          aria-label="Today's nutrition"
        >
          <p className="rule-label eyebrow text-faint">
            {selectedDate === todayStr ? "Today's nutrition" : `Daily total · ${selectedDate}`}
          </p>
          <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-2">
            <span className="nums display text-[76px] leading-none sm:text-[104px]">
              {totals.calories.toLocaleString()}
            </span>
            <span className="nums text-lg text-faint">
              / {goals.calories.toLocaleString()} kcal
            </span>
            <span className="rounded-pill bg-surface-soft px-3 py-1 text-xs font-semibold text-muted">
              {calPercent}% of target
            </span>
          </div>
          <div className="mt-4 h-2 max-w-2xl overflow-hidden rounded-full bg-surface-soft">
            <div
              className={`bar-grow h-full rounded-full ${totals.calories > goals.calories ? 'bg-danger' : 'bg-brand'}`}
              style={{ width: `${calPercent}%`, '--d': '250ms' } as React.CSSProperties}
              role="progressbar"
              aria-valuenow={calPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Calorie progress"
            />
          </div>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted">
            {remainingCalories >= 0 ? (
              <>
                <strong className="nums font-semibold text-ink">
                  {remainingCalories.toLocaleString()} kcal
                </strong>{' '}
                remaining today. {dailyNote}
              </>
            ) : (
              <span className="font-medium text-danger">
                {Math.abs(remainingCalories).toLocaleString()} kcal over target.{' '}
                {dailyNote}
              </span>
            )}
          </p>
          <button
            onClick={() => setIsEditingGoals(!isEditingGoals)}
            className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand-deep hover:underline"
          >
            <Target className="h-3.5 w-3.5" />
            {isEditingGoals ? 'Hide targets' : 'Adjust targets'}
          </button>
        </section>

        {/* 2 · Macro balance — editorial rows, no boxes */}
        <section
          className="anim-rise border-b border-line py-8"
          style={{ '--d': '120ms' } as React.CSSProperties}
          aria-label="Macro breakdown"
        >
          <div className="grid gap-x-10 gap-y-7 sm:grid-cols-3">
            {macroRows.map((m, i) => (
              <div key={m.label}>
                <div className="flex items-baseline justify-between">
                  <p className="text-sm font-medium text-muted">{m.label}</p>
                  <p className="nums text-xs text-faint">{m.percent}%</p>
                </div>
                <p className="nums display mt-1 text-[44px] leading-none">
                  {m.value}
                  <span className="ml-1.5 font-sans text-sm font-medium text-faint">
                    / {m.target}
                    {m.unit}
                  </span>
                </p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-soft">
                  <div
                    className={`bar-grow h-full rounded-full ${m.bar}`}
                    style={{ width: `${m.percent}%`, '--d': `${300 + i * 100}ms` } as React.CSSProperties}
                    role="progressbar"
                    aria-valuenow={m.percent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${m.label} progress`}
                  />
                </div>
                <p className="mt-2 text-xs text-faint">{m.sources}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 3 · What did you eat — the primary interaction */}
        <section
          className="anim-rise py-8 sm:py-10"
          style={{ '--d': '160ms' } as React.CSSProperties}
          aria-label="Log a meal"
        >
          <div className="max-w-2xl">
            <p className="eyebrow flex items-center gap-2 text-brand-deep">
              <Spark className="h-3.5 w-3.5" />
              Log with AI
            </p>
            <h2 className="display mt-2 text-4xl sm:text-5xl">
              What did you eat?
            </h2>
          </div>

          <form onSubmit={handleSmartEstimate} className="mt-6 max-w-2xl">
            <div className="rounded-card border border-line bg-surface p-2 shadow-card transition focus-within:border-brand">
              <input
                type="text"
                placeholder="Oatmeal with banana and milk…"
                value={quickInput}
                onChange={(e) => setQuickInput(e.target.value)}
                aria-label="Describe your meal"
                className="w-full bg-transparent px-4 py-3.5 font-display text-[22px] font-medium tracking-tight text-ink placeholder:text-faint focus:outline-none"
              />
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line-soft px-2 pb-1 pt-3">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 px-2 text-[13px] text-faint">
                  <span>Try:</span>
                  {[
                    '2 boiled eggs, toast & an apple',
                    'Chicken biryani & raita',
                    'Whey shake with milk',
                  ].map((example) => (
                    <button
                      key={example}
                      type="button"
                      onClick={() => setQuickInput(example)}
                      className="font-medium text-muted underline decoration-line underline-offset-[3px] transition hover:text-ink"
                    >
                      {example}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setManualModalOpen(true)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Manual
                  </Button>
                  <Button
                    type="submit"
                    disabled={aiLoading || !quickInput.trim()}
                    loading={aiLoading}
                  >
                    {aiLoading ? 'Estimating' : 'Estimate nutrition'}
                    {!aiLoading && <ArrowRight className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </form>

          {draftMeal && (
            <div className="anim-pop mt-5 max-w-2xl rounded-card border border-brand/25 bg-brand-mist p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="eyebrow text-brand-deep">Estimated · review & add</p>
                  <p className="display mt-1.5 text-[28px]">{draftMeal.meal_name}</p>
                  <p className="nums mt-2 flex flex-wrap items-center gap-x-2.5 text-sm text-ink-soft">
                    <strong className="text-lg font-semibold text-ink">
                      {draftMeal.calories} kcal
                    </strong>
                    <span className="text-faint">·</span>
                    <span>Protein {draftMeal.protein}g</span>
                    <span className="text-faint">·</span>
                    <span>Carbs {draftMeal.carbs}g</span>
                    <span className="text-faint">·</span>
                    <span>Fats {draftMeal.fats}g</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setDraftMeal(null)}
                  >
                    Discard
                  </Button>
                  <Button
                    type="button"
                    disabled={submitting}
                    loading={submitting}
                    onClick={() => handleCommitMeal(draftMeal)}
                  >
                    Add to today
                  </Button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* 4 · Personalized starting targets */}
        {showRecommendation && (
          <Card
            className="anim-rise mb-8 border-ember/25 bg-ember-soft/30 p-6 sm:p-7"
            style={{ '--d': '140ms' } as React.CSSProperties}
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 className="display text-2xl">
                  Your personalized starting targets
                </h2>
                <p className="mt-1 text-[13px] text-muted">
                  Calculated from your profile — review before applying.
                </p>
              </div>
              <Badge tone="ember">Calculated</Badge>
            </div>

            <dl className="mb-5 grid grid-cols-2 gap-x-8 gap-y-3 border-y border-line py-5 sm:grid-cols-4">
              {[
                { label: 'Calories', value: calculatedGoals.calories.toLocaleString(), unit: 'kcal' },
                { label: 'Protein', value: calculatedGoals.protein, unit: 'g' },
                { label: 'Carbs', value: calculatedGoals.carbs, unit: 'g' },
                { label: 'Fats', value: calculatedGoals.fats, unit: 'g' },
              ].map((g) => (
                <div key={g.label}>
                  <dt className="eyebrow text-faint">{g.label}</dt>
                  <dd className="nums display mt-1 text-[28px]">
                    {g.value}
                    <span className="ml-1 font-sans text-xs font-medium text-faint">
                      {g.unit}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>

            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" onClick={handleAcceptCalculated}>
                Use these goals
              </Button>
              <Button variant="outline" size="sm" onClick={handleDeclineCalculated}>
                Edit instead
              </Button>
            </div>
          </Card>
        )}

        {/* 5 · Targets editor */}
        {isEditingGoals && (
          <Card className="anim-rise mb-8 p-6 sm:p-7">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 className="display text-2xl">Nutrition targets</h2>
                <p className="mt-1 text-[13px] text-muted">
                  Fine-tune your daily calorie and macro baseline.
                </p>
              </div>
              <Badge tone="brand">{GOAL_SOURCE_LABEL[goalsSource]}</Badge>
            </div>

            <form
              onSubmit={handleSaveGoals}
              className="grid grid-cols-2 gap-4 sm:grid-cols-4"
            >
              {[
                { label: 'Calories (kcal)', key: 'calories' as const },
                { label: 'Protein (g)', key: 'protein' as const },
                { label: 'Carbs (g)', key: 'carbs' as const },
                { label: 'Fats (g)', key: 'fats' as const },
              ].map((f) => (
                <Field key={f.key} label={f.label}>
                  <input
                    type="number"
                    min={0}
                    value={tempGoals[f.key]}
                    onChange={(e) =>
                      setTempGoals({ ...tempGoals, [f.key]: Number(e.target.value) })
                    }
                    className={inputClass}
                    required
                  />
                </Field>
              ))}
              <div className="col-span-2 flex justify-end gap-2 border-t border-line-soft pt-4 sm:col-span-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingGoals(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="dark" size="sm">
                  Save targets
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* 6 · Meals timeline — open rows */}
        <section
          className="anim-rise border-t border-line pt-8"
          style={{ '--d': '200ms' } as React.CSSProperties}
          aria-label="Logged meals"
        >
          <div className="mb-2 flex items-end justify-between gap-3">
            <div>
              <p className="eyebrow text-faint">
                {selectedDate === todayStr ? "Today's meals" : 'Meals'}
              </p>
              <h2 className="display mt-1 text-3xl">
                {logs.length === 0
                  ? 'Nothing logged yet'
                  : `${logs.length} meal${logs.length === 1 ? '' : 's'} logged`}
              </h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/coach')}
            >
              Ask coach
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>

          {logs.length === 0 ? (
            <EmptyState
              icon={<Bowl className="h-5 w-5" />}
              title="Your day is a blank plate"
              hint="Describe a meal above and NutriCal will do the maths."
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setManualModalOpen(true)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add manual meal
                </Button>
              }
            />
          ) : (
            <ul className="divide-y divide-line">
              {logs.map((log, i) => {
                const timeStr = new Date(log.created_at).toLocaleTimeString(
                  'en-US',
                  { hour: '2-digit', minute: '2-digit', hour12: true }
                );
                return (
                  <li
                    key={log.id}
                    className="anim-row-in group flex items-center justify-between gap-3 py-4"
                    style={{ '--d': `${Math.min(i, 8) * 40}ms` } as React.CSSProperties}
                  >
                    <div className="flex min-w-0 items-baseline gap-4">
                      <span className="nums w-[64px] shrink-0 text-[12px] font-medium text-faint">
                        {timeStr}
                      </span>
                      <div className="min-w-0">
                        <h3 className="truncate font-display text-[19px] font-medium tracking-tight">
                          {log.meal_name}
                        </h3>
                        <p className="nums mt-0.5 flex flex-wrap items-center gap-x-2 text-[13px] text-muted">
                          <strong className="font-semibold text-ink">
                            {log.calories} kcal
                          </strong>
                          <span className="text-line">·</span>
                          <span>P {log.protein}g</span>
                          <span className="text-line">·</span>
                          <span>C {log.carbs}g</span>
                          <span className="text-line">·</span>
                          <span>F {log.fats}g</span>
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteMeal(log.id)}
                      className="shrink-0 rounded-full p-2 text-faint transition hover:bg-danger-soft hover:text-danger focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                      title="Remove meal"
                      aria-label={`Remove ${log.meal_name}`}
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="mt-2 text-xs text-faint">
            {logs.length > 0 ? 'Sorted by most recent.' : ''}
          </p>
        </section>

        {/* 7 · Manual entry */}
        {manualModalOpen && (
          <Modal title="Manual meal entry" onClose={() => setManualModalOpen(false)}>
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <Field label="Food / description">
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Grilled chicken salad"
                  value={manualForm.mealName}
                  onChange={(e) =>
                    setManualForm({ ...manualForm, mealName: e.target.value })
                  }
                  className={inputClass}
                />
              </Field>

              <Field label="Calories (kcal)">
                <input
                  type="number"
                  min={0}
                  placeholder="450"
                  value={manualForm.calories}
                  onChange={(e) =>
                    setManualForm({ ...manualForm, calories: e.target.value })
                  }
                  className={inputClass}
                />
              </Field>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Protein (g)', key: 'protein' as const, ph: '35' },
                  { label: 'Carbs (g)', key: 'carbs' as const, ph: '20' },
                  { label: 'Fats (g)', key: 'fats' as const, ph: '12' },
                ].map((f) => (
                  <Field key={f.key} label={f.label}>
                    <input
                      type="number"
                      min={0}
                      placeholder={f.ph}
                      value={manualForm[f.key]}
                      onChange={(e) =>
                        setManualForm({ ...manualForm, [f.key]: e.target.value })
                      }
                      className={inputClass}
                    />
                  </Field>
                ))}
              </div>

              <div className="flex justify-end gap-2 border-t border-line-soft pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setManualModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="dark" size="sm" loading={submitting}>
                  Add meal
                </Button>
              </div>
            </form>
          </Modal>
        )}

        {/* 8 · Coach strip */}
        <section
          className="anim-rise mt-10 flex flex-col items-start justify-between gap-4 rounded-card bg-brand-ink px-6 py-7 text-white sm:flex-row sm:items-center sm:px-8"
          style={{ '--d': '220ms' } as React.CSSProperties}
        >
          <div>
            <p className="eyebrow text-white/50">Not sure what&apos;s next?</p>
            <p className="display mt-1 text-2xl sm:text-[28px]">
              Ask your coach what to eat tonight.
            </p>
          </div>
          <Button
            variant="light"
            onClick={() => router.push('/coach')}
            className="shrink-0"
          >
            Open coach
            <ArrowRight className="h-4 w-4" />
          </Button>
        </section>

        {/* Footer note */}
        <footer className="mt-10 border-t border-line pt-5 pb-2 text-[12px] text-faint">
          <div className="flex items-center gap-2">
            <Chat className="h-3.5 w-3.5" />
            <span>
              NutriCal provides general nutrition guidance and estimates and is
              not a substitute for professional medical advice.
            </span>
          </div>
        </footer>
      </main>

      <MobileNav active="dashboard" />
    </div>
  );
}
