'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import {
  DEFAULT_GOALS,
  calculateGoalsFromProfile,
  type ProfileForGoals,
} from '@/lib/goals';
import {
  addDays,
  aggregateMealRows,
  clampPercent,
  formatLongDate,
  formatMonthYear,
  percentOf,
  toDateKey,
  todayKey,
  type DailyTotals,
  type MealTotalsRow,
} from '@/lib/stats';
import { AppShell } from '@/components/nav';
import {
  Button,
  Card,
  Badge,
  Alert,
  EmptyState,
  LoadingState,
  Progress,
} from '@/components/ui';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Bowl,
  Flame,
  Dumbbell,
  Droplet,
  Clock,
  Plus,
  ArrowRight,
} from '@/components/icons';

interface Goals {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

interface MealLog {
  id: string;
  meal_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  created_at: string;
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function HistoryPage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [name, setName] = useState('');
  const [goals, setGoals] = useState<Goals>(DEFAULT_GOALS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [monthCursor, setMonthCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(() => todayKey());
  const [monthDaily, setMonthDaily] = useState<Record<string, DailyTotals>>({});
  const [monthLoading, setMonthLoading] = useState(false);
  const [dayMeals, setDayMeals] = useState<MealLog[]>([]);
  const [dayLoading, setDayLoading] = useState(false);

  // Auth + goals + name
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

      const [{ data: profileRow }, { data: goalRow }] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', user.id).single(),
        supabase
          .from('nutrition_goals')
          .select('*')
          .eq('user_id', user.id)
          .single(),
      ]);

      if (profileRow?.full_name) setName(profileRow.full_name);

      let activeGoals: Goals = DEFAULT_GOALS;
      if (goalRow) {
        activeGoals = {
          calories: Number(goalRow.calorie_target),
          protein: Number(goalRow.protein_target),
          carbs: Number(goalRow.carbs_target),
          fats: Number(goalRow.fats_target),
        };
      } else if (profileRow) {
        const profileForGoals: ProfileForGoals = {
          age: profileRow.age,
          gender: profileRow.gender,
          height_cm: profileRow.height_cm,
          weight_kg: profileRow.weight_kg,
          activity_level: profileRow.activity_level,
          primary_goal: profileRow.primary_goal,
        };
        const calculated = calculateGoalsFromProfile(profileForGoals);
        if (calculated.canCalculate) activeGoals = calculated.goals;
      }

      setGoals(activeGoals);
      setLoading(false);
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Month totals
  useEffect(() => {
    if (!user) return;
    const loadMonth = async () => {
      setMonthLoading(true);
      setError('');
      setMonthDaily({});
      const year = monthCursor.getFullYear();
      const month = monthCursor.getMonth();
      const start = toDateKey(new Date(year, month, 1));
      const end = toDateKey(new Date(year, month + 1, 0));

      const { data, error } = await supabase
        .from('meal_logs')
        .select('logged_date, calories, protein, carbs, fats')
        .eq('user_id', user.id)
        .gte('logged_date', start)
        .lte('logged_date', end);

      if (error) {
        setError('Could not load this month: ' + error.message);
      } else {
        setMonthDaily(aggregateMealRows((data ?? []) as MealTotalsRow[]));
      }
      setMonthLoading(false);
    };

    loadMonth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, monthCursor]);

  // Selected day meals
  useEffect(() => {
    if (!user) return;
    const loadDay = async () => {
      setDayLoading(true);
      const { data, error } = await supabase
        .from('meal_logs')
        .select('id, meal_name, calories, protein, carbs, fats, created_at')
        .eq('user_id', user.id)
        .eq('logged_date', selectedDate)
        .order('created_at', { ascending: false });

      if (error) {
        setError('Could not load this day: ' + error.message);
      } else {
        setDayMeals((data ?? []) as MealLog[]);
      }
      setDayLoading(false);
    };

    loadDay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedDate]);

  const today = todayKey();
  const year = monthCursor.getFullYear();
  const month = monthCursor.getMonth();
  const isCurrentMonth = `${year}-${String(month + 1).padStart(2, '0')}` === today.slice(0, 7);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingBlanks = (new Date(year, month, 1).getDay() + 6) % 7;

