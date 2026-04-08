# LifeOS

LifeOS is a full-stack personal dashboard built with React, Tailwind CSS, and Supabase. It brings a Today workspace, skills, workouts, rep tracking, books, projects, tasks, weekly summaries, profile settings, dark mode, charts, and a GitHub-style consistency grid into one responsive workspace.

## Features

- Today page with a full-size daily todo flow, carry-over tasks, and a searchable learnings log
- Dashboard with welcome header, summary cards, weekly growth charts, and activity heatmap
- Skills tracker with XP, levels, progress bars, and session logging
- Physical health page with workout logging, history table, and weekly workout chart
- Reps page with custom exercises, instant set logging, and weekly/monthly charts per exercise
- Books page with shelf view, progress tracking, notes, and star ratings
- Projects and tasks page with project metadata, kanban drag-and-drop, and overdue highlighting
- Weekly summary page with Monday auto-generation and reflection notes
- Profile page with Supabase Storage avatar uploads and persistent theme preference

## 1. Clone the repo

```bash
git clone <your-repo-url>
cd lifeos
```

## 2. Create a Supabase project

Create a new Supabase project from the Supabase dashboard.

## 3. Run the SQL schema

Open the SQL editor in Supabase and run the SQL from [schema.sql](/D:/Codes/lifeos/supabase/schema.sql).

This creates the requested core tables:

- `profile`
- `skills`
- `skill_sessions`
- `workouts`
- `books`
- `projects`
- `tasks`
- `weekly_summary`

It also creates support tables `reading_logs`, `daily_todos`, `learnings`, `exercises`, and `rep_logs`, plus the `avatars` storage bucket and helper triggers.

## 4. Add environment variables

Copy `.env.example` to `.env` and paste your Supabase values:

```bash
cp .env.example .env
```

Required variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_BASE_PATH`

For local development, set `VITE_BASE_PATH=/`.

For GitHub Pages, set `VITE_BASE_PATH=/your-repository-name/`.

## 5. Install and run locally

```bash
npm install
npm run dev
```

## 6. Deploy to GitHub Pages

1. Push the repo to GitHub.
2. Make sure `VITE_BASE_PATH` matches your GitHub repository name.
3. Run:

```bash
npm run deploy
```

4. In GitHub, enable GitHub Pages for the `gh-pages` branch if it is not already enabled.

## Scripts

- `npm run dev` starts the local dev server
- `npm run build` creates the production build
- `npm run preview` previews the production build
- `npm run lint` runs ESLint
- `npm run deploy` builds and publishes `dist` with `gh-pages`

## Notes

- No seeded content is included. All persistent data comes from Supabase.
- The dashboard gracefully handles empty states, loading, and runtime errors.
- The app does not ship with seeded content. Everything you see is loaded from Supabase.
