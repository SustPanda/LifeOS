import { createElement, useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  BookOpen,
  BookText,
  CalendarClock,
  Check,
  CheckSquare,
  Dumbbell,
  Flame,
  FolderKanban,
  Home,
  LoaderCircle,
  Moon,
  Plus,
  Search,
  Sparkles,
  Sun,
  Target,
  Trash2,
  UserCircle2,
} from 'lucide-react'
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd'
import {
  addDays,
  differenceInCalendarDays,
  endOfWeek,
  format,
  isToday,
  parseISO,
  startOfWeek,
  subDays,
  subWeeks,
} from 'date-fns'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import clsx from 'clsx'
import { isSupabaseConfigured, supabase } from './lib/supabaseClient'

const NAV_ITEMS = [
  { to: '/', label: 'Today', icon: CheckSquare },
  { to: '/dashboard', label: 'Dashboard', icon: Home },
  { to: '/skills', label: 'Skills', icon: Sparkles },
  { to: '/health', label: 'Health', icon: Dumbbell },
  { to: '/reps', label: 'Reps', icon: Dumbbell },
  { to: '/books', label: 'Books', icon: BookOpen },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/weekly-summary', label: 'Weekly Summary', icon: CalendarClock },
  { to: '/profile', label: 'Profile', icon: UserCircle2 },
]

const PROJECT_COLUMNS = [
  { id: 'todo', label: 'To Do' },
  { id: 'inprogress', label: 'In Progress' },
  { id: 'done', label: 'Done' },
]

const BOOK_STATUSES = ['want to read', 'reading', 'finished']
const BOOK_GENRES = ['self help', 'autobiography', 'sahitya', 'other']
const PRIORITIES = ['low', 'medium', 'high']
const EMPTY_DATA = {
  profile: null,
  skills: [],
  skillSessions: [],
  workouts: [],
  books: [],
  readingLogs: [],
  projects: [],
  tasks: [],
  weeklySummary: [],
  dailyTodos: [],
  learnings: [],
  exercises: [],
  repLogs: [],
}

const tableSelects = {
  profile: 'id, name, avatar_url, bio, theme_mode',
  skills:
    'id, name, category, xp, time_logged_minutes, progress_percent, created_at',
  skillSessions: 'id, skill_id, duration_minutes, date, notes, created_at',
  workouts:
    'id, date, exercise_name, sets, reps, weight_kg, notes, created_at',
  books:
    'id, title, author, genre, status, current_page, total_pages, rating, notes, created_at',
  readingLogs:
    'id, book_id, previous_page, current_page, pages_read, date, created_at',
  projects:
    'id, name, description, priority, deadline, status, created_at',
  tasks:
    'id, project_id, title, priority, deadline, status, created_at, updated_at, completed_at',
  weeklySummary:
    'id, week_start_date, skills_minutes, workouts_count, books_pages, tasks_completed, notes, created_at',
  dailyTodos: 'id, title, completed, created_at',
  learnings: 'id, content, created_at',
  exercises: 'id, name, created_at',
  repLogs: 'id, exercise_id, reps, logged_at',
}

function App() {
  const [data, setData] = useState(EMPTY_DATA)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [theme, setTheme] = useState('dark')
  const [savingTheme, setSavingTheme] = useState(false)

  const loadAppData = useCallback(async () => {
    if (!supabase) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    const [
      profileRes,
      skillsRes,
      skillSessionsRes,
      workoutsRes,
      booksRes,
      readingLogsRes,
      projectsRes,
      tasksRes,
      weeklySummaryRes,
      dailyTodosRes,
      learningsRes,
      exercisesRes,
      repLogsRes,
    ] = await Promise.all([
      supabase.from('profile').select(tableSelects.profile).limit(1).maybeSingle(),
      supabase.from('skills').select(tableSelects.skills).order('created_at', { ascending: true }),
      supabase.from('skill_sessions').select(tableSelects.skillSessions).order('date', { ascending: false }),
      supabase.from('workouts').select(tableSelects.workouts).order('date', { ascending: false }),
      supabase.from('books').select(tableSelects.books).order('created_at', { ascending: false }),
      supabase.from('reading_logs').select(tableSelects.readingLogs).order('date', { ascending: false }),
      supabase.from('projects').select(tableSelects.projects).order('created_at', { ascending: false }),
      supabase.from('tasks').select(tableSelects.tasks).order('created_at', { ascending: false }),
      supabase.from('weekly_summary').select(tableSelects.weeklySummary).order('week_start_date', { ascending: true }),
      supabase.from('daily_todos').select(tableSelects.dailyTodos).order('created_at', { ascending: false }),
      supabase.from('learnings').select(tableSelects.learnings).order('created_at', { ascending: false }),
      supabase.from('exercises').select(tableSelects.exercises).order('created_at', { ascending: false }),
      supabase.from('rep_logs').select(tableSelects.repLogs).order('logged_at', { ascending: false }),
    ])

    const firstError = [
      profileRes.error,
      skillsRes.error,
      skillSessionsRes.error,
      workoutsRes.error,
      booksRes.error,
      readingLogsRes.error,
      projectsRes.error,
      tasksRes.error,
      weeklySummaryRes.error,
      dailyTodosRes.error,
      learningsRes.error,
      exercisesRes.error,
      repLogsRes.error,
    ].find(Boolean)

    if (firstError) {
      setError(firstError.message)
      setLoading(false)
      return
    }

    const nextData = {
      profile: profileRes.data,
      skills: skillsRes.data ?? [],
      skillSessions: skillSessionsRes.data ?? [],
      workouts: workoutsRes.data ?? [],
      books: booksRes.data ?? [],
      readingLogs: readingLogsRes.data ?? [],
      projects: projectsRes.data ?? [],
      tasks: tasksRes.data ?? [],
      weeklySummary: weeklySummaryRes.data ?? [],
      dailyTodos: dailyTodosRes.data ?? [],
      learnings: learningsRes.data ?? [],
      exercises: exercisesRes.data ?? [],
      repLogs: repLogsRes.data ?? [],
    }

    setData(nextData)
    setTheme(nextData.profile?.theme_mode || localStorage.getItem('lifeos-theme') || 'dark')
    setLoading(false)
    const today = new Date()
    const weekStartDate = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd')
    const exists = (nextData.weeklySummary || []).some((summary) => summary.week_start_date === weekStartDate)
    const shouldGenerate = today.getDay() === 1 || (nextData.weeklySummary || []).length === 0
    if (!exists && shouldGenerate) {
      const result = await supabase.from('weekly_summary').insert(
        buildSummaryPayload(nextData, subDays(today, 6), today, weekStartDate),
      )
      if (!result.error) {
        const refreshedSummaries = await supabase
          .from('weekly_summary')
          .select(tableSelects.weeklySummary)
          .order('week_start_date', { ascending: true })
        if (!refreshedSummaries.error) {
          setData((current) => ({
            ...current,
            weeklySummary: refreshedSummaries.data ?? current.weeklySummary,
          }))
        }
      }
    }
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadAppData()
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [loadAppData])

  useEffect(() => {
    document.body.dataset.theme = theme
    localStorage.setItem('lifeos-theme', theme)
  }, [theme])

  async function runMutation(operation) {
    setError('')
    const { error: mutationError } = await operation
    if (mutationError) {
      setError(mutationError.message)
      return false
    }
    await loadAppData()
    return true
  }

  async function saveProfile(values) {
    if (!supabase) return false
    return runMutation(
      supabase.from('profile').upsert(
        {
          id: data.profile?.id ?? 1,
          name: values.name?.trim() || null,
          avatar_url: values.avatar_url || null,
          bio: values.bio?.trim() || null,
          theme_mode: values.theme_mode || theme,
        },
        { onConflict: 'id' },
      ),
    )
  }

  async function uploadAvatar(file) {
    if (!supabase || !file) return null
    const extension = file.name.split('.').pop()
    const filePath = `avatar-${Date.now()}.${extension}`
    const upload = await supabase.storage.from('avatars').upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    })
    if (upload.error) {
      setError(upload.error.message)
      return null
    }
    return supabase.storage.from('avatars').getPublicUrl(filePath).data.publicUrl
  }

  async function toggleTheme() {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    if (!supabase) return
    setSavingTheme(true)
    await saveProfile({ ...data.profile, theme_mode: nextTheme })
    setSavingTheme(false)
  }

  async function addSkill(values) {
    if (!supabase) return false
    return runMutation(
      supabase.from('skills').insert({
        name: values.name.trim(),
        category: values.category.trim(),
        xp: Number(values.xp) || 0,
        time_logged_minutes: 0,
        progress_percent: Number(values.progress_percent) || 0,
      }),
    )
  }

  async function logSkillSession(values) {
    if (!supabase) return false
    const skill = data.skills.find((item) => item.id === Number(values.skill_id))
    if (!skill) {
      setError('Select a valid skill before logging a session.')
      return false
    }
    const duration = Number(values.duration_minutes) || 0
    const nextXp = skill.xp + duration
    const nextMinutes = skill.time_logged_minutes + duration
    const nextProgressPercent = Math.min(100, nextXp % 100 === 0 ? 100 : nextXp % 100)
    const [sessionResult, skillResult] = await Promise.all([
      supabase.from('skill_sessions').insert({
        skill_id: skill.id,
        duration_minutes: duration,
        date: values.date,
        notes: values.notes?.trim() || null,
      }),
      supabase.from('skills').update({
        xp: nextXp,
        time_logged_minutes: nextMinutes,
        progress_percent: nextProgressPercent,
      }).eq('id', skill.id),
    ])
    const mutationError = sessionResult.error || skillResult.error
    if (mutationError) {
      setError(mutationError.message)
      return false
    }
    await loadAppData()
    return true
  }

  async function addWorkout(values) {
    if (!supabase) return false
    return runMutation(
      supabase.from('workouts').insert({
        date: values.date,
        exercise_name: values.exercise_name.trim(),
        sets: Number(values.sets) || 0,
        reps: Number(values.reps) || 0,
        weight_kg: Number(values.weight_kg) || 0,
        notes: values.notes?.trim() || null,
      }),
    )
  }

  async function addBook(values) {
    if (!supabase) return false
    return runMutation(
      supabase.from('books').insert({
        title: values.title.trim(),
        author: values.author.trim(),
        status: values.status,
        current_page: Number(values.current_page) || 0,
        total_pages: Number(values.total_pages) || 0,
        rating: values.rating ? Number(values.rating) : null,
        genre: values.genre,
        notes: values.notes?.trim() || null,
      }),
    )
  }

  async function updateBookProgress(bookId, values) {
    if (!supabase) return false
    const book = data.books.find((item) => item.id === Number(bookId))
    if (!book) {
      setError('Book not found.')
      return false
    }
    const nextPage = Number(values.current_page) || 0
    const pagesRead = Math.max(0, nextPage - (book.current_page || 0))
    const operations = [
      supabase.from('books').update({
        current_page: nextPage,
        status: values.status,
        rating: values.rating ? Number(values.rating) : null,
        genre: values.genre,
        notes: values.notes?.trim() || null,
      }).eq('id', book.id),
    ]
    if (pagesRead > 0) {
      operations.push(
        supabase.from('reading_logs').insert({
          book_id: book.id,
          previous_page: book.current_page || 0,
          current_page: nextPage,
          pages_read: pagesRead,
          date: values.date,
        }),
      )
    }
    const results = await Promise.all(operations)
    const mutationError = results.find((result) => result.error)?.error
    if (mutationError) {
      setError(mutationError.message)
      return false
    }
    await loadAppData()
    return true
  }

  async function addProject(values) {
    if (!supabase) return false
    return runMutation(
      supabase.from('projects').insert({
        name: values.name.trim(),
        description: values.description?.trim() || null,
        priority: values.priority,
        deadline: values.deadline || null,
        status: values.status,
      }),
    )
  }

  async function addTask(values) {
    if (!supabase) return false
    return runMutation(
      supabase.from('tasks').insert({
        project_id: Number(values.project_id),
        title: values.title.trim(),
        priority: values.priority,
        deadline: values.deadline || null,
        status: values.status,
      }),
    )
  }

  async function updateTaskStatus(taskId, status) {
    if (!supabase) return false
    return runMutation(
      supabase.from('tasks').update({
        status,
        updated_at: new Date().toISOString(),
        completed_at: status === 'done' ? new Date().toISOString() : null,
      }).eq('id', taskId),
    )
  }

  async function updateWeeklySummaryNote(summaryId, notes) {
    if (!supabase) return false
    return runMutation(
      supabase.from('weekly_summary').update({ notes }).eq('id', summaryId),
    )
  }

  async function addDailyTodo(title) {
    if (!supabase) return false
    return runMutation(
      supabase.from('daily_todos').insert({
        title: title.trim(),
        completed: false,
        created_at: format(new Date(), 'yyyy-MM-dd'),
      }),
    )
  }

  async function toggleDailyTodo(todo) {
    if (!supabase) return false
    return runMutation(
      supabase.from('daily_todos').update({ completed: !todo.completed }).eq('id', todo.id),
    )
  }

  async function deleteDailyTodo(id) {
    if (!supabase) return false
    return runMutation(supabase.from('daily_todos').delete().eq('id', id))
  }

  async function carryOverDailyTodo(todo) {
    if (!supabase) return false
    return runMutation(
      supabase.from('daily_todos').update({ created_at: format(new Date(), 'yyyy-MM-dd') }).eq('id', todo.id),
    )
  }

  async function addLearning(content) {
    if (!supabase) return false
    return runMutation(
      supabase.from('learnings').insert({ content: content.trim() }),
    )
  }

  async function addExercise(name) {
    if (!supabase) return false
    return runMutation(
      supabase.from('exercises').insert({ name: name.trim() }),
    )
  }

  async function addRepLog(values) {
    if (!supabase) return false
    return runMutation(
      supabase.from('rep_logs').insert({
        exercise_id: values.exercise_id,
        reps: Number(values.reps) || 0,
      }),
    )
  }

  const appState = {
    data,
    loading,
    error,
    theme,
    savingTheme,
    actions: {
      loadAppData,
      saveProfile,
      uploadAvatar,
      toggleTheme,
      addSkill,
      logSkillSession,
      addWorkout,
      addBook,
      updateBookProgress,
      addProject,
      addTask,
      updateTaskStatus,
      updateWeeklySummaryNote,
      addDailyTodo,
      toggleDailyTodo,
      deleteDailyTodo,
      carryOverDailyTodo,
      addLearning,
      addExercise,
      addRepLog,
    },
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-bg-dark px-6 py-10 text-text-dark">
        <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-card-dark p-8 shadow-2xl shadow-black/30">
          <div className="mb-6 flex items-center gap-3 text-accent-soft">
            <AlertCircle className="size-6" />
            <h1 className="text-3xl font-semibold text-white">LifeOS needs Supabase keys</h1>
          </div>
          <p className="mb-4 text-zinc-300">
            Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to `.env`, then restart the dev server.
          </p>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-300">
            <p>`src/lib/supabaseClient.js` is already wired to read the environment values.</p>
            <p>`README.md` includes the exact setup and deployment steps.</p>
          </div>
        </div>
      </div>
    )
  }

  return <AppLayout appState={appState} />
}

