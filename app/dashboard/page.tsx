'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

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

const DEFAULT_GOALS: Goals = {
  calories: 2200,
  protein: 140,
  carbs: 250,
  fats: 65,
};

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [logs, setLogs] = useState<MealLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Active View Tab
  const [activeTab, setActiveTab] = useState<'today' | 'history' | 'goals'>('today');

  // Date Navigation State
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Dynamic Goal-Completion Streak State
  const [streak, setStreak] = useState<number>(0);

  // Goals State
  const [goals, setGoals] = useState<Goals>(DEFAULT_GOALS);
  const [tempGoals, setTempGoals] = useState<Goals>(DEFAULT_GOALS);
  const [isEditingGoals, setIsEditingGoals] = useState(false);

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
    let checkDate = new Date();

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

      // Load saved user goals
      let activeGoals = DEFAULT_GOALS;
      const savedGoals = localStorage.getItem(`nutrical_goals_${user.id}`);
      if (savedGoals) {
        try {
          const parsed = JSON.parse(savedGoals);
          activeGoals = parsed;
          setGoals(parsed);
          setTempGoals(parsed);
        } catch {
          setGoals(DEFAULT_GOALS);
          setTempGoals(DEFAULT_GOALS);
        }
      }

      await calculateTargetStreak(user.id, activeGoals);
      setLoading(false);
    };

    fetchUserData();
  }, []);

  // Fetch logs whenever the selected date changes
  useEffect(() => {
    if (user) {
      fetchLogsForDate(user.id, selectedDate);
    }
  }, [selectedDate]);

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

  // --- ACTIONS ---
  const handleSaveGoals = async (e: React.FormEvent) => {
    e.preventDefault();
    setGoals(tempGoals);
    if (user) {
      localStorage.setItem(`nutrical_goals_${user.id}`, JSON.stringify(tempGoals));
      await calculateTargetStreak(user.id, tempGoals);
    }
    setIsEditingGoals(false);
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
        alert(data.error || 'Failed to estimate');
      }
    } catch (err: any) {
      alert('Error contacting AI: ' + (err.message || err));
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
      alert('Error saving meal: ' + error.message);
    } else {
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
    const { error } = await supabase.from('meal_logs').delete().eq('id', id);
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
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
          <span className="text-sm font-medium text-zinc-500">Loading NutriCal...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 font-sans antialiased selection:bg-emerald-100 selection:text-emerald-900 pb-24">
      {/* 1. TOP HEADER */}
      <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
              <span className="text-base font-semibold tracking-tight text-zinc-950">NutriCal</span>
            </div>

            <nav className="hidden sm:flex items-center gap-1 text-sm">
              <button
                onClick={() => setActiveTab('today')}
                className={`rounded-md px-3 py-1 font-medium transition-colors ${
                  activeTab === 'today'
                    ? 'text-zinc-950 bg-zinc-100'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`rounded-md px-3 py-1 font-medium transition-colors ${
                  activeTab === 'history'
                    ? 'text-zinc-950 bg-zinc-100'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                History
              </button>
              <button
                onClick={() => setIsEditingGoals(!isEditingGoals)}
                className={`rounded-md px-3 py-1 font-medium transition-colors ${
                  isEditingGoals
                    ? 'text-zinc-950 bg-zinc-100'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                Targets
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {/* Dynamic Goal Completion Streak Indicator */}
            <div
              className="flex items-center gap-1.5 rounded-full border border-zinc-200/70 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-600"
              title={
                streak > 0
                  ? `${streak} consecutive day(s) hitting daily nutrition targets`
                  : 'Hit your daily target (90%-110% calories) to build your streak'
              }
            >
              <span className={streak > 0 ? 'text-amber-500' : 'text-zinc-300'}>🔥</span>
              <span>{streak > 0 ? `${streak}d target streak` : '0d streak'}</span>
            </div>

            <div className="h-4 w-px bg-zinc-200" />

            <div className="flex items-center gap-3">
              <span className="hidden md:inline text-xs text-zinc-500 max-w-[140px] truncate">
                {user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 2. MAIN CONTAINER */}
      <main className="mx-auto max-w-4xl px-6 pt-8">
        {/* COMPACT ARCHITECTURAL DATE SELECTOR */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center rounded-lg border border-zinc-200/80 bg-white p-0.5 shadow-xs">
              <button
                onClick={() => shiftDate(-1)}
                className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
                aria-label="Previous day"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="relative px-3 py-1">
                <span className="text-sm font-semibold text-zinc-900 cursor-pointer">
                  {formattedDateTitle}
                </span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  title="Pick a date"
                />
              </div>
              <button
                onClick={() => shiftDate(1)}
                className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
                aria-label="Next day"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {selectedDate !== todayStr && (
              <button
                onClick={() => setSelectedDate(todayStr)}
                className="text-xs font-medium text-emerald-600 hover:text-emerald-700 px-2 py-1 transition-colors"
              >
                Back to today
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setManualModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200/80 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors shadow-xs"
            >
              <span>+</span> Manual entry
            </button>
          </div>
        </div>

        {/* TARGETS CONFIGURATION DRAWER */}
        {isEditingGoals && (
          <div className="mb-8 rounded-xl border border-zinc-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900">Personalized Nutrition Targets</h3>
                <p className="text-xs text-zinc-500">Fine-tune your daily calorie and macronutrient baseline.</p>
              </div>
              <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                Customized for your activity
              </span>
            </div>

            <form onSubmit={handleSaveGoals} className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                  Calories (kcal)
                </label>
                <input
                  type="number"
                  value={tempGoals.calories}
                  onChange={(e) => setTempGoals({ ...tempGoals, calories: Number(e.target.value) })}
                  className="w-full rounded-md border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-900 focus:border-zinc-400 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                  Protein (g)
                </label>
                <input
                  type="number"
                  value={tempGoals.protein}
                  onChange={(e) => setTempGoals({ ...tempGoals, protein: Number(e.target.value) })}
                  className="w-full rounded-md border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-900 focus:border-zinc-400 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                  Carbohydrates (g)
                </label>
                <input
                  type="number"
                  value={tempGoals.carbs}
                  onChange={(e) => setTempGoals({ ...tempGoals, carbs: Number(e.target.value) })}
                  className="w-full rounded-md border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-900 focus:border-zinc-400 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                  Fats (g)
                </label>
                <input
                  type="number"
                  value={tempGoals.fats}
                  onChange={(e) => setTempGoals({ ...tempGoals, fats: Number(e.target.value) })}
                  className="w-full rounded-md border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-900 focus:border-zinc-400 focus:outline-none"
                  required
                />
              </div>
              <div className="col-span-2 sm:col-span-4 flex justify-end gap-2 pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsEditingGoals(false)}
                  className="rounded-md px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-zinc-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 transition-colors"
                >
                  Save Targets
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 3. HERO OVERVIEW: "HOW AM I DOING TODAY?" */}
        <section className="mb-8 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-baseline md:justify-between pb-6 border-b border-zinc-100">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                {selectedDate === todayStr ? "Today's Energy Balance" : `Daily Total · ${selectedDate}`}
              </span>
              <div className="mt-2 flex items-baseline gap-3">
                <span className="text-4xl font-semibold tracking-tight text-zinc-950">
                  {totals.calories.toLocaleString()}
                </span>
                <span className="text-base text-zinc-500 font-normal">
                  / {goals.calories.toLocaleString()} kcal
                </span>
                <span className="ml-2 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
                  {calPercent}% of target
                </span>
              </div>
            </div>

            <div className="mt-4 md:mt-0 text-sm text-zinc-500">
              {remainingCalories >= 0 ? (
                <span>
                  <strong className="font-semibold text-zinc-800">{remainingCalories.toLocaleString()} kcal</strong> remaining
                </span>
              ) : (
                <span className="text-rose-600 font-medium">
                  {Math.abs(remainingCalories).toLocaleString()} kcal over target
                </span>
              )}
            </div>
          </div>

          {/* Thin Progress Track */}
          <div className="mt-4 w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                totals.calories > goals.calories ? 'bg-rose-500' : 'bg-emerald-600'
              }`}
              style={{ width: `${calPercent}%` }}
            />
          </div>

          {/* Core Macronutrients Row */}
          <div className="mt-6 grid grid-cols-3 gap-6 pt-2">
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs font-medium text-zinc-500">Protein</span>
                <span className="text-xs font-medium text-zinc-400">{proteinPercent}%</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-semibold text-zinc-900">{totals.protein}g</span>
                <span className="text-xs text-zinc-400">/ {goals.protein}g</span>
              </div>
              <div className="mt-2 h-1 w-full bg-zinc-100 rounded-full overflow-hidden">
                <div
                  className="h-1 bg-emerald-600 rounded-full transition-all duration-300"
                  style={{ width: `${proteinPercent}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs font-medium text-zinc-500">Carbs</span>
                <span className="text-xs font-medium text-zinc-400">{carbsPercent}%</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-semibold text-zinc-900">{totals.carbs}g</span>
                <span className="text-xs text-zinc-400">/ {goals.carbs}g</span>
              </div>
              <div className="mt-2 h-1 w-full bg-zinc-100 rounded-full overflow-hidden">
                <div
                  className="h-1 bg-amber-500 rounded-full transition-all duration-300"
                  style={{ width: `${carbsPercent}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs font-medium text-zinc-500">Fats</span>
                <span className="text-xs font-medium text-zinc-400">{fatsPercent}%</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-semibold text-zinc-900">{totals.fats}g</span>
                <span className="text-xs text-zinc-400">/ {goals.fats}g</span>
              </div>
              <div className="mt-2 h-1 w-full bg-zinc-100 rounded-full overflow-hidden">
                <div
                  className="h-1 bg-indigo-500 rounded-full transition-all duration-300"
                  style={{ width: `${fatsPercent}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* 4. NATURAL-LANGUAGE SMART ESTIMATE INPUT */}
        <section className="mb-8 rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              ✨ Quick Log with AI
            </span>
          </div>

          <form onSubmit={handleSmartEstimate} className="relative flex items-center">
            <input
              type="text"
              placeholder="e.g., 2 eggs, 2 slices of whole wheat toast, and black coffee..."
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white focus:outline-none transition-all pr-28"
            />
            <button
              type="submit"
              disabled={aiLoading || !quickInput.trim()}
              className="absolute right-1.5 rounded-lg bg-zinc-950 px-4 py-2 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-30 transition-all flex items-center gap-1.5"
            >
              {aiLoading ? (
                <>
                  <div className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                  <span>Estimating...</span>
                </>
              ) : (
                <span>Estimate</span>
              )}
            </button>
          </form>

          {/* Quick Examples */}
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-zinc-500">
            <span className="text-zinc-400">Try:</span>
            <button
              type="button"
              onClick={() => setQuickInput('2 boiled eggs, 1 slice toast and an apple')}
              className="text-zinc-600 hover:text-zinc-950 underline decoration-zinc-300 underline-offset-2 transition-colors"
            >
              "2 boiled eggs, toast & apple"
            </button>
            <span className="text-zinc-300">·</span>
            <button
              type="button"
              onClick={() => setQuickInput('1 bowl chicken biryani with cucumber raita')}
              className="text-zinc-600 hover:text-zinc-950 underline decoration-zinc-300 underline-offset-2 transition-colors"
            >
              "Chicken biryani & raita"
            </button>
            <span className="text-zinc-300">·</span>
            <button
              type="button"
              onClick={() => setQuickInput('1 scoop whey protein with 250ml milk and almonds')}
              className="text-zinc-600 hover:text-zinc-950 underline decoration-zinc-300 underline-offset-2 transition-colors"
            >
              "Whey shake with milk"
            </button>
          </div>

          {/* AI ESTIMATE REVIEW CHIP */}
          {draftMeal && (
            <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-emerald-800">Estimated Breakdown:</span>
                    <h4 className="text-sm font-semibold text-zinc-900">{draftMeal.meal_name}</h4>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-zinc-600">
                    <span className="font-semibold text-zinc-900">{draftMeal.calories} kcal</span>
                    <span>·</span>
                    <span>Protein: {draftMeal.protein}g</span>
                    <span>·</span>
                    <span>Carbs: {draftMeal.carbs}g</span>
                    <span>·</span>
                    <span>Fats: {draftMeal.fats}g</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDraftMeal(null)}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-200/60 transition-colors"
                  >
                    Discard
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleCommitMeal(draftMeal)}
                    className="rounded-lg bg-emerald-700 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 shadow-xs transition-colors"
                  >
                    {submitting ? 'Saving...' : 'Add to Log'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* 5. MEAL TIMELINE */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Meals Logged ({logs.length})
            </h3>
            {logs.length > 0 && (
              <span className="text-xs text-zinc-400">
                Sorted by most recent
              </span>
            )}
          </div>

          {logs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-200 bg-white/50 p-12 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 mb-3">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h4 className="text-sm font-semibold text-zinc-900">Your nutrition timeline is clear</h4>
              <p className="mt-1 text-xs text-zinc-500 max-w-xs mx-auto">
                Use the AI quick log above or manual entry to log what you ate for this day.
              </p>
              <button
                onClick={() => setManualModalOpen(true)}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors shadow-xs"
              >
                + Add manual meal
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => {
                const timeStr = new Date(log.created_at).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                });

                return (
                  <div
                    key={log.id}
                    className="group flex items-center justify-between rounded-xl border border-zinc-200/70 bg-white px-5 py-4 transition-all hover:border-zinc-300 hover:shadow-xs"
                  >
                    <div className="flex items-start gap-4">
                      <div className="pt-0.5 text-[11px] font-mono font-medium text-zinc-400">
                        {timeStr}
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-zinc-900 group-hover:text-zinc-950">
                          {log.meal_name}
                        </h4>
                        <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
                          <span className="font-semibold text-zinc-700">{log.calories} kcal</span>
                          <span className="text-zinc-300">·</span>
                          <span>P: {log.protein}g</span>
                          <span className="text-zinc-300">·</span>
                          <span>C: {log.carbs}g</span>
                          <span className="text-zinc-300">·</span>
                          <span>F: {log.fats}g</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteMeal(log.id)}
                      className="opacity-0 group-hover:opacity-100 rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-rose-600 transition-all"
                      title="Remove meal"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 6. MANUAL ENTRY MODAL */}
        {manualModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
                <h3 className="text-base font-semibold text-zinc-900">Manual Meal Entry</h3>
                <button
                  onClick={() => setManualModalOpen(false)}
                  className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-800"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1">Food / Description</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Grilled Chicken Salad"
                    value={manualForm.mealName}
                    onChange={(e) => setManualForm({ ...manualForm, mealName: e.target.value })}
                    className="w-full rounded-lg border border-zinc-300 p-2 text-sm focus:border-zinc-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1">Calories (kcal)</label>
                  <input
                    type="number"
                    placeholder="450"
                    value={manualForm.calories}
                    onChange={(e) => setManualForm({ ...manualForm, calories: e.target.value })}
                    className="w-full rounded-lg border border-zinc-300 p-2 text-sm focus:border-zinc-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-600 mb-1">Protein (g)</label>
                    <input
                      type="number"
                      placeholder="35"
                      value={manualForm.protein}
                      onChange={(e) => setManualForm({ ...manualForm, protein: e.target.value })}
                      className="w-full rounded-lg border border-zinc-300 p-2 text-sm focus:border-zinc-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-600 mb-1">Carbs (g)</label>
                    <input
                      type="number"
                      placeholder="20"
                      value={manualForm.carbs}
                      onChange={(e) => setManualForm({ ...manualForm, carbs: e.target.value })}
                      className="w-full rounded-lg border border-zinc-300 p-2 text-sm focus:border-zinc-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-600 mb-1">Fats (g)</label>
                    <input
                      type="number"
                      placeholder="12"
                      value={manualForm.fats}
                      onChange={(e) => setManualForm({ ...manualForm, fats: e.target.value })}
                      className="w-full rounded-lg border border-zinc-300 p-2 text-sm focus:border-zinc-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={() => setManualModalOpen(false)}
                    className="rounded-lg px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-lg bg-zinc-950 px-5 py-2 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : 'Add Meal'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}