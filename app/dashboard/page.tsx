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
import {
  addDays,
  aggregateMealRows,
  calculateStreak,
  clampPercent,
  formatLongDate,
  formatShortDay,
  lastNDates,
  percentOf,
  todayKey,
  type DailyTotals,
} from '@/lib/stats';
import { AppShell } from '@/components/nav';
import {
  Button,
  Card,
  Badge,
  EmptyState,
  Alert,
  LoadingState,
  Modal,
  Field,
  Progress,
  inputClass,
} from '@/components/ui';
import { ProgressRing, LineChart, ChartLegend, type ChartSeries } from '@/components/charts';
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
  ArrowUpRight,
  Flame,
  Dumbbell,
  Droplet,
  ChartBar,
  Plan,
  Check,
} from '@/components/icons';

// --- TYPES ---
interface MealLog {
  id: string;
  meal_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  vitamin_a_mcg?: number | null;
  vitamin_c_mg?: number | null;
  vitamin_d_mcg?: number | null;
  iron_mg?: number | null;
  calcium_mg?: number | null;
  potassium_mg?: number | null;
  created_at: string;
  logged_date: string;
}

const MICRO_TARGETS = [
  { key: 'vitamin_a_mcg', label: 'Vitamin A', unit: 'mcg', target: 900 },
  { key: 'vitamin_c_mg', label: 'Vitamin C', unit: 'mg', target: 90 },
  { key: 'vitamin_d_mcg', label: 'Vitamin D', unit: 'mcg', target: 15 },
  { key: 'calcium_mg', label: 'Calcium', unit: 'mg', target: 1000 },
  { key: 'iron_mg', label: 'Iron', unit: 'mg', target: 18 },
  { key: 'potassium_mg', label: 'Potassium', unit: 'mg', target: 3500 },
] as const;

type MicroKey = (typeof MICRO_TARGETS)[number]['key'];