  const cells = useMemo(() => {
    const blanks = Array.from({ length: leadingBlanks }, () => null);
    const days = Array.from({ length: daysInMonth }, (_, index) => index + 1);
    return [...blanks, ...days];
  }, [leadingBlanks, daysInMonth]);

  const monthStats = useMemo(() => {
    let loggedDays = 0;
    let totalCalories = 0;
    let metTarget = 0;
    for (const totals of Object.values(monthDaily)) {
      if (totals.calories > 0) {
        loggedDays += 1;
        totalCalories += totals.calories;
        if (
          totals.calories >= goals.calories * 0.9 &&
          totals.calories <= goals.calories * 1.1
        ) {
          metTarget += 1;
        }
      }
    }
    return {
      loggedDays,
      averageCalories: loggedDays > 0 ? Math.round(totalCalories / loggedDays) : 0,
      metTarget,
    };
  }, [monthDaily, goals.calories]);

  const dayTotals = useMemo(
    () =>
      dayMeals.reduce(
        (acc, meal) => ({
          calories: acc.calories + (Number(meal.calories) || 0),
          protein: acc.protein + (Number(meal.protein) || 0),
          carbs: acc.carbs + (Number(meal.carbs) || 0),
          fats: acc.fats + (Number(meal.fats) || 0),
        }),
        { calories: 0, protein: 0, carbs: 0, fats: 0 }
      ),
    [dayMeals]
  );

  const changeMonth = (delta: number) => {
    if (delta > 0 && isCurrentMonth) return;
    const next = new Date(year, month + delta, 1);
    setMonthCursor(next);
    const now = new Date();
    if (next.getFullYear() === now.getFullYear() && next.getMonth() === now.getMonth()) {
      setSelectedDate(todayKey());
    } else {
      setSelectedDate(toDateKey(new Date(next.getFullYear(), next.getMonth(), 1)));
    }
  };

