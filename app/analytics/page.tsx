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
  average,
  calculateStreak,
  formatLongDate,
  formatShortDay,
  fromDateKey,
  lastNDates,
  percentOf,
  todayKey,
  type DailyTotals,
  type MealTotalsRow,
} from '@/lib/stats';
import { AppShell } from '@/components/nav';
import { Button, Card, Alert, LoadingState, Badge, Progress } from '@/components/ui';
import {
  LineChart,
  ChartLegend,
  DonutChart,
  BarChart,
  type ChartSeries,
} from '@/components/charts';
import {
  Flame,
  Dumbbell,
  Trophy,
  TrendUp,
  ChartBar,
  Scale,
  ArrowRight,
  Spark,
  Target,
  Bowl,
} from '@/components/icons';

type RangeOption = 7 | 30 | 90;

interface Goals {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

const RANGE_LABEL: Record<RangeOption, string> = {
  7: 'Last 7 days',
  30: 'Last 30 days',
  90: 'Last 90 days',
};

function shortMonthDay(key: string): string {
  return fromDateKey(key).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function bmiCategory(bmi: number): string {
  if (bmi < 18.5) return 'Underweight range';
  if (bmi < 25) return 'Healthy range';
  if (bmi < 30) return 'Overweight range';
  return 'Obesity range';
}

export default function AnalyticsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [range, setRange] = useState<RangeOption>(7);
  const [rows, setRows] = useState<MealTotalsRow[]>([]);
  const [goals, setGoals] = useState<Goals>(DEFAULT_GOALS);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [weight, setWeight] = useState<number | null>(null);
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setEmail(user.email ?? '');

      const [
        { data: profileRow, error: profileError },
        { data: goalRow, error: goalError },
        { data: mealRows, error: mealError },
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', user.id).single(),
        supabase
          .from('nutrition_goals')
          .select('*')
          .eq('user_id', user.id)
          .single(),
        supabase
          .from('meal_logs')
          .select('logged_date, calories, protein, carbs, fats')
          .eq('user_id', user.id)
          .gte('logged_date', addDays(todayKey(), -179))
          .order('logged_date', { ascending: true }),
      ]);

      if (profileError && profileError.code !== 'PGRST116') {
        setError(`Could not load your profile: ${profileError.message}`);
      }
      if (goalError && goalError.code !== 'PGRST116') {
        setError(`Could not load your targets: ${goalError.message}`);
      }
      if (mealError) {
        setError(`Could not load meal history: ${mealError.message}`);
      }

      if (profileRow?.full_name) setName(profileRow.full_name);
      if (profileRow?.weight_kg != null) setWeight(Number(profileRow.weight_kg));
      if (profileRow?.height_cm != null) setHeight(Number(profileRow.height_cm));

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
      setRows((mealRows ?? []) as MealTotalsRow[]);
      setLoading(false);
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dailyTotals = useMemo(() => aggregateMealRows(rows), [rows]);