interface Goals {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

type GoalsSource = 'saved' | 'calculated' | 'manual' | 'default';

const GOAL_SOURCE_LABEL: Record<GoalsSource, string> = {
  saved: 'Saved targets',
  calculated: 'Calculated',
  manual: 'Manual',
  default: 'Defaults',
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
  const [weekTotals, setWeekTotals] = useState<Record<string, DailyTotals>>({});
  const [profileName, setProfileName] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');

  const today = useMemo(() => todayKey(), []);
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [streak, setStreak] = useState(0);

  const [goals, setGoals] = useState<Goals>(DEFAULT_GOALS);
  const [tempGoals, setTempGoals] = useState<Goals>(DEFAULT_GOALS);
  const [goalsModalOpen, setGoalsModalOpen] = useState(false);
  const [goalsSource, setGoalsSource] = useState<GoalsSource>('default');
  const [showRecommendation, setShowRecommendation] = useState(false);
  const [calculatedGoals, setCalculatedGoals] = useState<Goals>(DEFAULT_GOALS);
  const [error, setError] = useState('');

  const [quickInput, setQuickInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [manualModalOpen, setManualModalOpen] = useState(false);

  const [draftMeal, setDraftMeal] = useState<{
    meal_name: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    vitamin_a_mcg: number;
    vitamin_c_mg: number;
    vitamin_d_mcg: number;
    iron_mg: number;
    calcium_mg: number;
    potassium_mg: number;
  } | null>(null);

  const [manualForm, setManualForm] = useState({
    mealName: '',
    calories: '',
    protein: '',
    carbs: '',
    fats: '',
    vitamin_a_mcg: '',
    vitamin_c_mg: '',
    vitamin_d_mcg: '',
    iron_mg: '',
    calcium_mg: '',
    potassium_mg: '',
  });

  const router = useRouter();
  const supabase = createClient();

  const fetchLogsForDate = async (userId: string, dateStr: string) => {
    const { data, error } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('logged_date', dateStr)
      .order('created_at', { ascending: false });
    if (!error && data) setLogs(data);
  };

  const loadWeekTotals = async (userId: string) => {
    const { data } = await supabase
      .from('meal_logs')
      .select('logged_date, calories, protein, carbs, fats')
      .eq('user_id', userId)
      .gte('logged_date', addDays(todayKey(), -6))
      .lte('logged_date', todayKey());
    setWeekTotals(aggregateMealRows(data ?? []));
  };

  const loadStreak = async (userId: string, target: number) => {
    const { data } = await supabase
      .from('meal_logs')
      .select('logged_date, calories')
      .eq('user_id', userId)
      .gte('logged_date', addDays(todayKey(), -180));

    const byDay: Record<string, number> = {};
    for (const row of data ?? []) {
      byDay[row.logged_date] = (byDay[row.logged_date] ?? 0) + (Number(row.calories) || 0);
    }
    setStreak(calculateStreak(byDay, target));
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

      const { data: profileRow } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileRow?.full_name) setProfileName(profileRow.full_name);

      let activeGoals: Goals = DEFAULT_GOALS;
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
      } else if (profileRow) {
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

      setGoals(activeGoals);
      setTempGoals(activeGoals);
      setGoalsSource(source);

      await Promise.all([
        fetchLogsForDate(user.id, todayKey()),
        loadWeekTotals(user.id),
        loadStreak(user.id, activeGoals.calories),
      ]);
      setLoading(false);
    };

    fetchUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectDate = (next: string) => {
    setSelectedDate(next);
    if (user) void fetchLogsForDate(user.id, next);
  };

  const shiftDate = (days: number) => {
    selectDate(addDays(selectedDate, days));
  };

  const formattedDateTitle = useMemo(() => {
    if (selectedDate === today) return 'Today';
    return formatLongDate(selectedDate);
  }, [selectedDate, today]);

  // --- TOTALS ---
  const totals = useMemo(
    () =>
      logs.reduce(
        (acc, item) => ({
          calories: acc.calories + (Number(item.calories) || 0),
          protein: acc.protein + (Number(item.protein) || 0),
          carbs: acc.carbs + (Number(item.carbs) || 0),
          fats: acc.fats + (Number(item.fats) || 0),
        }),
        { calories: 0, protein: 0, carbs: 0, fats: 0 }
      ),
    [logs]
  );

  const microTotals = useMemo(() => {
    const sums: Record<MicroKey, number> = {
      vitamin_a_mcg: 0,
      vitamin_c_mg: 0,
      vitamin_d_mcg: 0,
      iron_mg: 0,
      calcium_mg: 0,
      potassium_mg: 0,
    };
    for (const item of logs) {
      for (const key of Object.keys(sums) as MicroKey[]) {
        sums[key] += Number(item[key]) || 0;
      }
    }
    return sums;
  }, [logs]);

  const remainingCalories = Math.round(goals.calories - totals.calories);
  const calPercent = clampPercent(percentOf(totals.calories, goals.calories));
  const proteinPercent = clampPercent(percentOf(totals.protein, goals.protein));
  const carbsPercent = clampPercent(percentOf(totals.carbs, goals.carbs));
  const fatsPercent = clampPercent(percentOf(totals.fats, goals.fats));

  const proteinToGo = Math.round(goals.protein - totals.protein);
  const dailyNote =
    proteinToGo > 0
      ? `${proteinToGo}g of protein to go — a protein-rich dinner would close the gap.`
      : remainingCalories > 0
        ? 'Protein target hit. Stay the course through the rest of the day.'
        : 'Day complete. Review the timeline and plan tomorrow.';

  const displayName = profileName || nameFromEmail(user?.email);
  const greeting = useMemo(() => greetingFor(new Date()), []);

  // --- 7-day trend ---
  const weekDates = useMemo(() => lastNDates(7), []);
  // Calories (kcal) and macros (grams) can't share one axis without
  // flattening the macros, so every series is plotted as a percentage of
  // its own daily target. That makes the four lines directly comparable
  // and lets a single 100% reference line stand for all of them.
  const trendSeries: ChartSeries[] = useMemo(() => {
    const asPercent = (value: number, target: number) =>
      target > 0 ? Math.round((value / target) * 100) : 0;
    return [
      {
        key: 'calories',
        label: 'Calories',
        color: 'var(--color-brand)',
        values: weekDates.map((date) =>
          asPercent(weekTotals[date]?.calories ?? 0, goals.calories)
        ),
      },
      {
        key: 'protein',
        label: 'Protein',
        color: 'var(--color-macro-protein)',
        values: weekDates.map((date) =>
          asPercent(weekTotals[date]?.protein ?? 0, goals.protein)
        ),
      },
      {
        key: 'carbs',
        label: 'Carbs',
        color: 'var(--color-macro-carbs)',
        values: weekDates.map((date) =>
          asPercent(weekTotals[date]?.carbs ?? 0, goals.carbs)
        ),
      },
      {
        key: 'fats',
        label: 'Fats',
        color: 'var(--color-macro-fats)',
        values: weekDates.map((date) =>
          asPercent(weekTotals[date]?.fats ?? 0, goals.fats)
        ),
      },
    ];
  }, [weekDates, weekTotals, goals]);
  const trendLabels = useMemo(
    () => weekDates.map((date) => (date === today ? 'Today' : formatShortDay(date))),
    [weekDates, today]
  );

  const streakDots = useMemo(
    () =>
      lastNDates(7).map((date) => {
        const calories = weekTotals[date]?.calories ?? 0;
        const met =
          calories >= goals.calories * 0.9 && calories <= goals.calories * 1.1;
        return { date, met, logged: calories > 0 };
      }),
    [weekTotals, goals.calories]
  );

  const refreshAfterChange = async (userId: string, activeGoals: Goals) => {
    await Promise.all([
      fetchLogsForDate(userId, selectedDate),
      loadWeekTotals(userId),
      loadStreak(userId, activeGoals.calories),
    ]);
  };

  // --- ACTIONS ---
  const handleSaveGoals = async (e: React.FormEvent) => {
    e.preventDefault();
    setGoals(tempGoals);
    setGoalsSource('manual');

    if (user) {
      const { error } = await supabase.from('nutrition_goals').upsert(
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
        setSuccess('Targets updated');
        setTimeout(() => setSuccess(''), 3000);
        await loadStreak(user.id, tempGoals.calories);
      }
    }
    setGoalsModalOpen(false);
  };

  const handleAcceptCalculated = async () => {
    if (!user) return;
    const newGoals = calculatedGoals;
    setGoals(newGoals);
    setTempGoals(newGoals);
    setGoalsSource('calculated');
    setShowRecommendation(false);

    const { error } = await supabase.from('nutrition_goals').upsert(
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
      setSuccess('Calculated targets saved');
      setTimeout(() => setSuccess(''), 3000);
    }
    await loadStreak(user.id, newGoals.calories);
  };

  const handleDeclineCalculated = () => {
    setTempGoals(calculatedGoals);
    setShowRecommendation(false);
    setGoalsModalOpen(true);
  };

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
          vitamin_a_mcg: Math.round(data.vitamin_a_mcg || 0),
          vitamin_c_mg: Math.round(data.vitamin_c_mg || 0),
          vitamin_d_mcg: Math.round(data.vitamin_d_mcg || 0),
          iron_mg: Math.round(data.iron_mg || 0),
          calcium_mg: Math.round(data.calcium_mg || 0),
          potassium_mg: Math.round(data.potassium_mg || 0),
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
        vitamin_a_mcg: mealToSave.vitamin_a_mcg ?? 0,
        vitamin_c_mg: mealToSave.vitamin_c_mg ?? 0,
        vitamin_d_mcg: mealToSave.vitamin_d_mcg ?? 0,
        iron_mg: mealToSave.iron_mg ?? 0,
        calcium_mg: mealToSave.calcium_mg ?? 0,
        potassium_mg: mealToSave.potassium_mg ?? 0,
        logged_date: selectedDate,
      },
    ]);

    if (error) {
      setError('Error saving meal: ' + error.message);
    } else {
      setError('');
      setSuccess(
        selectedDate === today ? 'Meal added to today' : `Meal added to ${formatLongDate(selectedDate)}`
      );
      setTimeout(() => setSuccess(''), 3000);
      setDraftMeal(null);
      setQuickInput('');
      setManualModalOpen(false);
      setManualForm({
        mealName: '',
        calories: '',
        protein: '',
        carbs: '',
        fats: '',
        vitamin_a_mcg: '',
        vitamin_c_mg: '',
        vitamin_d_mcg: '',
        iron_mg: '',
        calcium_mg: '',
        potassium_mg: '',
      });
      await refreshAfterChange(user.id, goals);
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
      vitamin_a_mcg: Number(manualForm.vitamin_a_mcg) || 0,
      vitamin_c_mg: Number(manualForm.vitamin_c_mg) || 0,
      vitamin_d_mcg: Number(manualForm.vitamin_d_mcg) || 0,
      iron_mg: Number(manualForm.iron_mg) || 0,
      calcium_mg: Number(manualForm.calcium_mg) || 0,
      potassium_mg: Number(manualForm.potassium_mg) || 0,
    });
  };

  const handleDeleteMeal = async (id: string) => {
    if (!user) return;
    const { error } = await supabase
      .from('meal_logs')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (!error) {
      await refreshAfterChange(user.id, goals);
    }
  };

  const scrollToLog = () => {
    document.getElementById('log-meal')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Deep links from other pages (e.g. /dashboard#goals) arrive before the
  // dashboard content exists, so scroll once loading has finished.
  useEffect(() => {
    if (loading) return;
    const id = window.location.hash.replace(/^#/, '');
    if (!id) return;
    const target = document.getElementById(id);
    if (!target) return;
    const frame = requestAnimationFrame(() =>
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    );
    return () => cancelAnimationFrame(frame);
  }, [loading]);

  if (loading) {
    return <LoadingState label="Loading NutriCal..." />;
  }

  const statCards = [
    {
      label: 'Calories',
      value: Math.round(totals.calories),
      target: goals.calories,
      unit: 'kcal',
      percent: calPercent,
      icon: Flame,
      chip: 'bg-brand-soft text-brand-deep',
      bar: 'bg-brand',
    },
    {
      label: 'Protein',
      value: Math.round(totals.protein),
      target: goals.protein,
      unit: 'g',
      percent: proteinPercent,
      icon: Dumbbell,
      chip: 'bg-macro-protein-soft text-macro-protein',
      bar: 'bg-macro-protein',
    },
    {
      label: 'Carbs',
      value: Math.round(totals.carbs),
      target: goals.carbs,
      unit: 'g',
      percent: carbsPercent,
      icon: Bowl,
      chip: 'bg-macro-carbs-soft text-macro-carbs',
      bar: 'bg-macro-carbs',
    },
    {
      label: 'Fats',
      value: Math.round(totals.fats),
      target: goals.fats,
      unit: 'g',
      percent: fatsPercent,
      icon: Droplet,
      chip: 'bg-macro-fats-soft text-macro-fats',
      bar: 'bg-macro-fats',
    },
  ];

  const quickActions = [
    {
      label: 'Log a meal',
      detail: 'AI or manual',
      icon: Plus,
      chip: 'bg-brand-soft text-brand-deep',
      onClick: scrollToLog,
    },
    {
      label: 'Ask AI coach',
      detail: 'Context-aware advice',
      icon: Chat,
      chip: 'bg-macro-protein-soft text-macro-protein',
      onClick: () => router.push('/coach'),
    },
    {
      label: 'View analytics',
      detail: 'Trends and consistency',
      icon: ChartBar,
      chip: 'bg-teal-soft text-teal',
      onClick: () => router.push('/analytics'),
    },
    {
      label: 'Build my plan',
      detail: 'Guided assessment',
      icon: Plan,
      chip: 'bg-macro-carbs-soft text-macro-carbs',
      onClick: () => router.push('/assess'),
    },
  ];

  return (
    <AppShell
      active="dashboard"
      userEmail={user?.email}
      userName={displayName}
      streak={streak}
    >
      <div className="mx-auto w-full max-w-[1400px] space-y-4 sm:space-y-5">
        {error && (
          <Alert tone="danger" onDismiss={() => setError('')}>
            {error}
          </Alert>
        )}
        {success && <Alert tone="success">{success}</Alert>}

        {/* ---------- Greeting ---------- */}
        <div className="anim-rise flex flex-wrap items-end justify-between gap-4 pt-1">
          <div>
            <p className="text-[12.5px] font-medium text-muted">{formatLongDate(selectedDate)}</p>
            <h1 className="display mt-1 text-[28px] sm:text-[34px]">
              {greeting}
              {displayName ? `, ${displayName}` : ''}!{' '}
              <span aria-hidden="true" className="inline-block">👋</span>
            </h1>
            <p className="mt-1.5 text-[13.5px] text-muted">
              Here’s your nutrition overview for {selectedDate === today ? 'today' : formattedDateTitle}.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-control border border-line bg-surface p-1 shadow-card">
              <button
                onClick={() => shiftDate(-1)}
                className="rounded-lg p-2 text-muted transition hover:bg-surface-soft hover:text-ink"
                aria-label="Previous day"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="relative px-2.5 py-1">
                <span className="cursor-pointer text-[12.5px] font-semibold">
                  {selectedDate === today ? 'Today' : formattedDateTitle}
                </span>
                <input
                  type="date"
                  value={selectedDate}
                  max={today}
                  onChange={(e) => e.target.value && selectDate(e.target.value)}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  title="Pick a date"
                  aria-label="Pick a date"
                />
              </div>
              <button
                onClick={() => shiftDate(1)}
                disabled={selectedDate >= today}
                className="rounded-lg p-2 text-muted transition hover:bg-surface-soft hover:text-ink disabled:opacity-30"
                aria-label="Next day"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {selectedDate !== today && (
              <Button variant="outline" size="sm" onClick={() => selectDate(today)}>
                Back to today
              </Button>
            )}

            <Button size="sm" onClick={scrollToLog} className="hidden sm:inline-flex">
              <Plus className="h-4 w-4" />
              Log meal
            </Button>
          </div>
        </div>

        {/* ---------- Calculated targets banner ---------- */}
        {showRecommendation && (
          <Card className="anim-rise border-ember/30 bg-ember-soft/40 p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.12em] text-ember-deep">
                  <Spark className="h-3.5 w-3.5" />
                  Calculated from your profile
                </p>
                <p className="mt-1.5 text-[13.5px] text-ink-soft">
                  Starting targets:{' '}
                  <span className="nums font-semibold text-ink">
                    {calculatedGoals.calories.toLocaleString()} kcal · {calculatedGoals.protein}g P ·{' '}
                    {calculatedGoals.carbs}g C · {calculatedGoals.fats}g F
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={handleDeclineCalculated}>
                  Edit instead
                </Button>
                <Button size="sm" onClick={handleAcceptCalculated}>
                  Use these goals
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* ---------- Stat cards ---------- */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="anim-rise hover-lift rounded-card border border-line bg-surface p-4 shadow-card"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${stat.chip}`}>
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  <span className="nums rounded-pill bg-surface-soft px-2 py-1 text-[10px] font-semibold text-muted">
                    {stat.percent}%
                  </span>
                </div>
                <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-faint">
                  {stat.label}
                </p>
                <p className="nums mt-1 text-[25px] font-semibold leading-none tracking-tight">
                  {stat.value.toLocaleString()}
                  <span className="ml-1 text-[11.5px] font-medium text-faint">
                    / {stat.target.toLocaleString()} {stat.unit}
                  </span>
                </p>
                <Progress value={stat.percent} colorClass={stat.bar} className="mt-3" />
              </div>
            );
          })}
        </div>

        {/* ---------- Goal · trend · quick actions ---------- */}
        <div className="grid gap-3 sm:gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.65fr)_minmax(0,1fr)]">
          <Card
            id="goals"
            className="anim-rise flex scroll-mt-24 flex-col items-center p-5 text-center"
            style={{ animationDelay: '80ms' }}
          >
            <div className="mb-3 flex w-full items-center justify-between">
              <p className="text-[13px] font-semibold">Daily goal</p>
              <Badge tone="brand">{GOAL_SOURCE_LABEL[goalsSource]}</Badge>
            </div>

            <ProgressRing value={calPercent} size={158} stroke={13}>
              <span className="nums display text-[40px] leading-none">{calPercent}%</span>
              <span className="mt-1 text-[10.5px] text-muted">Goal achieved</span>
            </ProgressRing>

            <div
              className={`mt-3 inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-[11.5px] font-semibold ${
                remainingCalories >= 0
                  ? 'bg-brand-mist text-brand'
                  : 'bg-danger-soft text-danger'
              }`}
            >
              <Flame className="h-3.5 w-3.5" />
              {remainingCalories >= 0
                ? `${remainingCalories.toLocaleString()} kcal left`
                : `${Math.abs(remainingCalories).toLocaleString()} kcal over`}
            </div>

            <button
              onClick={() => {
                setTempGoals(goals);
                setGoalsModalOpen(true);
              }}
              className="mt-3 inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-brand transition hover:text-brand-deep"
            >
              <Target className="h-3.5 w-3.5" />
              Adjust targets
            </button>
          </Card>

          <Card className="anim-rise p-4 sm:p-5" style={{ animationDelay: '120ms' }}>
            <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-[14px] font-semibold">Nutrition trend</p>
                <p className="mt-0.5 text-[11.5px] text-muted">
                  Last 7 days · % of each daily target
                </p>
              </div>
              <div className="flex items-center gap-2">
                <ChartLegend series={trendSeries} />
              </div>
            </div>
            <LineChart
              labels={trendLabels}
              series={trendSeries}
              goal={100}
              goalLabel="100% of target"
              valueSuffix="%"
              height={214}
            />
          </Card>

          <Card className="anim-rise p-4" style={{ animationDelay: '160ms' }}>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[14px] font-semibold">Quick actions</p>
              <ArrowUpRight className="h-4 w-4 text-faint" />
            </div>
            <div className="space-y-2">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    onClick={action.onClick}
                    className="group flex w-full items-center gap-3 rounded-panel border border-line bg-surface px-3 py-2.5 text-left transition hover:border-brand/30 hover:bg-brand-mist/60"
                  >
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${action.chip}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[12.5px] font-semibold text-ink">{action.label}</span>
                      <span className="block text-[10.5px] text-muted">{action.detail}</span>
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-faint transition group-hover:translate-x-0.5" />
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* ---------- Log meal · focus/targets ---------- */}
        <div className="grid items-start gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
          <Card id="log-meal" className="anim-rise scroll-mt-24 p-4 sm:p-5" style={{ animationDelay: '80ms' }}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="flex items-center gap-1.5 text-[14px] font-semibold">
                  <Spark className="h-4 w-4 text-brand" />
                  Log your meal
                </p>
                <p className="mt-0.5 text-[11.5px] text-muted">
                  Describe it naturally — AI estimates the numbers for {selectedDate === today ? 'today' : formattedDateTitle}.
                </p>
              </div>
              <button
                onClick={() => setManualModalOpen(true)}
                className="inline-flex items-center gap-1 rounded-control border border-line bg-surface px-2.5 py-1.5 text-[11px] font-semibold text-ink-soft transition hover:border-faint"
              >
                <Plus className="h-3 w-3" />
                Manual entry
              </button>
            </div>

            <form onSubmit={handleSmartEstimate} className="mt-3">
              <div className="rounded-control border border-line bg-paper p-1.5 transition focus-within:border-brand/50 focus-within:ring-4 focus-within:ring-brand/10">
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="Oatmeal with banana and milk…"
                    value={quickInput}
                    onChange={(e) => setQuickInput(e.target.value)}
                    aria-label="Describe your meal"
                    className="min-w-0 flex-1 bg-transparent px-2.5 py-2.5 text-[14px] text-ink placeholder:text-faint focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={aiLoading || !quickInput.trim()}
                    className="pressable inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-[12.5px] font-semibold text-white transition hover:bg-brand-deep disabled:cursor-not-allowed disabled:bg-brand/40"
                  >
                    {aiLoading ? 'Estimating…' : 'Estimate'}
                    {!aiLoading && <ArrowRight className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <span className="text-[10.5px] font-medium text-faint">Try:</span>
                {[
                  '2 boiled eggs, toast & an apple',
                  'Chicken biryani & raita',
                  'Whey shake with milk',
                ].map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => setQuickInput(example)}
                    className="rounded-pill border border-line bg-surface px-2.5 py-1 text-[10.5px] font-medium text-muted transition hover:border-brand/30 hover:text-ink"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </form>

            {draftMeal && (
              <div className="anim-pop mt-4 rounded-panel border border-brand/25 bg-brand-mist p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.12em] text-brand">
                      <Check className="h-3 w-3" />
                      Review before adding
                    </p>
                    <p className="mt-1 truncate text-[16px] font-semibold">{draftMeal.meal_name}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {[
                        { label: 'kcal', value: draftMeal.calories, color: 'text-brand' },
                        { label: 'P', value: `${draftMeal.protein}g`, color: 'text-macro-protein' },
                        { label: 'C', value: `${draftMeal.carbs}g`, color: 'text-macro-carbs' },
                        { label: 'F', value: `${draftMeal.fats}g`, color: 'text-macro-fats' },
                      ].map((macro) => (
                        <span
                          key={macro.label}
                          className="nums rounded-pill bg-surface px-2.5 py-1 text-[11px] font-semibold text-ink-soft shadow-card"
                        >
                          <span className={macro.color}>{macro.value}</span>{' '}
                          <span className="text-faint">{macro.label}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setDraftMeal(null)}>
                      Discard
                    </Button>
                    <Button
                      size="sm"
                      disabled={submitting}
                      loading={submitting}
                      onClick={() => handleCommitMeal(draftMeal)}
                    >
                      Add meal
                    </Button>
                  </div>
                </div>
                <p className="mt-2 text-[10.5px] text-muted">
                  Includes estimated vitamins and minerals. You can delete it anytime.
                </p>
              </div>
            )}
          </Card>

          <div className="grid gap-3 sm:gap-4">
            <Card className="anim-rise p-4" style={{ animationDelay: '120ms' }}>
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-semibold">Today’s focus</p>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-mist text-brand">
                  <Spark className="h-3.5 w-3.5" />
                </span>
              </div>
              <p className="mt-2 text-[12.5px] leading-relaxed text-ink-soft">{dailyNote}</p>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-panel bg-paper px-3 py-2.5">
                  <p className="text-[10px] font-medium text-faint">Protein left</p>
                  <p className="nums mt-0.5 text-[16px] font-semibold">
                    {Math.max(proteinToGo, 0)}
                    <span className="ml-1 text-[10.5px] font-medium text-faint">g</span>
                  </p>
                </div>
                <div className="rounded-panel bg-paper px-3 py-2.5">
                  <p className="text-[10px] font-medium text-faint">Calories left</p>
                  <p className="nums mt-0.5 text-[16px] font-semibold">
                    {Math.max(remainingCalories, 0).toLocaleString()}
                    <span className="ml-1 text-[10.5px] font-medium text-faint">kcal</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => router.push('/coach')}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-control border border-line bg-surface px-3 py-2 text-[11.5px] font-semibold text-ink-soft transition hover:border-brand/30 hover:text-brand-deep"
              >
                <Chat className="h-3.5 w-3.5" />
                Ask the coach
                <ArrowRight className="h-3 w-3" />
              </button>
            </Card>

            <Card className="anim-rise p-4" style={{ animationDelay: '160ms' }}>
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-semibold">Your targets</p>
                <button
                  onClick={() => {
                    setTempGoals(goals);
                    setGoalsModalOpen(true);
                  }}
                  className="text-[10.5px] font-semibold text-brand transition hover:text-brand-deep"
                >
                  Edit
                </button>
              </div>

              <div className="mt-2.5 space-y-2">
                {[
                  { label: 'Calories', value: goals.calories.toLocaleString(), unit: 'kcal', dot: 'bg-brand' },
                  { label: 'Protein', value: goals.protein, unit: 'g', dot: 'bg-macro-protein' },
                  { label: 'Carbs', value: goals.carbs, unit: 'g', dot: 'bg-macro-carbs' },
                  { label: 'Fats', value: goals.fats, unit: 'g', dot: 'bg-macro-fats' },
                ].map((target) => (
                  <div key={target.label} className="flex items-center justify-between text-[12px]">
                    <span className="flex items-center gap-2 text-muted">
                      <span className={`h-2 w-2 rounded-full ${target.dot}`} />
                      {target.label}
                    </span>
                    <span className="nums font-semibold text-ink">
                      {target.value}
                      <span className="ml-1 text-[10px] font-medium text-faint">{target.unit}</span>
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-3 border-t border-line-soft pt-2.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-muted">
                    <Flame className="h-3.5 w-3.5 text-ember" />
                    {streak > 0 ? `${streak}-day streak` : 'No streak yet'}
                  </span>
                  <div className="flex gap-1">
                    {streakDots.map((dot) => (
                      <span
                        key={dot.date}
                        title={`${formatLongDate(dot.date)}${dot.met ? ' — target met' : ''}`}
                        className={`h-1.5 w-3 rounded-full ${
                          dot.met
                            ? 'bg-leaf'
                            : dot.logged
                              ? 'bg-brand-soft'
                              : 'bg-surface-soft'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* ---------- Recent meals · micronutrients ---------- */}
        <div className="grid gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
          <Card className="anim-rise p-4 sm:p-5" style={{ animationDelay: '80ms' }}>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-[14px] font-semibold">
                  {selectedDate === today ? 'Today’s meals' : 'Meals'}
                </p>
                <p className="mt-0.5 text-[11.5px] text-muted">
                  {logs.length === 0
                    ? 'Nothing logged yet'
                    : `${logs.length} meal${logs.length === 1 ? '' : 's'} · most recent first`}
                </p>
              </div>
              <button
                onClick={() => router.push('/history')}
                className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-brand transition hover:text-brand-deep"
              >
                View history
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            {logs.length === 0 ? (
              <EmptyState
                icon={<Bowl className="h-5 w-5" />}
                title="Your day is a blank plate"
                hint="Describe a meal above and NutriCal will do the maths."
                action={
                  <Button variant="outline" size="sm" onClick={() => setManualModalOpen(true)}>
                    <Plus className="h-3.5 w-3.5" />
                    Add manual meal
                  </Button>
                }
              />
            ) : (
              <ul className="divide-y divide-line-soft">
                {logs.map((log, index) => {
                  const timeStr = new Date(log.created_at).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  });
                  return (
                    <li
                      key={log.id}
                      className="anim-row-in group flex items-center gap-3 py-3"
                      style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-mist text-brand">
                        <Bowl className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <h3 className="truncate text-[13px] font-semibold">{log.meal_name}</h3>
                          <span className="nums shrink-0 text-[12px] font-semibold">
                            {Number(log.calories).toLocaleString()}
                            <span className="ml-0.5 text-[9.5px] font-medium text-faint">kcal</span>
                          </span>
                        </div>
                        <p className="nums mt-0.5 truncate text-[10.5px] text-muted">
                          {timeStr} · P {log.protein}g · C {log.carbs}g · F {log.fats}g
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteMeal(log.id)}
                        className="shrink-0 rounded-full p-2 text-faint opacity-100 transition hover:bg-danger-soft hover:text-danger sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                        title="Remove meal"
                        aria-label={`Remove ${log.meal_name}`}
                      >
                        <Trash className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card className="anim-rise p-4 sm:p-5" style={{ animationDelay: '120ms' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[14px] font-semibold">Micronutrients</p>
                <p className="mt-0.5 text-[11.5px] text-muted">Estimated daily intake</p>
              </div>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-leaf-soft text-leaf">
                <Droplet className="h-3.5 w-3.5" />
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
              {MICRO_TARGETS.map((micro) => {
                const value = Math.round(microTotals[micro.key]);
                const pct = clampPercent(percentOf(microTotals[micro.key], micro.target));
                return (
                  <div key={micro.key}>
                    <div className="flex items-baseline justify-between">
                      <p className="truncate text-[10.5px] font-medium text-muted">{micro.label}</p>
                      <p className="nums ml-1 shrink-0 text-[9.5px] text-faint">{pct}%</p>
                    </div>
                    <p className="nums mt-0.5 text-[14px] font-semibold leading-none">
                      {value.toLocaleString()}
                      <span className="ml-1 text-[9px] font-medium text-faint">
                        / {micro.target.toLocaleString()}
                        {micro.unit}
                      </span>
                    </p>
                    <Progress
                      value={pct}
                      colorClass="bg-leaf"
                      className="mt-1.5 !h-1"
                      label={`${micro.label} progress`}
                    />
                  </div>
                );
              })}
            </div>

            <p className="mt-3 border-t border-line-soft pt-2.5 text-[10px] leading-relaxed text-faint">
              General adult reference values — estimates, not a lab report.
            </p>
          </Card>
        </div>
      </div>

      {/* ---------- Goals modal ---------- */}
      {goalsModalOpen && (
        <Modal title="Adjust nutrition targets" onClose={() => setGoalsModalOpen(false)}>
          <form onSubmit={handleSaveGoals} className="space-y-4">
            <div className="flex items-center justify-between rounded-panel bg-surface-soft px-3.5 py-2.5">
              <span className="text-[12px] text-muted">Current source</span>
              <Badge tone="brand">{GOAL_SOURCE_LABEL[goalsSource]}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Calories (kcal)', key: 'calories' as const },
                { label: 'Protein (g)', key: 'protein' as const },
                { label: 'Carbs (g)', key: 'carbs' as const },
                { label: 'Fats (g)', key: 'fats' as const },
              ].map((field) => (
                <Field key={field.key} label={field.label}>
                  <input
                    type="number"
                    min={0}
                    value={tempGoals[field.key]}
                    onChange={(e) =>
                      setTempGoals({ ...tempGoals, [field.key]: Number(e.target.value) })
                    }
                    className={inputClass}
                    required
                  />
                </Field>
              ))}
            </div>

            <div className="flex justify-end gap-2 border-t border-line-soft pt-4">
              <Button type="button" variant="ghost" size="sm" onClick={() => setGoalsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm">
                Save targets
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ---------- Manual meal modal ---------- */}
      {manualModalOpen && (
        <Modal title="Manual meal entry" onClose={() => setManualModalOpen(false)} wide>
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <Field label="Food / description">
              <input
                type="text"
                required
                autoFocus
                placeholder="e.g. Grilled chicken salad"
                value={manualForm.mealName}
                onChange={(e) => setManualForm({ ...manualForm, mealName: e.target.value })}
                className={inputClass}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Calories', key: 'calories' as const, ph: '450' },
                { label: 'Protein (g)', key: 'protein' as const, ph: '35' },
                { label: 'Carbs (g)', key: 'carbs' as const, ph: '20' },
                { label: 'Fats (g)', key: 'fats' as const, ph: '12' },
              ].map((field) => (
                <Field key={field.key} label={field.label}>
                  <input
                    type="number"
                    min={0}
                    placeholder={field.ph}
                    value={manualForm[field.key]}
                    onChange={(e) =>
                      setManualForm({ ...manualForm, [field.key]: e.target.value })
                    }
                    className={inputClass}
                  />
                </Field>
              ))}
            </div>

            <details className="group rounded-panel border border-line-soft">
              <summary className="cursor-pointer list-none px-4 py-3 text-[12.5px] font-semibold text-muted transition hover:text-ink">
                Vitamins & minerals <span className="font-normal text-faint">(optional)</span>
              </summary>
              <div className="grid grid-cols-2 gap-3 px-4 pb-4 sm:grid-cols-3">
                {[
                  { label: 'Vit A (mcg)', key: 'vitamin_a_mcg' as const },
                  { label: 'Vit C (mg)', key: 'vitamin_c_mg' as const },
                  { label: 'Vit D (mcg)', key: 'vitamin_d_mcg' as const },
                  { label: 'Iron (mg)', key: 'iron_mg' as const },
                  { label: 'Calcium (mg)', key: 'calcium_mg' as const },
                  { label: 'Potassium (mg)', key: 'potassium_mg' as const },
                ].map((field) => (
                  <Field key={field.key} label={field.label}>
                    <input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={manualForm[field.key]}
                      onChange={(e) =>
                        setManualForm({ ...manualForm, [field.key]: e.target.value })
                      }
                      className={inputClass}
                    />
                  </Field>
                ))}
              </div>
            </details>

            <div className="flex justify-end gap-2 border-t border-line-soft pt-4">
              <Button type="button" variant="ghost" onClick={() => setManualModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={submitting}>
                Add meal
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </AppShell>
  );
}
