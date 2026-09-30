1. Recommended NutriCal architecture
Main navigation

I’d restructure the application around 4–5 primary areas:

NutriCal
│
├── Dashboard
│   ├── Today's calories
│   ├── Protein / Carbs / Fats
│   ├── Today's meals
│   ├── Goal progress
│   └── AI quick log
│
├── AI Coach
│   ├── Chat
│   ├── Nutrition questions
│   ├── Daily recommendations
│   ├── Set / change goals
│   └── Daily routine analysis
│
├── Nutrition
│   ├── Meal history
│   ├── Calendar
│   └── Nutrition trends
│
├── Profile
│   ├── Personal information
│   ├── Body information
│   ├── Goals
│   ├── Activity
│   ├── Dietary preferences
│   └── Health-related preferences
│
└── Settings
    ├── Account
    ├── AI preferences
    └── Logout

The key idea is that the profile becomes the source of truth for personalization.

2. Feature 1 — Personalized Profile

Instead of only having an email/password account, create a proper NutriCal Profile.

Basic information
Full Name
Age
Gender
Height
Weight
Lifestyle
Activity Level
    Sedentary
    Lightly Active
    Moderately Active
    Very Active

Daily Steps
Sleep Duration
Workout Frequency
Workout Type
Nutrition preferences
Diet Type
    Vegetarian
    Non-Vegetarian
    Vegan
    Eggetarian
    Other

Food Preferences
Food Allergies
Foods You Avoid
Preferred Cuisine
Primary goal
What is your goal?

○ Lose Weight
○ Maintain Weight
○ Gain Weight
○ Build Muscle
○ Improve General Nutrition
Optional information

You can also have:

Wake-up time
Sleep time
Typical breakfast time
Lunch time
Dinner time
Workout time
Water intake

This becomes extremely useful for the AI.

For example:

User wakes at 7:30 AM, college from 9 AM–4 PM, works out 6 PM–7 PM, sleeps at 11:30 PM, is moderately active and wants to gain muscle.

The AI can use that context when making recommendations.

3. Don't put everything in meal_logs

Your current database has one table:

meal_logs

That's fine for meals, but don't put profile information into meal_logs.

I'd introduce a separate profile table:

profiles

For example:

profiles
---------
id
user_id
full_name
age
gender
height_cm
weight_kg
activity_level
primary_goal
diet_type
workout_frequency
workout_type
daily_steps
sleep_hours
wake_time
sleep_time
workout_time
allergies
food_preferences
foods_to_avoid
created_at
updated_at

Then create another table for goals:

nutrition_goals
---------------
id
user_id
calorie_target
protein_target
carbs_target
fats_target
goal_type
source
created_at
updated_at

source could be:

manual
ai_generated
calculated

This distinction is useful because later you'll know why a goal exists.

4. Feature 2 — AI Nutrition Coach

This should be much more than a simple chatbot.

Think of it as:

A conversational nutrition assistant that understands the user's NutriCal profile and nutrition history.

For example:

User:

What should I eat for breakfast?

AI:

Based on your current protein target and today's intake, a protein-rich breakfast would fit well. You could have 3 eggs with whole-grain toast and fruit.

Another:

User:

Why should I eat protein after workout?

AI explains the general nutrition principle in simple language.

Another:

I haven't eaten much today and it's already 7 PM. What should I eat?

The AI can look at the user's logged meals and provide context-aware suggestions.

5. AI should know the user's context

This is the important part.

Don't simply send:

User: What should I eat?

to Gemini.

Your server should construct a context such as:

User Profile:
Age: 20
Height: 175 cm
Weight: 68 kg
Goal: Muscle Gain
Activity: Moderately Active
Diet: Vegetarian
Workout: 6 PM
Sleep: 7 hours

Daily Goals:
Calories: 2400
Protein: 140g
Carbs: 300g
Fats: 70g

Today's Nutrition:
Calories: 1320
Protein: 62g
Carbs: 170g
Fats: 35g

Today's meals:
Breakfast: ...
Lunch: ...

Then ask Gemini to respond to the user's question.

That makes the AI feel personalized rather than generic.

6. AI should be able to modify goals

This is one of your strongest ideas.

User:

I want to gain muscle. Set my targets.

AI shouldn't blindly change the database immediately.

Instead:

AI

Based on the information in your profile, I can calculate a starting nutrition target.

Then show:

Recommended Daily Target

Calories       2,450 kcal
Protein          145 g
Carbohydrates    300 g
Fats              70 g

[Apply These Goals]
[Keep Current Goals]

Only after the user presses Apply should the database update.

This is much safer than allowing the AI to directly modify user data.

7. Feature 3 — AI Daily Routine Assessment

This could become one of NutriCal's signature features.

Instead of asking users to manually calculate their calories, introduce:

"Build My Nutrition Plan"

The AI asks questions conversationally.

For example:

Step 1

What's your main goal?

Lose weight
Maintain weight
Gain weight
Build muscle
Improve nutrition
Step 2

Tell me your age, height and current weight.

Step 3

How active are you on a normal day?

Mostly sitting
Lightly active
Moderately active
Very active
Step 4

Tell me about your typical day.

The user could type:

I wake up at 7, go to college at 9, come home around 4, work out from 6–7 and sleep around 11:30.

AI extracts:

Wake: 7:00
College: 9:00–16:00
Workout: 18:00–19:00
Sleep: 23:30
Step 5

What kind of diet do you follow?

Step 6

How many meals do you usually eat?

Step 7

Are there foods you avoid or cannot eat?

Then AI generates a personalized starting target.

8. Add a "Nutrition Assessment" screen

After completing the conversation, don't immediately dump the user into the dashboard.

