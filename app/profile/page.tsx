'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { AppHeader, MobileNav } from '@/components/nav';
import {
  Button,
  Card,
  Field,
  Alert,
  LoadingState,
  inputClass,
} from '@/components/ui';

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
// This extracts it from either shape without using `any`.
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
      className="anim-rise p-6 sm:p-7"
      style={{ '--d': delay ?? '0ms' } as React.CSSProperties}
    >
      <p className="eyebrow text-faint">{eyebrow}</p>
      <h2 className="h-tight mt-1 text-[17px] font-semibold">{title}</h2>
      {hint && <p className="mt-1 text-[13px] text-muted">{hint}</p>}
      <div className="mt-5 space-y-4">{children}</div>
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

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        // Single string so the Next.js overlay shows the real message
        // instead of an opaque object preview.
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

      // Upsert handles both inserting and updating automatically!
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // --- LOADING STATE ---
  if (loading) {
    return <LoadingState label="Loading profile..." />;
  }

  return (
    <div className="min-h-screen bg-paper font-sans text-ink antialiased">
      <AppHeader active="profile" onSignOut={handleLogout} />

      <main className="mx-auto max-w-3xl px-4 pb-28 pt-6 sm:px-6 sm:pt-8 md:pb-16">
        <div
          className="anim-rise mb-6"
          style={{ '--d': '0ms' } as React.CSSProperties}
        >
          <p className="eyebrow text-faint">NutriCal profile</p>
          <h1 className="display mt-1.5 text-[30px] sm:text-[36px]">
            {profileId ? 'Your details' : 'Tell us about you'}
          </h1>
          <p className="mt-2 max-w-lg text-[15px] leading-relaxed text-muted">
            This is the source of truth for your personalized targets and AI
            coaching. Fill in what you know — you can update it anytime.
          </p>
        </div>

        {success && (
          <div className="mb-5">
            <Alert tone="success">{success}</Alert>
          </div>
        )}
        {error && (
          <div className="mb-5">
            <Alert tone="danger">{error}</Alert>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <Section
            eyebrow="Personal"
            title="Who you are"
            delay="40ms"
          >
            <Field label="Full name">
              <TextInput
                type="text"
                value={form.full_name}
                onChange={(e) => handleChange('full_name', e.target.value)}
                placeholder="Your full name"
                required
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
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
          </Section>

          <Section eyebrow="Body" title="Measurements" delay="80ms">
            <div className="grid grid-cols-2 gap-4">
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
          </Section>

          <Section
            eyebrow="Lifestyle"
            title="Daily activity & rest"
            delay="120ms"
          >
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
            <div className="grid grid-cols-2 gap-4">
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

          <Section eyebrow="Workout" title="Training routine" delay="160ms">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Frequency (days/week)">
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
            <Field label="Workout time">
              <TextInput
                type="time"
                value={form.workout_time}
                onChange={(e) => handleChange('workout_time', e.target.value)}
              />
            </Field>
          </Section>

          <Section
            eyebrow="Nutrition"
            title="Eating preferences"
            hint="The AI coach adapts suggestions to these."
            delay="200ms"
          >
            <div className="grid grid-cols-2 gap-4">
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
            </div>
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
          </Section>

          <Section eyebrow="Routine" title="Sleep schedule" delay="240ms">
            <div className="grid grid-cols-2 gap-4">
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
          </Section>

          <Section eyebrow="Goal" title="Primary goal" delay="280ms">
            <Field label="What are you working toward?">
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

          <div className="sticky bottom-[76px] flex justify-end gap-2 rounded-card border border-line bg-surface/95 p-3 shadow-lift backdrop-blur-md md:static md:border-0 md:bg-transparent md:p-0 md:shadow-none md:backdrop-blur-none">
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
        </form>
      </main>

      <MobileNav active="profile" />
    </div>
  );
}