  const goToToday = () => {
    const now = new Date();
    setMonthCursor(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(todayKey());
  };

  const selectedLabel = formatLongDate(selectedDate);
  const dayPercent = clampPercent(percentOf(dayTotals.calories, goals.calories));

  if (loading) {
    return <LoadingState label="Loading your history..." />;
  }

  return (
    <AppShell active="history" userEmail={user?.email} userName={name || undefined}>
      <div className="mx-auto w-full max-w-[1400px] space-y-4 sm:space-y-5">
        {error && (
          <Alert tone="danger" onDismiss={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Header */}
        <div className="anim-rise flex flex-wrap items-end justify-between gap-4 pt-1">
          <div>
            <p className="eyebrow text-brand">History</p>
            <h1 className="display mt-1.5 text-[28px] sm:text-[34px]">
              Every logged day, in one place.
            </h1>
            <p className="mt-1.5 text-[13.5px] text-muted">
              Pick a date to revisit meals and daily totals.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={goToToday}
              className="flex items-center gap-1.5 rounded-control border border-line bg-surface px-3 py-2 text-[12px] font-semibold text-ink-soft shadow-card transition hover:border-faint"
            >
              <Calendar className="h-3.5 w-3.5 text-brand" />
              Today
            </button>
            <Button
              size="sm"
              onClick={() => router.push('/dashboard#log-meal')}
              className="hidden sm:inline-flex"
            >
              <Plus className="h-3.5 w-3.5" />
              Log a meal
            </Button>
          </div>
        </div>

        <div className="grid gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1.25fr)]">
          {/* Calendar */}
          <Card className="anim-rise p-4 sm:p-5" style={{ animationDelay: '60ms' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[14px] font-semibold">{formatMonthYear(monthCursor)}</p>
                <p className="mt-0.5 text-[11px] text-muted">
                  {monthLoading
                    ? 'Loading…'
                    : `${monthStats.loggedDays} day${monthStats.loggedDays === 1 ? '' : 's'} logged · ${monthStats.metTarget} on target`}
                </p>
              </div>
              <div className="flex items-center gap-1 rounded-control border border-line bg-surface p-0.5">
                <button
                  onClick={() => changeMonth(-1)}
                  className="rounded-lg p-1.5 text-muted transition hover:bg-surface-soft hover:text-ink"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => changeMonth(1)}
                  disabled={isCurrentMonth}
                  className="rounded-lg p-1.5 text-muted transition hover:bg-surface-soft hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="Next month"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-7 gap-1">
              {WEEKDAYS.map((weekday) => (
                <div
                  key={weekday}
                  className="pb-1.5 text-center text-[9.5px] font-semibold uppercase tracking-[0.08em] text-faint"
                >
                  {weekday}
                </div>
              ))}

              {cells.map((day, index) => {
                if (day === null) {
                  return <div key={`blank-${index}`} className="aspect-square" />;
                }
                const key = toDateKey(new Date(year, month, day));
                const totals = monthDaily[key];
                const hasData = Boolean(totals && totals.calories > 0);
                const isSelected = key === selectedDate;
                const isToday = key === today;
                const isFuture = key > today;
                const metTarget =
                  hasData &&
                  totals &&
                  totals.calories >= goals.calories * 0.9 &&
                  totals.calories <= goals.calories * 1.1;

                return (
                  <button
                    key={key}
                    onClick={() => !isFuture && setSelectedDate(key)}
                    disabled={isFuture}
                    aria-label={formatLongDate(key)}
                    aria-pressed={isSelected}
                    className={`group relative flex aspect-square flex-col items-center justify-center rounded-[10px] border text-center transition ${
                      isSelected
                        ? 'border-brand bg-brand text-white shadow-card'
                        : hasData
                          ? 'border-brand/15 bg-brand-mist text-brand hover:border-brand/40'
                          : 'border-transparent text-ink-soft hover:bg-surface-soft'
                    } ${isFuture ? 'cursor-not-allowed opacity-30' : ''}`}
                  >
                    <span className={`nums text-[12px] font-semibold ${isToday && !isSelected ? 'text-brand' : ''}`}>
                      {day}
                    </span>
                    {hasData && (
                      <span
                        className={`mt-0.5 hidden text-[8px] leading-none sm:block ${
                          isSelected ? 'text-white/70' : 'text-faint'
                        }`}
                      >
                        {Math.round(totals.calories).toLocaleString()}
                      </span>
                    )}
                    {hasData && (
                      <span
                        className={`absolute bottom-1 h-1 w-1 rounded-full sm:hidden ${
                          isSelected
                            ? 'bg-white'
                            : metTarget
                              ? 'bg-leaf'
                              : 'bg-brand/50'
                        }`}
                      />
                    )}
                    {isToday && !isSelected && (
                      <span className="absolute right-1 top-1 h-1 w-1 rounded-full bg-brand" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-line-soft pt-3 text-[10px] text-faint">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-brand" /> Selected
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-leaf" /> Target met
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-brand-mist" /> Logged
              </span>
            </div>

            {monthStats.loggedDays > 0 && (
              <div className="mt-3 rounded-panel bg-paper px-3.5 py-3">
                <div className="flex items-center justify-between text-[11.5px]">
                  <span className="text-muted">Average per logged day</span>
                  <span className="nums font-semibold">
                    {monthStats.averageCalories.toLocaleString()} kcal
                  </span>
                </div>
              </div>
            )}
          </Card>

          {/* Day detail */}
          <div className="space-y-3 sm:space-y-4">
            <Card className="anim-rise p-4 sm:p-5" style={{ animationDelay: '100ms' }}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-faint">
                    Daily summary
                  </p>
                  <p className="mt-1 text-[16px] font-semibold">{selectedLabel}</p>
                </div>
                {dayTotals.calories > 0 ? (
                  <Badge tone={dayPercent > 110 ? 'ember' : 'brand'}>
                    {dayPercent}% of target
                  </Badge>
                ) : (
                  <Badge tone="neutral">No meals</Badge>
                )}
              </div>

              <div className="mt-3 flex items-center gap-3">
                <Progress value={dayPercent} colorClass="bg-brand" className="flex-1" />
                <span className="nums shrink-0 text-[10.5px] font-semibold text-muted">
                  {Math.round(dayTotals.calories).toLocaleString()} /{' '}
                  {goals.calories.toLocaleString()} kcal
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {[
                  { label: 'Calories', value: Math.round(dayTotals.calories), unit: 'kcal', icon: Flame, chip: 'bg-brand-soft text-brand-deep' },
                  { label: 'Protein', value: Math.round(dayTotals.protein), unit: 'g', icon: Dumbbell, chip: 'bg-macro-protein-soft text-macro-protein' },
                  { label: 'Carbs', value: Math.round(dayTotals.carbs), unit: 'g', icon: Bowl, chip: 'bg-macro-carbs-soft text-macro-carbs' },
                  { label: 'Fats', value: Math.round(dayTotals.fats), unit: 'g', icon: Droplet, chip: 'bg-macro-fats-soft text-macro-fats' },
                ].map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.label} className="rounded-panel bg-paper px-3 py-2.5">
                      <p className="flex items-center gap-1 text-[9.5px] font-medium text-faint">
                        <Icon className="h-3 w-3" />
                        {stat.label}
                      </p>
                      <p className="nums mt-0.5 text-[16px] font-semibold leading-none">
                        {stat.value}
                        <span className="ml-0.5 text-[9px] font-medium text-faint">{stat.unit}</span>
                      </p>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="anim-rise p-4 sm:p-5" style={{ animationDelay: '140ms' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[14px] font-semibold">Meals</p>
                  <p className="mt-0.5 text-[11.5px] text-muted">
                    {dayMeals.length === 0
                      ? 'Nothing recorded for this day'
                      : `${dayMeals.length} meal${dayMeals.length === 1 ? '' : 's'} · most recent first`}
                  </p>
                </div>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-mist text-brand">
                  <Clock className="h-4 w-4" />
                </span>
              </div>

              <div className="mt-3">
                {dayLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand border-t-transparent" />
                  </div>
                ) : dayMeals.length === 0 ? (
                  <EmptyState
                    icon={<Bowl className="h-5 w-5" />}
                    title={
                      selectedDate === today
                        ? 'Nothing logged today yet'
                        : 'No meals on this date'
                    }
                    hint="Your logged meals and daily totals will appear here."
                    action={
                      selectedDate === today ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push('/dashboard#log-meal')}
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Log a meal
                        </Button>
                      ) : undefined
                    }
                  />
                ) : (
                  <ul className="divide-y divide-line-soft">
                    {dayMeals.map((meal, index) => {
                      const time = new Date(meal.created_at).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      });
                      return (
                        <li
                          key={meal.id}
                          className="anim-row-in flex items-center gap-3 py-3"
                          style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-soft text-ink-soft">
                            <Bowl className="h-4 w-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline justify-between gap-2">
                              <h3 className="truncate text-[13px] font-semibold">{meal.meal_name}</h3>
                              <span className="nums shrink-0 text-[12px] font-semibold">
                                {Number(meal.calories).toLocaleString()}
                                <span className="ml-0.5 text-[9.5px] font-medium text-faint">kcal</span>
                              </span>
                            </div>
                            <p className="nums mt-0.5 truncate text-[10.5px] text-muted">
                              {time} · P {meal.protein}g · C {meal.carbs}g · F {meal.fats}g
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {selectedDate !== today && (
                <button
                  onClick={() => {
                    setSelectedDate(addDays(selectedDate, 1));
                    const next = new Date(`${addDays(selectedDate, 1)}T00:00:00`);
                    setMonthCursor(new Date(next.getFullYear(), next.getMonth(), 1));
                  }}
                  disabled={addDays(selectedDate, 1) > today}
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-control border border-line bg-surface px-3 py-2 text-[11.5px] font-semibold text-ink-soft transition hover:border-brand/30 hover:text-brand-deep disabled:opacity-40"
                >
                  Next day
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