  const rangeData = useMemo(() => {
    const days = lastNDates(range);
    const values = days.map(
      (day): DailyTotals => dailyTotals[day] ?? { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );

    const previousDays = lastNDates(range, addDays(days[0], -1));
    const previousAverage = average(
      previousDays.map((day) => dailyTotals[day]?.calories ?? 0)
    );

    const loggedDays = values.filter((day) => day.calories > 0).length;
    const averageCalories =
      days.reduce((sum, day) => sum + (dailyTotals[day]?.calories ?? 0), 0) / days.length;
    const averageProtein =
      days.reduce((sum, day) => sum + (dailyTotals[day]?.protein ?? 0), 0) / days.length;

    const proteinConsistency = Math.round(
      (values.filter((day) => day.protein >= goals.protein * 0.9).length / days.length) * 100
    );
    const goalCompletion = Math.round(
      (values.filter(
        (day) =>
          day.calories > 0 &&
          day.calories >= goals.calories * 0.9 &&
          day.calories <= goals.calories * 1.1
      ).length /
        days.length) *
        100
    );

    const proteinCalories = values.reduce((sum, day) => sum + day.protein * 4, 0);
    const carbCalories = values.reduce((sum, day) => sum + day.carbs * 4, 0);
    const fatCalories = values.reduce((sum, day) => sum + day.fats * 9, 0);
    const macroCalories = proteinCalories + carbCalories + fatCalories || 1;

    const delta =
      previousAverage > 0
        ? Math.round(((averageCalories - previousAverage) / previousAverage) * 100)
        : null;

    return {
      days,
      values,
      loggedDays,
      averageCalories,
      averageProtein,
      proteinConsistency,
      goalCompletion,
      previousAverage,
      delta,
      macroShares: {
        protein: Math.round((proteinCalories / macroCalories) * 100),
        carbs: Math.round((carbCalories / macroCalories) * 100),
        fats: Math.round((fatCalories / macroCalories) * 100),
      },
    };
  }, [range, dailyTotals, goals]);

  const streak = useMemo(() => {
    const byDay: Record<string, number> = {};
    for (const row of rows) {
      byDay[row.logged_date] =
        (byDay[row.logged_date] ?? 0) + (Number(row.calories) || 0);
    }
    return calculateStreak(byDay, goals.calories);
  }, [rows, goals.calories]);

  const calorieSeries: ChartSeries[] = [
    {
      key: 'calories',
      label: 'Calories',
      color: 'var(--color-brand)',
      values: rangeData.values.map((day) => day.calories),
    },
  ];

  const calorieLabels = rangeData.days.map((day, index) => {
    const every = range === 7 ? 1 : range === 30 ? 5 : 15;
    if (index % every === 0 || index === rangeData.days.length - 1) {
      return range === 7 ? formatShortDay(day) : shortMonthDay(day);
    }
    return '';
  });

  const proteinDays = useMemo(() => lastNDates(14), []);
  const proteinSeriesLabels = proteinDays.map((day) => formatShortDay(day));
  const proteinSeriesValues = proteinDays.map(
    (day) => dailyTotals[day]?.protein ?? 0
  );

  const bestProteinDay = useMemo(() => {
    let best: { day: string; protein: number } | null = null;
    for (const day of rangeData.days) {
      const protein = dailyTotals[day]?.protein ?? 0;
      if (protein > 0 && (!best || protein > best.protein)) {
        best = { day, protein };
      }
    }
    return best;
  }, [rangeData.days, dailyTotals]);

  const highestCalorieDay = useMemo(() => {
    let best: { day: string; calories: number } | null = null;
    for (const day of rangeData.days) {
      const calories = dailyTotals[day]?.calories ?? 0;
      if (calories > 0 && (!best || calories > best.calories)) {
        best = { day, calories };
      }
    }
    return best;
  }, [rangeData.days, dailyTotals]);

  const bmi =
    weight && height ? weight / Math.pow(height / 100, 2) : null;

  if (loading) {
    return <LoadingState label="Crunching your numbers..." />;
  }

  const noData = rangeData.loggedDays === 0;

  const macros = [
    {
      label: 'Protein',
      grams: Math.round(
        rangeData.values.reduce((sum, day) => sum + day.protein, 0) / rangeData.days.length
      ),
      share: rangeData.macroShares.protein,
      color: 'var(--color-macro-protein)',
      dot: 'bg-macro-protein',
    },
    {
      label: 'Carbs',
      grams: Math.round(
        rangeData.values.reduce((sum, day) => sum + day.carbs, 0) / rangeData.days.length
      ),
      share: rangeData.macroShares.carbs,
      color: 'var(--color-macro-carbs)',
      dot: 'bg-macro-carbs',
    },
    {
      label: 'Fats',
      grams: Math.round(
        rangeData.values.reduce((sum, day) => sum + day.fats, 0) / rangeData.days.length
      ),
      share: rangeData.macroShares.fats,
      color: 'var(--color-macro-fats)',
      dot: 'bg-macro-fats',
    },
  ];

  return (
    <AppShell
      active="analytics"
      userEmail={email}
      userName={name || undefined}
      streak={streak}
    >
      <div className="mx-auto w-full max-w-[1400px] space-y-4 sm:space-y-5">
        {error && (
          <Alert tone="danger" onDismiss={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Header */}
        <div className="anim-rise flex flex-wrap items-end justify-between gap-4 pt-1">
          <div>
            <p className="eyebrow text-brand">Analytics</p>
            <h1 className="display mt-1.5 text-[28px] sm:text-[34px]">
              Your nutrition, in context.
            </h1>
            <p className="mt-1.5 text-[13.5px] text-muted">
              {RANGE_LABEL[range]} · {rangeData.loggedDays} logged day
              {rangeData.loggedDays === 1 ? '' : 's'} of {range}
            </p>
          </div>

          <div className="flex rounded-control border border-line bg-surface p-1 shadow-card">
            {([7, 30, 90] as RangeOption[]).map((option) => (
              <button
                key={option}
                onClick={() => setRange(option)}
                className={`rounded-lg px-3.5 py-1.5 text-[12px] font-semibold transition ${
                  range === option
                    ? 'bg-brand text-white shadow-card'
                    : 'text-muted hover:text-ink'
                }`}
              >
                {option}D
              </button>
            ))}
          </div>
        </div>

        {noData && (
          <Card className="anim-rise flex flex-wrap items-center justify-between gap-3 border-ember/30 bg-ember-soft/40 p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface text-ember">
                <Bowl className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[13px] font-semibold">No meals in this window yet</p>
                <p className="text-[11.5px] text-muted">
                  Log a meal and your trends will appear here automatically.
                </p>
              </div>
            </div>
            <Button size="sm" onClick={() => router.push('/dashboard#log-meal')}>
              Log a meal
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Card>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {[
            {
              label: 'Average calories',
              value: Math.round(rangeData.averageCalories).toLocaleString(),
              unit: 'kcal',
              icon: Flame,
              chip: 'bg-brand-soft text-brand-deep',
              sub:
                rangeData.delta === null
                  ? 'No previous period data'
                  : `${rangeData.delta > 0 ? '+' : ''}${rangeData.delta}% vs previous ${range}`,
            },
            {
              label: 'Protein consistency',
              value: String(rangeData.proteinConsistency),
              unit: '%',
              icon: Dumbbell,
              chip: 'bg-macro-protein-soft text-macro-protein',
              sub: `Days at 90%+ of ${goals.protein}g target`,
            },
            {
              label: 'Goal completion',
              value: String(rangeData.goalCompletion),
              unit: '%',
              icon: Trophy,
              chip: 'bg-leaf-soft text-leaf',
              sub: 'Days within 90–110% of calories',
            },
            {
              label: 'Current streak',
              value: String(streak),
              unit: streak === 1 ? 'day' : 'days',
              icon: TrendUp,
              chip: 'bg-ember-soft text-ember',
              sub: streak > 0 ? 'Keep it going' : 'Hit your target to start one',
            },
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card
                key={stat.label}
                className="anim-rise p-4"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${stat.chip}`}>
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                </div>
                <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-faint">
                  {stat.label}
                </p>
                <p className="nums mt-1 text-[25px] font-semibold leading-none tracking-tight">
                  {stat.value}
                  <span className="ml-1 text-[11.5px] font-medium text-faint">{stat.unit}</span>
                </p>
                <p className="mt-2 text-[10.5px] leading-relaxed text-muted">{stat.sub}</p>
              </Card>
            );
          })}
        </div>

        {/* Trend + macro split */}
        <div className="grid gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
          <Card className="anim-rise p-4 sm:p-5" style={{ animationDelay: '80ms' }}>
            <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="flex items-center gap-1.5 text-[14px] font-semibold">
                  <ChartBar className="h-4 w-4 text-brand" />
                  Calorie trend
                </p>
                <p className="mt-0.5 text-[11.5px] text-muted">
                  Daily totals against your {goals.calories.toLocaleString()} kcal target
                </p>
              </div>
              <Badge tone="neutral">{RANGE_LABEL[range]}</Badge>
            </div>

            <LineChart
              labels={calorieLabels}
              series={calorieSeries}
              goal={goals.calories}
              goalLabel={`${goals.calories.toLocaleString()} kcal`}
              height={250}
            />

            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-line-soft pt-2.5">
              <ChartLegend series={calorieSeries} />
              <span className="text-[10.5px] text-faint">
                Dashed line = daily target
              </span>
            </div>
          </Card>

          <Card className="anim-rise p-4 sm:p-5" style={{ animationDelay: '120ms' }}>
            <div>
              <p className="text-[14px] font-semibold">Macro distribution</p>
              <p className="mt-0.5 text-[11.5px] text-muted">
                Average split across {RANGE_LABEL[range].toLowerCase()}
              </p>
            </div>

            <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:flex-col">
              <DonutChart
                slices={macros.map((macro) => ({
                  label: macro.label,
                  value: macro.share,
                  color: macro.color,
                }))}
                size={160}
                stroke={20}
                centerValue={`${rangeData.macroShares.protein}%`}
                centerLabel="protein"
              />

              <div className="w-full space-y-2.5">
                {macros.map((macro) => (
                  <div key={macro.label}>
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="flex items-center gap-2 font-medium text-ink-soft">
                        <span className={`h-2 w-2 rounded-full ${macro.dot}`} />
                        {macro.label}
                      </span>
                      <span className="nums font-semibold">
                        {macro.share}%
                        <span className="ml-1.5 text-[10px] font-medium text-faint">
                          {macro.grams}g avg
                        </span>
                      </span>
                    </div>
                    <Progress
                      value={macro.share}
                      colorClass={
                        macro.label === 'Protein'
                          ? 'bg-macro-protein'
                          : macro.label === 'Carbs'
                            ? 'bg-macro-carbs'
                            : 'bg-macro-fats'
                      }
                      className="mt-1.5 !h-1"
                    />
                  </div>
                ))}
              </div>
            </div>

            <p className="mt-4 border-t border-line-soft pt-2.5 text-[10px] leading-relaxed text-faint">
              Share of calories from protein ×4, carbs ×4 and fats ×9.
            </p>
          </Card>
        </div>

        {/* Protein + weight */}
        <div className="grid gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
          <Card className="anim-rise p-4 sm:p-5" style={{ animationDelay: '80ms' }}>
            <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-[14px] font-semibold">Protein consistency</p>
                <p className="mt-0.5 text-[11.5px] text-muted">
                  Last 14 days · target {goals.protein}g
                </p>
              </div>
              <Badge tone="brand">
                {Math.round(
                  (proteinSeriesValues.filter((value) => value >= goals.protein * 0.9).length /
                    14) *
                    100
                )}
                % on target
              </Badge>
            </div>

            <BarChart
              labels={proteinSeriesLabels}
              values={proteinSeriesValues}
              goal={goals.protein}
              color="var(--color-macro-protein)"
              height={160}
              valueSuffix="g protein"
            />

            <div className="mt-2 flex items-center justify-between border-t border-line-soft pt-2.5 text-[10.5px] text-faint">
              <span>Each bar is one day</span>
              <span>Dashed line = {goals.protein}g target</span>
            </div>
          </Card>

          <Card className="anim-rise p-4 sm:p-5" style={{ animationDelay: '120ms' }}>
            <div className="flex items-center justify-between">
              <p className="text-[14px] font-semibold">Body & weight</p>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-soft text-teal">
                <Scale className="h-4 w-4" />
              </span>
            </div>

            {weight ? (
              <>
                <div className="mt-4 flex items-end gap-3">
                  <p className="nums display text-[38px] leading-none">
                    {weight}
                    <span className="ml-1 text-[12px] font-medium text-faint">kg</span>
                  </p>
                  {bmi && <Badge tone="teal">BMI {bmi.toFixed(1)}</Badge>}
                </div>
                {bmi && (
                  <p className="mt-2 text-[11.5px] text-muted">{bmiCategory(bmi)}</p>
                )}
                <div className="mt-4 rounded-panel bg-paper px-3.5 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-faint">
                    Why no weight chart?
                  </p>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
                    NutriCal stores your current weight, not a weigh-in history.
                    We won’t draw a trend that doesn’t exist.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full"
                  onClick={() => router.push('/profile')}
                >
                  Update weight
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </>
            ) : (
              <div className="mt-4 rounded-panel border border-dashed border-line bg-paper px-4 py-6 text-center">
                <p className="text-[12.5px] font-semibold">No weight on file</p>
                <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
                  Add your weight in your profile to see BMI and energy context.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => router.push('/profile')}
                >
                  Add weight
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Highlights */}
        <Card className="anim-rise p-4 sm:p-5" style={{ animationDelay: '80ms' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[14px] font-semibold">What stands out</p>
              <p className="mt-0.5 text-[11.5px] text-muted">
                Automatically generated from this window
              </p>
            </div>
            <Spark className="h-4 w-4 text-brand" />
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {[
              {
                icon: Dumbbell,
                label: 'Strongest protein day',
                value: bestProteinDay
                  ? `${Math.round(bestProteinDay.protein)}g`
                  : 'No data yet',
                detail: bestProteinDay
                  ? formatLongDate(bestProteinDay.day)
                  : 'Log meals to build this',
                chip: 'bg-macro-protein-soft text-macro-protein',
              },
              {
                icon: Flame,
                label: 'Highest calorie day',
                value: highestCalorieDay
                  ? `${Math.round(highestCalorieDay.calories).toLocaleString()} kcal`
                  : 'No data yet',
                detail: highestCalorieDay
                  ? formatLongDate(highestCalorieDay.day)
                  : 'Log meals to build this',
                chip: 'bg-brand-soft text-brand-deep',
              },
              {
                icon: Target,
                label: 'Average protein',
                value: `${Math.round(rangeData.averageProtein)}g`,
                detail: `${percentOf(rangeData.averageProtein, goals.protein)}% of your ${
                  goals.protein
                }g target`,
                chip: 'bg-leaf-soft text-leaf',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-start gap-3 rounded-panel bg-paper p-3.5">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${item.chip}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10.5px] font-medium text-faint">{item.label}</p>
                    <p className="nums mt-0.5 truncate text-[15px] font-semibold">{item.value}</p>
                    <p className="mt-0.5 truncate text-[10.5px] text-muted">{item.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