function AppLayout({ appState }) {
  const location = useLocation()
  const { data, loading, error, theme, savingTheme, actions } = appState
  const profileName = data.profile?.name || 'there'

  return (
    <div className={clsx('min-h-screen transition-colors duration-300', theme === 'dark' ? 'bg-bg-dark text-text-dark' : 'bg-bg-light text-text-light')}>
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-4 lg:flex-row lg:px-6">
        <aside className={clsx('scrollbar-hidden sticky top-4 flex shrink-0 gap-2 overflow-x-auto rounded-3xl border p-3 lg:h-[calc(100vh-2rem)] lg:w-72 lg:flex-col lg:overflow-visible', theme === 'dark' ? 'border-white/10 bg-card-dark/90 shadow-2xl shadow-black/30' : 'border-zinc-200 bg-card-light shadow-xl shadow-zinc-200/60')}>
          <div className="hidden rounded-2xl border border-white/10 bg-gradient-to-br from-accent/30 to-transparent p-5 lg:block">
            <p className="mb-2 text-xs uppercase tracking-[0.3em] text-accent-soft">LifeOS</p>
            <h1 className="text-2xl font-semibold">Your personal operating system</h1>
            <p className="mt-3 text-sm text-zinc-400">Track your growth, reading, fitness, and execution in one calm workspace.</p>
          </div>
          <nav className="flex gap-2 lg:flex-col">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              return (
                <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => clsx('flex min-w-max items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition', isActive ? 'bg-accent text-white shadow-lg shadow-accent/20' : theme === 'dark' ? 'text-zinc-300 hover:bg-white/5 hover:text-white' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900')}>
                  <Icon className="size-4" />
                  {item.label}
                </NavLink>
              )
            })}
          </nav>
          <div className={clsx('hidden rounded-2xl p-4 text-sm lg:block', theme === 'dark' ? 'bg-black/20 text-zinc-400' : 'bg-zinc-100 text-zinc-600')}>
            <p className="font-medium text-current">Welcome back, {profileName}.</p>
            <p className="mt-2">Use the profile page to connect your identity, theme preference, and avatar.</p>
          </div>
        </aside>

        <main className="flex-1">
          <header className={clsx('mb-6 flex flex-col gap-4 rounded-3xl border p-4 md:flex-row md:items-center md:justify-between', theme === 'dark' ? 'border-white/10 bg-card-dark/90' : 'border-zinc-200 bg-card-light')}>
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-accent-soft">{format(new Date(), 'EEEE, MMMM d')}</p>
              <h2 className="text-2xl font-semibold">{NAV_ITEMS.find((item) => item.to === location.pathname)?.label || 'LifeOS'}</h2>
            </div>
            <div className="flex items-center gap-3">
              {error ? <div className={clsx('max-w-md rounded-2xl border px-4 py-3 text-sm', theme === 'dark' ? 'border-red-500/30 bg-red-500/10 text-red-200' : 'border-red-200 bg-red-50 text-red-700')}>{error}</div> : null}
              <button type="button" onClick={() => void actions.toggleTheme()} className={clsx(buttonClass(theme, 'secondary'))}>
                {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
                {savingTheme ? 'Saving...' : theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </button>
            </div>
          </header>

          {loading ? (
            <div className="flex min-h-[60vh] items-center justify-center">
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-card-dark px-5 py-4 text-zinc-300">
                <LoaderCircle className="size-5 animate-spin" />
                Loading LifeOS...
              </div>
            </div>
          ) : (
            <div key={location.pathname} className="page-enter">
              <Routes>
                <Route path="/" element={<TodayPage appState={appState} />} />
                <Route path="/dashboard" element={<DashboardPage appState={appState} />} />
                <Route path="/skills" element={<SkillsPage appState={appState} />} />
                <Route path="/health" element={<HealthPage appState={appState} />} />
                <Route path="/reps" element={<RepsPage appState={appState} />} />
                <Route path="/books" element={<BooksPage appState={appState} />} />
                <Route path="/projects" element={<ProjectsPage appState={appState} />} />
                <Route path="/weekly-summary" element={<WeeklySummaryPage appState={appState} />} />
                <Route path="/profile" element={<ProfilePage appState={appState} />} />
              </Routes>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

function TodayPage({ appState }) {
  const { data, theme, actions } = appState
  const [todoTitle, setTodoTitle] = useState('')
  const [learningInput, setLearningInput] = useState('')
  const [learningQuery, setLearningQuery] = useState('')
  const todayKey = format(new Date(), 'yyyy-MM-dd')
  const todaysTodos = data.dailyTodos
    .filter((todo) => todo.created_at === todayKey)
    .sort((left, right) => Number(left.completed) - Number(right.completed))
  const carryOverTodos = data.dailyTodos
    .filter((todo) => todo.created_at < todayKey && !todo.completed)
    .sort((left, right) => String(left.created_at).localeCompare(String(right.created_at)))
  const filteredLearnings = data.learnings.filter((entry) =>
    entry.content.toLowerCase().includes(learningQuery.toLowerCase()),
  )
  return (
    <div className="space-y-8">
      <section className={clsx('overflow-hidden rounded-[2rem] border', theme === 'dark' ? 'border-white/10 bg-card-dark' : 'border-zinc-200 bg-card-light')}>
        <div className="border-b border-white/10 px-5 pb-5 pt-6 md:px-8">
          <p className="text-sm uppercase tracking-[0.2em] text-accent-soft">{format(new Date(), 'EEEE, MMMM d')}</p>
          <h3 className="mt-3 text-3xl font-semibold md:text-4xl">{greetingForNow()}, {data.profile?.name || 'Builder'}</h3>
          <p className={clsx('mt-3 max-w-2xl text-base', mutedText(theme))}>A single focused list for today. Clear it, then capture what the day taught you.</p>
        </div>
        <div className="grid min-h-[60vh] lg:grid-cols-[1.25fr_0.75fr]">
          <div className="flex min-h-[60vh] flex-col">
            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5 md:px-8">
              {todaysTodos.length === 0 ? (
                <div className={clsx('flex min-h-[16rem] items-center justify-center rounded-[1.5rem] border border-dashed p-8 text-center', theme === 'dark' ? 'border-white/10 bg-black/20' : 'border-zinc-300 bg-zinc-50')}>
                  <div>
                    <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-accent/15 text-accent-soft">
                      <CheckSquare className="size-8" />
                    </div>
                    <h4 className="mt-4 text-xl font-semibold">Nothing on your list yet</h4>
                    <p className={clsx('mt-2 text-sm', mutedText(theme))}>Add the next few things that matter today and keep the page clean.</p>
                  </div>
                </div>
              ) : (
                todaysTodos.map((todo) => (
                  <div key={todo.id} className={clsx('flex items-center gap-4 rounded-[1.5rem] border px-4 py-4 transition md:px-5 md:py-5', theme === 'dark' ? 'border-white/10 bg-black/20' : 'border-zinc-200 bg-zinc-50', todo.completed && 'opacity-80')}>
                    <button type="button" onClick={() => void actions.toggleDailyTodo(todo)} aria-label={todo.completed ? 'Mark as incomplete' : 'Mark as complete'} className={clsx('flex size-11 shrink-0 items-center justify-center rounded-2xl border-2 transition active:scale-95 md:size-12', todo.completed ? 'border-accent bg-accent text-white shadow-lg shadow-accent/20' : theme === 'dark' ? 'border-white/20 bg-black/30 text-zinc-400 hover:border-accent/70 hover:text-accent-soft' : 'border-zinc-300 bg-white text-zinc-500 hover:border-accent/70 hover:text-accent')}>
                      {todo.completed ? <Check className="size-6" /> : null}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className={clsx('text-lg font-medium leading-7 md:text-xl', todo.completed && 'text-zinc-500 line-through')}>{todo.title}</p>
                    </div>
                    <button type="button" onClick={() => void actions.deleteDailyTodo(todo.id)} className={clsx('rounded-2xl p-3 transition', theme === 'dark' ? 'text-zinc-400 hover:bg-white/5 hover:text-white' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900')}>
                      <Trash2 className="size-5" />
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className={clsx('border-t p-4 md:p-5', theme === 'dark' ? 'border-white/10 bg-[#181818]' : 'border-zinc-200 bg-zinc-50')}>
              <form className="flex items-center gap-3" onSubmit={async (event) => { event.preventDefault(); if (await actions.addDailyTodo(todoTitle)) setTodoTitle('') }}>
                <Input theme={theme} value={todoTitle} onChange={(event) => setTodoTitle(event.target.value)} placeholder="Add a task for today" className="h-14 rounded-2xl text-base" required />
                <button type="submit" className={clsx('h-14 shrink-0 rounded-2xl px-5 text-base', buttonClass(theme, 'primary'))}>
                  <Plus className="size-5" />
                  Add
                </button>
              </form>
            </div>
          </div>
          <div className={clsx('border-t p-5 lg:border-l lg:border-t-0 md:p-6', theme === 'dark' ? 'border-white/10 bg-[#171717]' : 'border-zinc-200 bg-zinc-50/70')}>
            <div>
              <h4 className="text-lg font-semibold">Carry over</h4>
              <p className={clsx('mt-2 text-sm', mutedText(theme))}>Incomplete tasks from earlier days stay here until you intentionally bring them forward.</p>
            </div>
            {carryOverTodos.length === 0 ? (
              <div className={clsx('mt-5 rounded-[1.5rem] border border-dashed p-6 text-sm', theme === 'dark' ? 'border-white/10 bg-black/20 text-zinc-400' : 'border-zinc-300 bg-white text-zinc-500')}>
                No unfinished tasks are waiting from earlier days.
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {carryOverTodos.map((todo) => (
                  <div key={todo.id} className={clsx('rounded-[1.5rem] border p-4', theme === 'dark' ? 'border-white/10 bg-black/20' : 'border-zinc-200 bg-white')}>
                    <p className="text-base font-medium leading-7">{todo.title}</p>
                    <p className={clsx('mt-2 text-xs uppercase tracking-[0.18em]', mutedText(theme))}>{formatDate(todo.created_at)} | pending</p>
                    <button type="button" onClick={() => void actions.carryOverDailyTodo(todo)} className={clsx('mt-4 w-full justify-center', buttonClass(theme, 'primary'))}>
                      Carry over
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
      <section className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <p className="text-xs uppercase tracking-[0.28em] text-accent-soft">Learnings</p>
          <div className="h-px flex-1 bg-white/10" />
        </div>
        <Panel theme={theme}>
          <div className="grid gap-6 xl:grid-cols-[0.7fr_1.3fr]">
            <div className="space-y-4">
              <SectionHeader title="What I learned today" subtitle="Capture the lesson while it is still fresh." />
              <form className="space-y-3" onSubmit={async (event) => { event.preventDefault(); if (await actions.addLearning(learningInput)) setLearningInput('') }}>
                <Textarea theme={theme} value={learningInput} onChange={(event) => setLearningInput(event.target.value)} rows={5} placeholder="A pattern, reminder, idea, or mistake worth remembering" required />
                <button type="submit" className={buttonClass(theme, 'primary')}>Log</button>
              </form>
              <div className="relative">
                <Search className={clsx('pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2', mutedText(theme))} />
                <Input theme={theme} className="pl-11" value={learningQuery} onChange={(event) => setLearningQuery(event.target.value)} placeholder="Search all entries" />
              </div>
            </div>
            <div>
              {filteredLearnings.length === 0 ? (
                <EmptyState theme={theme} icon={Sparkles} title="No learnings logged yet" text="Your saved lessons will appear here in reverse chronological order." />
              ) : (
                <div className="max-h-[32rem] space-y-3 overflow-y-auto pr-1">
                  {filteredLearnings.map((entry) => (
                    <div key={entry.id} className={clsx('rounded-2xl border p-4', theme === 'dark' ? 'border-white/10 bg-black/20' : 'border-zinc-200 bg-zinc-50')}>
                      <p className="leading-7">{entry.content}</p>
                      <p className={clsx('mt-3 text-xs uppercase tracking-[0.18em]', mutedText(theme))}>{formatDateTime(entry.created_at)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Panel>
      </section>
    </div>
  )
}

function DashboardPage({ appState }) {
  const { data, theme } = appState
  const stats = {
    activeSkills: data.skills.length,
    readingBooks: data.books.filter((book) => book.status === 'reading').length,
    tasksDueToday: data.tasks.filter((task) => task.deadline && isToday(parseISO(task.deadline))).length,
    workoutsThisWeek: data.workouts.filter((workout) => inRange(workout.date, startOfWeek(new Date(), { weekStartsOn: 1 }), new Date())).length,
  }
  const weeklyChartData = useMemo(() => buildWeeklyChartData(data, 8), [data])
  const activityGrid = useMemo(() => buildActivityGrid(data), [data])
  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel theme={theme} className="overflow-hidden">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-accent-soft">Home</p>
            <h3 className="mt-2 text-3xl font-semibold">Welcome back, {data.profile?.name || 'Builder'}.</h3>
            <p className={clsx('mt-3 max-w-2xl text-sm', mutedText(theme))}>LifeOS keeps your learning, movement, reading, and project momentum visible in one place so your next action stays obvious.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard theme={theme} icon={Sparkles} label="Active skills" value={stats.activeSkills} />
              <StatCard theme={theme} icon={BookText} label="Books reading" value={stats.readingBooks} />
              <StatCard theme={theme} icon={CheckSquare} label="Tasks due today" value={stats.tasksDueToday} />
              <StatCard theme={theme} icon={Flame} label="Workouts this week" value={stats.workoutsThisWeek} />
            </div>
          </div>
        </Panel>
        <Panel theme={theme}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-accent-soft">Profile</p>
              <h4 className="mt-2 text-xl font-semibold">{data.profile?.name || 'Complete your profile'}</h4>
            </div>
            {data.profile?.avatar_url ? <img src={data.profile.avatar_url} alt={data.profile.name || 'Profile avatar'} className="size-14 rounded-2xl object-cover" /> : <div className="flex size-14 items-center justify-center rounded-2xl bg-accent/20 text-accent-soft"><UserCircle2 className="size-8" /></div>}
          </div>
          <p className={clsx('mt-4 text-sm leading-7', mutedText(theme))}>{data.profile?.bio || 'Add your bio and avatar to make the dashboard feel like home.'}</p>
          <Link to="/profile" className={clsx('mt-5 inline-flex', buttonClass(theme, 'primary'))}>Update profile</Link>
        </Panel>
      </section>
      <section className="grid gap-6 xl:grid-cols-2">
        <Panel theme={theme}>
          <SectionHeader title="Weekly progress" subtitle="Skills, workouts, pages, and completed tasks over time" />
          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyChartData}>
                <CartesianGrid stroke={theme === 'dark' ? '#27272a' : '#e4e4e7'} strokeDasharray="4 4" />
                <XAxis dataKey="label" stroke={theme === 'dark' ? '#a1a1aa' : '#71717a'} />
                <YAxis stroke={theme === 'dark' ? '#a1a1aa' : '#71717a'} />
                <Tooltip contentStyle={tooltipStyle(theme)} />
                <Legend />
                <Line type="monotone" dataKey="skills" stroke="#f59e0b" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="workouts" stroke="#fb923c" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="pages" stroke="#fbbf24" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="tasks" stroke="#fdba74" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel theme={theme}>
          <SectionHeader title="Activity grid" subtitle="A GitHub-style view of your recent consistency" />
          <div className="mt-4 overflow-x-auto">
            <div className="inline-grid grid-flow-col gap-2">
              {activityGrid.map((week, index) => (
                <div key={`${week.weekLabel}-${index}`} className="grid gap-2">
                  {week.days.map((day) => (
                    <div key={day.date} title={`${day.date}: ${day.count} activities`} className={clsx('size-5 rounded-md border', theme === 'dark' ? 'border-white/5' : 'border-zinc-200', heatmapClass(day.count))} />
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className={clsx('mt-4 flex items-center justify-between text-xs', mutedText(theme))}>
            <span>Less</span>
            <div className="flex gap-2">{[0, 1, 2, 3, 4].map((count) => <div key={count} className={clsx('size-4 rounded', heatmapClass(count))} />)}</div>
            <span>More</span>
          </div>
        </Panel>
      </section>
    </div>
  )
}

function SkillsPage({ appState }) {
  const { data, theme, actions } = appState
  const [skillForm, setSkillForm] = useState({ name: '', category: '', xp: 0, progress_percent: 0 })
  const [sessionForm, setSessionForm] = useState({ skill_id: '', duration_minutes: 45, date: format(new Date(), 'yyyy-MM-dd'), notes: '' })
  const skillBreakdown = useMemo(() => data.skills.map((skill) => ({ ...skill, level: Math.floor((skill.xp || 0) / 100), hours: ((skill.time_logged_minutes || 0) / 60).toFixed(1) })), [data.skills])

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <div className="space-y-6">
        <Panel theme={theme}>
          <SectionHeader title="Add a skill" subtitle="Track something you want to improve deliberately" />
          <form className="mt-4 space-y-3" onSubmit={async (event) => { event.preventDefault(); if (await actions.addSkill(skillForm)) setSkillForm({ name: '', category: '', xp: 0, progress_percent: 0 }) }}>
            <Field label="Skill name"><Input theme={theme} value={skillForm.name} onChange={(event) => setSkillForm((current) => ({ ...current, name: event.target.value }))} placeholder="Design Systems" required /></Field>
            <Field label="Category"><Input theme={theme} value={skillForm.category} onChange={(event) => setSkillForm((current) => ({ ...current, category: event.target.value }))} placeholder="Career, Health, Creative" required /></Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Starting XP"><Input theme={theme} type="number" min="0" value={skillForm.xp} onChange={(event) => setSkillForm((current) => ({ ...current, xp: event.target.value }))} /></Field>
              <Field label="Current progress %"><Input theme={theme} type="number" min="0" max="100" value={skillForm.progress_percent} onChange={(event) => setSkillForm((current) => ({ ...current, progress_percent: event.target.value }))} /></Field>
            </div>
            <button type="submit" className={buttonClass(theme, 'primary')}><Plus className="size-4" />Save skill</button>
          </form>
        </Panel>

        <Panel theme={theme}>
          <SectionHeader title="Log a session" subtitle="Each minute logged also adds XP to the selected skill" />
          <form className="mt-4 space-y-3" onSubmit={async (event) => { event.preventDefault(); if (await actions.logSkillSession(sessionForm)) setSessionForm((current) => ({ ...current, duration_minutes: 45, notes: '' })) }}>
            <Field label="Skill"><Select theme={theme} value={sessionForm.skill_id} onChange={(event) => setSessionForm((current) => ({ ...current, skill_id: event.target.value }))} required><option value="">Select a skill</option>{data.skills.map((skill) => <option key={skill.id} value={skill.id}>{skill.name}</option>)}</Select></Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Duration (minutes)"><Input theme={theme} type="number" min="1" value={sessionForm.duration_minutes} onChange={(event) => setSessionForm((current) => ({ ...current, duration_minutes: event.target.value }))} required /></Field>
              <Field label="Date"><Input theme={theme} type="date" value={sessionForm.date} onChange={(event) => setSessionForm((current) => ({ ...current, date: event.target.value }))} required /></Field>
            </div>
            <Field label="Notes"><Textarea theme={theme} value={sessionForm.notes} onChange={(event) => setSessionForm((current) => ({ ...current, notes: event.target.value }))} placeholder="What did you practice today?" /></Field>
            <button type="submit" className={buttonClass(theme, 'primary')}><Target className="size-4" />Log session</button>
          </form>
        </Panel>
      </div>

      <Panel theme={theme}>
        <SectionHeader title="Skill tracker" subtitle="XP, levels, and total hours logged for every focus area" />
        {skillBreakdown.length === 0 ? <EmptyState theme={theme} icon={Sparkles} title="No skills yet" text="Add your first skill to start tracking time, XP, and level progression." /> : <div className="mt-4 space-y-4">{skillBreakdown.map((skill) => <div key={skill.id} className={clsx('rounded-3xl border p-5', theme === 'dark' ? 'border-white/10 bg-black/20' : 'border-zinc-200 bg-zinc-50')}><div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><div className="flex items-center gap-3"><h4 className="text-lg font-semibold">{skill.name}</h4><span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-accent-soft">{skill.category}</span></div><p className={clsx('mt-2 text-sm', mutedText(theme))}>Level {skill.level} ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ {skill.xp} XP ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ {skill.hours} hours logged</p></div><div className={clsx('text-sm', mutedText(theme))}>{(skill.progress_percent || 0).toFixed(0)}% toward next level</div></div><div className={clsx('mt-4 h-3 overflow-hidden rounded-full', theme === 'dark' ? 'bg-white/10' : 'bg-zinc-200')}><div className="h-full rounded-full bg-gradient-to-r from-accent to-accent-soft" style={{ width: `${Math.max(6, skill.progress_percent || 0)}%` }} /></div></div>)}</div>}
      </Panel>
    </div>
  )
}

function HealthPage({ appState }) {
  const { data, theme, actions } = appState
  const [form, setForm] = useState({ date: format(new Date(), 'yyyy-MM-dd'), exercise_name: '', sets: 3, reps: 10, weight_kg: 0, notes: '' })
  const chartData = useMemo(() => buildWorkoutChartData(data.workouts), [data.workouts])

  return (
    <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <div className="space-y-6">
        <Panel theme={theme}>
          <SectionHeader title="Log workout" subtitle="Capture your training sessions and keep the streak visible" />
          <form className="mt-4 space-y-3" onSubmit={async (event) => { event.preventDefault(); if (await actions.addWorkout(form)) setForm((current) => ({ ...current, exercise_name: '', notes: '' })) }}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Date"><Input theme={theme} type="date" value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} required /></Field>
              <Field label="Exercise"><Input theme={theme} value={form.exercise_name} onChange={(event) => setForm((current) => ({ ...current, exercise_name: event.target.value }))} placeholder="Deadlift" required /></Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Sets"><Input theme={theme} type="number" min="1" value={form.sets} onChange={(event) => setForm((current) => ({ ...current, sets: event.target.value }))} required /></Field>
              <Field label="Reps"><Input theme={theme} type="number" min="1" value={form.reps} onChange={(event) => setForm((current) => ({ ...current, reps: event.target.value }))} required /></Field>
              <Field label="Weight (kg)"><Input theme={theme} type="number" min="0" step="0.5" value={form.weight_kg} onChange={(event) => setForm((current) => ({ ...current, weight_kg: event.target.value }))} required /></Field>
            </div>
            <Field label="Notes"><Textarea theme={theme} value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Energy, form notes, PRs..." /></Field>
            <button type="submit" className={buttonClass(theme, 'primary')}><Dumbbell className="size-4" />Add workout</button>
          </form>
        </Panel>

        <Panel theme={theme}>
          <SectionHeader title="Weekly workout count" subtitle="A simple trend of how consistently you trained" />
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid stroke={theme === 'dark' ? '#27272a' : '#e4e4e7'} strokeDasharray="4 4" />
                <XAxis dataKey="label" stroke={theme === 'dark' ? '#a1a1aa' : '#71717a'} />
                <YAxis stroke={theme === 'dark' ? '#a1a1aa' : '#71717a'} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle(theme)} />
                <Bar dataKey="count" radius={[10, 10, 0, 0]} fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <Panel theme={theme}>
        <SectionHeader title="Workout history" subtitle="Recent sessions in a clean, searchable-at-a-glance table" />
        {data.workouts.length === 0 ? <EmptyState theme={theme} icon={Dumbbell} title="No workouts logged" text="Record your first session to build momentum and unlock weekly insights." /> : <div className="mt-4 overflow-hidden rounded-3xl border border-white/10"><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className={theme === 'dark' ? 'bg-white/5 text-zinc-300' : 'bg-zinc-100 text-zinc-600'}><tr><th className="px-4 py-3 font-medium">Date</th><th className="px-4 py-3 font-medium">Exercise</th><th className="px-4 py-3 font-medium">Sets x Reps</th><th className="px-4 py-3 font-medium">Weight</th><th className="px-4 py-3 font-medium">Notes</th></tr></thead><tbody>{data.workouts.map((workout) => <tr key={workout.id} className={theme === 'dark' ? 'border-t border-white/10' : 'border-t border-zinc-200'}><td className="px-4 py-4">{formatDate(workout.date)}</td><td className="px-4 py-4 font-medium">{workout.exercise_name}</td><td className="px-4 py-4">{workout.sets} x {workout.reps}</td><td className="px-4 py-4">{workout.weight_kg} kg</td><td className={clsx('px-4 py-4', mutedText(theme))}>{workout.notes || 'ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â'}</td></tr>)}</tbody></table></div></div>}
      </Panel>
    </div>
  )
}

function RepsPage({ appState }) {
  const { data, theme, actions } = appState
  const [exerciseName, setExerciseName] = useState('')
  const [viewMode, setViewMode] = useState('weekly')
  const [repDrafts, setRepDrafts] = useState({})
  const todayKey = format(new Date(), 'yyyy-MM-dd')
  const exercises = useMemo(
    () =>
      data.exercises.map((exercise) => {
        const logs = data.repLogs.filter((log) => log.exercise_id === exercise.id)
        const todaysTotal = logs
          .filter((log) => format(parseISO(log.logged_at), 'yyyy-MM-dd') === todayKey)
          .reduce((sum, log) => sum + (log.reps || 0), 0)

        return {
          ...exercise,
          todaysTotal,
          chartData: buildRepChartData(logs, viewMode),
        }
      }),
    [data.exercises, data.repLogs, todayKey, viewMode],
  )

  return (
    <div className="space-y-6">
      <Panel theme={theme}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-accent-soft">Rep Tracker</p>
            <h3 className="mt-2 text-3xl font-semibold">Log quick bodyweight or custom rep sets.</h3>
            <p className={clsx('mt-3 max-w-2xl text-sm', mutedText(theme))}>Create any exercise you want, add sets in seconds, and watch the weekly or monthly volume update immediately.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {['weekly', 'monthly'].map((mode) => (
              <button key={mode} type="button" onClick={() => setViewMode(mode)} className={clsx('rounded-full px-4 py-2 text-sm font-medium transition', viewMode === mode ? 'bg-accent text-white' : theme === 'dark' ? 'bg-black/20 text-zinc-300 hover:bg-white/5' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200')}>
                {titleCase(mode)}
              </button>
            ))}
          </div>
        </div>
        <form className="mt-5 flex flex-col gap-3 sm:flex-row" onSubmit={async (event) => { event.preventDefault(); if (await actions.addExercise(exerciseName)) setExerciseName('') }}>
          <Input theme={theme} value={exerciseName} onChange={(event) => setExerciseName(event.target.value)} placeholder="Add an exercise like Pushups or Squats" required />
          <button type="submit" className={clsx('sm:w-auto', buttonClass(theme, 'primary'))}>
            <Plus className="size-4" />
            Add exercise
          </button>
        </form>
      </Panel>

      {exercises.length === 0 ? (
        <Panel theme={theme}>
          <EmptyState theme={theme} icon={Dumbbell} title="No exercises yet" text="Add your first exercise to start logging reps and building charts." />
        </Panel>
      ) : (
        <div className="grid gap-6">
          {exercises.map((exercise) => (
            <Panel key={exercise.id} theme={theme}>
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-accent-soft">{viewMode === 'weekly' ? 'Last 7 days' : 'Last 4 weeks'}</p>
                  <h4 className="mt-2 text-2xl font-semibold">{exercise.name}</h4>
                  <p className={clsx('mt-4 text-sm', mutedText(theme))}>Today's total</p>
                  <p className="mt-1 text-5xl font-semibold text-accent-soft">{exercise.todaysTotal}</p>
                </div>

                <form className="flex w-full max-w-md flex-col gap-3 sm:flex-row xl:justify-end" onSubmit={async (event) => { event.preventDefault(); if (await actions.addRepLog({ exercise_id: exercise.id, reps: repDrafts[exercise.id] })) setRepDrafts((current) => ({ ...current, [exercise.id]: '' })) }}>
                  <Input theme={theme} type="number" min="1" value={repDrafts[exercise.id] || ''} onChange={(event) => setRepDrafts((current) => ({ ...current, [exercise.id]: event.target.value }))} placeholder="Reps in this set" />
                  <button type="submit" className={clsx('sm:w-auto', buttonClass(theme, 'primary'))}>
                    <Plus className="size-4" />
                    Log set
                  </button>
                </form>
              </div>

              <div className="mt-6 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={exercise.chartData}>
                    <CartesianGrid stroke={theme === 'dark' ? '#27272a' : '#e4e4e7'} strokeDasharray="4 4" />
                    <XAxis dataKey="label" stroke={theme === 'dark' ? '#a1a1aa' : '#71717a'} />
                    <YAxis stroke={theme === 'dark' ? '#a1a1aa' : '#71717a'} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle(theme)} />
                    <Bar dataKey="reps" radius={[10, 10, 0, 0]} fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  )
}

function BooksPage({ appState }) {
  const { data, theme, actions } = appState
  const [bookForm, setBookForm] = useState({ title: '', author: '', genre: 'other', status: 'want to read', current_page: 0, total_pages: 0, rating: '', notes: '' })
  const [editingBookId, setEditingBookId] = useState(null)
  const [progressForm, setProgressForm] = useState({ current_page: 0, genre: 'other', status: 'reading', rating: '', notes: '', date: format(new Date(), 'yyyy-MM-dd') })
  const [genreFilter, setGenreFilter] = useState('all')
  const filteredBooks = useMemo(() => genreFilter === 'all' ? data.books : data.books.filter((book) => (book.genre || 'other') === genreFilter), [data.books, genreFilter])
  const groupedBooks = useMemo(() => BOOK_STATUSES.map((status) => ({ status, books: filteredBooks.filter((book) => book.status === status) })), [filteredBooks])

  return (
    <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
      <div className="space-y-6">
        <Panel theme={theme}>
          <SectionHeader title="Add a book" subtitle="Build your shelf and keep your current reading position updated" />
          <form className="mt-4 space-y-3" onSubmit={async (event) => { event.preventDefault(); if (await actions.addBook(bookForm)) setBookForm({ title: '', author: '', genre: 'other', status: 'want to read', current_page: 0, total_pages: 0, rating: '', notes: '' }) }}>
            <Field label="Title"><Input theme={theme} value={bookForm.title} onChange={(event) => setBookForm((current) => ({ ...current, title: event.target.value }))} required /></Field>
            <Field label="Author"><Input theme={theme} value={bookForm.author} onChange={(event) => setBookForm((current) => ({ ...current, author: event.target.value }))} required /></Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Genre"><Select theme={theme} value={bookForm.genre} onChange={(event) => setBookForm((current) => ({ ...current, genre: event.target.value }))}>{BOOK_GENRES.map((genre) => <option key={genre} value={genre}>{titleCase(genre)}</option>)}</Select></Field>
              <Field label="Status"><Select theme={theme} value={bookForm.status} onChange={(event) => setBookForm((current) => ({ ...current, status: event.target.value }))}>{BOOK_STATUSES.map((status) => <option key={status} value={status}>{titleCase(status)}</option>)}</Select></Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Current page"><Input theme={theme} type="number" min="0" value={bookForm.current_page} onChange={(event) => setBookForm((current) => ({ ...current, current_page: event.target.value }))} /></Field>
              <Field label="Total pages"><Input theme={theme} type="number" min="1" value={bookForm.total_pages} onChange={(event) => setBookForm((current) => ({ ...current, total_pages: event.target.value }))} /></Field>
            </div>
            <Field label="Notes"><Textarea theme={theme} value={bookForm.notes} onChange={(event) => setBookForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Why this book, favorite theme, or takeaway" /></Field>
            <button type="submit" className={buttonClass(theme, 'primary')}><BookOpen className="size-4" />Save book</button>
          </form>
        </Panel>

        <Panel theme={theme}>
          <SectionHeader title="Update reading progress" subtitle="Every page update records a log for weekly summaries" />
          <form className="mt-4 space-y-3" onSubmit={async (event) => { event.preventDefault(); if (await actions.updateBookProgress(editingBookId, progressForm)) setEditingBookId(null) }}>
            <Field label="Book"><Select theme={theme} value={editingBookId || ''} onChange={(event) => { const book = data.books.find((item) => item.id === Number(event.target.value)); setEditingBookId(book?.id || null); if (book) setProgressForm({ current_page: book.current_page || 0, genre: book.genre || 'other', status: book.status, rating: book.rating || '', notes: book.notes || '', date: format(new Date(), 'yyyy-MM-dd') }) }} required><option value="">Select a book</option>{data.books.map((book) => <option key={book.id} value={book.id}>{book.title}</option>)}</Select></Field>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Genre"><Select theme={theme} value={progressForm.genre} onChange={(event) => setProgressForm((current) => ({ ...current, genre: event.target.value }))}>{BOOK_GENRES.map((genre) => <option key={genre} value={genre}>{titleCase(genre)}</option>)}</Select></Field>
              <Field label="Current page"><Input theme={theme} type="number" min="0" value={progressForm.current_page} onChange={(event) => setProgressForm((current) => ({ ...current, current_page: event.target.value }))} required /></Field>
              <Field label="Status"><Select theme={theme} value={progressForm.status} onChange={(event) => setProgressForm((current) => ({ ...current, status: event.target.value }))}>{BOOK_STATUSES.map((status) => <option key={status} value={status}>{titleCase(status)}</option>)}</Select></Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Rating"><Select theme={theme} value={progressForm.rating} onChange={(event) => setProgressForm((current) => ({ ...current, rating: event.target.value }))}><option value="">No rating yet</option>{[1, 2, 3, 4, 5].map((rating) => <option key={rating} value={rating}>{rating} star{rating > 1 ? 's' : ''}</option>)}</Select></Field>
              <Field label="Log date"><Input theme={theme} type="date" value={progressForm.date} onChange={(event) => setProgressForm((current) => ({ ...current, date: event.target.value }))} /></Field>
            </div>
            <Field label="Notes"><Textarea theme={theme} value={progressForm.notes} onChange={(event) => setProgressForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Insight, favorite chapter, or finishing note" /></Field>
            <button type="submit" className={buttonClass(theme, 'primary')}><BookText className="size-4" />Save progress</button>
          </form>
        </Panel>
      </div>

      <Panel theme={theme}>
        <SectionHeader title="Shelf view" subtitle="Grouped by reading status with visible progress on every title" />
        <div className="mt-4 flex flex-wrap gap-2">
          {['all', ...BOOK_GENRES].map((genre) => <button key={genre} type="button" onClick={() => setGenreFilter(genre)} className={clsx('rounded-full px-4 py-2 text-sm font-medium transition', genreFilter === genre ? 'bg-accent text-white' : theme === 'dark' ? 'bg-black/20 text-zinc-300 hover:bg-white/5' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200')}>{genre === 'all' ? 'All Genres' : titleCase(genre)}</button>)}
        </div>
        <div className="mt-4 space-y-6">{groupedBooks.map((group) => <div key={group.status}><div className="mb-3 flex items-center justify-between"><h4 className="text-lg font-semibold">{titleCase(group.status)}</h4><span className={clsx('text-sm', mutedText(theme))}>{group.books.length} books</span></div>{group.books.length === 0 ? <div className={clsx('rounded-2xl border border-dashed p-4 text-sm', theme === 'dark' ? 'border-white/10 text-zinc-400' : 'border-zinc-300 text-zinc-500')}>Nothing here yet.</div> : <div className="grid gap-4 md:grid-cols-2">{group.books.map((book) => { const progress = book.total_pages ? Math.min(100, (book.current_page / book.total_pages) * 100) : 0; return <div key={book.id} className={clsx('rounded-3xl border p-5', theme === 'dark' ? 'border-white/10 bg-black/20' : 'border-zinc-200 bg-zinc-50')}><h5 className="text-lg font-semibold">{book.title}</h5><p className={clsx('mt-1 text-sm', mutedText(theme))}>{book.author}</p><span className="mt-3 inline-flex rounded-full bg-accent/15 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-accent-soft">{titleCase(book.genre || 'other')}</span><div className={clsx('mt-4 h-3 overflow-hidden rounded-full', theme === 'dark' ? 'bg-white/10' : 'bg-zinc-200')}><div className="h-full rounded-full bg-gradient-to-r from-accent to-accent-soft" style={{ width: `${Math.max(progress, 4)}%` }} /></div><div className="mt-3 flex items-center justify-between text-sm"><span>{book.current_page}/{book.total_pages || '?'} pages</span><span className={mutedText(theme)}>{progress.toFixed(0)}%</span></div><p className={clsx('mt-4 text-sm leading-6', mutedText(theme))}>{book.notes || 'No notes yet.'}</p>{book.status === 'finished' && book.rating ? <p className="mt-3 text-sm font-medium text-amber-400">{'ÃƒÂ¢Ã‹Å“Ã¢â‚¬Â¦'.repeat(book.rating)}</p> : null}</div> })}</div>}</div>)}</div>
      </Panel>
    </div>
  )
}

function ProjectsPage({ appState }) {
  const { data, theme, actions } = appState
  const [projectForm, setProjectForm] = useState({ name: '', description: '', priority: 'medium', deadline: '', status: 'todo' })
  const [taskForm, setTaskForm] = useState({ project_id: '', title: '', priority: 'medium', deadline: '', status: 'todo' })
  const selectedProjectId = Number(taskForm.project_id) || data.projects[0]?.id || null
  const selectedProject = data.projects.find((project) => project.id === selectedProjectId) || null
  const projectTasks = data.tasks.filter((task) => task.project_id === selectedProjectId)
  const handleDragEnd = async (result) => { if (result.destination && result.destination.droppableId !== result.source.droppableId) await actions.updateTaskStatus(Number(result.draggableId), result.destination.droppableId) }

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-6">
          <Panel theme={theme}>
            <SectionHeader title="Create project" subtitle="Set a priority and deadline so the next milestone stays clear" />
            <form className="mt-4 space-y-3" onSubmit={async (event) => { event.preventDefault(); if (await actions.addProject(projectForm)) setProjectForm({ name: '', description: '', priority: 'medium', deadline: '', status: 'todo' }) }}>
              <Field label="Project name"><Input theme={theme} value={projectForm.name} onChange={(event) => setProjectForm((current) => ({ ...current, name: event.target.value }))} required /></Field>
              <Field label="Description"><Textarea theme={theme} value={projectForm.description} onChange={(event) => setProjectForm((current) => ({ ...current, description: event.target.value }))} /></Field>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Priority"><Select theme={theme} value={projectForm.priority} onChange={(event) => setProjectForm((current) => ({ ...current, priority: event.target.value }))}>{PRIORITIES.map((priority) => <option key={priority} value={priority}>{titleCase(priority)}</option>)}</Select></Field>
                <Field label="Deadline"><Input theme={theme} type="date" value={projectForm.deadline} onChange={(event) => setProjectForm((current) => ({ ...current, deadline: event.target.value }))} /></Field>
                <Field label="Status"><Select theme={theme} value={projectForm.status} onChange={(event) => setProjectForm((current) => ({ ...current, status: event.target.value }))}>{PROJECT_COLUMNS.map((column) => <option key={column.id} value={column.id}>{column.label}</option>)}</Select></Field>
              </div>
              <button type="submit" className={buttonClass(theme, 'primary')}><FolderKanban className="size-4" />Save project</button>
            </form>
          </Panel>

          <Panel theme={theme}>
            <SectionHeader title="Add task" subtitle="Tasks are attached to a project and move across the board by drag and drop" />
            <form className="mt-4 space-y-3" onSubmit={async (event) => { event.preventDefault(); if (await actions.addTask(taskForm)) setTaskForm((current) => ({ ...current, title: '', deadline: '' })) }}>
              <Field label="Project"><Select theme={theme} value={taskForm.project_id || selectedProjectId || ''} onChange={(event) => setTaskForm((current) => ({ ...current, project_id: event.target.value }))} required><option value="">Select project</option>{data.projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</Select></Field>
              <Field label="Task title"><Input theme={theme} value={taskForm.title} onChange={(event) => setTaskForm((current) => ({ ...current, title: event.target.value }))} required /></Field>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Priority"><Select theme={theme} value={taskForm.priority} onChange={(event) => setTaskForm((current) => ({ ...current, priority: event.target.value }))}>{PRIORITIES.map((priority) => <option key={priority} value={priority}>{titleCase(priority)}</option>)}</Select></Field>
                <Field label="Deadline"><Input theme={theme} type="date" value={taskForm.deadline} onChange={(event) => setTaskForm((current) => ({ ...current, deadline: event.target.value }))} /></Field>
                <Field label="Status"><Select theme={theme} value={taskForm.status} onChange={(event) => setTaskForm((current) => ({ ...current, status: event.target.value }))}>{PROJECT_COLUMNS.map((column) => <option key={column.id} value={column.id}>{column.label}</option>)}</Select></Field>
              </div>
              <button type="submit" className={buttonClass(theme, 'primary')}><Plus className="size-4" />Add task</button>
            </form>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel theme={theme}>
            <SectionHeader title="Projects" subtitle="Priority badges and deadline countdowns keep work triaged" />
            {data.projects.length === 0 ? <EmptyState theme={theme} icon={FolderKanban} title="No projects yet" text="Create a project to unlock the kanban board and deadline tracking." /> : <div className="mt-4 grid gap-4">{data.projects.map((project) => <button key={project.id} type="button" onClick={() => setTaskForm((current) => ({ ...current, project_id: String(project.id) }))} className={clsx('rounded-3xl border p-5 text-left transition', selectedProjectId === project.id ? 'border-accent bg-accent/10' : theme === 'dark' ? 'border-white/10 bg-black/20 hover:bg-white/5' : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100')}><div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"><div><h4 className="text-lg font-semibold">{project.name}</h4><p className={clsx('mt-2 text-sm leading-6', mutedText(theme))}>{project.description || 'No description added yet.'}</p></div><div className="flex flex-wrap gap-2"><Badge label={project.priority} /><Badge label={project.status} accent={project.status === 'done'} /></div></div><p className={clsx('mt-4 text-sm', project.deadline && isPastDate(project.deadline) ? 'text-red-400' : mutedText(theme))}>{project.deadline ? deadlineCopy(project.deadline) : 'No deadline set'}</p></button>)}</div>}
          </Panel>

          <Panel theme={theme}>
            <SectionHeader title={selectedProject ? `${selectedProject.name} board` : 'Kanban board'} subtitle="Drag tasks between columns to keep your project current" />
            {!selectedProject ? <EmptyState theme={theme} icon={CheckSquare} title="Choose a project" text="Select a project to see its kanban board and task flow." /> : <DragDropContext onDragEnd={handleDragEnd}><div className="mt-4 grid gap-4 lg:grid-cols-3">{PROJECT_COLUMNS.map((column) => { const tasks = projectTasks.filter((task) => task.status === column.id); return <Droppable key={column.id} droppableId={column.id}>{(provided) => <div ref={provided.innerRef} {...provided.droppableProps} className={clsx('min-h-72 rounded-3xl border p-4', theme === 'dark' ? 'border-white/10 bg-black/20' : 'border-zinc-200 bg-zinc-50')}><div className="mb-4 flex items-center justify-between"><h4 className="font-semibold">{column.label}</h4><span className={clsx('text-sm', mutedText(theme))}>{tasks.length}</span></div><div className="space-y-3">{tasks.map((task, index) => <Draggable key={task.id} draggableId={String(task.id)} index={index}>{(dragProvided) => <div ref={dragProvided.innerRef} {...dragProvided.draggableProps} {...dragProvided.dragHandleProps} className={clsx('rounded-2xl border p-4', theme === 'dark' ? 'border-white/10 bg-card-dark' : 'border-zinc-200 bg-white', task.deadline && isPastDate(task.deadline) && task.status !== 'done' ? 'ring-1 ring-red-500/60' : '')}><div className="flex items-center justify-between gap-3"><h5 className="font-medium">{task.title}</h5><Badge label={task.priority} /></div><p className={clsx('mt-3 text-sm', task.deadline && isPastDate(task.deadline) && task.status !== 'done' ? 'text-red-400' : mutedText(theme))}>{task.deadline ? deadlineCopy(task.deadline) : 'No deadline'}</p></div>}</Draggable>)}{provided.placeholder}</div></div>}</Droppable> })}</div></DragDropContext>}
          </Panel>
        </div>
      </section>
    </div>
  )
}

function WeeklySummaryPage({ appState }) {
  const { data, theme, actions } = appState
  const [draftNotes, setDraftNotes] = useState({})
  const latestSummary = data.weeklySummary[data.weeklySummary.length - 1] || null
  const chartData = data.weeklySummary.map((summary) => ({ week: formatDate(summary.week_start_date, 'MMM d'), skills: summary.skills_minutes, workouts: summary.workouts_count, pages: summary.books_pages, tasks: summary.tasks_completed }))
  const notes = latestSummary ? draftNotes[latestSummary.id] ?? latestSummary.notes ?? '' : ''

  return (
    <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
      <div className="space-y-6">
        <Panel theme={theme}>
          <SectionHeader title="Latest weekly summary" subtitle="Auto-generated from the last 7 days of activity" />
          {!latestSummary ? <EmptyState theme={theme} icon={CalendarClock} title="No summary yet" text="Your first Monday summary appears automatically after you start logging data." /> : <div className="mt-4 space-y-4"><div className="grid gap-4 sm:grid-cols-2"><Metric theme={theme} label="Skills time" value={`${latestSummary.skills_minutes} min`} /><Metric theme={theme} label="Workouts" value={latestSummary.workouts_count} /><Metric theme={theme} label="Pages read" value={latestSummary.books_pages} /><Metric theme={theme} label="Tasks completed" value={latestSummary.tasks_completed} /></div><div><p className="mb-2 text-sm font-medium">Reflection notes</p><Textarea theme={theme} value={notes} onChange={(event) => setDraftNotes((current) => ({ ...current, [latestSummary.id]: event.target.value }))} placeholder="Capture what worked, what felt hard, and what you want to improve next week." rows={5} /><button type="button" onClick={() => void actions.updateWeeklySummaryNote(latestSummary.id, notes)} className={clsx('mt-3', buttonClass(theme, 'primary'))}>Save reflection</button></div></div>}
        </Panel>
      </div>

      <Panel theme={theme}>
        <SectionHeader title="Week over week" subtitle="Bar chart comparing your progress across every recorded weekly summary" />
        {chartData.length === 0 ? <EmptyState theme={theme} icon={CalendarClock} title="No chart yet" text="Weekly bars appear automatically after the first summary is generated." /> : <div className="mt-4 h-96"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData}><CartesianGrid stroke={theme === 'dark' ? '#27272a' : '#e4e4e7'} strokeDasharray="4 4" /><XAxis dataKey="week" stroke={theme === 'dark' ? '#a1a1aa' : '#71717a'} /><YAxis stroke={theme === 'dark' ? '#a1a1aa' : '#71717a'} /><Tooltip contentStyle={tooltipStyle(theme)} /><Legend /><Bar dataKey="skills" fill="#f59e0b" radius={[8, 8, 0, 0]} /><Bar dataKey="workouts" fill="#f97316" radius={[8, 8, 0, 0]} /><Bar dataKey="pages" fill="#fb923c" radius={[8, 8, 0, 0]} /><Bar dataKey="tasks" fill="#fdba74" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></div>}
      </Panel>
    </div>
  )
}

function ProfilePage({ appState }) {
  const { data, theme, actions } = appState
  const profileSnapshot = { name: data.profile?.name || '', avatar_url: data.profile?.avatar_url || '', bio: data.profile?.bio || '' }
  const [draftProfile, setDraftProfile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const form = draftProfile || profileSnapshot
  return (
    <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <Panel theme={theme}>
        <SectionHeader title="Your identity" subtitle="Personalize the dashboard with your avatar, bio, and theme preference." />
        <form className="mt-4 space-y-4" onSubmit={async (event) => { event.preventDefault(); await actions.saveProfile({ ...form, theme_mode: appState.theme }); setDraftProfile(null) }}>
          <div className="flex items-center gap-4">
            {form.avatar_url ? <img src={form.avatar_url} alt="Avatar preview" className="size-20 rounded-3xl object-cover" /> : <div className="flex size-20 items-center justify-center rounded-3xl bg-accent/20 text-accent-soft"><UserCircle2 className="size-10" /></div>}
            <label className={clsx('inline-flex cursor-pointer items-center gap-2', buttonClass(theme, 'secondary'))}>
              {uploading ? 'Uploading...' : 'Upload avatar'}
              <input type="file" accept="image/*" className="hidden" onChange={async (event) => { const file = event.target.files?.[0]; if (!file) return; setUploading(true); const url = await actions.uploadAvatar(file); if (url) setDraftProfile({ ...form, avatar_url: url }); setUploading(false) }} />
            </label>
          </div>
          <Field label="Name"><Input theme={theme} value={form.name} onChange={(event) => setDraftProfile({ ...form, name: event.target.value })} placeholder="Your name" /></Field>
          <Field label="Bio"><Textarea theme={theme} value={form.bio} onChange={(event) => setDraftProfile({ ...form, bio: event.target.value })} rows={5} placeholder="What are you optimizing your life around?" /></Field>
          <button type="submit" className={buttonClass(theme, 'primary')}>Save profile</button>
        </form>
      </Panel>
      <Panel theme={theme}>
        <SectionHeader title="Preferences" subtitle="Theme preference is saved to your Supabase profile and applied automatically" />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <button type="button" onClick={() => { if (appState.theme !== 'dark') void actions.toggleTheme() }} className={clsx('rounded-3xl border p-5 text-left transition', appState.theme === 'dark' ? 'border-accent bg-accent/10' : theme === 'dark' ? 'border-white/10 bg-black/20' : 'border-zinc-200 bg-zinc-50')}><Moon className="mb-3 size-5 text-accent-soft" /><h4 className="font-semibold">Dark mode</h4><p className={clsx('mt-2 text-sm', mutedText(theme))}>Default LifeOS theme with deep contrast and focus-friendly cards.</p></button>
          <button type="button" onClick={() => { if (appState.theme !== 'light') void actions.toggleTheme() }} className={clsx('rounded-3xl border p-5 text-left transition', appState.theme === 'light' ? 'border-accent bg-accent/10' : theme === 'dark' ? 'border-white/10 bg-black/20' : 'border-zinc-200 bg-zinc-50')}><Sun className="mb-3 size-5 text-accent-soft" /><h4 className="font-semibold">Light mode</h4><p className={clsx('mt-2 text-sm', mutedText(theme))}>Bright workspace for daytime review without changing the core visual language.</p></button>
        </div>
      </Panel>
    </div>
  )
}

function Panel({ children, theme, className = '' }) {
  return <section className={clsx('rounded-3xl border p-5 md:p-6', theme === 'dark' ? 'border-white/10 bg-card-dark/90 shadow-2xl shadow-black/20' : 'border-zinc-200 bg-card-light shadow-xl shadow-zinc-200/50', className)}>{children}</section>
}

function SectionHeader({ title, subtitle }) {
  return <div><h3 className="text-2xl font-semibold">{title}</h3><p className="mt-2 text-sm text-zinc-400">{subtitle}</p></div>
}

function Field({ label, children }) {
  return <label className="block"><span className="mb-2 block text-sm font-medium">{label}</span>{children}</label>
}

function Input({ theme, className, ...props }) {
  return <input {...props} className={clsx(inputClass(theme), className)} />
}

function Select({ theme, className, children, ...props }) {
  return <select {...props} className={clsx(inputClass(theme), className)}>{children}</select>
}

function Textarea({ theme, className, rows = 4, ...props }) {
  return <textarea {...props} rows={rows} className={clsx(inputClass(theme), 'resize-none', className)} />
}

function EmptyState({ theme, icon: IconComponent, title, text }) {
  const iconNode = createElement(IconComponent, { className: 'size-6' })
  return <div className={clsx('mt-4 rounded-3xl border border-dashed p-8 text-center', theme === 'dark' ? 'border-white/10 bg-black/20' : 'border-zinc-300 bg-zinc-50')}><div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-accent/15 text-accent-soft">{iconNode}</div><h4 className="mt-4 text-lg font-semibold">{title}</h4><p className={clsx('mt-2 text-sm', mutedText(theme))}>{text}</p></div>
}

function StatCard({ theme, icon: IconComponent, label, value }) {
  const iconNode = createElement(IconComponent, { className: 'size-4 text-accent-soft' })
  return <div className={clsx('rounded-2xl border p-4', theme === 'dark' ? 'border-white/10 bg-black/20' : 'border-zinc-200 bg-zinc-50')}><div className="flex items-center justify-between"><p className={clsx('text-sm', mutedText(theme))}>{label}</p>{iconNode}</div><p className="mt-4 text-3xl font-semibold">{value}</p></div>
}

function Metric({ theme, label, value }) {
  return <div className={clsx('rounded-2xl border p-4', theme === 'dark' ? 'border-white/10 bg-black/20' : 'border-zinc-200 bg-zinc-50')}><p className={clsx('text-sm', mutedText(theme))}>{label}</p><p className="mt-3 text-2xl font-semibold">{value}</p></div>
}

function Badge({ label, accent = false }) {
  return <span className={clsx('rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]', accent ? 'bg-emerald-500/15 text-emerald-400' : priorityClass(label))}>{titleCase(label)}</span>
}

function priorityClass(priority) {
  if (priority === 'high') return 'bg-red-500/15 text-red-400'
  if (priority === 'medium' || priority === 'inprogress') return 'bg-amber-500/15 text-amber-400'
  if (priority === 'done') return 'bg-emerald-500/15 text-emerald-400'
  return 'bg-sky-500/15 text-sky-400'
}

function inputClass(theme) {
  return clsx('w-full rounded-2xl border px-4 py-3 outline-none transition focus:border-accent', theme === 'dark' ? 'border-white/10 bg-black/20 text-white placeholder:text-zinc-500' : 'border-zinc-200 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400')
}

function buttonClass(theme, variant) {
  return clsx('inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition', variant === 'primary' ? 'bg-accent text-white hover:bg-amber-600' : theme === 'dark' ? 'border border-white/10 bg-white/5 text-white hover:bg-white/10' : 'border border-zinc-200 bg-zinc-50 text-zinc-900 hover:bg-zinc-100')
}

function mutedText(theme) {
  return theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'
}

function tooltipStyle(theme) {
  return { backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff', border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.08)' : '#e4e4e7'}`, borderRadius: '16px', color: theme === 'dark' ? '#f5f5f5' : '#111827' }
}

function buildWeeklyChartData(data, weekCount) {
  return Array.from({ length: weekCount }).map((_, index) => { const weekStart = startOfWeek(subWeeks(new Date(), weekCount - index - 1), { weekStartsOn: 1 }); const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 }); return { label: format(weekStart, 'MMM d'), skills: data.skillSessions.filter((session) => inRange(session.date, weekStart, weekEnd)).reduce((sum, session) => sum + (session.duration_minutes || 0), 0), workouts: data.workouts.filter((workout) => inRange(workout.date, weekStart, weekEnd)).length, pages: data.readingLogs.filter((log) => inRange(log.date, weekStart, weekEnd)).reduce((sum, log) => sum + (log.pages_read || 0), 0), tasks: data.tasks.filter((task) => task.completed_at && inRange(task.completed_at, weekStart, weekEnd)).length } })
}

function buildWorkoutChartData(workouts) {
  return Array.from({ length: 8 }).map((_, index) => { const weekStart = startOfWeek(subWeeks(new Date(), 7 - index), { weekStartsOn: 1 }); const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 }); return { label: format(weekStart, 'MMM d'), count: workouts.filter((workout) => inRange(workout.date, weekStart, weekEnd)).length } })
}

function buildRepChartData(logs, viewMode) {
  if (viewMode === 'monthly') {
    return Array.from({ length: 4 }).map((_, index) => {
      const weekStart = startOfWeek(subWeeks(new Date(), 3 - index), { weekStartsOn: 1 })
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
      return {
        label: format(weekStart, 'MMM d'),
        reps: logs
          .filter((log) => inRange(log.logged_at, weekStart, weekEnd))
          .reduce((sum, log) => sum + (log.reps || 0), 0),
      }
    })
  }

  return Array.from({ length: 7 }).map((_, index) => {
    const date = subDays(new Date(), 6 - index)
    const dateKey = format(date, 'yyyy-MM-dd')
    return {
      label: format(date, 'EEE'),
      reps: logs
        .filter((log) => format(parseISO(log.logged_at), 'yyyy-MM-dd') === dateKey)
        .reduce((sum, log) => sum + (log.reps || 0), 0),
    }
  })
}

function buildActivityGrid(data) {
  const today = new Date()
  const start = startOfWeek(subDays(today, 83), { weekStartsOn: 0 })
  const days = Array.from({ length: 84 }).map((_, index) => { const date = addDays(start, index); const dateKey = format(date, 'yyyy-MM-dd'); return { date: dateKey, weekLabel: format(date, 'wo'), count: data.skillSessions.filter((session) => session.date === dateKey).length + data.workouts.filter((workout) => workout.date === dateKey).length + data.tasks.filter((task) => task.created_at?.startsWith(dateKey)).length + data.readingLogs.filter((log) => log.date === dateKey).length } })
  const weeks = []
  for (let index = 0; index < days.length; index += 7) weeks.push({ weekLabel: days[index]?.weekLabel || String(index), days: days.slice(index, index + 7) })
  return weeks
}

function heatmapClass(count) {
  if (count >= 4) return 'bg-amber-500'
  if (count === 3) return 'bg-amber-400'
  if (count === 2) return 'bg-amber-300'
  if (count === 1) return 'bg-amber-200'
  return 'bg-zinc-800/80'
}

function buildSummaryPayload(data, rangeStart, rangeEnd, weekStartDate) {
  return { week_start_date: weekStartDate, skills_minutes: data.skillSessions.filter((session) => inRange(session.date, rangeStart, rangeEnd)).reduce((sum, session) => sum + (session.duration_minutes || 0), 0), workouts_count: data.workouts.filter((workout) => inRange(workout.date, rangeStart, rangeEnd)).length, books_pages: data.readingLogs.filter((log) => inRange(log.date, rangeStart, rangeEnd)).reduce((sum, log) => sum + (log.pages_read || 0), 0), tasks_completed: data.tasks.filter((task) => task.completed_at && inRange(task.completed_at, rangeStart, rangeEnd)).length, notes: '' }
}

function titleCase(value) {
  return value.split(/[\s_]+/).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
}

function formatDate(value, token = 'MMM d, yyyy') {
  return format(parseISO(value), token)
}

function formatDateTime(value) {
  return format(parseISO(value), 'MMM d, yyyy | h:mm a')
}

function inRange(value, startDate, endDate) {
  const target = parseISO(String(value).slice(0, 10))
  return target >= startDate && target <= endDate
}

function deadlineCopy(deadline) {
  const days = differenceInCalendarDays(parseISO(deadline), new Date())
  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} overdue`
  if (days === 0) return 'Due today'
  return `Due in ${days} day${days === 1 ? '' : 's'}`
}

function isPastDate(date) {
  return differenceInCalendarDays(parseISO(date), new Date()) < 0
}

function greetingForNow() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export default App

