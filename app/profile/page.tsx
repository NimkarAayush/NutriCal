'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { AppShell } from '@/components/nav';
import {
  Button,
  Card,
  Field,
  Alert,
  LoadingState,
  Progress,
  Badge,
  inputClass,
} from '@/components/ui';
import {
  Target,
  Settings,
  ArrowRight,
  Scale,
  Flame,
  Dumbbell,
  Trophy,
  User,
  Check,
} from '@/components/icons';

// --- TYPES ---
interface ProfileForm {
  full_name: string;
  age: string;
  gender: string;
  height_cm: string;
  weight_kg: string;
  activity_level: string;
  primary_goal: string;
  diet_type: string;
  workout_frequency: string;
  workout_type: string;
  daily_steps: string;
  sleep_hours: string;
  wake_time: string;
  sleep_time: string;
  workout_time: string;
  meals_per_day: string;
  allergies: string;
  food_preferences: string;
  foods_to_avoid: string;
}

interface GoalTargets {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

// --- OPTIONS ---
const ACTIVITY_LEVELS = [
  'Sedentary',
  'Lightly Active',
  'Moderately Active',
  'Very Active',
];

const PRIMARY_GOALS = [
  'Lose Weight',
  'Maintain Weight',
  'Gain Weight',
  'Build Muscle',
  'Improve General Nutrition',
];

const DIET_TYPES = [
  'Vegetarian',
  'Non-Vegetarian',
  'Vegan',
  'Eggetarian',
  'Other',
];

const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'];

const WORKOUT_TYPES = [
  'Strength Training',
  'Cardio',
  'Yoga',
  'Sports',
  'Mixed',
  'None',
];

const EMPTY_FORM: ProfileForm = {
  full_name: '',
  age: '',
  gender: '',
  height_cm: '',
  weight_kg: '',
  activity_level: '',
  primary_goal: '',
  diet_type: '',
  workout_frequency: '',
  workout_type: '',
  daily_steps: '',
  sleep_hours: '',
  wake_time: '',
  sleep_time: '',
  workout_time: '',
  meals_per_day: '',
  allergies: '',
  food_preferences: '',
  foods_to_avoid: '',
};

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={inputClass} />;
}

function SelectInput({
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={inputClass}>
      {children}
    </select>
  );
}

// Supabase returns plain objects ({ message, code, ... }), not Error
// instances — so `instanceof Error` alone swallows the real message.
function supabaseErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  if (
    typeof err === 'object' &&
    err !== null &&
    'message' in err &&
    typeof (err as { message: unknown }).message === 'string' &&
    (err as { message: string }).message
  ) {
    return (err as { message: string }).message;
  }
  return fallback;
}