Show a beautiful result:

YOUR NUTRITION PROFILE

Your Goal
Build Muscle

Daily Energy
2,450 kcal

Protein
145 g

Carbohydrates
300 g

Fats
70 g

Suggested Meals
4 meals / day

Workout Nutrition
Higher protein around your training window

Hydration
Personalized recommendation

────────────────────

These are starting targets.
You can adjust them anytime.

[Use These Goals]
[Edit Information]

This will feel significantly more premium.

9. AI Coach homepage

I would make the AI page visually different from a generic ChatGPT clone.

Something like:

Good afternoon, Aayush.

How can I help with your nutrition today?

┌────────────────────────────────────┐
│ Ask NutriCal anything...           │
└────────────────────────────────────┘

Quick actions

[🍽 What should I eat?]
[🎯 Adjust my goals]
[💪 Post-workout meal]
[📊 Analyze today's nutrition]

Today's insight

You are 62g away from your protein target.

Try adding a protein-rich snack
to your evening meal.

This makes the AI action-oriented, rather than just a chat box.

10. Give the AI access to actions

Eventually, your AI should be able to perform controlled actions.

For example:

User

Add my breakfast: 3 eggs and 2 slices of toast.

AI:

I estimated:

Calories       410 kcal
Protein         24 g
Carbs           30 g
Fat             20 g

[Add to today's log]
User

Change my protein target to 150g.

AI:

Your current target is 140g.

Would you like to change it to 150g?

[Confirm]
[Cancel]
User

Show me how much protein I ate this week.

AI can retrieve the relevant data and summarize it.

This is where your AI becomes a real application agent rather than just a chatbot.

11. Important architecture change

Your current:

/api/estimate

is specifically designed for nutrition estimation.

I'd eventually create:

/api/
│
├── estimate/
│   └── route.ts
│
├── coach/
│   └── route.ts
│
├── profile/
│   └── route.ts
│
├── goals/
│   └── route.ts
│
└── nutrition/
    └── route.ts

But don't build all of these at once.

Build incrementally.

12. Recommended development order

I'd do it in this exact sequence:

Phase 1 — Profile

Build:

Profile page
↓
profiles table
↓
Profile editing
↓
Save/load profile
Phase 2 — Goal engine

Build:

Profile information
↓
Calculate starting targets
↓
Display recommended goals
↓
User confirms
↓
Save goals
Phase 3 — AI assessment

Build:

AI onboarding conversation
↓
Collect routine
↓
Collect preferences
↓
Analyze information
↓
Generate recommended goals
↓
User confirms
↓
Save
Phase 4 — AI Coach

Build:

Chat UI
↓
Send message to /api/coach
↓
Load profile
↓
Load today's nutrition
↓
Send context to Gemini
↓
Return response
Phase 5 — AI actions

Add:

Log meal
Change goals
Analyze day
Analyze week
Give meal suggestions

with confirmation before database changes.

Phase 6 — Polish

Finally:

Animations
Loading states
Error states
Empty states
Mobile responsiveness
Dark/light theme
Accessibility
Security
13. Very important: health safety

Because NutriCal deals with health/nutrition, the AI should not pretend to be a doctor or dietitian.

The system prompt should tell Gemini:

You are a nutrition education and wellness assistant.

Provide general nutrition information and practical food suggestions.

Do not diagnose diseases.
Do not prescribe medication.
Do not claim to replace a doctor or registered dietitian.
Do not provide dangerous extreme dieting recommendations.
If the user describes a serious medical condition, eating disorder,
severe symptoms, pregnancy-related concerns, or medication-related
nutrition questions, recommend consulting an appropriate healthcare
professional.

Clearly distinguish estimates from measured nutritional values.

Also make the UI say something like:

NutriCal provides general nutrition guidance and estimates. It is not a substitute for professional medical advice.

14. Your database should eventually look like this
auth.users
     │
     │
     ▼
 profiles
     │
     ├──────────────► nutrition_goals
     │
     │
     └──────────────► meal_logs
                          │
                          ▼
                     daily nutrition

Later you could add:

ai_conversations
ai_messages

if you want persistent chat history.

15. The prompt I'd give Gemini Pro

Since you're using Gemini Pro to actually modify the codebase, don't give it one enormous "build everything" prompt immediately.

Give it a strong architectural prompt first.

Then use smaller implementation prompts.

Master Prompt 
You are working on my existing Next.js application called NutriCal.

IMPORTANT:
Do NOT rebuild the application from scratch.
Do NOT remove or break existing functionality.
First inspect the existing codebase and understand the current architecture before making changes.

Existing stack
Next.js 16.3.6
App Router
React 19
TypeScript
Tailwind CSS v4
Supabase Authentication
Supabase PostgreSQL
Google Gemini API through @google/genai
Existing functionality

NutriCal currently has:

Email/password authentication using Supabase
Nutrition dashboard
AI nutrition estimation
Natural-language meal logging
Manual meal entry
Daily calories/macros tracking
Date-based meal history
Custom nutrition targets
Goal streak tracking

Existing database table:

meal_logs

Columns:

id
user_id
meal_name
calories
protein
carbs
fats
created_at
logged_date

Existing default targets:

2200 kcal
140g protein
250g carbohydrates
65g fats

The existing application should continue working after all changes.

NEW PRODUCT DIRECTION

Transform NutriCal into a personalized nutrition companion.

The main flow should become:

USER PROFILE
↓
PERSONAL INFORMATION
↓
DAILY ROUTINE
↓
AI NUTRITION ASSESSMENT
↓
PERSONALIZED TARGETS
↓
DAILY TRACKING
↓
AI NUTRITION COACH
↓
CONTINUOUS PERSONALIZED RECOMMENDATIONS

The design must feel like a premium modern health-tech product rather than an AI-generated template.

Use a restrained visual system:

Zinc / neutral backgrounds
Emerald as the primary accent
Strong typography hierarchy
Generous whitespace
Subtle borders
Minimal shadows
Rounded but not excessively rounded components
Clean cards
Excellent mobile responsiveness
Smooth but subtle animations

Avoid:

excessive gradients
excessive glassmorphism
huge decorative elements
generic AI chatbot styling
unnecessary icons everywhere
overly colorful dashboards
template-like UI
FEATURE 1: PERSONALIZED PROFILE

Create a dedicated /profile page.

Create a new Supabase table:

profiles

Suggested fields:

id
user_id
full_name
age
gender
height_cm
weight_kg
activity_level
primary_goal
diet_type
workout_frequency
workout_type
daily_steps
sleep_hours
wake_time
sleep_time
workout_time
meals_per_day
allergies
food_preferences
foods_to_avoid
created_at
updated_at

Use appropriate PostgreSQL types.

The profile must belong to the authenticated Supabase user.

Implement Row Level Security so users can only access their own profile.

The profile page should allow users to:

create their profile
edit their profile
save changes
view their current information

Organize the form into logical sections:

Personal Information
Body Information
Lifestyle
Workout
Nutrition Preferences
Daily Routine
Goals

Do not make the form visually overwhelming.

Use progressive sections/cards where appropriate.

FEATURE 2: PERSONALIZED NUTRITION GOALS

Create a separate table:

nutrition_goals

Suggested fields:

id
user_id
calorie_target
protein_target
carbs_target
fats_target
goal_type
source
created_at
updated_at

Possible values for source:

manual
ai_generated
calculated

Users should be able to manually edit their goals.

The existing dashboard must use the user's personalized goals instead of always using the hardcoded default values.

Keep the existing defaults as fallback values for users who have not completed their profile.

FEATURE 3: AI NUTRITION ASSESSMENT

Create an onboarding/assessment experience called:

Build My Nutrition Plan

The user should be able to have a conversational interaction with NutriCal.

The AI should collect information such as:

age
height
weight
primary goal
activity level
workout frequency
workout type
typical daily routine
wake time
sleep time
workout time
meals per day
diet type
food preferences
foods avoided
allergies

The user should be able to answer naturally.

Example:

"I wake up at 7, go to college at 9, come home around 4, work out from 6 to 7 and sleep around 11:30."

The AI should extract useful structured information from this response rather than forcing the user to enter every field manually.

After collecting sufficient information, show a clear summary:

NUTRITION PROFILE

Goal
Muscle Gain

Daily Calories
2450 kcal

Protein
145 g

Carbohydrates
300 g

Fats
70 g

Suggested Meals
4/day

Then show:

[Use These Goals]
[Edit Information]

Do NOT automatically overwrite the user's existing goals.

The user must explicitly confirm before personalized goals are saved.

FEATURE 4: AI NUTRITION COACH

Create a dedicated /coach page.

This should NOT look like a generic ChatGPT clone.

The page should contain:

personalized greeting
chat interface
suggested questions
today's nutrition summary
useful nutrition insight
quick actions

Suggested quick actions:

"What should I eat?"
"Analyze today's nutrition"
"Adjust my goals"
"Suggest a post-workout meal"
"Why do I need more protein?"
"Help me plan tomorrow's meals"

The AI should understand the authenticated user's context.

When generating a response, the server should retrieve:

User profile
Current nutrition goals
Today's meal logs
Relevant recent nutrition information

Then provide that context to Gemini.

Do NOT expose the Gemini API key to the browser.

Create a server-side route such as:

/api/coach

AI CONTEXT

The AI should receive structured context similar to:

USER PROFILE:
Age:
Height:
Weight:
Goal:
Activity:
Diet:
Workout:
Sleep:
Daily routine:

NUTRITION TARGETS:
Calories:
Protein:
Carbs:
Fats:

TODAY'S NUTRITION:
Calories consumed:
Protein consumed:
Carbs consumed:
Fat consumed:

TODAY'S MEALS:
...

USER QUESTION:
...

The AI should use this information to make contextual responses.

FEATURE 5: CONTROLLED AI ACTIONS

The AI should eventually support actions such as:

Log a meal
Change nutrition goals
Analyze today's nutrition
Analyze recent nutrition history
Suggest meals
Explain nutrition concepts

IMPORTANT:

Never allow the AI to silently modify the database.

For database-changing actions, first show a confirmation UI.

Example:

User:
"Change my protein target to 150g."

NutriCal:

"Your current protein target is 140g.

I can change it to 150g.

[Confirm Change]
[Cancel]"

Only after confirmation should the database be updated.

HEALTH SAFETY

The AI is a nutrition education and wellness assistant.

It must:

provide general nutrition information
explain nutrition concepts
provide practical food suggestions
clearly distinguish estimates from measured nutritional values

It must NOT:

diagnose medical conditions
prescribe medication
claim to replace a doctor or registered dietitian
recommend dangerous extreme diets
provide unsafe weight-loss recommendations
make medical claims without appropriate caution

For serious medical conditions, eating disorders, pregnancy-related concerns, medication-related nutrition questions, or serious symptoms, recommend consulting an appropriate healthcare professional.

Add an unobtrusive disclaimer in the AI Coach UI:

"NutriCal provides general nutrition guidance and estimates and is not a substitute for professional medical advice."

SECURITY

Maintain Supabase Row Level Security.

Every user should only be able to access:

their own profile
their own nutrition goals
their own meal logs
their own AI conversation data if conversation history is implemented

Never expose:

GEMINI_API_KEY

to client-side code.

Do not put sensitive AI logic directly into client components.

CODE QUALITY

Before modifying anything:

Inspect the current project structure.
Inspect the existing dashboard implementation.
Inspect the existing Supabase client.
Inspect the existing AI estimation API.
Identify reusable code.
Avoid unnecessary rewrites.

Do not duplicate existing functionality.

If the dashboard is currently a large component, refactor carefully into reusable components only where it improves maintainability.

Potential future structure:

components/
├── dashboard/
├── profile/
├── coach/
├── nutrition/
└── ui/

lib/
├── supabase.ts
├── nutrition.ts
├── goals.ts
└── ai.ts

app/
├── dashboard/
├── profile/
├── coach/
└── api/
├── estimate/
├── coach/
├── profile/
└── goals/

Do not create this structure blindly. Use the existing project structure where practical.

IMPLEMENTATION STRATEGY

Do NOT implement every feature in one huge change.

Implement in stages:

Stage 1:
Profile + Supabase profiles table

Stage 2:
Personalized nutrition_goals

Stage 3:
AI nutrition assessment

Stage 4:
AI Coach

Stage 5:
Controlled AI actions

Stage 6:
UI polish and responsive improvements

After each stage:

check TypeScript errors
check ESLint errors
verify existing functionality
verify Supabase queries
verify authentication
verify RLS assumptions
verify mobile layout

Do not continue to the next stage if the previous stage introduces errors.

For every major change, explain:

What files were changed
What database changes are required
What environment variables are required
How to test the feature
Any assumptions made

Start by analyzing the current codebase and proposing the exact implementation for Stage 1 only. Do not write the entire application at once.

16. Then give Gemini this Stage 1 prompt

After Gemini analyzes the project, use this:
Implement Stage 1: Personalized User Profile for the existing NutriCal application.

Do not modify unrelated features.

Goal

Create a complete personalized profile system connected to Supabase.

Database

Create a profiles table with:

id UUID primary key
user_id UUID referencing authenticated user
full_name TEXT
age INTEGER
gender TEXT
height_cm NUMERIC
weight_kg NUMERIC
activity_level TEXT
primary_goal TEXT
diet_type TEXT
workout_frequency INTEGER
workout_type TEXT
daily_steps INTEGER
sleep_hours NUMERIC
wake_time TIME
sleep_time TIME
workout_time TIME
meals_per_day INTEGER
allergies TEXT
food_preferences TEXT
foods_to_avoid TEXT
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ

Add appropriate constraints where reasonable.

Enable Row Level Security.

Users must only be able to SELECT, INSERT and UPDATE their own profile.

Do not create insecure policies that allow users to access other users' profiles.

UI

Create:

/profile

The page should have a premium NutriCal design.

Sections:

Personal
Full name
Age
Gender
Body
Height
Weight
Lifestyle
Activity level
Daily steps
Sleep duration
Workout
Workout frequency
Workout type
Workout time
Nutrition
Diet type
Meals per day
Food preferences
Foods to avoid
Allergies
Goal
Primary goal

Use clear controls rather than requiring everything to be typed manually.

For example:

Activity:

Sedentary
Lightly Active
Moderately Active
Very Active

Goal:

Lose Weight
Maintain Weight
Gain Weight
Build Muscle
Improve General Nutrition

Diet:

Vegetarian
Non-Vegetarian
Vegan
Eggetarian
Other

UX

When the user opens /profile:

retrieve their existing profile
populate the form
show a loading state
handle missing profile gracefully

When saving:

validate fields
save to Supabase
show success feedback
handle errors clearly

Do not reload the entire page unnecessarily.

Make it responsive for desktop, tablet and mobile.

Do not use excessive gradients, glassmorphism or decorative UI.

Important

Do not break:

authentication
dashboard
meal logging
AI nutrition estimation
date navigation
existing goal tracking

After implementation, tell me:

Exact files changed
SQL I need to run in Supabase
RLS policies created
How to test the feature
Any issues or assumptions

17. Stage 2 prompt

Once the profile works, give Gemini this:
Now implement Stage 2: Personalized Nutrition Goals.

Do not rebuild the application.

Use the profile information created in Stage 1.

Goal1. Recommended NutriCal architecture
Main navigation

I’d restructure the application around 4–5 primary areas:



NutriCal
│
├── Dashboard
│   ├── Today's calories
│   ├── Protein / Carbs / Fats
│   ├── Today's meals
│   ├── Goal progress
│   └── AI quick log
│
├── AI Coach
│   ├── Chat
│   ├── Nutrition questions
│   ├── Daily recommendations
│   ├── Set / change goals
│   └── Daily routine analysis
│
├── Nutrition
│   ├── Meal history
│   ├── Calendar
│   └── Nutrition trends
│
├── Profile
│   ├── Personal information
│   ├── Body information
│   ├── Goals
│   ├── Activity
│   ├── Dietary preferences
│   └── Health-related preferences
│
└── Settings
    ├── Account
    ├── AI preferences
    └── Logout

The key idea is that the profile becomes the source of truth for personalization.

2. Feature 1 — Personalized Profile

Instead of only having an email/password account, create a proper NutriCal Profile.

Basic information


Full Name
Age
Gender
Height
Weight
Lifestyle


Activity Level
    Sedentary
    Lightly Active
    Moderately Active
    Very Active

Daily Steps
Sleep Duration
Workout Frequency
Workout Type
Nutrition preferences


Diet Type
    Vegetarian
    Non-Vegetarian
    Vegan
    Eggetarian
    Other

Food Preferences
Food Allergies
Foods You Avoid
Preferred Cuisine
Primary goal


What is your goal?

○ Lose Weight
○ Maintain Weight
○ Gain Weight
○ Build Muscle
○ Improve General Nutrition
Optional information

You can also have:



Wake-up time
Sleep time
Typical breakfast time
Lunch time
Dinner time
Workout time
Water intake

This becomes extremely useful for the AI.

For example:

User wakes at 7:30 AM, college from 9 AM–4 PM, works out 6 PM–7 PM, sleeps at 11:30 PM, is moderately active and wants to gain muscle.

The AI can use that context when making recommendations.

3. Don't put everything in meal_logs

Your current database has one table:



meal_logs

That's fine for meals, but don't put profile information into meal_logs.

I'd introduce a separate profile table:



profiles

For example:



profiles
---------
id
user_id
full_name
age
gender
height_cm
weight_kg
activity_level
primary_goal
diet_type
workout_frequency
workout_type
daily_steps
sleep_hours
wake_time
sleep_time
workout_time
allergies
food_preferences
foods_to_avoid
created_at
updated_at

Then create another table for goals:



nutrition_goals
---------------
id
user_id
calorie_target
protein_target
carbs_target
fats_target
goal_type
source
created_at
updated_at

source could be:



manual
ai_generated
calculated

This distinction is useful because later you'll know why a goal exists.

4. Feature 2 — AI Nutrition Coach

This should be much more than a simple chatbot.

Think of it as:

A conversational nutrition assistant that understands the user's NutriCal profile and nutrition history.

For example:

User:

What should I eat for breakfast?

AI:

Based on your current protein target and today's intake, a protein-rich breakfast would fit well. You could have 3 eggs with whole-grain toast and fruit.

Another:

User:

Why should I eat protein after workout?

AI explains the general nutrition principle in simple language.

Another:

I haven't eaten much today and it's already 7 PM. What should I eat?

The AI can look at the user's logged meals and provide context-aware suggestions.

5. AI should know the user's context

This is the important part.

Don't simply send:



User: What should I eat?

to Gemini.

Your server should construct a context such as:



User Profile:
Age: 20
Height: 175 cm
Weight: 68 kg
Goal: Muscle Gain
Activity: Moderately Active
Diet: Vegetarian
Workout: 6 PM
Sleep: 7 hours

Daily Goals:
Calories: 2400
Protein: 140g
Carbs: 300g
Fats: 70g

Today's Nutrition:
Calories: 1320
Protein: 62g
Carbs: 170g
Fats: 35g

Today's meals:
Breakfast: ...
Lunch: ...

Then ask Gemini to respond to the user's question.

That makes the AI feel personalized rather than generic.

6. AI should be able to modify goals

This is one of your strongest ideas.

User:

I want to gain muscle. Set my targets.

AI shouldn't blindly change the database immediately.

Instead:

AI

Based on the information in your profile, I can calculate a starting nutrition target.

Then show:



Recommended Daily Target

Calories       2,450 kcal
Protein          145 g
Carbohydrates    300 g
Fats              70 g

[Apply These Goals]
[Keep Current Goals]

Only after the user presses Apply should the database update.

This is much safer than allowing the AI to directly modify user data.

7. Feature 3 — AI Daily Routine Assessment

This could become one of NutriCal's signature features.

Instead of asking users to manually calculate their calories, introduce:

"Build My Nutrition Plan"

The AI asks questions conversationally.

For example:

Step 1

What's your main goal?



Lose weight
Maintain weight
Gain weight
Build muscle
Improve nutrition
Step 2

Tell me your age, height and current weight.

Step 3

How active are you on a normal day?



Mostly sitting
Lightly active
Moderately active
Very active
Step 4

Tell me about your typical day.

The user could type:

I wake up at 7, go to college at 9, come home around 4, work out from 6–7 and sleep around 11:30.

AI extracts:



Wake: 7:00
College: 9:00–16:00
Workout: 18:00–19:00
Sleep: 23:30
Step 5

What kind of diet do you follow?

Step 6

How many meals do you usually eat?

Step 7

Are there foods you avoid or cannot eat?

Then AI generates a personalized starting target.

8. Add a "Nutrition Assessment" screen

After completing the conversation, don't immediately dump the user into the dashboard.

Show a beautiful result:



YOUR NUTRITION PROFILE

Your Goal
Build Muscle

Daily Energy
2,450 kcal

Protein
145 g

Carbohydrates
300 g

Fats
70 g

Suggested Meals
4 meals / day

Workout Nutrition
Higher protein around your training window

Hydration
Personalized recommendation

────────────────────

These are starting targets.
You can adjust them anytime.

[Use These Goals]
[Edit Information]

This will feel significantly more premium.

9. AI Coach homepage

I would make the AI page visually different from a generic ChatGPT clone.

Something like:



Good afternoon, Aayush.

How can I help with your nutrition today?

┌────────────────────────────────────┐
│ Ask NutriCal anything...           │
└────────────────────────────────────┘

Quick actions

[🍽 What should I eat?]
[🎯 Adjust my goals]
[💪 Post-workout meal]
[📊 Analyze today's nutrition]

Today's insight

You are 62g away from your protein target.

Try adding a protein-rich snack
to your evening meal.

This makes the AI action-oriented, rather than just a chat box.

10. Give the AI access to actions

Eventually, your AI should be able to perform controlled actions.

For example:

User

Add my breakfast: 3 eggs and 2 slices of toast.

AI:



I estimated:

Calories       410 kcal
Protein         24 g
Carbs           30 g
Fat             20 g

[Add to today's log]
User

Change my protein target to 150g.

AI:



Your current target is 140g.

Would you like to change it to 150g?

[Confirm]
[Cancel]
User

Show me how much protein I ate this week.

AI can retrieve the relevant data and summarize it.

This is where your AI becomes a real application agent rather than just a chatbot.

11. Important architecture change

Your current:



/api/estimate

is specifically designed for nutrition estimation.

I'd eventually create:



/api/
│
├── estimate/
│   └── route.ts
│
├── coach/
│   └── route.ts
│
├── profile/
│   └── route.ts
│
├── goals/
│   └── route.ts
│
└── nutrition/
    └── route.ts

But don't build all of these at once.

Build incrementally.

12. Recommended development order

I'd do it in this exact sequence:

Phase 1 — Profile

Build:



Profile page
↓
profiles table
↓
Profile editing
↓
Save/load profile
Phase 2 — Goal engine

Build:



Profile information
↓
Calculate starting targets
↓
Display recommended goals
↓
User confirms
↓
Save goals
Phase 3 — AI assessment

Build:



AI onboarding conversation
↓
Collect routine
↓
Collect preferences
↓
Analyze information
↓
Generate recommended goals
↓
User confirms
↓
Save
Phase 4 — AI Coach

Build:



Chat UI
↓
Send message to /api/coach
↓
Load profile
↓
Load today's nutrition
↓
Send context to Gemini
↓
Return response
Phase 5 — AI actions

Add:



Log meal
Change goals
Analyze day
Analyze week
Give meal suggestions

with confirmation before database changes.

Phase 6 — Polish

Finally:



Animations
Loading states
Error states
Empty states
Mobile responsiveness
Dark/light theme
Accessibility
Security
13. Very important: health safety

Because NutriCal deals with health/nutrition, the AI should not pretend to be a doctor or dietitian.

The system prompt should tell Gemini:



You are a nutrition education and wellness assistant.

Provide general nutrition information and practical food suggestions.

Do not diagnose diseases.
Do not prescribe medication.
Do not claim to replace a doctor or registered dietitian.
Do not provide dangerous extreme dieting recommendations.
If the user describes a serious medical condition, eating disorder,
severe symptoms, pregnancy-related concerns, or medication-related
nutrition questions, recommend consulting an appropriate healthcare
professional.

Clearly distinguish estimates from measured nutritional values.

Also make the UI say something like:

NutriCal provides general nutrition guidance and estimates. It is not a substitute for professional medical advice.

14. Your database should eventually look like this


auth.users
     │
     │
     ▼
 profiles
     │
     ├──────────────► nutrition_goals
     │
     │
     └──────────────► meal_logs
                          │
                          ▼
                     daily nutrition

Later you could add:



ai_conversations
ai_messages

if you want persistent chat history.

15. The prompt I'd give Gemini Pro

Since you're using Gemini Pro to actually modify the codebase, don't give it one enormous "build everything" prompt immediately.

Give it a strong architectural prompt first.

Then use smaller implementation prompts.

Master prompt

You are working on my existing Next.js application called NutriCal.

IMPORTANT:
Do NOT rebuild the application from scratch.
Do NOT remove or break existing functionality.
First inspect the existing codebase and understand the current architecture before making changes.

Existing stack
Next.js 16.3.6
App Router
React 19
TypeScript
Tailwind CSS v4
Supabase Authentication
Supabase PostgreSQL
Google Gemini API through @google/genai
Existing functionality

NutriCal currently has:

Email/password authentication using Supabase
Nutrition dashboard
AI nutrition estimation
Natural-language meal logging
Manual meal entry
Daily calories/macros tracking
Date-based meal history
Custom nutrition targets
Goal streak tracking

Existing database table:

meal_logs

Columns:

id
user_id
meal_name
calories
protein
carbs
fats
created_at
logged_date

Existing default targets:

2200 kcal
140g protein
250g carbohydrates
65g fats

The existing application should continue working after all changes.

NEW PRODUCT DIRECTION

Transform NutriCal into a personalized nutrition companion.

The main flow should become:

USER PROFILE
↓
PERSONAL INFORMATION
↓
DAILY ROUTINE
↓
AI NUTRITION ASSESSMENT
↓
PERSONALIZED TARGETS
↓
DAILY TRACKING
↓
AI NUTRITION COACH
↓
CONTINUOUS PERSONALIZED RECOMMENDATIONS

The design must feel like a premium modern health-tech product rather than an AI-generated template.

Use a restrained visual system:

Zinc / neutral backgrounds
Emerald as the primary accent
Strong typography hierarchy
Generous whitespace
Subtle borders
Minimal shadows
Rounded but not excessively rounded components
Clean cards
Excellent mobile responsiveness
Smooth but subtle animations

Avoid:

excessive gradients
excessive glassmorphism
huge decorative elements
generic AI chatbot styling
unnecessary icons everywhere
overly colorful dashboards
template-like UI
FEATURE 1: PERSONALIZED PROFILE

Create a dedicated /profile page.

Create a new Supabase table:

profiles

Suggested fields:

id
user_id
full_name
age
gender
height_cm
weight_kg
activity_level
primary_goal
diet_type
workout_frequency
workout_type
daily_steps
sleep_hours
wake_time
sleep_time
workout_time
meals_per_day
allergies
food_preferences
foods_to_avoid
created_at
updated_at

Use appropriate PostgreSQL types.

The profile must belong to the authenticated Supabase user.

Implement Row Level Security so users can only access their own profile.

The profile page should allow users to:

create their profile
edit their profile
save changes
view their current information

Organize the form into logical sections:

Personal Information
Body Information
Lifestyle
Workout
Nutrition Preferences
Daily Routine
Goals

Do not make the form visually overwhelming.

Use progressive sections/cards where appropriate.

FEATURE 2: PERSONALIZED NUTRITION GOALS

Create a separate table:

nutrition_goals

Suggested fields:

id
user_id
calorie_target
protein_target
carbs_target
fats_target
goal_type
source
created_at
updated_at

Possible values for source:

manual
ai_generated
calculated

Users should be able to manually edit their goals.

The existing dashboard must use the user's personalized goals instead of always using the hardcoded default values.

Keep the existing defaults as fallback values for users who have not completed their profile.

FEATURE 3: AI NUTRITION ASSESSMENT

Create an onboarding/assessment experience called:

Build My Nutrition Plan

The user should be able to have a conversational interaction with NutriCal.

The AI should collect information such as:

age
height
weight
primary goal
activity level
workout frequency
workout type
typical daily routine
wake time
sleep time
workout time
meals per day
diet type
food preferences
foods avoided
allergies

The user should be able to answer naturally.

Example:

"I wake up at 7, go to college at 9, come home around 4, work out from 6 to 7 and sleep around 11:30."

The AI should extract useful structured information from this response rather than forcing the user to enter every field manually.

After collecting sufficient information, show a clear summary:

NUTRITION PROFILE

Goal
Muscle Gain

Daily Calories
2450 kcal

Protein
145 g

Carbohydrates
300 g

Fats
70 g

Suggested Meals
4/day

Then show:

[Use These Goals]
[Edit Information]

Do NOT automatically overwrite the user's existing goals.

The user must explicitly confirm before personalized goals are saved.

FEATURE 4: AI NUTRITION COACH

Create a dedicated /coach page.

This should NOT look like a generic ChatGPT clone.

The page should contain:

personalized greeting
chat interface
suggested questions
today's nutrition summary
useful nutrition insight
quick actions

Suggested quick actions:

"What should I eat?"
"Analyze today's nutrition"
"Adjust my goals"
"Suggest a post-workout meal"
"Why do I need more protein?"
"Help me plan tomorrow's meals"

The AI should understand the authenticated user's context.

When generating a response, the server should retrieve:

User profile
Current nutrition goals
Today's meal logs
Relevant recent nutrition information

Then provide that context to Gemini.

Do NOT expose the Gemini API key to the browser.

Create a server-side route such as:

/api/coach

AI CONTEXT

The AI should receive structured context similar to:

USER PROFILE:
Age:
Height:
Weight:
Goal:
Activity:
Diet:
Workout:
Sleep:
Daily routine:

NUTRITION TARGETS:
Calories:
Protein:
Carbs:
Fats:

TODAY'S NUTRITION:
Calories consumed:
Protein consumed:
Carbs consumed:
Fat consumed:

TODAY'S MEALS:
...

USER QUESTION:
...

The AI should use this information to make contextual responses.

FEATURE 5: CONTROLLED AI ACTIONS

The AI should eventually support actions such as:

Log a meal
Change nutrition goals
Analyze today's nutrition
Analyze recent nutrition history
Suggest meals
Explain nutrition concepts

IMPORTANT:

Never allow the AI to silently modify the database.

For database-changing actions, first show a confirmation UI.

Example:

User:
"Change my protein target to 150g."

NutriCal:

"Your current protein target is 140g.

I can change it to 150g.

[Confirm Change]
[Cancel]"

Only after confirmation should the database be updated.

HEALTH SAFETY

The AI is a nutrition education and wellness assistant.

It must:

provide general nutrition information
explain nutrition concepts
provide practical food suggestions
clearly distinguish estimates from measured nutritional values

It must NOT:

diagnose medical conditions
prescribe medication
claim to replace a doctor or registered dietitian
recommend dangerous extreme diets
provide unsafe weight-loss recommendations
make medical claims without appropriate caution

For serious medical conditions, eating disorders, pregnancy-related concerns, medication-related nutrition questions, or serious symptoms, recommend consulting an appropriate healthcare professional.

Add an unobtrusive disclaimer in the AI Coach UI:

"NutriCal provides general nutrition guidance and estimates and is not a substitute for professional medical advice."

SECURITY

Maintain Supabase Row Level Security.

Every user should only be able to access:

their own profile
their own nutrition goals
their own meal logs
their own AI conversation data if conversation history is implemented

Never expose:

GEMINI_API_KEY

to client-side code.

Do not put sensitive AI logic directly into client components.

CODE QUALITY

Before modifying anything:

Inspect the current project structure.
Inspect the existing dashboard implementation.
Inspect the existing Supabase client.
Inspect the existing AI estimation API.
Identify reusable code.
Avoid unnecessary rewrites.

Do not duplicate existing functionality.

If the dashboard is currently a large component, refactor carefully into reusable components only where it improves maintainability.

Potential future structure:

components/
├── dashboard/
├── profile/
├── coach/
├── nutrition/
└── ui/

lib/
├── supabase.ts
├── nutrition.ts
├── goals.ts
└── ai.ts

app/
├── dashboard/
├── profile/
├── coach/
└── api/
├── estimate/
├── coach/
├── profile/
└── goals/

Do not create this structure blindly. Use the existing project structure where practical.

IMPLEMENTATION STRATEGY

Do NOT implement every feature in one huge change.

Implement in stages:

Stage 1:
Profile + Supabase profiles table

Stage 2:
Personalized nutrition_goals

Stage 3:
AI nutrition assessment

Stage 4:
AI Coach

Stage 5:
Controlled AI actions

Stage 6:
UI polish and responsive improvements

After each stage:

check TypeScript errors
check ESLint errors
verify existing functionality
verify Supabase queries
verify authentication
verify RLS assumptions
verify mobile layout

Do not continue to the next stage if the previous stage introduces errors.

For every major change, explain:

What files were changed
What database changes are required
What environment variables are required
How to test the feature
Any assumptions made

Start by analyzing the current codebase and proposing the exact implementation for Stage 1 only. Do not write the entire application at once.

16. Then give Gemini this Stage 1 prompt

After Gemini analyzes the project, use this:

Implement Stage 1: Personalized User Profile for the existing NutriCal application.

Do not modify unrelated features.

Goal

Create a complete personalized profile system connected to Supabase.

Database

Create a profiles table with:

id UUID primary key
user_id UUID referencing authenticated user
full_name TEXT
age INTEGER
gender TEXT
height_cm NUMERIC
weight_kg NUMERIC
activity_level TEXT
primary_goal TEXT
diet_type TEXT
workout_frequency INTEGER
workout_type TEXT
daily_steps INTEGER
sleep_hours NUMERIC
wake_time TIME
sleep_time TIME
workout_time TIME
meals_per_day INTEGER
allergies TEXT
food_preferences TEXT
foods_to_avoid TEXT
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ

Add appropriate constraints where reasonable.

Enable Row Level Security.

Users must only be able to SELECT, INSERT and UPDATE their own profile.

Do not create insecure policies that allow users to access other users' profiles.

UI

Create:

/profile

The page should have a premium NutriCal design.

Sections:

Personal
Full name
Age
Gender
Body
Height
Weight
Lifestyle
Activity level
Daily steps
Sleep duration
Workout
Workout frequency
Workout type
Workout time
Nutrition
Diet type
Meals per day
Food preferences
Foods to avoid
Allergies
Goal
Primary goal

Use clear controls rather than requiring everything to be typed manually.

For example:

Activity:

Sedentary
Lightly Active
Moderately Active
Very Active

Goal:

Lose Weight
Maintain Weight
Gain Weight
Build Muscle
Improve General Nutrition

Diet:

Vegetarian
Non-Vegetarian
Vegan
Eggetarian
Other

UX

When the user opens /profile:

retrieve their existing profile
populate the form
show a loading state
handle missing profile gracefully

When saving:

validate fields
save to Supabase
show success feedback
handle errors clearly

Do not reload the entire page unnecessarily.

Make it responsive for desktop, tablet and mobile.

Do not use excessive gradients, glassmorphism or decorative UI.

Important

Do not break:

authentication
dashboard
meal logging
AI nutrition estimation
date navigation
existing goal tracking

After implementation, tell me:

Exact files changed
SQL I need to run in Supabase
RLS policies created
How to test the feature
Any issues or assumptions
17. Stage 2 prompt

Once the profile works, give Gemini this:

Replace the dashboard's hardcoded nutrition targets with user-specific targets.

Create:

nutrition_goals

Fields:

id
user_id
calorie_target
protein_target
carbs_target
fats_target
goal_type
source
created_at
updated_at

Enable Row Level Security so users can only access their own goals.

Goal calculation

Create a reusable server-side nutrition calculation utility.

Use profile information such as:

age
gender
height
weight
activity level
primary goal

to calculate a reasonable starting estimate.

Treat the result as an estimate rather than medical advice.

Do not silently overwrite existing user goals.

If the user has no personalized goals, generate a starting recommendation.

Show the user:

"Your personalized starting targets"

with:

Calories
Protein
Carbohydrates
Fats

Allow the user to:

accept the targets
manually edit them
save them

The dashboard must then use the personalized targets everywhere instead of the old hardcoded values.

Keep the existing default targets only as a fallback for users who have not created a profile.

Do not break existing streak calculations.

After implementation, report:

Files changed
SQL required
How the calculations work
How existing users are handled
How to test it
18. Stage 3 is where NutriCal becomes really interesting

Once Stages 1 and 2 are working, I'd build the AI assessment.

The important design principle is:

Don't make the AI ask 15 boring form questions.

Make it conversational.

For example:

Let's understand your routine.

What does a normal weekday look like for you?

User:

I wake up at 7, have breakfast, go to college at 9, come home at 4, then gym from 6 to 7 and sleep at around 11:30.

NutriCal extracts the information and then asks only what's missing:

Got it. One more thing — what kind of diet do you usually follow?

That feels much more intelligent.

19. One more feature I'd strongly recommend

Add a "Today for You" section.

Instead of the dashboard only saying:

Calories: 1420 / 2200
Protein: 72 / 140

have NutriCal interpret the numbers:

You're 68g short of your protein target today.

Since you have a workout scheduled this evening, consider a protein-rich dinner or snack.

Then:

Suggested options

Paneer + roti
Greek yogurt + fruit
Eggs + toast
Dal + rice

The exact suggestions can be adapted to the user's dietary profile.

That is the difference between:

nutrition tracker

and

nutrition companion.

20. Your eventual NutriCal experience

I would aim for this flow:

                 ┌──────────────┐
                 │   Sign Up    │
                 └──────┬───────┘
                        ↓
                 ┌──────────────┐
                 │    Profile   │
                 └──────┬───────┘
                        ↓
                 ┌──────────────┐
                 │ AI Assessment│
                 └──────┬───────┘
                        ↓
              ┌─────────────────────┐
              │ Personalized Goals  │
              └──────────┬──────────┘
                         ↓
                 ┌──────────────┐
                 │   Dashboard  │
                 └──────┬───────┘
                        ↓
              ┌─────────────────────┐
              │     AI Coach        │
              │                     │
              │ Ask                 │
              │ Analyze             │
              │ Suggest             │
              │ Explain             │
              │ Adjust              │
              └──────────┬──────────┘
                         ↓
                Continuous learning
                from user's profile
                + nutrition history