function initialsFrom(name: string, email: string): string {
  const source = name.trim() || email.split('@')[0] || 'N';
  const parts = source.replace(/[._-]+/g, ' ').split(/\s+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'N';
}

function Section({
  eyebrow,
  title,
  hint,
  children,
  delay,
}: {
  eyebrow: string;
  title: string;
  hint?: string;
  children: React.ReactNode;
  delay?: string;
}) {
  return (
    <Card
      className="anim-rise p-5 sm:p-6"
      style={{ animationDelay: delay ?? '0ms' }}
    >
      <p className="eyebrow text-faint">{eyebrow}</p>
      <h2 className="h-tight mt-1 text-[16px] font-semibold">{title}</h2>
      {hint && <p className="mt-1 text-[12.5px] text-muted">{hint}</p>}
      <div className="mt-4 space-y-3.5">{children}</div>
    </Card>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profileId, setProfileId] = useState<string | null>(null);
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);
  const [email, setEmail] = useState('');
  const [memberSince, setMemberSince] = useState('');
  const [goals, setGoals] = useState<GoalTargets | null>(null);

  // --- FETCH PROFILE ---
  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      setEmail(user.email ?? '');
      if (user.created_at) {
        setMemberSince(
          new Date(user.created_at).toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
          })
        );
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error(
          `Error fetching profile: ${error.message} (${error.code})` +
            (error.details ? ` — ${error.details}` : '') +
            (error.hint ? ` Hint: ${error.hint}` : '')
        );
      }

      if (data) {
        setProfileId(data.id);
        setForm({
          full_name: data.full_name || '',
          age: data.age?.toString() || '',
          gender: data.gender || '',
          height_cm: data.height_cm?.toString() || '',
          weight_kg: data.weight_kg?.toString() || '',
          activity_level: data.activity_level || '',
          primary_goal: data.primary_goal || '',
          diet_type: data.diet_type || '',
          workout_frequency: data.workout_frequency?.toString() || '',
          workout_type: data.workout_type || '',
          daily_steps: data.daily_steps?.toString() || '',
          sleep_hours: data.sleep_hours?.toString() || '',
          wake_time: data.wake_time || '',
          sleep_time: data.sleep_time || '',
          workout_time: data.workout_time || '',
          meals_per_day: data.meals_per_day?.toString() || '',
          allergies: data.allergies || '',
          food_preferences: data.food_preferences || '',
          foods_to_avoid: data.foods_to_avoid || '',
        });
      }

      const { data: goalData } = await supabase
        .from('nutrition_goals')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (goalData) {
        setGoals({
          calories: Number(goalData.calorie_target),
          protein: Number(goalData.protein_target),
          carbs: Number(goalData.carbs_target),
          fats: Number(goalData.fats_target),
        });
      }

      setLoading(false);
    };

    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- FORM HANDLER ---
  const handleChange = (field: keyof ProfileForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // --- SAVE PROFILE ---
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.full_name.trim()) {
      setError('Full name is required');
      return;
    }

    setSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError('You must be logged in');
        return;
      }

      const profileData = {
        id: user.id,
        user_id: user.id,
        full_name: form.full_name.trim(),
        age: form.age ? parseInt(form.age) : null,
        gender: form.gender || null,
        height_cm: form.height_cm ? parseFloat(form.height_cm) : null,
        weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
        activity_level: form.activity_level || null,
        primary_goal: form.primary_goal || null,
        diet_type: form.diet_type || null,
        workout_frequency: form.workout_frequency
          ? parseInt(form.workout_frequency)
          : null,
        workout_type: form.workout_type || null,
        daily_steps: form.daily_steps ? parseInt(form.daily_steps) : null,
        sleep_hours: form.sleep_hours ? parseFloat(form.sleep_hours) : null,
        wake_time: form.wake_time || null,
        sleep_time: form.sleep_time || null,
        workout_time: form.workout_time || null,
        meals_per_day: form.meals_per_day ? parseInt(form.meals_per_day) : null,
        allergies: form.allergies.trim() || null,
        food_preferences: form.food_preferences.trim() || null,
        foods_to_avoid: form.foods_to_avoid.trim() || null,
      };

      // Upsert handles both inserting and updating automatically.
      const { data, error } = await supabase
        .from('profiles')
        .upsert([profileData])
        .select()
        .single();

      if (error) throw error;
      if (data) setProfileId(data.id);

      setSuccess('Profile saved successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      setError(supabaseErrorMessage(err, 'Failed to save profile'));
    } finally {
      setSaving(false);
    }
  };

  // --- LOADING STATE ---
  if (loading) {
    return <LoadingState label="Loading profile..." />;
  }

  const displayName = form.full_name || email.split('@')[0] || 'Your profile';
  const initials = initialsFrom(form.full_name, email);

  const trackedFields: Array<keyof ProfileForm> = [
    'full_name',
    'age',
    'gender',
    'height_cm',
    'weight_kg',
    'activity_level',
    'primary_goal',
    'diet_type',
    'workout_frequency',
    'workout_type',
    'daily_steps',
    'sleep_hours',
    'wake_time',
    'sleep_time',
    'meals_per_day',
    'food_preferences',
  ];
  const completedFields = trackedFields.filter((field) => form[field].trim() !== '').length;
  const completeness = Math.round((completedFields / trackedFields.length) * 100);

  return (
    <AppShell active="profile" userEmail={email} userName={form.full_name || undefined}>
      <div className="mx-auto w-full max-w-6xl space-y-4 sm:space-y-5">
        {/* Header */}
        <div className="anim-rise flex flex-wrap items-end justify-between gap-4 pt-1">
          <div>
            <p className="eyebrow text-brand">Profile</p>
            <h1 className="display mt-1.5 text-[28px] sm:text-[34px]">
              {profileId ? 'Your details' : 'Tell us about you'}
            </h1>
            <p className="mt-1.5 max-w-xl text-[13.5px] leading-relaxed text-muted">
              The source of truth for your targets and AI coaching. Fill in what
              you know — you can update it anytime.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => router.push('/settings')}>
            <Settings className="h-4 w-4" />
            Account settings
          </Button>
        </div>

        {success && <Alert tone="success">{success}</Alert>}
        {error && (
          <Alert tone="danger" onDismiss={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Identity card */}
        <Card className="anim-rise overflow-hidden p-5 sm:p-6" style={{ animationDelay: '60ms' }}>
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="flex min-w-0 items-center gap-4">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-[20px] font-bold text-brand">
                {initials}
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-[20px] font-semibold tracking-tight">
                  {displayName}
                </h2>
                <p className="mt-0.5 truncate text-[12.5px] text-muted">{email}</p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {form.primary_goal && <Badge tone="brand">{form.primary_goal}</Badge>}
                  {form.diet_type && <Badge tone="teal">{form.diet_type}</Badge>}
                  {form.activity_level && (
                    <Badge tone="neutral">{form.activity_level}</Badge>
                  )}
                  {!form.primary_goal && !form.diet_type && (
                    <span className="text-[11.5px] text-faint">
                      Add your goal and diet below.
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {memberSince && (
                <div className="hidden text-right sm:block">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-faint">
                    Member since
                  </p>
                  <p className="mt-0.5 text-[12.5px] font-semibold text-ink-soft">
                    {memberSince}
                  </p>
                </div>
              )}
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-soft text-muted">
                <User className="h-4.5 w-4.5" />
              </span>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-line-soft pt-4 sm:grid-cols-4">
            {[
              { label: 'Weight', value: form.weight_kg ? `${form.weight_kg} kg` : '—', icon: Scale },
              { label: 'Height', value: form.height_cm ? `${form.height_cm} cm` : '—', icon: Target },
              { label: 'Daily energy', value: goals ? `${goals.calories.toLocaleString()} kcal` : 'Not set', icon: Flame },
              { label: 'Protein target', value: goals ? `${goals.protein} g` : 'Not set', icon: Dumbbell },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="min-w-0">
                  <p className="flex items-center gap-1 text-[10px] font-medium text-faint">
                    <Icon className="h-3 w-3" />
                    {stat.label}
                  </p>
                  <p className="nums mt-0.5 truncate text-[15px] font-semibold">
                    {stat.value}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center gap-3">
            <Progress value={completeness} colorClass="bg-brand" className="flex-1" />
            <span className="nums shrink-0 text-[10.5px] font-semibold text-muted">
              {completeness}% complete
            </span>
          </div>
        </Card>

        {/* Goals summary */}
        <Card className="anim-rise p-5" style={{ animationDelay: '100ms' }}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="flex items-center gap-1.5 text-[13.5px] font-semibold">
                <Trophy className="h-4 w-4 text-ember" />
                Your daily targets
              </p>
              <p className="mt-0.5 text-[11.5px] text-muted">
                {goals
                  ? 'Saved targets used across your dashboard and coach.'
                  : 'No custom targets yet — NutriCal is using defaults.'}
              </p>
            </div>
            <Button variant="soft" size="sm" onClick={() => router.push('/dashboard#goals')}>
              Adjust targets
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {[
              { label: 'Calories', value: goals?.calories.toLocaleString() ?? '2,200', unit: 'kcal', dot: 'bg-brand' },
              { label: 'Protein', value: goals?.protein ?? 140, unit: 'g', dot: 'bg-macro-protein' },
              { label: 'Carbs', value: goals?.carbs ?? 250, unit: 'g', dot: 'bg-macro-carbs' },
              { label: 'Fats', value: goals?.fats ?? 65, unit: 'g', dot: 'bg-macro-fats' },
            ].map((goal) => (
              <div key={goal.label} className="rounded-panel bg-paper px-3.5 py-3">
                <p className="flex items-center gap-1.5 text-[10.5px] font-medium text-muted">
                  <span className={`h-2 w-2 rounded-full ${goal.dot}`} />
                  {goal.label}
                </p>
                <p className="nums mt-1 text-[18px] font-semibold leading-none">
                  {goal.value}
                  <span className="ml-1 text-[10px] font-medium text-faint">{goal.unit}</span>
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Section eyebrow="Personal" title="Who you are" delay="40ms">
              <Field label="Full name">
                <TextInput
                  type="text"
                  value={form.full_name}
                  onChange={(e) => handleChange('full_name', e.target.value)}
                  placeholder="Your full name"
                  required
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Age">
                  <TextInput
                    type="number"
                    value={form.age}
                    onChange={(e) => handleChange('age', e.target.value)}
                    placeholder="25"
                    min={1}
                    max={120}
                  />
                </Field>
                <Field label="Gender">
                  <SelectInput
                    value={form.gender}
                    onChange={(e) => handleChange('gender', e.target.value)}
                  >
                    <option value="">Select</option>
                    {GENDERS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </SelectInput>
                </Field>
              </div>
              <Field label="Primary goal">
                <SelectInput
                  value={form.primary_goal}
                  onChange={(e) => handleChange('primary_goal', e.target.value)}
                >
                  <option value="">Select goal</option>
                  {PRIMARY_GOALS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </SelectInput>
              </Field>
            </Section>

            <Section eyebrow="Body" title="Measurements" delay="80ms">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Height (cm)">
                  <TextInput
                    type="number"
                    value={form.height_cm}
                    onChange={(e) => handleChange('height_cm', e.target.value)}
                    placeholder="175"
                    min={50}
                    max={300}
                    step="0.1"
                  />
                </Field>
                <Field label="Weight (kg)">
                  <TextInput
                    type="number"
                    value={form.weight_kg}
                    onChange={(e) => handleChange('weight_kg', e.target.value)}
                    placeholder="70"
                    min={20}
                    max={500}
                    step="0.1"
                  />
                </Field>
              </div>
              <Field label="Activity level">
                <SelectInput
                  value={form.activity_level}
                  onChange={(e) => handleChange('activity_level', e.target.value)}
                >
                  <option value="">Select activity level</option>
                  {ACTIVITY_LEVELS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Daily steps">
                  <TextInput
                    type="number"
                    value={form.daily_steps}
                    onChange={(e) => handleChange('daily_steps', e.target.value)}
                    placeholder="8000"
                    min={0}
                  />
                </Field>
                <Field label="Sleep (hours)">
                  <TextInput
                    type="number"
                    value={form.sleep_hours}
                    onChange={(e) => handleChange('sleep_hours', e.target.value)}
                    placeholder="7.5"
                    min={0}
                    max={24}
                    step="0.5"
                  />
                </Field>
              </div>
            </Section>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Section eyebrow="Training" title="Workout routine" delay="120ms">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Days per week">
                  <TextInput
                    type="number"
                    value={form.workout_frequency}
                    onChange={(e) =>
                      handleChange('workout_frequency', e.target.value)
                    }
                    placeholder="4"
                    min={0}
                    max={7}
                  />
                </Field>
                <Field label="Workout type">
                  <SelectInput
                    value={form.workout_type}
                    onChange={(e) => handleChange('workout_type', e.target.value)}
                  >
                    <option value="">Select type</option>
                    {WORKOUT_TYPES.map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </SelectInput>
                </Field>
              </div>
              <Field label="Usual workout time">
                <TextInput
                  type="time"
                  value={form.workout_time}
                  onChange={(e) => handleChange('workout_time', e.target.value)}
                />
              </Field>
            </Section>

            <Section eyebrow="Routine" title="Sleep schedule" delay="160ms">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Wake-up time">
                  <TextInput
                    type="time"
                    value={form.wake_time}
                    onChange={(e) => handleChange('wake_time', e.target.value)}
                  />
                </Field>
                <Field label="Sleep time">
                  <TextInput
                    type="time"
                    value={form.sleep_time}
                    onChange={(e) => handleChange('sleep_time', e.target.value)}
                  />
                </Field>
              </div>
              <Field label="Meals per day">
                <TextInput
                  type="number"
                  value={form.meals_per_day}
                  onChange={(e) => handleChange('meals_per_day', e.target.value)}
                  placeholder="3"
                  min={1}
                  max={10}
                />
              </Field>
            </Section>
          </div>

          <Section
            eyebrow="Nutrition"
            title="Eating preferences"
            hint="The AI coach adapts suggestions to these."
            delay="200ms"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Diet type">
                <SelectInput
                  value={form.diet_type}
                  onChange={(e) => handleChange('diet_type', e.target.value)}
                >
                  <option value="">Select diet</option>
                  {DIET_TYPES.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Food preferences">
                <TextInput
                  type="text"
                  value={form.food_preferences}
                  onChange={(e) =>
                    handleChange('food_preferences', e.target.value)
                  }
                  placeholder="e.g. Indian cuisine, spicy food…"
                />
              </Field>
              <Field label="Foods to avoid">
                <TextInput
                  type="text"
                  value={form.foods_to_avoid}
                  onChange={(e) => handleChange('foods_to_avoid', e.target.value)}
                  placeholder="e.g. mushrooms, cilantro…"
                />
              </Field>
              <Field label="Allergies">
                <TextInput
                  type="text"
                  value={form.allergies}
                  onChange={(e) => handleChange('allergies', e.target.value)}
                  placeholder="e.g. peanuts, dairy…"
                />
              </Field>
            </div>
          </Section>

          <div className="sticky bottom-[calc(76px+env(safe-area-inset-bottom))] z-20 flex items-center justify-between gap-3 rounded-card border border-line bg-surface/95 p-3 shadow-lift backdrop-blur-md lg:static lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-none">
            <p className="hidden items-center gap-1.5 text-[11.5px] text-muted sm:flex">
              <Check className="h-3.5 w-3.5 text-brand" />
              Changes apply to your dashboard and coach immediately.
            </p>
            <div className="ml-auto flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.push('/dashboard')}
              >
                Cancel
              </Button>
              <Button type="submit" loading={saving}>
                {saving ? 'Saving' : 'Save profile'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
